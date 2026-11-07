const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const dns = require('node:dns').promises;
const { isBlockedAddress, assertSafeUrl, runWebChecks } = require('../api/_lib/webChecks');
const start = require('../api/audit-teaser/start');

const site = 'https://site.example/';
const secret = 'test-audit-secret';
const publicAddress = { address: '93.184.216.34', family: 4 };

function useAuditSecret(t) {
  const previous = process.env.AUDIT_TOKEN_SECRET;
  process.env.AUDIT_TOKEN_SECRET = secret;
  t.after(() => {
    if (previous === undefined) delete process.env.AUDIT_TOKEN_SECRET;
    else process.env.AUDIT_TOKEN_SECRET = previous;
  });
}

function mockPublicSite(t, html) {
  t.mock.method(dns, 'lookup', async () => [publicAddress]);
  t.mock.method(global, 'fetch', async (url) => url === site
    ? new Response(html)
    : new Response(null, { status: 404 }));
}

async function request(handler, body) {
  const result = {};
  const res = {
    status(code) { result.code = code; return this; },
    json(data) { result.data = data; },
  };
  await handler({ method: 'POST', body, headers: {}, socket: { remoteAddress: 'test' } }, res);
  return result;
}

test('blocks internal, reserved and mapped addresses but allows public IPs', () => {
  for (const ip of [
    '127.0.0.1', '10.1.2.3', '100.64.0.1', '169.254.169.254', '172.20.0.1',
    '192.168.1.1', '0.0.0.1', '192.0.0.1', '198.19.0.1', '224.0.0.1', '240.0.0.1',
    '::', '::1', '[::1]', 'fc00::1', 'fe80::1', 'ff02::1',
    '::ffff:127.0.0.1', '::ffff:a9fe:a9fe', '::ffff:5db8:d822',
  ]) {
    assert.equal(isBlockedAddress(ip), true, ip);
  }
  for (const ip of ['93.184.216.34', '2606:2800:220:1::1']) {
    assert.equal(isBlockedAddress(ip), false, ip);
  }
});

test('blocks unsafe ports and protocols before and after a redirect', async (t) => {
  await assert.rejects(assertSafeUrl('https://site.example:8080/'), /blocked_url/);
  await assert.rejects(assertSafeUrl('ftp://site.example/'), /blocked_url/);
  t.mock.method(dns, 'lookup', async () => [publicAddress]);
  const fetch = t.mock.method(global, 'fetch', async (url) => url === site
    ? new Response(null, { status: 302, headers: { location: 'https://site.example:8080/next' } })
    : new Response(null, { status: 404 }));
  const result = await runWebChecks(site);
  assert.equal(result.reachable, false);
  assert.equal(fetch.mock.calls.some(({ arguments: [url] }) => url === site), true);
  assert.equal(fetch.mock.calls.some(({ arguments: [url] }) => url.includes(':8080')), false);
});

test('start rejects a DNS answer containing a private IP before fetching', async (t) => {
  useAuditSecret(t);
  t.mock.method(dns, 'lookup', async (_, options) => {
    assert.deepEqual(options, { all: true });
    return [publicAddress, { address: '192.168.1.1', family: 4 }];
  });
  const fetch = t.mock.method(global, 'fetch', async () => new Response('unexpected'));
  assert.deepEqual(await request(start, { url: site }), { code: 400, data: { error: 'invalid_url' } });
  assert.equal(fetch.mock.callCount(), 0);
});

test('start returns 422 without a token for a 403 or a network failure', async (t) => {
  useAuditSecret(t);
  t.mock.method(dns, 'lookup', async () => [publicAddress]);
  let offline = false;
  t.mock.method(global, 'fetch', async () => {
    if (offline) throw new Error('offline');
    return new Response(null, { status: 403 });
  });
  for (offline of [false, true]) {
    assert.deepEqual(await request(start, { url: site }), { code: 422, data: { error: 'site_unreachable' } });
  }
});

test('Tag Manager without a GA4 ID leaves GA4 outside the score', async (t) => {
  mockPublicSite(t, '<script>/* GTM-ABC */</script>');
  const result = await runWebChecks(site);
  assert.equal(result.reachable, true);
  assert.equal(result.items.find(({ id }) => id === 'ga4_present').ok, 'na');
  assert.equal(result.items.find(({ id }) => id === 'gtm_present').ok, true);
  assert.equal(result.score.total, result.items.length - 1);
});

test('the form check only confirms a form tag is present', async (t) => {
  mockPublicSite(t, '<form><input name="name"></form>');
  const result = await runWebChecks(site);
  assert.deepEqual(result.items.find(({ id }) => id === 'form_present'), {
    id: 'form_present',
    area: 'Conversión básica',
    severity: 'bajo',
    label: 'Formulario de contacto en la página',
    ok: true,
  });
});

test('a 5 MB response stops reading and cancels the stream at 2 MB', async (t) => {
  const chunkSize = 100_000;
  const chunks = 50;
  let reads = 0;
  let canceled = false;
  const stream = new ReadableStream({
    pull(controller) {
      if (reads === chunks) { controller.close(); return; }
      const chunk = new Uint8Array(chunkSize).fill(120);
      if (reads === 20) chunk.set(new TextEncoder().encode('<form>'));
      reads++;
      controller.enqueue(chunk);
    },
    cancel() { canceled = true; },
  }, { highWaterMark: 0 });
  mockPublicSite(t, stream);
  const result = await runWebChecks(site);
  assert.equal(result.reachable, true);
  assert.equal(reads * chunkSize, 2_000_000);
  assert.equal(canceled, true);
  assert.equal(result.items.find(({ id }) => id === 'form_present').ok, false);
});

test('reveal returns only public check fields and excludes contact data', async (t) => {
  useAuditSecret(t);
  const notifyLead = require('../api/_lib/notifyLead');
  t.mock.method(notifyLead, 'notifyLead', async () => ({
    stored: false, delivery: { status: 'accepted', provider: 'resend' },
  }));
  const reveal = require('../api/audit-teaser/reveal');
  const item = { id: 'form_present', area: 'Conversión básica', label: 'Formulario de contacto en la página', ok: false };
  const result = {
    url: site,
    score: { passed: 0, total: 1 },
    severityCounts: { alto: 0, medio: 0, bajo: 1 },
    areasWithIssues: [item.area],
    items: [{ ...item, severity: 'bajo', internal: 'private detail' }],
  };
  const b64 = Buffer.from(JSON.stringify({ createdAt: Date.now(), result })).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(b64).digest('base64url');
  const contact = { nombre: 'Test Contact', whatsapp: '0000000000', tipoNegocio: 'Test Business', problema: 'Test Problem' };
  const response = await request(reveal, { ...contact, token: b64 + '.' + signature });
  assert.equal(response.code, 200);
  assert.deepEqual(response.data.items, [item]);
  for (const [key, value] of Object.entries(contact)) {
    assert.equal(Object.hasOwn(response.data, key), false);
    assert.equal(JSON.stringify(response.data).includes(value), false);
  }
});
