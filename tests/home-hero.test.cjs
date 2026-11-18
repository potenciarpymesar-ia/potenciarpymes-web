const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const root0 = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root0, file), 'utf8');

function fixture({ reduced = false, noGsap = false } = {}) {
  const classes = new Set(), events = {}, docEvents = {}, attrs = {};
  const button = { hidden:true, textContent:'', setAttribute:(k,v)=>attrs[k]=v,
    addEventListener:(k,v)=>events[k]=v, removeEventListener:k=>delete events[k] };
  const media = { matches:reduced, addEventListener:(_,fn)=>media.change=fn, removeEventListener:()=>{} };
  const document = { hidden:false, addEventListener:(k,v)=>docEvents[k]=v, removeEventListener:k=>delete docEvents[k], querySelector:()=>null };
  const photo = {}, lines = [], channels = [];
  const root = { dataset:{}, classList:{add:x=>classes.add(x),remove:x=>classes.delete(x)},
    querySelector:s=>s==='[data-hero-motion]'?button:photo,
    querySelectorAll:s=>s==='.hero-title-line'?lines:channels };
  const animations = [];
  const gsap = { set:()=>{}, timeline:()=>{
    const anim={paused:true,to(){return this},from(){return this},fromTo(){return this},set(){return this},call(){return this},addLabel(){return this},
      play(){this.paused=false;return this},pause(){this.paused=true;return this},kill(){this.killed=true;return this}};
    animations.push(anim);return anim;
  }};
  let observer;
  function IntersectionObserver(callback){observer={emit:on=>callback([{isIntersecting:on}]),observe(){},disconnect(){this.disconnected=true}};return observer;}
  const window = {};
  const file=path.join(__dirname,'../home-hero.js');
  assert.ok(fs.existsSync(file),'hero motion controller must exist');
  vm.runInNewContext(fs.readFileSync(file,'utf8'),{window,document});
  const controller=window.ppInitHomeHero(root,{gsap:noGsap?null:gsap,document,media,IntersectionObserver});
  return {root,button,attrs,media,document,events,docEvents,animations,controller,get observer(){return observer}};
}

test('hero motion pause survives visibility changes until explicitly resumed',()=>{
  const f=fixture();assert.equal(f.root.dataset.motion,'running');assert.equal(f.button.hidden,false);
  f.events.click();assert.equal(f.root.dataset.motion,'paused');assert.equal(f.attrs['aria-pressed'],'true');
  f.document.hidden=true;f.docEvents.visibilitychange();f.document.hidden=false;f.docEvents.visibilitychange();
  assert.equal(f.root.dataset.motion,'paused');assert.ok(f.animations.every(a=>a.paused));
  f.events.click();assert.equal(f.root.dataset.motion,'running');
});
test('offscreen and hidden page suspend motion and resume only when visible',()=>{
  const f=fixture();f.observer.emit(false);assert.equal(f.root.dataset.motion,'paused');
  f.observer.emit(true);assert.equal(f.root.dataset.motion,'running');
  f.document.hidden=true;f.docEvents.visibilitychange();assert.equal(f.root.dataset.motion,'paused');
  f.document.hidden=false;f.docEvents.visibilitychange();assert.equal(f.root.dataset.motion,'running');
});
test('live reduced-motion preference kills animation and hides the motion control',()=>{
  const f=fixture();f.media.matches=true;f.media.change();
  assert.equal(f.root.dataset.motion,'still');assert.equal(f.button.hidden,true);assert.ok(f.animations.every(a=>a.killed));
  f.media.matches=false;f.media.change();assert.equal(f.root.dataset.motion,'running');
});
test('reduced motion at load and unavailable GSAP leave a still readable hero',()=>{
  for(const options of [{reduced:true},{noGsap:true}]){const f=fixture(options);
    assert.equal(f.root.dataset.motion,'still');assert.equal(f.button.hidden,true);assert.equal(f.animations.length,0);}
});
test('destroy releases observer and page handlers',()=>{
  const f=fixture();f.controller.destroy();assert.equal(f.observer.disconnected,true);
  assert.equal(f.events.click,undefined);assert.equal(f.docEvents.visibilitychange,undefined);assert.ok(f.animations.every(a=>a.killed));
});

