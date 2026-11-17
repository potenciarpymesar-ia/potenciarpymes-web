const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { createHash } = require('node:crypto');
const { runInNewContext } = require('node:vm');
const { join } = require('node:path');

const guide = join(__dirname, '../recursos');
const html = readFileSync(join(guide, 'prompts-claude-whatsapp.html'), 'utf8');
const approvedHashes = {
  consultas: '95913bacea4388e0d762e1a3c8dbe7e04d4aa63df55fa045171a15579fba7c0b',
  presupuestos: 'f4c3237a2f05a10c0b21e8d5d4da05c5a4df42b7f2e9629acdc17393be682a24',
  seguimiento: '7c56205e5d7a9a0503f9c97e44858294d220c1a61eaafe46cd390377d68ddfe1',
  objeciones: '9883eaf549901cdcf1167850b826898936ebb95cb39934d4bd223b8de7c75fea',
  posventa: 'f3d692c5f9502e566fe08a2fb861a90b545aba908606367bfe95b8a30ee9fbfe',
};
const fields = Object.fromEntries([...html.matchAll(/<textarea id="(prompt-[^"]+)"[^>]*>([\s\S]*?)<\/textarea>/g)]
  .map(([, id, value]) => [id, {
    value: value.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'),
    focus() { this.focused = true; },
    select() { this.selected = true; },
  }]));

test('the five prompts preserve the exact Framework section 02 text', () => {
  assert.equal(Object.keys(fields).length, 5);
  for (const [placement, hash] of Object.entries(approvedHashes)) {
    assert.equal(createHash('sha256').update(fields['prompt-' + placement].value).digest('hex'), hash, placement);
  }
});

test('each copy control copies only its own prompt and handles clipboard denial', async () => {
  const buttons = [...html.matchAll(/data-copy-prompt="([^"]+)" data-copy-target="([^"]+)"/g)]
    .map(([, placement, target]) => ({
      dataset: { copyPrompt: placement, copyTarget: target },
      hidden: true,
      textContent: 'Copiar prompt',
      addEventListener(type, click) { this.click = click; },
    }));
  assert.deepEqual(buttons.map(button => button.dataset.copyPrompt), Object.keys(approvedHashes));
  const messages = Object.fromEntries(Object.keys(approvedHashes).map(key => [key, {}]));
  const writes = [];
  let denied = false;
  const window = { dataLayer: [] };
  const cta = { search: '?source=guia-prompts-claude-whatsapp', addEventListener(type, click) { this.click = click; } };
  runInNewContext(readFileSync(join(guide, 'auditoria-tienda-claude.js'), 'utf8'), {
    window, URLSearchParams,
    navigator: { clipboard: { async writeText(text) { if (denied) throw Error('denied'); writes.push(text); } } },
    document: {
      body: { dataset: { resourceId: 'prompts-claude-whatsapp' } },
      getElementById: id => fields[id],
      querySelectorAll: () => buttons,
      querySelector(selector) {
        if (selector === '[data-diagnosis-cta]') return cta;
        const feedback = selector.match(/data-copy-feedback="([^"]+)"/);
        return feedback ? messages[feedback[1]] : null;
      },
    },
    setTimeout: () => 1,
    clearTimeout() {},
  });

  for (const button of buttons) {
    assert.equal(button.hidden, false);
    await button.click();
    assert.equal(button.textContent, 'Copiado');
  }
  assert.deepEqual(writes, buttons.map(button => fields[button.dataset.copyTarget].value));
  denied = true;
  await buttons[0].click();
  assert.equal(fields['prompt-consultas'].selected, true);
  assert.match(messages.consultas.textContent, /Seleccioná y copiá/);
  cta.click();
  assert.equal(window.dataLayer.at(-1).source, 'guia-prompts-claude-whatsapp');
});
