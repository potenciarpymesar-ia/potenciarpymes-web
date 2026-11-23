const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const file = 'blog/fichas-de-producto-tiendanube.html';
const route = '/blog/fichas-de-producto-tiendanube';
const url = `https://potenciarpymes.ar${route}`;
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const html = fs.existsSync(path.join(root, file)) ? read(file) : '';
const visible = (value) => value.replace(/<!--[\s\S]*?-->|<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
  .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const schemas = (value) => [...value.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
  .map(([, json]) => JSON.parse(json));
const nodes = (value) => !value || typeof value !== 'object' ? []
  : Array.isArray(value) ? value.flatMap(nodes) : [value, ...Object.values(value).flatMap(nodes)];

test('fichas: existe y tiene un solo h1 con el título solicitado', () => {
  assert.ok(fs.existsSync(path.join(root, file)));
  const headings = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
  assert.equal(headings.length, 1);
  assert.equal(visible(headings[0][1]), 'Fichas de producto en Tiendanube: cómo ordenarlas');
});

test('fichas: title y description cumplen las longitudes y las URLs son finales', () => {
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  const description = html.match(/<meta name="description" content="([^"]+)"/i)?.[1];
  assert.ok(title?.length >= 30 && title.length <= 60);
  assert.equal(title, 'Fichas de producto en Tiendanube: cómo ordenarlas');
  assert.ok(description?.length >= 80 && description.length <= 160);
  assert.equal(html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1], url);
  assert.equal(html.match(/<meta property="og:url" content="([^"]+)"/i)?.[1], url);
  for (const property of ['og:title', 'twitter:title']) {
    assert.equal(html.match(new RegExp(`<meta (?:property|name)="${property}" content="([^"]+)"`))?.[1], title);
  }
  for (const property of ['og:description', 'twitter:description']) {
    assert.equal(html.match(new RegExp(`<meta (?:property|name)="${property}" content="([^"]+)"`))?.[1], description);
  }
});

test('fichas: sitemap y llms incluyen el recurso con la fecha y campos del blog', () => {
  const entries = [...read('sitemap.xml').matchAll(/<url>([\s\S]*?)<\/url>/g)]
    .filter(([, entry]) => entry.includes(`<loc>${url}</loc>`));
  assert.equal(entries.length, 1);
  assert.match(entries[0][1], /<lastmod>2026-11-23<\/lastmod>\s*<changefreq>monthly<\/changefreq>\s*<priority>0\.6<\/priority>/);
  assert.ok(read('llms.txt').includes(url));
});

test('fichas: recibe enlaces reales desde blog, servicio, guía completa y recursos', () => {
  const sources = ['blog.html', 'tiendanube.html', 'blog/tiendanube-guia-completa.html', 'recursos.html'];
  const incoming = sources.filter((source) => [...read(source).matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/gi)]
    .some(([, href]) => href === route));
  assert.ok(incoming.length >= 3);
  assert.deepEqual(incoming, sources);
  assert.match(read('blog.html'), /<article class="post-card reveal">[\s\S]*?href="\/blog\/fichas-de-producto-tiendanube"/);
});

test('fichas: JSON-LD válido con BlogPosting, BreadcrumbList y FAQPage coherentes', () => {
  const blocks = schemas(html);
  assert.deepEqual(blocks.map((block) => block['@type']).sort(), ['BlogPosting', 'BreadcrumbList', 'FAQPage']);
  const article = blocks.find((block) => block['@type'] === 'BlogPosting');
  assert.equal(article.url, url);
  assert.equal(article.headline, visible(html.match(/<h1>(.*?)<\/h1>/)[1]));
  assert.equal(article.description, html.match(/<meta name="description" content="([^"]+)"/)[1]);
  assert.equal(article.dateModified, '2026-11-23');
  const breadcrumb = blocks.find((block) => block['@type'] === 'BreadcrumbList');
  assert.equal(breadcrumb.itemListElement.at(-1).item, url);
  const faq = blocks.find((block) => block['@type'] === 'FAQPage');
  const visibleFAQ = [...html.matchAll(/<div class="faq-item">\s*<h3>(.*?)<\/h3>\s*<p>(.*?)<\/p>/g)];
  assert.equal(visibleFAQ.length, 4);
  assert.equal(faq.mainEntity.length, 4);
  faq.mainEntity.forEach((question, index) => {
    assert.equal(question['@type'], 'Question');
    assert.equal(question.name, visible(visibleFAQ[index][1]));
    assert.equal(question.acceptedAnswer['@type'], 'Answer');
    assert.equal(question.acceptedAnswer.text, visible(visibleFAQ[index][2]));
  });
});

