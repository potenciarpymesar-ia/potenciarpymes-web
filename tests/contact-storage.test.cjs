const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');

// Run real handlers and library; only the external network and environment are isolated.
function harness(env = {}, responses = []) {
  const calls = [];
  const modules = new Map();
  const context = vm.createContext({ process: { env }, Buffer, console: { error() {} }, AbortSignal,
    fetch: async (url, options) => {
      calls.push({ url, options });
      const next = responses.shift();
      if (next instanceof Error) throw next;
      if (!next) throw new Error('Unexpected external request');
      return { ok: next.ok !== false, json: async () => {
        if (next.badJson) throw new Error('Invalid JSON');
        return next.body;
      } };
    },
  });
  function load(file) {
    if (modules.has(file)) return modules.get(file).exports;
    const module = { exports: {} }; modules.set(file, module);
    const localRequire = (name) => name.startsWith('.')
      ? load(path.resolve(path.dirname(file), name + (path.extname(name) ? '' : '.js')))
      : require(name);
    vm.runInContext(`(function(require,module,exports){${fs.readFileSync(file, 'utf8')}\n})`, context)(localRequire, module, module.exports);
    return module.exports;
  }
  async function request(file, body) {
    let code, data;
    const res = { status(value) { code = value; return this; }, json(value) { data = JSON.parse(JSON.stringify(value)); } };
    await load(path.join(root, file))({ method: 'POST', body, headers: {}, socket: { remoteAddress: 'test' } }, res);
    return { code, data };
  }
  return { calls, request };
}
const lead = { nombre: 'TEST POTENCIAR PYMES', whatsapp: '0000000000', requestId: 'test-request-123456' };
const env = { N8N_WEBHOOK_URL: 'https://storage.invalid/test', RESEND_API_KEY: 'test-key' };

