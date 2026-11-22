const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'service-premium.js'), 'utf8');
const pages = [
  'analisis-mensual.html',
  'identidad-visual.html',
  'inpi.html',
  'automatizaciones.html',
  'mercado-libre.html',
  'meta-ads.html',
  'ga4.html',
  'tiendanube.html',
  'whatsapp-business.html',
  'google-business.html',
  'google-shopping.html',
  'contenido-ia.html',
  'seo-geo.html',
];
const legalLinks = [
  ['/privacidad', 'Privacidad'],
  ['/terminos', 'Términos'],
  ['/eliminacion-de-datos', 'Eliminación de datos'],
];
const navigationLinks = ['/soluciones', '/recursos', '/#diagnostico', '/#contacto'];

function anchors(html) {
  return [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)]
    .map(([, href, label]) => ({ href, label: label.replace(/<[^>]+>/g, '').trim() }));
}

function footerDOM(html) {
  const footer = html.match(/<footer\b[^>]*>([\s\S]*?)<\/footer>/i);
  assert.ok(footer, 'la página debe tener un pie');
  // Cada innerHTML es mutable: reemplazarlo descarta sus enlaces anteriores,
  // igual que en el DOM. El contenido inicial proviene de la página real.
  const groups = [...footer[1].matchAll(/<nav\b[^>]*class="footer-links"[^>]*>([\s\S]*?)<\/nav>/gi)]
    .map(([, innerHTML]) => ({ innerHTML }));
  const copies = [...footer[1].matchAll(/<p\b[^>]*class="footer-copy"[^>]*>([\s\S]*?)<\/p>/gi)]
    .map(([, textContent]) => ({ textContent }));
  assert.ok(groups.length > 1, 'deben existir ambos grupos de enlaces del pie');
  const document = {
    querySelector(selector) {
      if (selector === '.footer-copy') return copies[0];
      return null;
    },
    querySelectorAll(selector) {
      assert.equal(selector, '.footer-links');
      return groups;
    },
  };
  return { document, groups, copies };
}

for (const page of pages) {
  test(`${page} conserva los enlaces legales después de ejecutar service-premium.js`, () => {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    assert.match(html, /<script\b[^>]*src="\/service-premium\.js"/);
    const dom = footerDOM(html);
    const otherGroups = dom.groups.slice(1).map((group) => group.innerHTML);
    const legalIdentity = dom.copies.slice(1).map((copy) => copy.textContent);

    vm.runInNewContext(script, {
      document: dom.document,
      window: { addEventListener() {} },
    }, { filename: 'service-premium.js', timeout: 1000 });

    const renderedLinks = anchors(dom.groups[0].innerHTML);
    for (const [href, label] of legalLinks) {
      const matches = renderedLinks.filter((link) => link.href === href);
      assert.equal(matches.length, 1, `${page}: el pie renderizado debe conservar ${href} una sola vez`);
      assert.equal(matches[0].label, label);
    }
    for (const href of navigationLinks) {
      assert.equal(renderedLinks.filter((link) => link.href === href).length, 1,
        `${page}: debe conservar el enlace de navegación ${href}`);
    }
    assert.deepEqual(dom.groups.slice(1).map((group) => group.innerHTML), otherGroups,
      'debe conservar el resto de los enlaces del pie');
    assert.deepEqual(dom.copies.slice(1).map((copy) => copy.textContent), legalIdentity,
      'debe conservar los datos legales y sus enlaces de contacto');
  });
}
