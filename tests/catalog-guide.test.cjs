const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=path.join(__dirname,'../recursos/guia-catalogo-mercado-libre.js');

// DOM boundary only; execute the delivered script, not a second progress implementation.
function guide(){
  assert.ok(fs.existsSync(source),'Missing interactive guide');
  const master=[{checked:false},{checked:false}];
  const progress={value:0},status={textContent:''},hint={textContent:''};
  const listeners={};
  const document={
    querySelector:s=>({'[data-review-progress]':progress,'[data-review-status]':status,'[data-state-hint]':hint}[s]||null),
    querySelectorAll:s=>s==='[data-master-check]'?master:[],
    addEventListener:(event,fn)=>{listeners[event]=fn;}
  };
  const window={dataLayer:[]};
  vm.runInNewContext(fs.readFileSync(source,'utf8'),{window,document});
  const change=(type,attrs={})=>listeners.change({target:{type,checked:true,value:'PRIVATE_ANSWER',matches:s=>s==='[data-master-check]'&&Boolean(attrs.master),...attrs}});
  return {master,progress,status,hint,window,change,click:id=>listeners.click({target:{closest:()=>({dataset:{guideAction:id}})}})};
}

test('master progress follows both checking and unchecking; other checks do not count',()=>{
  const g=guide();assert.equal(g.status.textContent,'0 de 2 preguntas revisadas');
  g.master[0].checked=true;g.change('checkbox',{master:true});assert.equal(g.progress.value,1);
  g.change('checkbox');assert.equal(g.progress.value,1);
  g.master[1].checked=true;g.change('checkbox',{master:true});assert.equal(g.progress.value,2);
  g.master[0].checked=false;g.change('checkbox',{master:true});assert.equal(g.progress.value,1);
  assert.equal(g.status.textContent,'1 de 2 preguntas revisadas');
});
test('analytics registers the requested actions without checklist answers or competition state',()=>{
  const g=guide();g.click('start_review');g.change('checkbox');g.change('radio',{name:'competition-state',value:'unknown'});g.click('final_cta');g.click('more_resources');
  assert.deepEqual(Array.from(g.window.dataLayer,e=>e.event),['resource_view','resource_start_review','resource_checklist_interaction','resource_checklist_interaction','resource_cta','resource_more_resources']);
  for(const event of g.window.dataLayer){
    assert.equal(event.resource_id,'guia-catalogo-mercado-libre');
    assert.deepEqual(Object.keys(event).sort(),['event','resource_category','resource_format','resource_id']);
  }
  assert.ok(g.hint.textContent.includes('primer dato'));
  g.change('radio',{name:'competition-state',value:'winning'});
  assert.ok(!g.hint.textContent.includes('primer dato'));
});