test('no delivery provider fails without notifying or claiming a saved contact', async () => {
  const h = harness();
  const result = await h.request('api/diagnostic-lead.js', lead);
  assert.equal(result.code, 503); assert.equal(result.data.stored, false);
  assert.equal(result.data.retryable, true); assert.equal(h.calls.length, 0);
});
for (const [name, response] of [
  ['HTTP failure', { ok: false, body: {} }],
  ['network exception', new Error('offline')],
]) test(`${name} without a fallback cannot claim accepted delivery`, async () => {
  const h = harness({ N8N_WEBHOOK_URL: env.N8N_WEBHOOK_URL }, [response]); const result = await h.request('api/diagnostic-lead.js', lead);
  assert.equal(result.code, 502); assert.equal(result.data.stored, false);
  assert.equal(result.data.retryable, true); assert.equal(h.calls.length, 1);
});
test('an explicit optional storage receipt is distinguished from delivery, without duplicate Resend notification', async () => {
  const h = harness(env, [{ body: { stored: true, leadId: 'lead-1' } }]);
  const result = await h.request('api/diagnostic-lead.js', { ...lead, score: null, nivel: 'Orientación basada en respuestas', problema_declarado: 'sin_tiempo', respuestas: { q1: ['whatsapp'], q2: ['boca'], q3: 'mide_algo', q4: 'f1', q5: 'sin_tiempo' } });
  assert.equal(result.code, 200); assert.equal(result.data.stored, true);
  assert.equal(result.data.leadId, 'lead-1'); assert.equal(result.data.delivery.status, 'accepted');
  const sent = JSON.parse(h.calls[0].options.body);
  assert.equal(sent.problema_declarado, 'sin_tiempo'); assert.equal(sent.respuestas.q5, 'sin_tiempo');
  assert.equal(h.calls[0].options.headers['idempotency-key'], lead.requestId);
  assert.equal(sent.requestId, lead.requestId); assert.equal(h.calls.length, 1);
});
for (const response of [{ ok: false }, new Error('offline'), { body: {} }, { badJson: true }]) {
  test('Resend failure or missing provider receipt cannot claim accepted delivery', async () => {
    const h = harness({ RESEND_API_KEY: 'test-key' }, [response]);
    const result = await h.request('api/diagnostic-lead.js', lead);
    assert.equal(result.code, 502); assert.equal(result.data.stored, false);
    assert.equal(result.data.retryable, true); assert.equal(h.calls.length, 1);
  });
}
test('Resend acceptance means submitted to provider, not durable storage or mailbox delivery', async () => {
  const h = harness({ RESEND_API_KEY: 'test-key' }, [{ body: { id: 'email-1' } }]);
  const result = await h.request('api/diagnostic-lead.js', lead);
  assert.equal(result.code, 200); assert.equal(result.data.stored, false);
  assert.equal(result.data.delivery.provider, 'resend'); assert.equal(result.data.delivery.status, 'accepted');
  assert.equal(result.data.notification.status, 'accepted'); assert.equal(result.data.leadId, undefined);
});
for (const response of [{ body: { ok: true } }, { badJson: true }, { body: { stored: true, leadId: '' } }, { body: { stored: false, leadId: 'lead-1' } }]) {
  test('webhook 2xx may confirm receipt, but without a valid storage acknowledgment does not imply persistence', async () => {
    const h = harness(env, [response]); const result = await h.request('api/diagnostic-lead.js', lead);
    assert.equal(result.code, 200); assert.equal(result.data.stored, false);
    assert.equal(result.data.delivery.provider, 'n8n'); assert.equal(result.data.leadId, undefined);
    assert.equal(h.calls.length, 1);
  });
}
test('explicit webhook HTTP rejection allows email fallback', async () => {
  const h = harness(env, [{ ok: false }, { body: { id: 'email-1' } }]);
  const result = await h.request('api/diagnostic-lead.js', lead);
  assert.equal(result.code, 200); assert.equal(result.data.stored, false);
  assert.equal(result.data.delivery.provider, 'resend'); assert.equal(h.calls.length, 2);
});
test('uncertain webhook network failure never triggers a duplicate email fallback', async () => {
  const h = harness(env, [new Error('timeout'), { body: { id: 'email-1' } }]);
  const result = await h.request('api/diagnostic-lead.js', lead);
  assert.equal(result.code, 502); assert.equal(result.data.stored, false); assert.equal(h.calls.length, 1);
});
test('explicit failed webhook notification without storage is not accepted delivery and never triggers duplicate fallback', async () => {
  const h = harness(env, [{ body: { stored: false, notification: { status: 'failed' } } }]);
  const result = await h.request('api/diagnostic-lead.js', lead);
  assert.equal(result.code, 502); assert.equal(result.data.delivery.status, 'unconfirmed');
  assert.equal(h.calls.length, 1);
});
test('confirmed webhook storage and failed notification remain independent', async () => {
  const h = harness(env, [{ body: { stored: true, leadId: 'lead-1', notification: { status: 'failed' } } }]);
  const result = await h.request('api/diagnostic-lead.js', lead);
  assert.equal(result.code, 200); assert.equal(result.data.stored, true);
  assert.equal(result.data.notification.status, 'failed'); assert.equal(h.calls.length, 1);
});
for (const body of [{ ...lead, requestId: 'short' }, { ...lead, respuestas: { q1: ['x'], q5: 'other' } }, { ...lead, nombre: '   ' }]) {
  test('invalid identity, answers or retry identifier is rejected before contacting storage', async () => {
    const h = harness(env); const result = await h.request('api/diagnostic-lead.js', body);
    assert.equal(result.code, 400); assert.equal(h.calls.length, 0);
  });
}
function token() {
  const result = { url: 'https://example.com', score: { passed: 1, total: 2 }, items: [], areasWithIssues: [], severityCounts: { alto: 0 } };
  const b64 = Buffer.from(JSON.stringify({ createdAt: Date.now(), result })).toString('base64url');
  return `${b64}.${crypto.createHmac('sha256', 'test-secret').update(b64).digest('base64url')}`;
}
test('audit reveal does not reveal a stored-contact success without a storage receipt', async () => {
  const h = harness({ AUDIT_TOKEN_SECRET: 'test-secret' });
  const result = await h.request('api/audit-teaser/reveal.js', { ...lead, token: token() });
  assert.equal(result.code, 503); assert.equal(result.data.stored, false);
});
test('audit reveal preserves its result and includes separate confirmed storage metadata', async () => {
  const h = harness({ AUDIT_TOKEN_SECRET: 'test-secret', N8N_WEBHOOK_URL: env.N8N_WEBHOOK_URL }, [{ body: { stored: true, leadId: 'audit-lead-1' } }]);
  const result = await h.request('api/audit-teaser/reveal.js', { ...lead, token: token() });
  assert.equal(result.code, 200); assert.equal(result.data.stored, true);
  assert.equal(result.data.leadId, 'audit-lead-1'); assert.deepEqual(result.data.score, { passed: 1, total: 2 });
});
test('audit reveal with accepted email preserves results but never labels email as CRM storage', async () => {
  const h = harness({ AUDIT_TOKEN_SECRET: 'test-secret', RESEND_API_KEY: 'test-key' }, [{ body: { id: 'email-1' } }]);
  const result = await h.request('api/audit-teaser/reveal.js', { ...lead, token: token() });
  assert.equal(result.code, 200); assert.equal(result.data.stored, false);
  assert.equal(result.data.delivery.provider, 'resend'); assert.equal(result.data.leadId, undefined);
  assert.deepEqual(result.data.score, { passed: 1, total: 2 });
});
test('audit reveal email failure is reattemptable and does not claim accepted delivery', async () => {
  const h = harness({ AUDIT_TOKEN_SECRET: 'test-secret', RESEND_API_KEY: 'test-key' }, [{ ok: false }]);
  const result = await h.request('api/audit-teaser/reveal.js', { ...lead, token: token() });
  assert.equal(result.code, 502); assert.equal(result.data.delivery.status, 'unconfirmed');
  assert.equal(result.data.retryable, true); assert.equal(result.data.stored, false);
});
