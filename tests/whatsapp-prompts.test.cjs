const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { createHash } = require('node:crypto');
const { runInNewContext } = require('node:vm');
const { join } = require('node:path');

const guide = join(__dirname, '../recursos');
const html = readFileSync(join(guide, 'prompts-claude-whatsapp.html'), 'utf8');
const approvedHashes = {
  consultas: 'a7d81e92e5853de9c6744e7a41c46dfe21d041a4a35642a75d54c924827a859a',
  presupuestos: '975396f7d7dcac6dc99466a7953cbbe931acf8bdfa8cabfabfe8ae21924310db',
  seguimiento: '728a55d612622f5e872a4d4bc45ec889ed395607e3ebd29fab128b12a5503bc8',
  objeciones: '74743e5dc4133573429f264e0530b06c05acb662ab4fa2172cdccb5e3eb9fc73',
  posventa: '6f41bc958459627fd85f2abfc212ba93382d342e87ba2a7fa58acc86013aad1f',
};
const fields = Object.fromEntries([...html.matchAll(/<textarea id="(prompt-[^"]+)"[^>]*>([\s\S]*?)<\/textarea>/g)]
  .map(([, id, value]) => [id, {
    value: value.replace(/\r\n/g, '\n').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'),
    focus() { this.focused = true; },
    select() { this.selected = true; },
  }]));

test('the five prompts preserve the exact Framework section 02 text', () => {
  assert.equal(Object.keys(fields).length, 5);
  for (const [placement, hash] of Object.entries(approvedHashes)) {
    assert.equal(createHash('sha256').update(fields['prompt-' + placement].value).digest('hex'), hash, placement);
  }
});

test('every prompt keeps the safety rules: no invented data and manual sending', () => {
  for (const [id, field] of Object.entries(fields)) {
    assert.match(field.value, /No inventes/, id);
    assert.match(field.value, /manual/, id);
    assert.match(field.value, /RESULTADO ESPERADO/, id);
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
