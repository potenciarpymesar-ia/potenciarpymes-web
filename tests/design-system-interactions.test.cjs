const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

// Small DOM doubles exercise handlers, not browser layout, accessibility trees,
// CSS specificity, or native focus behavior. Browser checks remain separate.
function fixture() {
  const document = { activeElement: null };
  function element(tagName = 'div') {
    const attributes = new Map();
    const listeners = new Map();
    const node = {
      tagName: tagName.toUpperCase(), children: [], dataset: {}, className: '',
      selectors: new Map(), id: '', textContent: '', value: '', checked: false,
      setAttribute(name, value) { attributes.set(name, String(value)); },
      getAttribute(name) { return attributes.get(name) ?? null; },
      addEventListener(name, callback) {
        const callbacks = listeners.get(name) || [];
        callbacks.push(callback);
        listeners.set(name, callbacks);
      },
      dispatchEvent(event) {
        if (!event.target) event.target = node;
        for (const callback of listeners.get(event.type) || []) callback(event);
      },
      focus() { document.activeElement = node; },
      querySelector(selector) { return node.selectors.get(selector) || null; },
      insertBefore(child, before) {
        const index = node.children.indexOf(before);
        node.children.splice(index < 0 ? node.children.length : index, 0, child);
        child.parentNode = node;
      },
      closest(selector) { return selector === 'a' && node.tagName === 'A' ? node : null; }
    };
    node.classList = {
      contains(name) { return node.className.split(/\s+/).includes(name); },
      add(name) { if (!this.contains(name)) node.className = `${node.className} ${name}`.trim(); },
      remove(name) { node.className = node.className.split(/\s+/).filter(value => value !== name).join(' '); },
      toggle(name, force) {
        const enabled = force === undefined ? !this.contains(name) : force;
        if (enabled) this.add(name); else this.remove(name);
        return enabled;
      }
    };
    return node;
  }
  const body = element('body');
  Object.defineProperty(body, 'firstChild', { get: () => body.children[0] || null });
  const singles = new Map();
  const multiples = new Map();
  document.body = body;
  document.createElement = element;
  document.querySelector = selector => {
    if (selector === '.skip,.skip-link,.pp-skip-link') {
      return body.children.find(node => ['skip', 'skip-link', 'pp-skip-link'].some(name => node.classList.contains(name))) || null;
    }
    return singles.get(selector) || null;
  };
  document.querySelectorAll = selector => multiples.get(selector) || [];
  let networkCalls = 0;
  function execute() {
    vm.runInNewContext(read('design-system.js'), {
      document,
      Event: class Event { constructor(type) { this.type = type; } },
      fetch() { networkCalls++; throw new Error('Reference must never send data'); }
    }, { filename: 'design-system.js' });
  }
  function fire(node, type, extra = {}) {
    const event = { type, target: node, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...extra };
    node.dispatchEvent(event);
    return event;
  }
  return { document, body, element, singles, multiples, execute, fire, networkCalls: () => networkCalls };
}

test('skip link targets the main content and is not duplicated', () => {
  const f = fixture();
  const main = f.element('main');
  f.singles.set('main', main);
  f.execute();
  assert.equal(main.id, 'pp-main');
  assert.equal(f.body.children[0].href, '#pp-main');
  assert.equal(f.body.children[0].className, 'pp-skip-link');
  f.execute();
  assert.equal(f.body.children.length, 1);
  for (const className of ['skip', 'skip-link', 'pp-skip-link']) {
    const existing = fixture();
    const skip = existing.element('a');
    skip.className = className;
    existing.body.children.push(skip);
    existing.singles.set('main', existing.element('main'));
    existing.execute();
    assert.equal(existing.body.children.length, 1, className);
  }
});

test('legacy page container receives a main landmark and preserves its id', () => {
  const f = fixture();
  const main = f.element();
  main.id = 'diagnostic-content';
  f.singles.set('.page', main);
  f.execute();
  assert.equal(main.getAttribute('role'), 'main');
  assert.equal(f.body.children[0].href, '#diagnostic-content');
});

