const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

function publicPages(dir = '') {
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((entry) => {
    const file = path.posix.join(dir, entry.name);
    if (entry.isDirectory() && (dir || ['blog', 'recursos', 'herramientas'].includes(entry.name))) {
      return publicPages(file);
    }
    return entry.isFile() && entry.name.endsWith('.html') && entry.name !== 'design-system.html'
      ? [file] : [];
  });
}

const pages = publicPages().filter((page) => /<footer\b/i.test(read(page)));
const selectors = [
  'footer .footer-links a',
  'footer :is(p, span):has(> a[href="/privacidad"]) > a',
  'footer > p:has(> a[href^="/recursos/"]) > a',
];
const normalize = (value) => value.replace(/\s+/g, ' ').trim();

function touchRule(page) {
  const css = [...read(page).matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)]
    .map(([, body]) => body.replace(/\/\*[\s\S]*?\*\//g, '')).join('\n');
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([, selector, body]) => /footer/.test(selector) && /min-height\s*:\s*24px\b/.test(body));
  assert.equal(rules.length, 1, `${page}: falta una única regla del pie con mínimo de 24 px`);
  const [, selector, body] = rules[0];
  assert.equal(normalize(selector), normalize(selectors.join(', ')),
    `${page}: cubrir navegación, listas legales y el enlace destacado, sin las frases legales`);
  return Object.fromEntries(body.split(';').filter((item) => item.trim()).map((item) => {
    const colon = item.indexOf(':');
    return [item.slice(0, colon).trim(), item.slice(colon + 1).trim()];
  }));
}

for (const page of pages) {
  test(`${page}: el CSS amplía los enlaces independientes del pie y conserva su aspecto`, () => {
    assert.deepEqual(touchRule(page), {
      display: 'inline-flex',
      'align-items': 'center',
      'box-sizing': 'border-box',
      'min-height': '24px',
      'min-width': '24px',
      'max-width': '100%',
      'padding-block': 'max(0px, calc((24px - 1lh) / 2))',
      'white-space': 'normal',
      'overflow-wrap': 'anywhere',
    }, 'solo tamaño mínimo y contención; sin cambiar fuente ni color ni superponer objetivos');
  });
}

test('todas las páginas públicas con pie quedan cubiertas por el mismo CSS', () => {
  assert.equal(pages.length, 40);
  assert.deepEqual(Object.fromEntries(['', 'blog/', 'recursos/', 'herramientas/'].map((dir) => [
    dir || 'raíz', pages.filter((page) => dir ? page.startsWith(dir) : !page.includes('/')).length,
  ])), { raíz: 31, 'blog/': 5, 'recursos/': 3, 'herramientas/': 1 });
  const reference = touchRule(pages[0]);
  for (const page of pages) assert.deepEqual(touchRule(page), reference, page);
});

test('los selectores alcanzan las listas reales y dejan fuera los enlaces dentro de frases', () => {
  for (const page of pages) {
    const footer = read(page).match(/<footer\b[^>]*>([\s\S]*?)<\/footer>/i)[1];
    // Cada enlace legal independiente está en .footer-links o en una lista p/span.
    const navigation = [...footer.matchAll(/<(nav|div)\b[^>]*class="footer-links"[^>]*>([\s\S]*?)<\/\1>/gi)]
      .map(([, , body]) => body);
    const groups = [...footer.matchAll(/<(p|span|small)\b([^>]*)>([\s\S]*?)<\/\1>/gi)];
    const legalLists = groups.filter(([, tag, , body]) => tag !== 'small' &&
      /^\s*<a\b/.test(body) && body.includes('href="/privacidad"')).map(([, , , body]) => body);
    for (const href of ['/privacidad', '/terminos', '/eliminacion-de-datos']) {
      assert.ok([...navigation, ...legalLists].some((body) => body.includes(`href="${href}"`)),
      `${page}: ${href} debe pertenecer a una lista de enlaces cubierta`);
    }
    for (const [, , attributes, body] of groups) {
      if (/class="(?:footer-legal|footer-copy|consumer)"/.test(attributes)) {
        assert.doesNotMatch(body, /href="\/privacidad"|href="\/recursos\//,
          `${page}: una frase no debe coincidir con los selectores de listas`);
      }
    }
  }
});

test('la regla limita el ancho al contenedor y permite partir enlaces largos', () => {
  for (const page of pages) {
    const rule = touchRule(page);
    assert.equal(rule['box-sizing'], 'border-box');
    assert.equal(rule['max-width'], '100%');
    assert.equal(rule['white-space'], 'normal');
    assert.equal(rule['overflow-wrap'], 'anywhere');
    assert.equal(rule['min-width'], '24px');
    assert.ok(!Object.keys(rule).some((property) => /^(width|padding-inline|margin-inline|gap)$/.test(property)));
  }
});
