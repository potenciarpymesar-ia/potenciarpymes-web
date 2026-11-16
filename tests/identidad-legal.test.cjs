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

// El domicilio fiscal no puede aparecer en ningún archivo público. Para no dejar la
// calle escrita en el repositorio, se compara por huella SHA-256 de la palabra normalizada.
const FORBIDDEN_WORD_HASHES = new Set([
  '9c9c24d02dd150ceacaf7b95151d6c416e6bc2ae8a0d2781ca54f50ec3582858',
]);
const FORBIDDEN_WORDS = ['dpto', 'depto'];

const identityPages = ['index.html', 'diagnostico-digital.html', 'web-profesional.html', 'privacidad.html', 'terminos.html'];

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
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

for (const page of identityPages) {
  test(`${page} muestra nombre legal, CUIT, ciudad y mail`, () => {
    const text = visibleText(read(page));
    assert.ok(text.includes(LEGAL_NAME), 'falta el nombre legal');
    assert.ok(text.includes(CUIT), 'falta el CUIT');
    assert.ok(text.includes(CITY), 'falta la ciudad');
    assert.ok(text.includes(MAIL), 'falta el mail de contacto');
  });
}

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
});

test('el teléfono de WhatsApp es el mismo en todo el sitio', () => {
  const numbers = new Set();
  for (const file of publicFiles()) {
    for (const [, number] of read(file).matchAll(/wa\.me\/(\d+)/g)) numbers.add(number);
  }
  assert.deepEqual([...numbers], ['5491150161326']);
});