test('fichas: author es la referencia mínima del modelo y de los demás artículos', () => {
  const model = schemas(read('blog/tiendanube-guia-completa.html')).find((node) => node['@type'] === 'BlogPosting');
  const author = schemas(html).find((node) => node['@type'] === 'BlogPosting').author;
  assert.deepEqual(author, model.author);
  assert.deepEqual(Object.keys(author).sort(), ['@id', '@type', 'name']);
  for (const name of fs.readdirSync(path.join(root, 'blog')).filter((name) => name.endsWith('.html'))) {
    for (const article of schemas(read(`blog/${name}`)).flatMap(nodes).filter((node) => ['Article', 'BlogPosting'].includes(node['@type']))) {
      assert.deepEqual(author, article.author, name);
    }
  }
});

test('fichas: no contiene promesas, servicios ajenos ni voz de agencia', () => {
  const text = visible(html);
  const forbidden = [/garantiz/i, /aument/i, /duplic/i, /primer lugar/i, /%\s*de mejora/i, /resultados en/i,
    /power\s*bi/i, /reels/i, /nuestro equipo/i, /somos una agencia/i, /nosotros somos/i, /\bnosotros\b/i];
  for (const expression of forbidden) {
    assert.doesNotMatch(text, expression);
    assert.doesNotMatch(html, expression, 'también cubre metadatos y JSON-LD');
  }
});

test('fichas: extensión, ejemplos, estado de borrador y cierre requeridos', () => {
  const articleText = visible(html.match(/<header>[\s\S]*?<\/main>/)?.[0] ?? '');
  const words = articleText.split(/\s+/).length;
  assert.ok(words >= 1200 && words <= 1800, `${words} palabras`);
  assert.match(articleText, /Borrador para revisión/);
  assert.match(articleText, /ejemplo inventado/i);
  assert.match(articleText, /características son ficticias/);
  const closing = html.slice(html.indexOf('<section aria-labelledby="seguir-leyendo-title">'), html.indexOf('</main>'));
  assert.match(closing, /href="\/diagnostico"/);
  assert.match(closing, /test gratis de 4 preguntas/);
  assert.match(closing, /href="\/tiendanube"/);
  assert.match(closing, /href="\/blog\/tiendanube-guia-completa"/);
});

test('fichas: reutiliza las clases y estilos del modelo sin anchos rígidos nuevos', () => {
  const styleBlocks = (source) => [...source.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(([, css]) => css);
  const model = read('blog/tiendanube-guia-completa.html');
  assert.deepEqual(styleBlocks(html), styleBlocks(model));
  for (const className of ['container', 'meta-row', 'tldr', 'checklist', 'checklist-item', 'box', 'faq-item', 'cta-box', 'footer-legal']) {
    assert.ok(html.includes(`class="${className}"`), className);
  }
  assert.match(html, /box-sizing: border-box/);
  assert.match(html, /\.container \{ max-width: 740px;[^}]*padding: 0 clamp\(1rem, 5vw, 3rem\)/);
  assert.match(html, /footer \.footer-legal[^}]*overflow-wrap: anywhere/);
  assert.doesNotMatch(html.match(/<header>[\s\S]*?<\/main>/)[0], /<table|<pre|style="[^"]*(?:min-width|width):/i);
});
