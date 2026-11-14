const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

function publicHtml(directory = '') {
  return fs.readdirSync(path.join(root, directory), { withFileTypes: true })
    .flatMap((entry) => {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) return directory ? publicHtml(file) : [];
      return entry.isFile() && entry.name.endsWith('.html') && entry.name !== 'design-system.html'
        ? [file] : [];
    });
}

function normalizeEntities(text) {
  return text.replace(/&oacute;|&#0*243;|&#x0*f3;/gi, 'ó');
}

test('los archivos públicos usan los nombres comerciales vigentes, incluso con entidades HTML', () => {
  const files = [
    ...publicHtml(),
    ...['blog', 'recursos', 'herramientas'].flatMap(publicHtml),
    'llms.txt',
    'resources-data.js',
  ];
  const oldName = /diagnóstico\s+(?:inicial|gratuito|gratis|online)\b/iu;
  const offenders = files.filter((file) => oldName.test(normalizeEntities(read(file))));
  assert.deepEqual(offenders, [], 'Nombres anteriores encontrados en archivos públicos');
});

test('el portfolio aclara que las cuatro maquetas usan datos y cifras de ejemplo', () => {
  const html = read('web-profesional.html');
  const note = html.match(/<p class="portfolio-note">([^<]+)<\/p>/);
  assert.ok(note, 'Falta el aviso visible con clase portfolio-note');
  assert.equal(note[1], 'Marcas Muro es un sitio real. Los otros cuatro ejemplos son maquetas de diseño: sus textos, datos y cifras son de ejemplo y no corresponden a clientes ni a resultados reales.');
  assert.match(html, /class="portfolio-head">[\s\S]*?<\/p>\s*<p class="portfolio-note">/);
});

test('el test gratis conserva los eventos y el identificador de flujo de medición', () => {
  const html = read('diagnostico.html');
  for (const event of [
    'diagnostico_iniciado',
    'diagnostico_answers_completed',
    'diagnostico_contact_submitted',
    'diagnostico_error',
    'diagnostico_completado',
    'diagnostico_result_shown',
  ]) {
    assert.ok(html.includes(`ppTrack('${event}',`), `Falta el evento ${event}`);
  }
  assert.match(html, /ppTrack\(receipt\.stored === true \? 'diagnostico_contact_saved' : 'diagnostico_contact_sent',/);
  assert.match(html, /flow:\s*'diagnostico_inicial'/);
  assert.match(html, /window\.dataLayer\.push\(\{ event:'click_diagnostico_completo'/);
});
