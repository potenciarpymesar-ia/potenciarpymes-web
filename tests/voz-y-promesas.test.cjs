const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const legalPages = new Set(['privacidad.html', 'terminos.html', 'eliminacion-de-datos.html']);
function pages(directory) {
  return fs.readdirSync(path.join(root, directory), { withFileTypes: true }).flatMap(entry => {
    const file = path.posix.join(directory, entry.name);
    if (entry.isDirectory()) return directory ? pages(file) : [];
    return entry.name.endsWith('.html') && entry.name !== 'design-system.html' && !legalPages.has(file) ? [file] : [];
  });
}
const files = [...pages(''), ...['blog', 'recursos', 'herramientas'].flatMap(pages), 'llms.txt'];
function readable(source) {
  const entities = { aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', ntilde: 'ñ', nbsp: ' ', quot: '"', amp: '&', iquest: '¿' };
  const decoded = source.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code) => {
    if (code[0] === '#') return String.fromCodePoint(parseInt(code.slice(code[1].toLowerCase() === 'x' ? 2 : 1), code[1].toLowerCase() === 'x' ? 16 : 10));
    return entities[code.toLowerCase()] ?? entity;
  });
  // Check text split by markup and the original attributes/metadata as well.
  return `${decoded.replace(/<[^>]*>/g, ' ')} ${decoded}`.replace(/\s+/g, ' ').normalize('NFC');
}
for (const file of files) {
  test(`${file}: voz personal y ausencia de promesas comerciales`, () => {
    const source = readable(fs.readFileSync(path.join(root, file), 'utf8'));
    // Examples written for another business retain that business's voice.
    let withoutMotto = source.replace(/Primero entendemos\. Después decidimos qué mejorar\./gi, '');
    if (file === 'whatsapp-business-setup.html') {
      withoutMotto = withoutMotto.replaceAll('"¡Hola! Gracias por escribirnos 👋 Somos [Nombre del negocio]. Contanos qué estás buscando y te ayudamos en un toque."', '');
    }
    if (file === 'blog/tiendanube-guia-completa.html') {
      withoutMotto = withoutMotto.replaceAll('"Sobre nosotros"', '');
    }
    assert.doesNotMatch(withoutMotto, /nuestro equipo|somos una agencia|te ayudamos|nos ocupamos|\bnosotros\b/i);
    assert.doesNotMatch(source, /aumentá tus ventas|duplicá|primer lugar|garantizado|mejora los números|4% más ventas|\+4% ventas|Volumen y tráfico desde el día uno/i);
  });
}
test('Meta Ads ofrece creatividades de imagen y copy, sin video', () => {
  const source = readable(fs.readFileSync(path.join(root, 'meta-ads.html'), 'utf8'));
  assert.doesNotMatch(source, /\bvideos?\b/i);
  assert.match(source, /Creatividades \(imagen, copy\)/);
});
