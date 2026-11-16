const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const LEGAL_NAME = 'frenquel jonathan';
const CUIT = '20-27768640-7';
const CITY = 'ciudad autónoma de buenos aires';
const MAIL = 'info@potenciarpymes.ar';
const WHATSAPP = '+54 9 11 5016-1326';

// El domicilio fiscal no puede aparecer en ningún archivo público. Para no dejar la
// calle escrita en el repositorio, se compara por huella SHA-256 de la palabra normalizada.
const FORBIDDEN_WORD_HASHES = new Set([
  '9c9c24d02dd150ceacaf7b95151d6c416e6bc2ae8a0d2781ca54f50ec3582858',
]);
const FORBIDDEN_WORDS = ['dpto', 'depto'];

function publicPages(dir = '') {
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((entry) => {
    const file = path.posix.join(dir, entry.name);
    if (entry.isDirectory() && (dir || ['blog', 'recursos', 'herramientas'].includes(entry.name))) {
      return publicPages(file);
    }
    return entry.isFile() && entry.name.endsWith('.html') && entry.name !== 'design-system.html' ? [file] : [];
  });
}
const identityPages = publicPages();

function publicFiles() {
  const out = [];
  const skip = new Set(['node_modules', '.git', 'tests', 'docs', 'frontend', 'qa', 'scripts', 'vendor', 'assets']);
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (skip.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(html|txt|xml|json|js|css)$/i.test(entry.name)) out.push(path.relative(root, full));
    }
  })(root);
  return out.filter((file) => file !== 'design-tokens.json');
}

function visibleText(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

for (const page of identityPages) {
  test(`${page} muestra la identidad completa y los enlaces legales en el pie`, () => {
    const html = read(page);
    const footer = html.match(/<footer\b[^>]*>[\s\S]*?<\/footer>/i)?.[0];
    assert.ok(footer, 'falta el pie');
    const text = visibleText(footer);
    assert.ok(text.includes(LEGAL_NAME), 'falta el nombre legal');
    assert.ok(text.includes(CUIT), 'falta el CUIT');
    assert.ok(text.includes(CITY), 'falta la ciudad');
    assert.ok(text.includes(MAIL), 'falta el mail de contacto');
    assert.ok(text.includes(WHATSAPP), 'falta el WhatsApp visible');
    assert.doesNotMatch(footer, /\bhidden\b|aria-hidden="true"|display\s*:\s*none|visibility\s*:\s*hidden/i);
    for (const [href, label] of [
      ['mailto:info@potenciarpymes.ar', MAIL],
      ['https://wa.me/5491150161326', `WhatsApp ${WHATSAPP}`],
      ['/privacidad', 'Privacidad'], ['/terminos', 'Términos'], ['/eliminacion-de-datos', 'Eliminación de datos'],
    ]) {
      const links = [...footer.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)]
        .filter(([, url]) => url === href);
      assert.ok(links.some(([, , labelHTML]) => visibleText(labelHTML).trim() === label.toLowerCase()), `${page}: falta el enlace visible a ${href}`);
      if (href.startsWith('/')) assert.equal(links.length, 1, `${page}: enlace legal duplicado: ${href}`);
    }
  });
}

test('eliminacion-de-datos.html existe y está enlazada desde sitemap, llms y Tus derechos', () => {
  assert.ok(fs.existsSync(path.join(root, 'eliminacion-de-datos.html')));
  assert.ok(identityPages.includes('eliminacion-de-datos.html'));
  assert.ok(publicFiles().includes('eliminacion-de-datos.html'), 'la página nueva debe quedar cubierta por el control de domicilio fiscal');
  assert.match(read('sitemap.xml'), /<loc>https:\/\/potenciarpymes\.ar\/eliminacion-de-datos<\/loc>\s*<lastmod>2026-11-16<\/lastmod>\s*<changefreq>monthly<\/changefreq>\s*<priority>0\.6<\/priority>/);
  assert.match(read('llms.txt'), /https:\/\/potenciarpymes\.ar\/eliminacion-de-datos/);
  const rights = read('privacidad.html').match(/<h2>Tus derechos<\/h2>([\s\S]*?)<\/div>/)?.[1];
  assert.match(rights || '', /href="\/eliminacion-de-datos"/);
});

