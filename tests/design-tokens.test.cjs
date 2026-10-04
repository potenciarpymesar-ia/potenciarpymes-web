const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const generator = path.join(root, 'scripts', 'build-design-tokens.cjs');

function api() {
  assert.ok(fs.existsSync(generator), 'The token generator must exist');
  return require(generator);
}

function tokens() {
  return JSON.parse(fs.readFileSync(path.join(root, 'design-tokens.json'), 'utf8'));
}

test('generates identical CSS for identical input and checks the committed artifact', () => {
  const { generate } = api();
  const source = tokens();
  assert.equal(generate(source), generate(source));
  assert.equal(generate(source), fs.readFileSync(path.join(root, 'design-tokens.css'), 'utf8'));
});

test('the contrast calculation matches black/white and identical colors', () => {
  const { contrast } = api();
  assert.equal(contrast('#000000', '#FFFFFF'), 21);
  assert.equal(contrast('#11110F', '#11110F'), 1);
});

test('every declared text and interactive pair meets its contrast minimum', () => {
  const { contrast, resolve } = api();
  const source = tokens();
  for (const theme of ['light', 'dark']) {
    for (const pair of source.contrastPairs) {
      const ratio = contrast(resolve(source, source.themes[theme][pair.foreground]), resolve(source, source.themes[theme][pair.background]));
      assert.ok(ratio >= pair.minimum, `${theme} ${pair.foreground}/${pair.background}: ${ratio.toFixed(2)} < ${pair.minimum}`);
    }
  }
});

test('generation rejects inaccessible theme changes', () => {
  const { generate } = api();
  const source = tokens();
  source.themes.light.text = source.themes.light.bg;
  assert.throws(() => generate(source), /contrast.*light.*text\/bg/i);
});

test('generation resolves changed source values, including legacy aliases', () => {
  const { generate } = api();
  const source = tokens();
  source.brand.ink = '#000000';
  const css = generate(source);
  assert.match(css, /--pp-brand-ink: #000000;/);
  assert.match(css, /--ink: var\(--pp-brand-ink\);/);
  assert.match(css, /--paper-0: var\(--pp-bg\);/);
  assert.match(css, /\[data-theme="light"\]/);
  assert.match(css, /\[data-theme="dark"\]/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});

test('unknown references cannot silently generate invalid CSS', () => {
  const { generate } = api();
  const source = tokens();
  source.themes.dark.text = '{brand.missing}';
  assert.throws(() => generate(source), /Unknown token reference/);
});
