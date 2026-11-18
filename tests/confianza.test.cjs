const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const home = read('index.html');
const person = { '@type': 'Person', '@id': 'https://potenciarpymes.ar/#jonathan', name: 'Jonathan' };
function nodes(value) {
  if (!value || typeof value !== 'object') return [];
  return Array.isArray(value) ? value.flatMap(nodes) : [value, ...Object.values(value).flatMap(nodes)];
}
function schemas(html) {
  return [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
    .flatMap(([, json]) => nodes(JSON.parse(json)));
}
function pages(dir = '') {
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(entry => {
    const file = path.posix.join(dir, entry.name);
    if (entry.isDirectory() && (dir || ['blog', 'recursos'].includes(entry.name))) return pages(file);
    return entry.isFile() && entry.name.endsWith('.html') && entry.name !== 'design-system.html' ? [file] : [];
  });
}
const articles = pages().filter(file => schemas(read(file)).some(node => ['Article', 'BlogPosting'].includes(node['@type'])));

test('home explains how Jonathan works between cases and the starting options, without repeating his photo', () => {
  const section = home.match(/<section\b[^>]*\bid="quien"[^>]*>[\s\S]*?<\/section>/)?.[0];
  assert.ok(section, 'Missing #quien');
  assert.ok(home.indexOf('id="casos"') < home.indexOf('id="quien"'));
  assert.ok(home.indexOf('id="quien"') < home.indexOf('id="diagnostico"'));
  const heading = section.match(/aria-labelledby="([^"]+)"/)?.[1];
  assert.ok(heading);
  assert.ok(section.includes(`<h2 id="${heading}"`));
  assert.match(section, /Me ocupo yo, para que no dependa todo de vos\./);
  assert.match(section, /Cómo trabajo conmigo/);
  assert.doesNotMatch(section, /<img\b/, 'the photo is already in the hero');
  for (const point of ['Ordeno lo que ya tenés\.', 'Me hago cargo del trabajo\.', 'Sin promesas de ventas\.']) assert.match(section, new RegExp(point));
  assert.match(section, /matrícula N\.° 3209/);
  const whatsapp = [...section.matchAll(/<a\b[^>]*>/g)].map(([tag]) => tag).find(tag => tag.includes('wa.me'));
  assert.ok(whatsapp);
  assert.match(whatsapp, /class="[^"]*\btrack-whatsapp\b/);
  assert.match(whatsapp, /target="_blank"/);
  assert.match(whatsapp, /rel="noopener noreferrer"/);
  assert.equal(new URL(whatsapp.match(/href="([^"]+)"/)[1]).searchParams.get('text'), 'Hola Jonathan, quiero conversar sobre mi negocio.');
  assert.match(section, /href="\/diagnostico">Empezar con el test gratis de 4 preguntas<\/a>/);
});

test('the home tells one story: one photo of Jonathan, the diagnostic and what it delivers together, no Power BI', () => {
  const photos = [...home.matchAll(/<img\b[^>]*src="[^"]*jonathan[^"]*"/g)];
  assert.equal(photos.length, 1, 'Jonathan appears once, in the hero');
  assert.ok(home.indexOf('class="diagnostic"') < home.indexOf('class="statement"'));
  assert.ok(home.indexOf('class="statement"') < home.indexOf('class="professional-launch"'));
  assert.ok(home.indexOf('class="professional-launch"') < home.indexOf('id="contacto"'));
  for (const file of ['index.html', 'sitemap.xml', 'llms.txt', 'soluciones.html', 'ga4.html', 'analisis-mensual.html', 'meta-ads.html']) assert.doesNotMatch(read(file), /power[- ]?bi/i, file);
  assert.ok(!fs.existsSync(path.join(root, 'power-bi.html')));
  assert.match(read('vercel.json'), /"source": "\/power-bi",\s*"destination": "\/ga4"/);
  assert.doesNotMatch(home, /que confían en el proceso/);
});

test('Jonathan portrait exists within the 300 KB budget', () => {
  assert.ok(fs.statSync(path.join(root, 'assets/sobre-mi/jonathan-retrato.webp')).size < 300000);
});

