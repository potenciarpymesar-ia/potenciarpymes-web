const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const file = path.join(__dirname, '../contact-client.js');
function client(fetch) {
  assert.ok(fs.existsSync(file), 'contact submission must require a storage receipt');
  const window = { fetch, crypto: require('node:crypto').webcrypto };
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), { window, AbortController, setTimeout, clearTimeout });
  return window.ppCreateContactSubmitter('/api/diagnostic-lead');
}
test('HTTP success without persisted receipt is rejected', async () => {
  const submit = client(async () => ({ ok:true, json:async()=>({ok:true}) }));
  await assert.rejects(submit({nombre:'TEST'}), e => e.code === 'contact_storage_unconfirmed');
});
test('notification failure does not discard a stored receipt', async () => {
  const submit = client(async () => ({ok:true,json:async()=>({ok:true,stored:true,leadId:'stored-test',notification:{status:'failed'}})}));
  const data = await submit({nombre:'TEST'});
  assert.equal(data.stored, true);
  assert.equal(data.notification.status, 'failed');
});
test('failed retry keeps request identity and data, changed payload starts a new identity', async () => {
  const calls = [];
  const submit = client(async (url, options) => {
    calls.push(JSON.parse(options.body));
    if (calls.length === 1) throw new Error('offline');
    return {ok:true,json:async()=>({ok:true,stored:true,leadId:'stored-test'})};
  });
  const payload = {nombre:'TEST', whatsapp:'00000000', respuestas:{q5:'sin_tiempo'}};
  await assert.rejects(submit(payload));
  await submit(payload);
  assert.equal(calls[0].requestId, calls[1].requestId);
  assert.deepEqual(calls[1].respuestas, {q5:'sin_tiempo'});
  await submit({...payload,nombre:'OTRO TEST'});
  assert.notEqual(calls[1].requestId, calls[2].requestId);
});
test('duplicate in-flight submits share one request and receipt', async () => {
  let calls = 0, finish;
  const submit = client(() => {calls++;return new Promise(resolve=>{finish=()=>resolve({ok:true,json:async()=>({ok:true,stored:true,leadId:'stored-test'})});});});
  const a = submit({nombre:'TEST'}), b = submit({nombre:'TEST'});
  finish();
  assert.equal((await a).leadId, (await b).leadId);
  assert.equal(calls, 1);
});
test('503 and invalid JSON cannot confirm storage', async () => {
  for (const response of [{ok:false,json:async()=>({error:'contact_storage_unavailable'})},{ok:true,json:async()=>{throw new Error('invalid JSON');}}]) {
    await assert.rejects(client(async()=>response)({nombre:'TEST'}));
  }
});
test('provider acceptance is delivery, never a persisted lead', async () => {
  const submit = client(async()=>({ok:true,json:async()=>({ok:true,stored:false,delivery:{status:'accepted',provider:'resend'}})}));
  const receipt = await submit({nombre:'TEST'});
  assert.equal(receipt.stored, false);
  assert.equal(receipt.leadId, undefined);
  assert.equal(receipt.delivery.provider, 'resend');
});
test('arbitrary claimed delivery provider is not accepted', async () => {
  await assert.rejects(client(async()=>({ok:true,json:async()=>({ok:true,stored:false,delivery:{status:'accepted',provider:'unknown'}})}))({nombre:'TEST'}));
});
