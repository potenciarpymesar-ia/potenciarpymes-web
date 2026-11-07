// Chequeos web 100% objetivos y verificables sin login.
// Reglas de items y umbrales tomados de:
// pyme-audit-tool\.claude\skills\pyme-audit\references\web-checks.md (secciones A, B, C, E, G)
// Instagram/Mercado Libre/WhatsApp Business/Google Business quedan afuera:
// requieren sesion logueada o screenshots del cliente, no son verificables de forma anonima.

const dns = require('node:dns').promises;
const net = require('node:net');

const FETCH_TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 5;
const MAX_BODY_CHARS = 2_000_000; // ~2MB, evita retener descargas gigantes en memoria

function normalizeUrl(input) {
  let url = String(input || '').trim();
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(url);
  const hasBarePort = /^[^/:?#]+\.[^/:?#]+:[0-9]+(?:[/?#]|$)/.test(url);
  if (!hasScheme || hasBarePort) url = 'https://' + url;
  return new URL(url).toString();
}

const BLOCKED_HOSTNAMES = /^(localhost|metadata\.google\.internal)\.?$/i;
const blockedIPv4 = new net.BlockList();
const blockedIPv6 = new net.BlockList();
for (const [address, prefix] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
  ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.168.0.0', 16],
  ['198.18.0.0', 15], ['224.0.0.0', 4], ['240.0.0.0', 4],
]) {
  blockedIPv4.addSubnet(address, prefix);
}
for (const [address, prefix] of [
  ['::', 128], ['::1', 128], ['fc00::', 7], ['fe80::', 10],
  ['ff00::', 8], ['::ffff:0:0', 96],
]) {
  blockedIPv6.addSubnet(address, prefix, 'ipv6');
}

function isBlockedAddress(ip) {
  const address = ip.replace(/^\[(.*)\]$/, '$1');
  const family = net.isIP(address);
  if (family === 4) return blockedIPv4.check(address);
  return family === 0 || blockedIPv6.check(address, 'ipv6');
}

async function assertSafeHost(hostname) {
  const host = hostname.replace(/^\[(.*)\]$/, '$1');
  if (BLOCKED_HOSTNAMES.test(host)) throw new Error('blocked_host');
  const addresses = net.isIP(host) ? [{ address: host }] : await dns.lookup(host, { all: true });
  if (addresses.length === 0 || addresses.some(({ address }) => isBlockedAddress(address))) {
    throw new Error('blocked_host');
  }
}

async function assertSafeUrl(url) {
  const { protocol, port, hostname } = new URL(url);
  if (!['http:', 'https:'].includes(protocol) || !['', '80', '443'].includes(port)) {
    throw new Error('blocked_url');
  }
  await assertSafeHost(hostname);
}

async function readBody(body) {
  if (!body) return '';
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let remaining = MAX_BODY_CHARS;
  let text = '';
  try {
    while (remaining > 0) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = value.subarray(0, remaining);
      remaining -= chunk.byteLength;
      text += decoder.decode(chunk, { stream: true });
    }
    return text + decoder.decode();
  } finally {
    if (remaining === 0) void reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

async function fetchText(url) {
  let currentUrl = url;
  for (let hop = 0; hop < MAX_REDIRECTS; hop++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      await assertSafeUrl(currentUrl);
      const res = await fetch(currentUrl, {
        signal: controller.signal,
        redirect: 'manual',
        headers: { 'user-agent': 'Mozilla/5.0 (compatible; PotenciarPymesAuditBot/1.0)' },
      });

      if ([301, 302, 303, 307, 308].includes(res.status)) {
        const location = res.headers.get('location');
        if (res.body) void res.body.cancel().catch(() => {});
        if (!location) return { ok: false, status: res.status, finalUrl: currentUrl, text: '' };
        currentUrl = new URL(location, currentUrl).toString();
        continue;
      }

      const text = await readBody(res.body);
      return { ok: res.ok, status: res.status, finalUrl: currentUrl, text };
    } catch {
      return { ok: false, status: 0, finalUrl: currentUrl, text: '' };
    } finally {
      clearTimeout(timer);
    }
  }
  return { ok: false, status: 0, finalUrl: currentUrl, text: '' };
}

function extract(re, text) {
  const m = text.match(re);
  return m ? m[0] : null;
}

function countMatches(re, text) {
  const m = text.match(re);
  return m ? m.length : 0;
}