test('real GSAP lights the five channels one at a time and loops',()=>{
  const real=require('../vendor/gsap-3.13.0.min.js').gsap;
  const channels=Array.from({length:5},()=>{const on=new Set();return {on,classList:{toggle:(name,force)=>{force?on.add(name):on.delete(name);}}};});
  const lit=()=>channels.map((c,i)=>c.on.has('is-lit')?i:-1).filter(i=>i>=0);
  const timelines=[];
  const gsap={timeline:vars=>{const t=real.timeline(vars);timelines.push(t);return t;},set(){}};
  const button={hidden:true,setAttribute(){},addEventListener(){},removeEventListener(){}};
  const root={dataset:{},classList:{add(){},remove(){}},querySelector:s=>s==='[data-hero-motion]'?button:null,
    querySelectorAll:s=>s==='.hero-channel'?channels:[]};
  const document={querySelector:()=>null,hidden:false,addEventListener(){},removeEventListener(){}};
  const window={};vm.runInNewContext(read('home-hero.js'),{window,document});
  const controller=window.ppInitHomeHero(root,{gsap,document,media:{matches:false,addEventListener(){},removeEventListener(){}}});
  try{
    const story=timelines[1];timelines.forEach(t=>t.pause());
    story.time(0.2);assert.deepEqual(lit(),[0]);
    story.time(2.9);assert.deepEqual(lit(),[1]);
    story.time(5.5);assert.deepEqual(lit(),[2]);
    story.time(8.1);assert.deepEqual(lit(),[3]);
    story.time(10.7);assert.deepEqual(lit(),[4]);
    story.totalTime(story.duration()+0.2);assert.deepEqual(lit(),[0]);
  }finally{controller.destroy();real.ticker.sleep();}
  assert.deepEqual(lit(),[]);
});

test('the hero is the studio composition: approved headline, real photo, five channels, one clear action',()=>{
  const html=read('index.html');
  const hero=html.match(/<section class="hero hero--cinematic hero--studio"[\s\S]*?<\/section>/)[0];
  assert.match(hero,/<span class="hero-title-line">TU NEGOCIO<\/span> <span class="hero-title-line">TE NECESITA\.<\/span> <em><span class="hero-title-line">PERO NO<\/span> <span class="hero-title-line">PARA TODO\.<\/span><\/em>/);
  assert.match(hero,/aria-label="Tu negocio te necesita\. Pero no para todo\."/);
  const img=hero.match(/<img class="studio-photo-img"[^>]*>/)[0];
  for(const attr of ['src="/assets/sobre-mi/jonathan-estudio-hero.webp"','width="1086"','height="1448"','fetchpriority="high"','decoding="async"'])assert.ok(img.includes(attr),attr);
  assert.match(img,/alt="Jonathan, fundador de Potenciar Pymes[^"]+"/);
  const names=[...hero.matchAll(/<li class="hero-channel"><b><i aria-hidden="true"><\/i>([^<]+)<\/b><p>([^<]+)<\/p><\/li>/g)];
  assert.deepEqual(names.map(m=>m[1]),['Anuncios','Web','Tienda','WhatsApp','Medición']);
  for(const m of names)assert.ok(m[2].length>20,m[1]+' needs a real description');
  assert.equal([...hero.matchAll(/class="button[^"]*track-diagnosis[^"]*"[^>]*href="\/diagnostico"/g)].length,1);
  assert.match(hero,/data-hero-motion/);
  assert.ok(fs.existsSync(path.join(root0,'assets/sobre-mi/jonathan-estudio-hero.webp')));
  assert.ok(fs.statSync(path.join(root0,'assets/sobre-mi/jonathan-estudio-hero.webp')).size<120000,'hero photo budget');
});

test('the old background threads, React bundle and device illustrations are gone from the home',()=>{
  const html=read('index.html');
  for(const gone of ['hero-threads','hero-system','laptop-photoreal','phone-photoreal','device-laptop','phone-notification'])assert.ok(!html.includes(gone),gone);
  assert.ok(!fs.existsSync(path.join(root0,'assets/home')),'assets/home should be removed');
  assert.match(html,/<link rel="preload" as="image" href="\/assets\/sobre-mi\/jonathan-estudio-hero\.webp"[^>]*media="\(min-width:768px\)"/);
});

test('the hero never hides its text when scripts or motion are unavailable',()=>{
  const css=read('home-hero.css'),js=read('home-hero.js');
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(js,/overflow:'hidden'/);            // el overflow solo existe durante el revelado
  assert.match(js,/clearProps:'overflow'/);
  assert.ok(!/opacity\s*:\s*0\b/.test(css.replace(/\.hero-channel p\{[^}]*\}/,'')),'no element starts invisible in the hero CSS');
});