test('la página de eliminación explica el pedido, el alcance y el plazo sin pedir datos sensibles', () => {
  const html = read('eliminacion-de-datos.html');
  assert.match(html, /<main id="main">\s*<!-- BORRADOR para revisión legal/);
  assert.match(html, /<body data-service="eliminacion-de-datos">/);
  const headings = [...html.matchAll(/<h2>([^<]+)<\/h2>/g)].map(([, heading]) => heading);
  assert.deepEqual(headings, ['Qué podés pedir', 'Cómo pedirlo', 'Cuánto tardamos', 'Qué eliminamos', 'Qué podemos conservar', 'Datos en plataformas de terceros', 'Reclamos', 'Contacto']);
  const text = visibleText(html);
  for (const phrase of ['test gratis de 4 preguntas', 'chequeo web gratis', 'eliminar mis datos', '5 días hábiles', 'ley 25.326', 'planilla privada', 'copias de respaldo', 'aaip', 'no nos envíes documentos ni datos sensibles']) {
    assert.ok(text.includes(phrase), `falta: ${phrase}`);
  }
  const blocks = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map(([, body]) => JSON.parse(body));
  const breadcrumb = blocks.find((block) => block['@type'] === 'BreadcrumbList');
  assert.equal(breadcrumb?.itemListElement.at(-1).item, 'https://potenciarpymes.ar/eliminacion-de-datos');
  const webpage = blocks.find((block) => block['@type'] === 'WebPage');
  assert.equal(webpage?.url, 'https://potenciarpymes.ar/eliminacion-de-datos');
  assert.equal(webpage?.name, 'Eliminación de datos');
  assert.equal(webpage?.inLanguage, 'es-AR');
});

test('ningún archivo público contiene el domicilio fiscal', () => {
  for (const file of publicFiles()) {
    const normalized = read(file).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    for (const word of normalized.split(/[^a-z0-9]+/)) {
      if (!word) continue;
      const hash = crypto.createHash('sha256').update(word).digest('hex');
      assert.ok(!FORBIDDEN_WORD_HASHES.has(hash), `${file}: contiene una palabra del domicilio fiscal`);
      assert.ok(!FORBIDDEN_WORDS.includes(word), `${file}: contiene "${word}"`);
    }
  }
});

test('la política de privacidad nombra al responsable y no cita calle ni número', () => {
  const text = visibleText(read('privacidad.html'));
  assert.ok(text.includes('nombre comercial potenciar pymes'));
  assert.ok(text.includes('noviembre de 2026'));
  assert.ok(!/(domicilio|calle)[^.]{0,80}\b\d{2,5}\b/.test(text), 'no debe haber calle con número');
});

test('los pies de index, diagnóstico completo, web profesional y privacidad enlazan a los términos', () => {
  for (const page of ['index.html', 'diagnostico-digital.html', 'web-profesional.html', 'privacidad.html']) {
    assert.match(read(page), /href="\/terminos"/, `${page}: falta el enlace a /terminos`);
  }
});

test('terminos.html existe, está en el sitemap y en llms.txt', () => {
  assert.ok(fs.existsSync(path.join(root, 'terminos.html')));
  assert.match(read('sitemap.xml'), /<loc>https:\/\/potenciarpymes\.ar\/terminos<\/loc>/);
  assert.match(read('llms.txt'), /https:\/\/potenciarpymes\.ar\/terminos/);
  assert.match(read('llms.txt'), /20-27768640-7/);
});

test('la home deja preparado el lugar para la verificación de dominio de Meta', () => {
  const home = read('index.html');
  const head = home.slice(0, home.indexOf('</head>'));
  assert.match(head, /<!--[\s\S]*?facebook-domain-verification[\s\S]*?-->/);
  assert.ok(!/<meta\s+name="facebook-domain-verification"/i.test(head.replace(/<!--[\s\S]*?-->/g, '')),
    'la etiqueta real se agrega cuando Meta entregue el código');
});

test('los datos estructurados de la organización incluyen nombre legal, CUIT y ciudad, sin dirección postal', () => {
  const home = read('index.html');
  const blocks = [...home.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map(([, body]) => JSON.parse(body));
  const nodes = blocks.flatMap((block) => (Array.isArray(block['@graph']) ? block['@graph'] : [block]));
  const org = nodes.find((node) => node['@id'] === 'https://potenciarpymes.ar/#organization');
  assert.ok(org, 'falta el nodo de organización');
  assert.equal(org.legalName, 'Frenquel Jonathan');
  assert.equal(org.taxID, CUIT);
  assert.equal(org.address.addressCountry, 'AR');
  assert.equal(org.address.addressLocality, 'Ciudad Autónoma de Buenos Aires');
  for (const field of ['streetAddress', 'postalCode']) assert.equal(org.address[field], undefined);
  assert.deepEqual(org.contactPoint, {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    email: MAIL,
    telephone: WHATSAPP,
    areaServed: 'AR',
    availableLanguage: 'es',
  });
});

test('el teléfono de WhatsApp es el mismo en todo el sitio', () => {
  const numbers = new Set();
  for (const file of publicFiles()) {
    for (const [, number] of read(file).matchAll(/wa\.me\/(\d+)/g)) numbers.add(number);
  }
  assert.deepEqual([...numbers], ['5491150161326']);
});
