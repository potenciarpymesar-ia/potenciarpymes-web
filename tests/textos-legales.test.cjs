const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const text = (file) => fs.readFileSync(path.join(root, file), 'utf8')
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .toLowerCase();

function mustInclude(file, phrases) {
  const body = text(file);
  for (const phrase of phrases) assert.ok(body.includes(phrase.toLowerCase()), `${file}: falta "${phrase}"`);
}

test('la política de privacidad cubre lo que piden la Ley 25.326 y Meta', () => {
  mustInclude('privacidad.html', [
    'ley 25.326',
    'responsable del tratamiento',
    'qué datos recolectamos',
    'los que se generan al usar el sitio',
    'para qué usamos tus datos',
    'obligatorio',
    'con quién compartimos',
    'vercel', 'resend', 'google sheets', 'google analytics', 'píxel de meta', 'microsoft clarity',
    'estados unidos',
    'cuánto tiempo los conservamos',
    'cómo los protegemos',
    'diez días corridos',
    'cinco días hábiles',
    'seis meses',
    'artículo 14, inciso 3',
    'agencia de acceso a la información pública',
    'menores de edad',
    'cambios en esta política',
    'página de eliminación de datos',
  ]);
});

test('los términos cubren servicios, pagos, cancelación, consumidor y jurisdicción', () => {
  mustInclude('terminos.html', [
    'mayor de 18 años',
    'herramientas y recursos gratuitos',
    'servicios pagos',
    'pagos y facturación',
    'entregables y propiedad intelectual',
    'confidencialidad',
    'diez días corridos',
    'artículo 34 de la ley 24.240',
    'incumplimiento y suspensión',
    'ley 24.240',
    'código civil y comercial',
    'tribunales ordinarios de la ciudad autónoma de buenos aires',
    'política de privacidad',
    'página de eliminación de datos',
  ]);
});

test('la página de eliminación de datos explica pasos, plazo y qué se conserva', () => {
  mustInclude('eliminacion-de-datos.html', [
    'info@potenciarpymes.ar',
    'eliminar mis datos',
    'cinco días hábiles',
    'qué eliminamos',
    'qué podemos conservar',
    'plataformas de terceros',
    'agencia de acceso a la información pública',
  ]);
});

test('ninguna de las tres páginas conserva marcas de borrador', () => {
  for (const file of ['privacidad.html', 'terminos.html', 'eliminacion-de-datos.html']) {
    const raw = fs.readFileSync(path.join(root, file), 'utf8');
    assert.ok(!/borrador/i.test(raw), `${file}: quedó una marca de borrador`);
  }
});
