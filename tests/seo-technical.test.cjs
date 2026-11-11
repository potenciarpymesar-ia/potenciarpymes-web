const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const origin = 'https://potenciarpymes.ar';
const organization = `${origin}/#organization`;

function publicPages(dir, recursive = false) {
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((entry) => {
    const relative = path.posix.join(dir, entry.name);
    if (entry.isDirectory() && recursive) return publicPages(relative, true);
    return entry.isFile() && entry.name.endsWith('.html') && entry.name !== 'design-system.html'
      ? [relative] : [];
  });
}

function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)]
    .map(([, key, double, single, unquoted]) => [key.toLowerCase(), double ?? single ?? unquoted]));
}

function route(page) {
  return page === 'index.html' ? '/' : `/${page.replace(/\.html$/, '')}`;
}

function markup(html) {
  return html.replace(/<!--[\s\S]*?-->|<(script|style|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '');
}

function tags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b(?:"[^"]*"|'[^']*'|[^'">])*>`, 'gi'))]
    .map(([tag]) => attributes(tag));
}

function jsonLD(html) {
  return [...html.replace(/<!--[\s\S]*?-->/g, '').matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)]
    .filter(([, attrs]) => attributes(attrs).type?.toLowerCase() === 'application/ld+json')
    .map(([, , json]) => JSON.parse(json));
}

function nodes(value) {
  if (!value || typeof value !== 'object') return [];
  return Array.isArray(value) ? value.flatMap(nodes) : [value, ...Object.values(value).flatMap(nodes)];
}

function hasType(node, type) {
  return [].concat(node['@type'] ?? []).includes(type);
}

function internalURL(href, page) {
  const url = new URL(href.replace(/&amp;/g, '&'), origin + route(page));
  return ['potenciarpymes.ar', 'www.potenciarpymes.ar'].includes(url.hostname) ? url : null;
}

const pages = [...publicPages(''), ...['blog', 'recursos', 'herramientas'].flatMap((dir) => publicPages(dir, true))];
const htmlByPage = new Map(pages.map((page) => [page, fs.readFileSync(path.join(root, page), 'utf8')]));
const routes = new Map(pages.map((page) => [route(page), page]));
const incoming = new Map(pages.map((page) => [page, new Set()]));

for (const [page, html] of htmlByPage) {
  for (const { href } of tags(markup(html), 'a')) {
    if (!href) continue;
    const url = internalURL(href, page);
    if (!url) continue;
    const target = routes.get(decodeURIComponent(url.pathname).replace(/\/$/, '') || '/');
    if (target && target !== page) incoming.get(target).add(page);
  }
}

const rootGuides = [
  'automatizaciones-sin-codigo', 'como-usar-claude-en-tu-pyme', 'conectar-tus-canales',
  'diagnostico-10-puntos', 'metricas-que-importan', 'seo-local-pymes', 'whatsapp-business-setup',
].map((slug) => `${slug}.html`);
const breadcrumbPages = new Set([
  ...rootGuides, 'blog.html', ...pages.filter((page) => page.startsWith('blog/')),
  'herramientas/product-lock.html', 'diagnostico.html', 'privacidad.html',
]);

for (const [page, html] of htmlByPage) {
  test(`${page} declares Argentine Spanish`, () => {
    assert.equal(tags(markup(html), 'html')[0]?.lang, 'es-AR');
  });

  test(`${page} has valid JSON-LD and the required breadcrumbs`, () => {
    const structured = jsonLD(html).flatMap(nodes);
    if (!breadcrumbPages.has(page)) return;
    const breadcrumbs = structured.filter((node) => hasType(node, 'BreadcrumbList'));
    assert.equal(breadcrumbs.length, 1, 'Expected one BreadcrumbList');
    const items = breadcrumbs[0].itemListElement;
    assert.ok(items.length >= 2);
    assert.equal(items[0].name, 'Inicio');
    assert.equal(items[0].item, `${origin}/`);
    assert.equal(items.at(-1).item, origin + route(page));
    items.forEach((item, index) => {
      assert.equal(item.position, index + 1);
      assert.ok(item.name?.trim());
      assert.ok(item.item.startsWith(`${origin}/`));
      assert.ok(routes.has(new URL(item.item).pathname), `Unknown breadcrumb: ${item.item}`);
      assert.ok(!item.item.endsWith('.html'));
    });
  });

  test(`${page} identifies the organization and language in articles`, () => {
    for (const article of jsonLD(html).flatMap(nodes).filter((node) => hasType(node, 'Article') || hasType(node, 'BlogPosting'))) {
      assert.ok(article.headline?.trim());
      assert.ok(article.description?.trim());
      assert.ok(article.url || article.mainEntityOfPage);
      assert.equal(article.inLanguage, 'es-AR');
      assert.equal(article.author?.['@id'], organization);
      assert.equal(article.publisher?.['@id'], organization);
      assert.match(article.dateModified, /^\d{4}-\d{2}-\d{2}$/);
    }
  });

  test(`${page} gives every image alt text and dimensions`, () => {
    for (const image of tags(markup(html), 'img')) {
      assert.ok(Object.hasOwn(image, 'alt'), `Missing alt: ${image.src}`);
      assert.match(image.width ?? '', /^[1-9]\d*$/, `Missing width: ${image.src}`);
      assert.match(image.height ?? '', /^[1-9]\d*$/, `Missing height: ${image.src}`);
    }
  });

  test(`${page} receives links from at least three other public pages`, () => {
    const sources = incoming.get(page);
    assert.ok(sources.size >= 3, `Only ${sources.size} source pages: ${[...sources].join(', ')}`);
  });

  test(`${page} links to existing internal routes without .html`, () => {
    for (const { href } of tags(markup(html), 'a')) {
      if (!href) continue;
      const url = internalURL(href, page);
      if (!url) continue;
      const target = decodeURIComponent(url.pathname).replace(/\/$/, '') || '/';
      assert.ok(!/\.html$/i.test(target), `HTML extension in ${href}`);
      assert.ok(routes.has(target) || fs.statSync(path.join(root, target.slice(1)), { throwIfNoEntry: false })?.isFile(), `Unknown route: ${href}`);
    }
  });
}

test('privacy has a minimal WebPage schema', () => {
  const page = jsonLD(htmlByPage.get('privacidad.html')).flatMap(nodes).find((node) => hasType(node, 'WebPage'));
  assert.ok(page?.name?.trim());
  assert.equal(page.url, `${origin}/privacidad`);
  assert.equal(page.inLanguage, 'es-AR');
});

test('sitemap contains exactly the 37 public pages, once each, and no unknown files', () => {
  const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => url);
  assert.equal(urls.length, 37);
  assert.equal(new Set(urls).size, urls.length);
  assert.deepEqual([...urls].sort(), [...routes.keys()].map((url) => origin + url).sort());
});
