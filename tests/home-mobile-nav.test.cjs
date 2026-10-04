const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function fixture(home = true, mobile = true) {
  function node() {
    const attrs = {}, handlers = {}, classes = new Set();
    return {
      id:'', textContent:'', focused:false, handlers,
      classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c),toggle(c,on){if(on===undefined)on=!classes.has(c);on?classes.add(c):classes.delete(c);}},
      setAttribute:(key,value)=>{attrs[key]=value;},getAttribute:key=>attrs[key]??null,hasAttribute:key=>key in attrs,
      addEventListener:(type,handler)=>{handlers[type]=handler;},focus(){this.focused=true;},
      querySelector:()=>null,contains(target){return target===this;}
    };
  }
  const inner = node(), links = node(), togglePlaceholder = node(), link = node(), outside = node();
  const header = node();
  if(home)header.setAttribute('data-home-mobile-nav','');
  inner.closest = selector=>selector==='[data-home-mobile-nav]'&&home?header:null;
  inner.querySelector = ()=>links;
  inner.contains = target=>[inner,links,link,togglePlaceholder,inner.toggle].includes(target);
  inner.insertBefore = toggle=>{inner.toggle=toggle;};
  link.closest = selector=>selector==='a'?link:null;
  const media = {matches:mobile,addEventListener(type,handler){this.handler=handler;}};
  const document = {handlers:{},querySelector:()=>null,querySelectorAll:selector=>selector==='.nav-inner'?[inner]:[],createElement:node,
    addEventListener(type,handler){this.handlers[type]=handler;},activeElement:outside};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../design-system.js'),'utf8'),{document,window:{matchMedia:()=>media}});
  const click = ()=>inner.toggle.handlers.click({});
  const open = ()=>inner.toggle.getAttribute('aria-expanded')==='true';
  return {inner,links,link,outside,media,document,click,open,toggle:inner.toggle};
}

test('home mobile menu is a disclosure with a stable label',()=>{
  const f=fixture();f.click();assert.equal(f.open(),true);assert.equal(f.toggle.textContent,'Menú');
  assert.equal(f.toggle.getAttribute('aria-controls'),f.links.id);assert.equal(f.links.classList.contains('is-open'),true);
  f.click();assert.equal(f.open(),false);
});
test('Escape closes home disclosure and restores trigger focus',()=>{
  const f=fixture();f.click();f.inner.handlers.keydown({key:'Escape'});assert.equal(f.open(),false);assert.equal(f.toggle.focused,true);
});
test('selecting a link closes without moving focus from its destination',()=>{
  const f=fixture();f.click();f.links.handlers.click({target:f.link});assert.equal(f.open(),false);assert.equal(f.toggle.focused,false);
});
test('click outside closes but clicks within the header do not',()=>{
  const f=fixture();f.click();assert.equal(typeof f.document.handlers.click,'function');
  f.document.handlers.click({target:f.link});assert.equal(f.open(),true);
  f.document.handlers.click({target:f.outside});assert.equal(f.open(),false);assert.equal(f.toggle.focused,false);
});
test('focus leaving header closes without trapping keyboard focus',()=>{
  const f=fixture();f.click();assert.equal(typeof f.inner.handlers.focusout,'function');
  f.inner.handlers.focusout({relatedTarget:f.link});assert.equal(f.open(),true);
  f.inner.handlers.focusout({relatedTarget:f.outside});assert.equal(f.open(),false);assert.equal(f.toggle.focused,false);
});
test('crossing the mobile breakpoint closes disclosure but preserves tablet behavior',()=>{
  const f=fixture();f.click();assert.equal(typeof f.media.handler,'function');
  f.media.matches=false;f.media.handler({matches:false});assert.equal(f.open(),false);
  f.click();assert.equal(f.open(),true);assert.equal(f.toggle.textContent,'Cerrar menú');
  f.document.handlers.click({target:f.outside});assert.equal(f.open(),true);
  f.inner.handlers.focusout({relatedTarget:f.outside});assert.equal(f.open(),true);
  f.media.matches=true;f.media.handler({matches:true});assert.equal(f.open(),false);
});
test('other pages keep existing toggle labeling and interactions',()=>{
  const f=fixture(false);f.click();assert.equal(f.toggle.textContent,'Cerrar menú');assert.equal(f.open(),true);
  assert.equal(f.document.handlers.click,undefined);assert.equal(f.inner.handlers.focusout,undefined);assert.equal(f.media.handler,undefined);
  f.links.handlers.click({target:f.link});assert.equal(f.open(),false);assert.equal(f.toggle.textContent,'Menú');
});
