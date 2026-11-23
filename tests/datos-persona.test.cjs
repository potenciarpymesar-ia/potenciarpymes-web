const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const origin = 'https://potenciarpymes.ar';
const personId = `${origin}/#jonathan`;

function pagesIn(dir, recursive = false) {
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(entry => {
    const file = path.posix.join(dir, entry.name);
    if (entry.isDirectory() && recursive) return pagesIn(file, true);
    return entry.isFile() && entry.name.endsWith('.html') && entry.name !== 'design-system.html' ? [file] : [];
  });
}

const pages = [...pagesIn(''), ...['blog', 'recursos', 'herramientas'].flatMap(dir => pagesIn(dir, true))];
const blocksByPage = new Map(pages.map(page => {
  const html = fs.readFileSync(path.join(root, page), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  const blocks = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)]
    .filter(([, attrs]) => /\btype\s*=\s*(?:"application\/ld\+json"|'application\/ld\+json'|application\/ld\+json(?=\s|$))/i.test(attrs))
    .map(([, , json]) => json);
  return [page, blocks];
}));

function schemas(page) {
  return blocksByPage.get(page).map(json => JSON.parse(json));
}

function nodes(value) {
  if (!value || typeof value !== 'object') return [];
  return Array.isArray(value) ? value.flatMap(nodes) : [value, ...Object.values(value).flatMap(nodes)];
}

function isJonathan(node) {
  return [].concat(node['@type'] ?? []).includes('Person') && node['@id'] === personId;
}

function homePerson() {
  const people = schemas('index.html').flatMap(nodes).filter(isJonathan);
  assert.equal(people.length, 1);
  return people[0];
}

function webpDimensions(buffer) {
  assert.equal(buffer.toString('ascii', 0, 4), 'RIFF');
  assert.equal(buffer.toString('ascii', 8, 12), 'WEBP');
  for (let offset = 12; offset + 8 < buffer.length;) {
    const kind = buffer.toString('ascii', offset, offset + 4);
    const start = offset + 8;
    if (kind === 'VP8X') return [buffer.readUIntLE(start + 4, 3) + 1, buffer.readUIntLE(start + 7, 3) + 1];
    if (kind === 'VP8 ') return [buffer.readUInt16LE(start + 6) & 0x3fff, buffer.readUInt16LE(start + 8) & 0x3fff];
    if (kind === 'VP8L') {
      const bits = buffer.readUInt32LE(start + 1);
      return [(bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1];
    }
    const size = buffer.readUInt32LE(offset + 4);
    offset = start + size + (size % 2);
  }
  throw new Error('Missing WebP dimensions');
}

test('Jonathan has exactly the two real partner credentials, without Google or Meta', () => {
  const credentials = homePerson().hasCredential;
  assert.deepEqual(credentials, [
    { '@type': 'EducationalOccupationalCredential', name: 'Mercado Libre Partner', recognizedBy: { '@type': 'Organization', name: 'Mercado Libre' } },
    { '@type': 'EducationalOccupationalCredential', name: 'Tiendanube Partner', recognizedBy: { '@type': 'Organization', name: 'Tiendanube' } },
  ]);
  assert.doesNotMatch(JSON.stringify(credentials), /google|meta/i);
});

test('Jonathan ImageObject points to the current local portrait with its actual dimensions', () => {
  const image = homePerson().image;
  assert.equal(image?.['@type'], 'ImageObject');
  assert.equal(image.url, `${origin}/assets/sobre-mi/jonathan-estudio-hero.webp`);
  const file = path.join(root, new URL(image.url).pathname.slice(1));
  assert.ok(fs.statSync(file).isFile());
  const dimensions = webpDimensions(fs.readFileSync(file));
  assert.deepEqual(dimensions, [1086, 1448]);
  assert.deepEqual([image.width, image.height], dimensions);
});

test('Jonathan knowsAbout includes all six confirmed topics', () => {
  assert.deepEqual(homePerson().knowsAbout, [
    'Tiendanube', 'Mercado Libre', 'SEO', 'GEO', 'Redes sociales', 'Automatización de procesos',
  ]);
});

test('Jonathan worksFor resolves to the existing home organization', () => {
  const person = homePerson();
  assert.deepEqual(person.worksFor, { '@id': `${origin}/#organization` });
  const organizations = schemas('index.html').flatMap(nodes).filter(node =>
    node['@type'] === 'Organization' && node['@id'] === person.worksFor['@id']);
  assert.equal(organizations.length, 1);
  assert.equal(organizations[0].name, 'Potenciar Pymes');
  assert.equal(organizations[0].founder['@id'], personId);
});

test('every complete Jonathan Person definition agrees with the home', () => {
  const home = homePerson();
  for (const page of pages) {
    for (const person of schemas(page).flatMap(nodes).filter(isJonathan)) {
      if (Object.keys(person).some(key => !['@type', '@id', 'name'].includes(key))) {
        assert.deepEqual(person, home, page);
      }
    }
  }
});

test('all public site JSON-LD blocks parse as valid JSON', () => {
  assert.ok(blocksByPage.get('index.html').length > 0);
  for (const [page, blocks] of blocksByPage) {
    blocks.forEach((json, index) => assert.doesNotThrow(() => JSON.parse(json), `${page}, block ${index + 1}`));
  }
});

test('no public site JSON-LD mentions Power BI', () => {
  for (const page of pages) {
    for (const schema of schemas(page)) {
      assert.doesNotMatch(JSON.stringify(schema), /power\s*bi/i, page);
    }
  }
});
