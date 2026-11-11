const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const origin = 'https://potenciarpymes.ar';
const voidTags = new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
const pagesIn = (dir) => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(entry => {
  const file = path.posix.join(dir, entry.name);
  if (entry.isDirectory()) return pagesIn(file);
  return entry.name.endsWith('.html') && entry.name !== 'design-system.html' ? [file] : [];
});
const pages = [
  ...fs.readdirSync(root).filter(file => file.endsWith('.html') && file !== 'design-system.html'),
  ...['blog', 'recursos', 'herramientas'].flatMap(pagesIn),
];

function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)]
    .map(([, key, double, single, bare]) => [key.toLowerCase(), double ?? single ?? bare ?? '']));
}

function pngDimensions(buffer) {
  assert.equal(buffer.subarray(1, 4).toString(), 'PNG');
  return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
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
    offset = start + buffer.readUInt32LE(offset + 4) + (buffer.readUInt32LE(offset + 4) % 2);
  }
  throw new Error('Missing WebP dimensions');
}

test('optimized WebP images preserve the original dimensions and stay below 150 KB', () => {
  for (const stem of [
    ...['arquitectura-interiorismo', 'consultoria-profesional', 'estudio-contable', 'estudio-juridico', 'marcas-muro']
      .map(name => 'assets/web-profesional/' + name),
    'marcas-muro-logo',
  ]) {
    const original = fs.readFileSync(path.join(root, stem + '.png'));
    const optimized = fs.readFileSync(path.join(root, stem + '.webp'));
    assert.deepEqual(webpDimensions(optimized), pngDimensions(original), stem);
    assert.ok(optimized.length < 150000, `${stem}: exceeds 150 KB`);
  }
});

test('favicon and Apple touch icon have the requested pixel dimensions and stay below 30 KB', () => {
  for (const [file, size] of [['favicon-48.png', 48], ['apple-touch-icon.png', 180]]) {
    const buffer = fs.readFileSync(path.join(root, file));
    assert.deepEqual(pngDimensions(buffer), [size, size]);
    assert.ok(buffer.length < 30000, file);
  }
});

test('below-fold images defer loading while navigation, service hero and home hero images stay eager', () => {
  for (const page of pages) {
    const nodes = all(parse(fs.readFileSync(path.join(root, page), 'utf8')));
    for (const image of nodes.filter(node => node.tag === 'img' && !hidden(node))) {
      const ancestors = [];
      for (let parent = image.parent; parent; parent = parent.parent) ancestors.push(parent);
      if (ancestors.some(node => ['nav', 'header'].includes(node.tag) || /(?:^|\s)(?:nav|hero|svc-hero)(?:\s|$)/.test(node.attrs.class || ''))) {
        assert.notEqual(image.attrs.loading, 'lazy', `${page}: initial image ${image.attrs.src}`);
      } else {
        assert.equal(image.attrs.loading, 'lazy', `${page}: below-fold image ${image.attrs.src}`);
        assert.equal(image.attrs.decoding, 'async', `${page}: below-fold decoding ${image.attrs.src}`);
      }
    }
  }
});