test('all three cases tell what was worked on and the result, without figures, and Wheels explains its closed store', () => {
  const section = home.match(/<section\b[^>]*\bid="casos"[^>]*>[\s\S]*?<\/section>/)[0];
  const cases = [...section.matchAll(/<article class="proof-case">([\s\S]*?)<\/article>/g)].map(([, card]) => card);
  assert.equal(cases.length, 3);
  for (const card of cases) assert.match(card, /<strong>Resultado<\/strong>/);
  for (const card of cases) assert.doesNotMatch(card, /\$|\bSKU\b|\d{2,}\s*(bicicletas|productos)|facturaci/i, 'cases carry no figures');
  assert.match(cases[0], /Uno de los cuatro socios/);
  assert.match(cases[0], /parte del equipo a mi cargo/);
  assert.doesNotMatch(cases[0], /propio negocio|negocio propio/, 'Conectia was not his own company');
  assert.match(cases[1], /Emprendimiento propio con un socio/);
  assert.match(cases[1], /Una marca creada desde cero junto a un socio/);
  assert.match(cases[2], /Uno de mis primeros clientes/);
  assert.doesNotMatch(home, /Nutrex/, 'the brand is Nutrax');
  assert.match(home, /data-brand="Nutrax"/);
  assert.match(cases[1], /Proyecto finalizado: la tienda ya no está online/);
  assert.match(cases[2], /Una tienda lista para vender, entregada llave en mano\./);
});

test('home and files changed for trust contain no unconfirmed revenue claims', () => {
  // Only the task scope: llms.txt and private documents must not be read or changed.
  const files = ['index.html', 'resources-library.js', 'tests/confianza.test.cjs', 'tests/seo-technical.test.cjs', ...articles];
  const forbidden = [['$', '500'], ['500', 'M']].map(parts => parts.join(''));
  for (const file of new Set(files)) for (const claim of forbidden) assert.ok(!read(file).includes(claim), `${file}: unconfirmed revenue claim`);
});

test('home credentials have three consistent cards, original accessible logos and no inline styles', () => {
  const block = home.match(/<div class="ecommerce-partners"[^>]*>([\s\S]*?)\n\s*<\/div>/)?.[1];
  assert.ok(block);
  assert.doesNotMatch(block, /\bstyle\s*=/i);
  assert.equal((block.match(/class="ecommerce-partner"/g) || []).length, 3);
  assert.equal((block.match(/class="ecommerce-partner-mark"/g) || []).length, 3);
  assert.match(block, /href="\/tiendanube"/);
  assert.match(block, /href="\/mercado-libre"/);
  assert.match(block, /alt="Tiendanube Partners: Agencia certificada"/);
  assert.match(block, /alt="Mercado Libre"/);
  assert.match(block, />EN<\/span>/);
});