test('mobile menu updates ARIA, closes with Escape and returns focus', () => {
  const f = fixture();
  const inner = f.element();
  const links = f.element('nav');
  inner.children.push(links);
  inner.selectors.set('.service-nav-links,.nav-links', links);
  f.multiples.set('.nav-inner', [inner]);
  f.execute();
  const toggle = inner.children[0];
  assert.equal(toggle.type, 'button');
  assert.equal(toggle.getAttribute('aria-controls'), links.id);
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  f.fire(toggle, 'click');
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  assert.equal(toggle.textContent, 'Cerrar menú');
  assert(links.classList.contains('is-open'));
  f.fire(inner, 'keydown', { key: 'Escape' });
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(f.document.activeElement, toggle);
  assert(!links.classList.contains('is-open'));
  f.fire(toggle, 'click');
  f.fire(links, 'click', { target: f.element('a') });
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
});

test('pause control emits state changes without claiming carousel readiness', () => {
  const f = fixture();
  const carousel = f.element();
  const parent = f.element();
  parent.children.push(carousel);
  carousel.parentNode = parent;
  let changes = 0;
  carousel.addEventListener('pp-motion-change', () => changes++);
  f.multiples.set('[data-coverflow]', [carousel]);
  f.execute();
  const control = parent.children[1];
  assert.equal(carousel.dataset.ppReady, undefined);
  assert.equal(control.getAttribute('aria-pressed'), 'false');
  f.fire(control, 'click');
  assert.equal(carousel.dataset.motionPaused, 'true');
  assert.equal(control.getAttribute('aria-pressed'), 'true');
  assert.equal(control.textContent, 'Reanudar animación');
  f.fire(control, 'click');
  assert.equal(carousel.dataset.motionPaused, 'false');
  assert.equal(control.textContent, 'Pausar animación');
  assert.equal(changes, 2);
});

test('reference form is local and prevents submission without network writes', () => {
  const f = fixture();
  const form = f.element('form');
  const status = f.element('p');
  form.selectors.set('[data-reference-status]', status);
  f.singles.set('[data-reference-form]', form);
  f.execute();
  assert(f.fire(form, 'submit').defaultPrevented);
  assert.equal(status.textContent, 'Prueba local completada. No se envió ningún dato.');
  assert.equal(f.networkCalls(), 0);
});

test('reference themes apply only the selected radio value', () => {
  const f = fixture();
  const dark = f.element('input');
  const light = f.element('input');
  dark.value = 'dark'; light.value = 'light';
  f.multiples.set('[data-reference-theme]', [dark, light]);
  f.execute();
  f.fire(light, 'change');
  assert.equal(f.body.getAttribute('data-theme'), null);
  light.checked = true;
  f.fire(light, 'change');
  assert.equal(f.body.getAttribute('data-theme'), 'light');
  dark.checked = true;
  f.fire(dark, 'change');
  assert.equal(f.body.getAttribute('data-theme'), 'dark');
});

test('static guards preserve no-JS content/navigation and reduced motion', () => {
  const css = read('design-system.css');
  assert.match(css, /\.reveal[^{}]*\{[^}]*opacity:\s*1\s*!important/);
  assert.match(css, /\.coverflow:not\(\[data-pp-ready\]\)\s+\.cover-slide:first-child\s*\{[^}]*opacity:\s*1/);
  assert.match(css, /\.nav-inner:not\(\.pp-nav-ready\)\s+\.nav-links>a\s*\{[^}]*display:\s*inline-flex/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /animation:\s*none\s*!important;transition:\s*none\s*!important;scroll-behavior:\s*auto\s*!important/);
  assert.match(css, /\.hero-photo,\.hero-wordmark,\.warp-letter\s*\{transform:\s*none\s*!important/);
  const home = read('index.html');
  assert.match(home, /motionPreference\.addEventListener\('change'/);
  assert.match(home, /manualPaused\|\|reduced\?0:target/);
  assert.match(home, /motionControl\.addEventListener\('click'/);
  const web = read('web-profesional.html');
  assert.match(web, /set\(0\);root\.dataset\.ppReady='true';startAutoplay\(\)/);
  assert.match(web, /root\.dataset\.motionPaused==='true'\|\|reducedMotion\.matches/);
  assert.match(web, /reducedMotion\.addEventListener\('change'/);
  assert(!read('design-system.js').includes("dataset.ppReady='true'"));
});