// A small static tree: scripts/styles are raw text, so JS strings never become HTML.
function parse(html) {
  const document = { tag: '#document', attrs: {}, children: [] };
  const stack = [document];
  const tokens = html.match(/<!--[\s\S]*?-->|<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>|<[^>]+>|[^<]+/gi) || [];
  for (const token of tokens) {
    if (/^<!--|^<!/i.test(token)) continue;
    const closing = token.match(/^<\/([\w-]+)/);
    if (closing) {
      const index = stack.findLastIndex(node => node.tag === closing[1].toLowerCase());
      if (index > 0) stack.length = index;
      continue;
    }
    const opening = token.match(/^<([\w-]+)\b([^>]*?)\/?\s*>/);
    if (!opening) { stack.at(-1).children.push(token); continue; }
    const node = { tag: opening[1].toLowerCase(), attrs: attributes(opening[2]), children: [], parent: stack.at(-1) };
    stack.at(-1).children.push(node);
    if (!voidTags.has(node.tag) && !['script', 'style'].includes(node.tag) && !token.endsWith('/>')) stack.push(node);
  }
  return document;
}
function all(node) {
  return [node, ...node.children.filter(child => typeof child !== 'string').flatMap(all)];
}
function hidden(node) {
  return node && (Object.hasOwn(node.attrs, 'hidden') || node.attrs['aria-hidden'] === 'true'
    || ['template', 'script', 'style'].includes(node.tag) || /display\s*:\s*none/i.test(node.attrs.style || '') || hidden(node.parent));
}
function text(node) {
  if (typeof node === 'string') return node.replace(/&(?:nbsp|#160);/g, ' ').trim();
  if (node.attrs['aria-hidden'] === 'true' || ['script', 'style'].includes(node.tag)) return '';
  if (node.tag === 'img') return node.attrs.alt || '';
  return node.children.map(text).join(' ').trim();
}
function accessibleName(node, nodes) {
  if (node.attrs['aria-labelledby']) return node.attrs['aria-labelledby'].split(/\s+/)
    .map(id => nodes.find(other => other.attrs.id === id)).filter(Boolean).map(text).join(' ').trim();
  return node.attrs['aria-label']?.trim() || text(node) || node.attrs.title?.trim() || '';
}
function localFile(url, owner) {
  const resolved = new URL(url.replace(/&amp;/g, '&'), origin + '/' + owner);
  if (resolved.origin !== origin) return null;
  return decodeURIComponent(resolved.pathname).replace(/^\//, '');
}
function sources(page, html) {
  const found = new Map([[page, html]]);
  function visit(owner, source) {
    const references = [
      ...source.matchAll(/<(?:link|script)\b[^>]*?\b(?:href|src)=["']([^"']+)["']/gi),
      ...source.matchAll(/(?:@import\s+(?:url\()?|\bimport\s+(?:[^;]*?from\s+)?)["']([^"']+)["']/gi),
    ];
    for (const [, url] of references) {
      const file = localFile(url, owner);
      if (!file || !/\.(css|js)$/.test(file) || found.has(file)) continue;
      assert.ok(fs.existsSync(path.join(root, file)), `${page}: missing dependency ${file}`);
      const content = fs.readFileSync(path.join(root, file), 'utf8');
      found.set(file, content);
      visit(file, content);
    }
  }
  visit(page, html);
  return found;
}
function imageReferences(owner, content) {
  // Includes src/srcset, CSS url(), metadata, JSON-LD and images created by JS.
  // In JavaScript only string literals can be image URLs; a.svg is a property.
  if (owner.endsWith('.js')) content = (content.match(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/g) || []).join('\n');
  return [...content.matchAll(/(?:^|[\s"'`(=:])((?:https?:\/\/[^\s"'`<>()[\]{}]+|\/?[\w.~-][\w./%+~-]*)\.(?:png|jpe?g|webp|gif|svg|ico|avif)(?:\?[^\s"'`<>()]*)?)(?=[\s"'`)<>,]|$)/gi)]
    .map(([, url]) => localFile(url, owner)).filter(Boolean);
}

for (const page of pages) {
  const html = fs.readFileSync(path.join(root, page), 'utf8');
  const nodes = all(parse(html));
  const dependencies = sources(page, html);

  test(`${page}: referenced images exist and meet the weight budget`, () => {
    const direct = nodes.filter(node => ['img', 'source', 'image'].includes(node.tag)).flatMap(node => [
      node.attrs.src, node.attrs.href, node.attrs['xlink:href'],
      ...(node.attrs.srcset || '').split(',').map(candidate => candidate.trim().split(/\s+/)[0]),
    ]).filter(Boolean).map(url => localFile(url, page)).filter(Boolean);
    const references = [...dependencies].flatMap(([owner, content]) => imageReferences(owner, content).map(image => [owner, image]));
    for (const [owner, image] of [...references, ...direct.map(image => [page, image])]) {
      assert.ok(fs.existsSync(path.join(root, image)), `${owner}: missing ${image}`);
      assert.ok(fs.statSync(path.join(root, image)).size <= 300000, `${owner}: ${image} exceeds 300 KB`);
    }
    for (const rel of ['icon', 'apple-touch-icon']) {
      const icons = nodes.filter(node => node.tag === 'link' && node.attrs.rel?.split(/\s+/).includes(rel));
      assert.equal(icons.length, 1, `${page}: expected one ${rel}`);
      const file = localFile(icons[0].attrs.href, page);
      assert.ok(file && fs.existsSync(path.join(root, file)), `${page}: missing local ${rel}`);
      assert.ok(fs.statSync(path.join(root, file)).size < 60000, `${page}: ${rel} exceeds 60 KB`);
    }
  });

  test(`${page}: every img reserves width and height`, () => {
    for (const node of nodes.filter(node => node.tag === 'img')) {
      assert.match(node.attrs.width || '', /^[1-9]\d*$/, `${page}: width for ${node.attrs.src}`);
      assert.match(node.attrs.height || '', /^[1-9]\d*$/, `${page}: height for ${node.attrs.src}`);
    }
  });

  test(`${page}: heavy original PNGs are not requested`, () => {
    for (const [owner, content] of dependencies) assert.doesNotMatch(content,
      /(?:assets\/web-profesional\/(?:arquitectura-interiorismo|estudio-juridico|consultoria-profesional|marcas-muro|estudio-contable)|marcas-muro-logo|favicon-potenciar-pymes-2026|og-potenciar-pymes-2026)\.png/i, owner);
  });

  test(`${page}: all keyboard controls have a focus-visible outline`, () => {
    const css = [...dependencies].filter(([file]) => file.endsWith('.css')).map(([, content]) => content).join('\n')
      + [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(([, content]) => content).join('\n');
    const focusRules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .filter(([, selector, body]) => selector.includes(':focus-visible') && /outline\s*:\s*[^;}]+solid/.test(body));
    for (const tag of ['a', 'button', 'input', 'select', 'textarea', 'summary']) assert.ok(
      focusRules.some(([, selectors]) => selectors.split(',').some(selector => {
        selector = selector.trim();
        return selector === ':focus-visible' || selector === '*:focus-visible' || selector === `${tag}:focus-visible`;
      })), `${page}: no general focus-visible outline for ${tag}`);
  });

  test(`${page}: visible fields have associated labels`, () => {
    for (const node of nodes.filter(node => ['input', 'select', 'textarea'].includes(node.tag)
      && node.attrs.type !== 'hidden' && !hidden(node))) {
      const wrapping = (() => { for (let parent = node.parent; parent; parent = parent.parent) if (parent.tag === 'label' && text(parent)) return true; return false; })();
      assert.ok(node.attrs['aria-label']?.trim() || (node.attrs['aria-labelledby'] && accessibleName(node, nodes)) || wrapping
        || (node.attrs.id && nodes.some(label => label.tag === 'label' && label.attrs.for === node.attrs.id && text(label))),
      `${page}: unlabelled ${node.tag} ${node.attrs.id || node.attrs.name}`);
    }
  });

  test(`${page}: buttons and links have accessible names and decorative icons are hidden`, () => {
    for (const node of nodes.filter(node => ['a', 'button'].includes(node.tag) && !hidden(node))) {
      assert.ok(accessibleName(node, nodes), `${page}: unnamed ${node.tag} ${node.attrs.class || node.attrs.id || ''}`);
    }
    for (const node of nodes.filter(node => !hidden(node) && (node.tag === 'svg' || (node.tag === 'i' && /(?:icon|fa[bsrl]?)(?:-|\s)/.test(node.attrs.class || ''))))) {
      assert.ok(node.attrs['aria-hidden'] === 'true' || accessibleName(node, nodes), `${page}: decorative icon needs aria-hidden`);
    }
  });

  test(`${page}: one main and a consecutive accessible heading hierarchy`, () => {
    assert.equal(nodes.filter(node => node.tag === 'main').length, 1, `${page}: expected exactly one main`);
    let previous = 0;
    // aria-hidden subtrees (including the decorative home scene) are absent from the accessibility tree.
    for (const node of nodes.filter(node => /^h[1-6]$/.test(node.tag) && !hidden(node))) {
      const level = Number(node.tag[1]);
      assert.ok(level <= previous + 1, `${page}: h${previous} to ${node.tag}: ${text(node).slice(0,80)}`);
      previous = level;
    }
  });

  test(`${page}: new-window links protect the opener`, () => {
    for (const node of nodes.filter(node => node.tag === 'a' && node.attrs.target?.toLowerCase() === '_blank')) {
      assert.ok(node.attrs.rel?.toLowerCase().split(/\s+/).includes('noopener'), `${page}: ${node.attrs.href || node.attrs.class} needs noopener`);
    }
  });

  test(`${page}: Google Fonts keeps swap and both preconnects`, () => {
    const links = nodes.filter(node => node.tag === 'link');
    const fonts = links.filter(node => /https:\/\/fonts.googleapis.com\/(?:css|css2)\?/.test(node.attrs.href || ''));
    for (const font of fonts) assert.match(font.attrs.href, /[?&](?:amp;)?display=swap(?:&|$)/);
    if (fonts.length) for (const host of ['fonts.googleapis.com', 'fonts.gstatic.com']) assert.ok(links.some(node =>
      node.attrs.rel === 'preconnect' && node.attrs.href === `https://${host}`
      && (host !== 'fonts.gstatic.com' || Object.hasOwn(node.attrs, 'crossorigin'))), `${page}: missing preconnect ${host}`);
  });
}