test('founder, credentials and case evidence can shrink inside a 375 px viewport', () => {
  const css = [...home.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(([, value]) => value).join('\n');
  const rule = selector => [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([, selectors]) => selectors.trim() === selector).map(([, , body]) => body).join(';');
  assert.match(css, /@media\(max-width:780px\)\{\.founder\{padding-inline:20px\}\.founder \.wrap\{grid-template-columns:minmax\(0,1fr\)/);
  assert.match(css, /@media\(max-width:900px\)\{\.ecommerce-partners\{grid-template-columns:1fr;grid-auto-rows:1fr/);
  assert.match(css, /@media\(max-width:780px\)\{[\s\S]*?\.proof-head,\.proof-case,[^{]+\{grid-template-columns:1fr/);
  for (const selector of ['.founder-copy', '.ecommerce-partner', '.ecommerce-partner-copy', '.proof-case>div,.proof-evidence']) assert.match(rule(selector), /min-width:0/, selector);
  assert.match(rule('.proof-evidence p'), /overflow-wrap:anywhere/);
  assert.match(rule('.founder-actions .button'), /max-width:100%/);
  assert.match(rule('.founder-test'), /max-width:100%/);
  // At 375 px, both sections leave 335 px after their 20 px side padding.
  // The fixed logo box plus padding/borders/gap still leaves room for text.
  const available = 375 - 2 * 20;
  const tokens = read('design-tokens.css');
  const spacing = Number(tokens.match(/--pp-space-4:\s*(\d+)px/)[1]);
  const logo = Number(rule('.ecommerce-partner-mark').match(/(?:^|;)width:(\d+)px/)[1]);
  assert.ok(available - 2 * spacing - 2 - logo - spacing >= 200);
  const scoped = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(([, selector]) => /\.(?:founder|ecommerce-partner|proof-evidence)/.test(selector));
  for (const [, selector, body] of scoped) for (const [, width] of body.matchAll(/(?:^|;)\s*(?:width|min-width)\s*:\s*(\d+)px/g)) assert.ok(Number(width) <= available, `${selector}: fixed width exceeds mobile space`);
});

test('credential text meets 4.5:1 contrast and its links inherit visible keyboard focus', () => {
  const tokens = read('design-tokens.css');
  const color = name => tokens.match(new RegExp(`${name}:\\s*(#[0-9a-f]{6})`, 'i'))[1];
  function luminance(hex) {
    return hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255)
      .map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
      .reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
  }
  const background = luminance(color('--pp-brand-ink'));
  for (const token of ['--pp-brand-paper', '--pp-text-muted']) assert.ok((luminance(color(token)) + .05) / (background + .05) >= 4.5, token);
  assert.match(home, /\.ecommerce-partner\{[^}]*color:var\(--paper\)/);
  assert.match(home, /\.ecommerce-partner-copy small\{color:var\(--pp-text-muted\)/);
  assert.match(read('design-system.css'), /:focus-visible\{outline:3px solid var\(--pp-focus\);outline-offset:4px\}/);
});

test('home identifies one founder Person and links him to the organization', () => {
  const people = schemas(home).filter(node => node['@type'] === 'Person');
  assert.equal(people.length, 1);
  assert.deepEqual(people[0], { ...person, jobTitle: 'Fundador de Potenciar Pymes', image: 'https://potenciarpymes.ar/assets/sobre-mi/jonathan-retrato.webp', worksFor: { '@id': 'https://potenciarpymes.ar/#organization' } });
});

test('every Article and BlogPosting uses exactly the Jonathan Person as author', () => {
  assert.ok(articles.length >= 14, 'Expected root guides, blog and resource articles');
  for (const file of articles) for (const article of schemas(read(file)).filter(node => ['Article', 'BlogPosting'].includes(node['@type']))) assert.deepEqual(article.author, person, file);
});

test('resource ordering keeps every tool before all other categories, including the former lead guide', () => {
  const source = read('resources-library.js');
  assert.doesNotMatch(source, /leadId|auditoria-tienda-claude/);
  assert.ok(source.includes('// Keep tools ahead of guides even when new resources are inserted at the top of the catalog.'));
  const context = { window: {}, document: { querySelector: () => null } };
  vm.createContext(context);
  vm.runInContext(read('resources-data.js'), context);
  const catalog = context.window.POTENCIAR_RESOURCES;
  const tool = catalog.find(item => item.category === 'Herramientas');
  assert.ok(tool);
  // The production script sorts before querying its mount points. Capture that
  // actual array through a filter wrapper, then let the complete script run.
  let sorted;
  function order(items) {
    context.window.POTENCIAR_RESOURCES = { filter(predicate) { sorted = items.filter(predicate); return sorted; } };
    vm.runInContext(source, context);
    let seenOther = false;
    for (const item of sorted) {
      if (item.category !== 'Herramientas') seenOther = true;
      else assert.equal(seenOther, false, `${item.id} appears after a non-tool`);
    }
    assert.equal(sorted.filter(item => item.category === 'Herramientas').length, items.filter(item => item.category === 'Herramientas').length);
  }
  order(catalog);
  order([...catalog, { ...tool, id: 'second-tool' }, { ...tool, id: 'other-category', category: 'Otra' }]);
  order([...catalog].reverse());
});
