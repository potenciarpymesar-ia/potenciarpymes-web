// Chequeos web 100% objetivos y verificables sin login.
// Reglas de items y umbrales tomados de:
// pyme-audit-tool\.claude\skills\pyme-audit\references\web-checks.md (secciones A, B, C, E, G)
// Instagram/Mercado Libre/WhatsApp Business/Google Business quedan afuera:
// requieren sesion logueada o screenshots del cliente, no son verificables de forma anonima.

const FETCH_TIMEOUT_MS = 8000;

function normalizeUrl(input) {
  let url = String(input || '').trim();
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  return new URL(url).toString();
}

async function fetchText(url, opts = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; PotenciarPymesAuditBot/1.0)' },
      ...opts,
    });
    const text = await res.text().catch(() => '');
    return { ok: res.ok, status: res.status, finalUrl: res.url, text };
  } catch {
    return { ok: false, status: 0, finalUrl: url, text: '' };
  } finally {
    clearTimeout(timer);
  }
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
      label: 'Google Analytics 4 instalado',
      ok: /G-[A-Z0-9]{6,}/.test(html),
    },
    {
      id: 'gtm_present',
      area: 'Medición y analítica',
      severity: 'medio',
      label: 'Google Tag Manager instalado',
      ok: /GTM-[A-Z0-9]+/.test(html),
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
      id: 'form_real_capture',
      area: 'Conversión básica',
      severity: 'alto',
      label: 'Los formularios capturan de verdad',
      ok: (() => {
        const forms = html.match(/<form[^>]*>/gi) || [];
        if (forms.length === 0) return 'na';
        return forms.some((f) => /data-netlify/i.test(f) || /action=["'][^"'#]+["']/i.test(f));
      })(),
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
    checkedAt: new Date().toISOString(),
    items,
    score: { passed, total: scored.length },
    severityCounts,
    areasWithIssues: areas,
  };
}

module.exports = { runWebChecks, normalizeUrl };
