const fs = require('node:fs');
const path = require('node:path');

function resolve(source, value, seen = new Set()) {
  if (typeof value !== 'string' || !/^\{[^}]+\}$/.test(value)) return value;
  const key = value.slice(1, -1);
  if (seen.has(key)) throw new Error(`Circular token reference: ${key}`);
  const result = key.split('.').reduce((node, part) => node?.[part], source);
  if (result === undefined) throw new Error(`Unknown token reference: ${key}`);
  return resolve(source, result, new Set([...seen, key]));
}

function contrast(foreground, background) {
  function luminance(hex) {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) throw new Error(`Contrast needs an opaque six-digit hex color: ${hex}`);
    const rgb = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255)
      .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  }
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function generate(source) {
  const reports = [];
  for (const [name, theme] of Object.entries(source.themes)) {
    for (const pair of source.contrastPairs) {
      const ratio = contrast(resolve(source, theme[pair.foreground]), resolve(source, theme[pair.background]));
      if (ratio < pair.minimum) throw new Error(`Contrast failed: ${name} ${pair.foreground}/${pair.background} ${ratio.toFixed(2)} < ${pair.minimum}`);
      reports.push(` * ${name}: ${pair.foreground}/${pair.background} ${ratio.toFixed(2)}:1 (minimum ${pair.minimum}:1)`);
    }
  }
  const declarations = (group, prefix) => Object.entries(group).map(([key, value]) => `  --${prefix}-${key}: ${resolve(source, value)};`).join('\n');
  const aliases = Object.entries(source.aliases).map(([key, value]) => `  --${key}: var(--${value});`).join('\n');
  const groups = ['brand', 'font', 'type', 'weight', 'leading', 'tracking', 'space', 'breakpoint', 'container', 'radius', 'border-width', 'control', 'z', 'motion', 'ease'];
  const theme = name => `  color-scheme: ${name};\n${declarations(source.themes[name], 'pp')}\n${aliases}`;
  return [
    '/* Generated from design-tokens.json. Do not edit; run node scripts/build-design-tokens.cjs.',
    ' * Contrast ratios use opaque sRGB colors; component opacity/background overlays require a separate check.',
    ...reports,
    ' */',
    ':root {',
    ...groups.map(group => declarations(source[group], `pp-${group}`)),
    theme(source.defaultTheme),
    '}',
    ...Object.keys(source.themes).map(name => `[data-theme="${name}"] {\n${theme(name)}\n}`),
    '@media (prefers-reduced-motion: reduce) {',
    '  :root, [data-theme] {',
    declarations(source['motion-reduced'], 'pp-motion').split('\n').map(line => `  ${line}`).join('\n'),
    '  }',
    '}',
    ''
  ].join('\n');
}

if (require.main === module) {
  const root = path.join(__dirname, '..');
  const source = JSON.parse(fs.readFileSync(path.join(root, 'design-tokens.json'), 'utf8'));
  const result = generate(source);
  const output = path.join(root, 'design-tokens.css');
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(output) || fs.readFileSync(output, 'utf8') !== result) {
      console.error('design-tokens.css is stale. Run node scripts/build-design-tokens.cjs.');
      process.exitCode = 1;
    } else console.log('Token CSS is current; all theme contrast pairs pass.');
  } else {
    fs.writeFileSync(output, result);
    console.log(`Generated design-tokens.css; ${source.contrastPairs.length * Object.keys(source.themes).length} contrast checks passed.`);
  }
}

module.exports = { generate, contrast, resolve };
