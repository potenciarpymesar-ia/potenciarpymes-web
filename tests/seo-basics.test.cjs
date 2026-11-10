const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function publicPages(dir, recursive = false) {
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(dir, entry.name);
    if (entry.isDirectory() && recursive) return publicPages(relative, true);
    return entry.isFile() && entry.name.endsWith('.html') && entry.name !== 'design-system.html'
      ? [relative]
      : [];
  });
}

function attributes(tag) {
  return Object.fromEntries(
    [...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)]
      .map(([, key, double, single, unquoted]) => [key.toLowerCase(), double ?? single ?? unquoted]),
  );
}

function text(value) {
  const entities = { amp: '&', apos: "'", gt: '>', lt: '<', nbsp: ' ', quot: '"' };
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code) => {
    if (code.startsWith('#')) {
      const hex = code[1].toLowerCase() === 'x';
      return String.fromCodePoint(parseInt(code.slice(hex ? 2 : 1), hex ? 16 : 10));
    }
    return entities[code] ?? entity;
  }).replace(/\s+/g, ' ').trim().normalize('NFC');
}

function meta(head, key) {
  return [...head.matchAll(/<meta\b(?:"[^"]*"|'[^']*'|[^'">])*>/gi)]
    .map(([tag]) => attributes(tag))
    .filter(({ name, property }) => name === key || property === key)
    .map(({ content = '' }) => text(content));
}

function onlyValue(values, min, max, label) {
  assert.equal(values.length, 1, `Expected one ${label}`);
  const value = values[0];
  const length = [...value].length;
  assert.ok(length >= min && length <= max, `${label} has ${length} characters (expected ${min}–${max})`);
  return value;
}

function assertUnique(seen, value, page, label) {
  const key = value.toLowerCase();
  assert.ok(!seen.has(key), `${label} repeats the value from ${seen.get(key)}`);
  seen.set(key, page);
}

const pages = [...publicPages(''), ...['blog', 'recursos', 'herramientas'].flatMap((dir) => publicPages(dir, true))];
const titles = new Map();
const descriptions = new Map();

for (const page of pages) {
  test(`${page} has one H1 and complete, unique SEO metadata`, () => {
    const html = fs.readFileSync(path.join(root, page), 'utf8')
      .replace(/<!--[\s\S]*?-->|<(script|style|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '');
    const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? '';
    assert.equal([...html.matchAll(/<h1\b[^>]*>/gi)].length, 1, 'Expected one H1');

    const title = onlyValue([...head.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)]
      .map(([, value]) => text(value)), 30, 60, 'title');
    const description = onlyValue(meta(head, 'description'), 80, 160, 'meta description');
    assertUnique(titles, title, page, 'title');
    assertUnique(descriptions, description, page, 'meta description');

    const canonicals = [...head.matchAll(/<link\b(?:"[^"]*"|'[^']*'|[^'">])*>/gi)]
      .map(([tag]) => attributes(tag))
      .filter(({ rel }) => rel?.toLowerCase().split(/\s+/).includes('canonical'));
    assert.equal(canonicals.length, 1, 'Expected one canonical link');
    assert.ok(canonicals[0].href?.trim(), 'Canonical href is missing');
    assert.deepEqual(meta(head, 'og:title'), [title], 'og:title must match title');
    assert.deepEqual(meta(head, 'twitter:title'), [title], 'twitter:title must match title');
  });
}