async function runWebChecks(rawUrl) {
  const targetUrl = normalizeUrl(rawUrl);
  const origin = new URL(targetUrl).origin;

  const [home, robots, sitemap, llms] = await Promise.all([
    fetchText(targetUrl),
    fetchText(origin + '/robots.txt'),
    fetchText(origin + '/sitemap.xml'),
    fetchText(origin + '/llms.txt'),
  ]);

  const html = home.text || '';
  const hasGa4 = /G-[A-Z0-9]{6,}/.test(html);
  const hasGtm = /GTM-[A-Z0-9]+/.test(html);
  const titleMatch = extract(/<title[^>]*>([^<]*)<\/title>/i, html);
  const title = titleMatch ? titleMatch.replace(/<[^>]+>/g, '').trim() : '';
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i);
  const description = descMatch ? descMatch[1].trim() : '';
  const h1Count = countMatches(/<h1[\s>]/gi, html);
  const jsonLdBlocks = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  const jsonLdText = jsonLdBlocks.join('\n');

  const items = [
    {
      id: 'https_ok',
      area: 'SEO técnico',
      severity: 'alto',
      label: 'Responde bien por HTTPS',
      ok: home.ok && home.status === 200 && home.finalUrl.startsWith('https://'),
    },
    {
      id: 'title_length',
      area: 'SEO técnico',
      severity: 'medio',
      label: 'Título con largo adecuado (30-60 caracteres)',
      ok: title.length >= 30 && title.length <= 60,
    },
    {
      id: 'meta_description',
      area: 'SEO técnico',
      severity: 'medio',
      label: 'Meta description presente y con largo adecuado',
      ok: description.length >= 80 && description.length <= 170,
    },
    {
      id: 'single_h1',
      area: 'SEO técnico',
      severity: 'bajo',
      label: 'Un solo H1 en la página',
      ok: h1Count === 1,
    },
    {
      id: 'robots_ok',
      area: 'SEO técnico',
      severity: 'medio',
      label: 'robots.txt responde y no bloquea todo el sitio',
      ok: robots.ok && robots.status === 200 && !/User-agent:\s*\*\s*[\r\n]+Disallow:\s*\/\s*$/im.test(robots.text),
    },
    {
      id: 'sitemap_ok',
      area: 'SEO técnico',
      severity: 'medio',
      label: 'sitemap.xml responde',
      ok: sitemap.ok && sitemap.status === 200,
    },
    {
      id: 'no_noindex',
      area: 'SEO técnico',
      severity: 'alto',
      label: 'Sin noindex accidental en la home',
      ok: !/<meta[^>]+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html),
    },
    {
      id: 'canonical_present',
      area: 'SEO técnico',
      severity: 'bajo',
      label: 'Tag canonical presente',
      ok: /<link[^>]+rel=["']canonical["']/i.test(html),
    },
    {
      id: 'viewport_present',
      area: 'SEO técnico',
      severity: 'alto',
      label: 'Meta viewport (mobile) presente',
      ok: /<meta[^>]+name=["']viewport["']/i.test(html),
    },
    {
      id: 'favicon_present',
      area: 'SEO técnico',
      severity: 'bajo',
      label: 'Favicon presente',
      ok: /<link[^>]+rel=["'](?:shortcut )?icon["']/i.test(html),
    },
    {
      id: 'jsonld_present',
      area: 'Datos estructurados',
      severity: 'medio',
      label: 'Datos estructurados (JSON-LD) presentes',
      ok: jsonLdBlocks.length > 0,
    },
    {
      id: 'org_or_localbusiness',
      area: 'Datos estructurados',
      severity: 'medio',
      label: 'Schema Organization/LocalBusiness presente',
      ok: /"@type"\s*:\s*"(Organization|LocalBusiness)"/i.test(jsonLdText),
    },
    {
      id: 'llms_txt_present',
      area: 'Visibilidad en IA (GEO)',
      severity: 'bajo',
      label: 'llms.txt presente en la raíz',
      ok: llms.ok && llms.status === 200,
    },
    {
      id: 'ga4_present',
      area: 'Medición y analítica',
      severity: 'alto',
      label: 'Google Analytics 4 (puede cargarse desde Tag Manager)',
      ok: hasGa4 ? true : hasGtm ? 'na' : false,
    },
    {
      id: 'gtm_present',
      area: 'Medición y analítica',
      severity: 'medio',
      label: 'Google Tag Manager instalado',
      ok: hasGtm,
    },
    {
      id: 'meta_pixel_present',
      area: 'Medición y analítica',
      severity: 'medio',
      label: 'Meta Pixel instalado',
      ok: /fbq\(/i.test(html),
    },
    {
      id: 'ads_tag_present',
      area: 'Medición y analítica',
      severity: 'bajo',
      label: 'Google Ads tag instalado',
      ok: /AW-[0-9]+/.test(html),
    },
    {
      id: 'heatmap_present',
      area: 'Medición y analítica',
      severity: 'bajo',
      label: 'Mapa de calor (Clarity/Hotjar) instalado',
      ok: /clarity\.ms|hotjar/i.test(html),
    },
    {
      id: 'form_present',
      area: 'Conversión básica',
      severity: 'bajo',
      label: 'Formulario de contacto en la página',
      ok: /<form[\s>]/i.test(html),
    },
    {
      id: 'whatsapp_link_present',
      area: 'Conversión básica',
      severity: 'medio',
      label: 'WhatsApp accesible desde la página',
      ok: /wa\.me\/|api\.whatsapp\.com/i.test(html),
    },
  ];

  const scored = items.filter((i) => i.ok !== 'na');
  const passed = scored.filter((i) => i.ok === true).length;
  const failed = scored.filter((i) => i.ok === false);
  const severityCounts = { alto: 0, medio: 0, bajo: 0 };
  for (const item of failed) severityCounts[item.severity] += 1;

  const areas = [...new Set(failed.map((i) => i.area))];

  return {
    url: targetUrl,
    reachable: home.ok && home.status === 200,
    checkedAt: new Date().toISOString(),
    items,
    score: { passed, total: scored.length },
    severityCounts,
    areasWithIssues: areas,
  };
}

module.exports = { runWebChecks, normalizeUrl, isBlockedAddress, assertSafeUrl };
