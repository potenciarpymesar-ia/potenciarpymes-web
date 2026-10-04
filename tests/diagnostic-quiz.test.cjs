const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'diagnostico.html'), 'utf8');
const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).find(s => s.includes('var answers ='));
function harness(reply) {
  const elements = new Map();
  function element(id) {
    if (!elements.has(id)) elements.set(id, { value: '', textContent: '', innerHTML: '', disabled: false, style: {}, classList: { add(){}, remove(){} }, setAttribute(){}, addEventListener(){}, focus(){}, querySelector(){ return element('heading'); } });
    return elements.get(id);
  }
  const events = [], requests = [];
  const context = vm.createContext({ document: { querySelectorAll: () => [], getElementById: element }, window: { dataLayer: events, location: { pathname: '/diagnostico' }, fetch: async (url, options) => { requests.push(JSON.parse(options.body)); return reply(); }, matchMedia: () => ({ matches: true }), scrollTo(){} }, console, AbortController, setTimeout, clearTimeout });
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..','contact-client.js'),'utf8'),context);
  vm.runInContext(script, context);
  context.answers = { q1:['whatsapp'], q2:['boca'], q3:'mide_bien', q4:'f1', q5:'sin_tiempo' };
  element('inp-nombre').value = 'TEST POTENCIAR PYMES'; element('inp-wa').value = '+54000000000';
  return { context, element, events, requests };
}
test('profesional con referidos no recibe brechas por canales que no declaró necesitar', () => {
  const h = harness();
  assert.equal(h.context.getGaps().some(g => /Mercado Libre|e-commerce|SEO ni GEO|Sin canal/.test(g.title)), false);
});
test('el problema declarado ocupa la primera prioridad para los cinco problemas', () => {
  const h = harness();
  for (const pain of ['sin_clientes','ads_sin_retorno','desconectado','sin_tiempo','sin_datos']) { h.context.answers.q5 = pain; assert.equal(h.context.getGaps()[0].id, pain); }
});
test('facturación y cantidad de canales no producen juicio de madurez', () => {
  const h = harness();
  const first = JSON.stringify(h.context.getNivel());
  h.context.answers.q1 = ['ml','tiendanube','redes']; h.context.answers.q2 = ['ads','mlads','seo']; h.context.answers.q4 = 'f4';
  assert.equal(JSON.stringify(h.context.getNivel()), first);
  assert.match(first, /Orientación basada en respuestas/);
});
for (const [name, body] of [['200 sin recibo',{ok:true}], ['guardado false',{stored:false,leadId:'x'}], ['sin identificador',{stored:true}]]) {
  test(name + ': no registra lead, conserva contacto y permite reintentar', async () => {
    const h = harness(() => ({ok:true,json:async()=>body}));
    await h.context.showResult();
    assert.equal(h.events.some(e => ['generate_lead','diagnostico_contact_saved','diagnosis_completed','diagnostico_completado'].includes(e.event)), false);
    assert.equal(h.element('inp-nombre').value, 'TEST POTENCIAR PYMES');
    assert.equal(h.element('next6').disabled, false);
    assert.notEqual(h.element('step6').style.display, 'none');
    assert.match(h.element('diagnosticContactStatus').textContent, /reintentar/i);
  });
}
test('guardado confirmado muestra orientación coherente y emite conversiones después del recibo', async () => {
  const h = harness(() => ({ok:true,json:async()=>({ok:true,stored:true,leadId:'test-local-1',notification:{status:'failed'}})}));
  await h.context.showResult();
  assert.equal(h.events.filter(e=>e.event==='generate_lead').length,1);
  assert.equal(h.element('resultStep').style.display,'block');
  assert.match(h.element('res-titulo').textContent,/tiempo/i);
  assert.equal(h.requests[0].score,null);
  assert.equal(h.requests[0].problema_declarado,'sin_tiempo');
  assert.match(h.element('diagnosticContactStatus').textContent,/guardado/i);
  assert.equal(h.events.some(e=>JSON.stringify(e).includes('TEST POTENCIAR')),false);
});
test('doble clic durante envío realiza una sola solicitud y conserva respuestas ante error de red', async () => {
  let rejectRequest;
  const pending = new Promise((resolve,reject)=>{rejectRequest=reject;});
  const h = harness(() => pending);
  const first = h.context.showResult(); const second = h.context.showResult();
  assert.equal(h.requests.length,1);
  rejectRequest(new Error('offline'));
  await Promise.all([first,second]);
  assert.equal(h.context.answers.q5,'sin_tiempo');
  assert.equal(h.element('next6').disabled,false);
});
test('un error HTTP conserva idempotencia y el reintento confirmado guarda una sola vez', async () => {
  let attempt = 0;
  const h = harness(() => ++attempt === 1 ? {ok:false,json:async()=>({stored:false,retryable:true})} : {ok:true,json:async()=>({ok:true,stored:true,leadId:'test-retry',notification:{status:'sent'}})});
  await h.context.showResult();
  assert.equal(h.element('resultStep').style.display,undefined);
  assert.equal(h.events.filter(e=>e.event==='generate_lead').length,0);
  await h.context.showResult();
  assert.equal(h.requests[0].requestId,h.requests[1].requestId);
  assert.equal(h.events.filter(e=>e.event==='generate_lead').length,1);
  assert.equal(h.element('resultStep').style.display,'block');
});
test('perfiles comercio, profesional y servicio local mantienen la prioridad declarada sin prescribir canales nuevos', () => {
  const h = harness();
  for (const profile of [
    {q1:['whatsapp'],q2:['boca'],q3:'no_mide',q4:'f1',q5:'sin_clientes'},
    {q1:['ml','tiendanube'],q2:['ads'],q3:'mide_algo',q4:'f4',q5:'ads_sin_retorno'},
    {q1:['redes'],q2:['nada'],q3:'mide_bien',q4:'f2',q5:'desconectado'}
  ]) {
    h.context.answers=profile;
    const priorities=h.context.getGaps();
    assert.equal(priorities[0].id,profile.q5);
    assert.equal(priorities.some(g=>/Sin presencia|Sin e-commerce|Sin SEO|GA4 configurado|complemento necesario/.test(g.title+' '+g.desc)),false);
  }
});
test('no atraigo actualmente es excluyente con canales declarados y permite deseleccionar', () => {
  const h=harness();
  h.context.answers.q2=['ads','seo'];
  h.context.toggleMultiAnswer('q2','nada');
  assert.equal(JSON.stringify(h.context.answers.q2),'["nada"]');
  h.context.toggleMultiAnswer('q2','boca');
  assert.equal(JSON.stringify(h.context.answers.q2),'["boca"]');
  h.context.toggleMultiAnswer('q2','boca');
  assert.equal(JSON.stringify(h.context.answers.q2),'[]');
});
test('envío aceptado sin CRM muestra resultado pero no afirma guardado ni emite lead', async () => {
  const h=harness(()=>({ok:true,json:async()=>({ok:true,stored:false,delivery:{status:'accepted',provider:'resend'}})}));
  await h.context.showResult();
  assert.equal(h.element('resultStep').style.display,'block');
  assert.match(h.element('diagnosticSavedStatus').textContent,/enviada/i);
  assert.equal(h.events.some(e=>['generate_lead','diagnostico_contact_saved','diagnostico_completado','diagnosis_completed'].includes(e.event)),false);
  assert.equal(h.events.filter(e=>e.event==='diagnostico_contact_sent').length,1);
});
test('envío pendiente impide volver a editar; el error libera la navegación sin perder respuestas', async () => {
  let rejectRequest;
  const pending=new Promise((resolve,reject)=>{rejectRequest=reject;});
  const h=harness(()=>pending);
  h.context.currentStep=6;
  const submit=h.context.showResult();
  h.context.goTo(5);
  assert.equal(h.context.currentStep,6);
  rejectRequest(new Error('offline'));
  await submit;
  h.context.goTo(5);
  assert.equal(h.context.currentStep,5);
  assert.equal(h.context.answers.q5,'sin_tiempo');
});
