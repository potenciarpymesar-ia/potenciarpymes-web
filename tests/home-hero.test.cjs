const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function fixture({ reduced = false, noGsap = false } = {}) {
  const classes = new Set(), events = {}, docEvents = {}, attrs = {};
  const button = { hidden:true, textContent:'', setAttribute:(k,v)=>attrs[k]=v,
    addEventListener:(k,v)=>events[k]=v, removeEventListener:k=>delete events[k] };
  const media = { matches:reduced, addEventListener:(_,fn)=>media.change=fn, removeEventListener:()=>{} };
  const document = { hidden:false, addEventListener:(k,v)=>docEvents[k]=v, removeEventListener:k=>delete docEvents[k], querySelector:()=>null };
  const scene = {}, photo = {}, lines = [], routes = [], steps = [];
  const root = { dataset:{}, classList:{add:x=>classes.add(x),remove:x=>classes.delete(x)},
    querySelector:s=>s==='[data-hero-motion]'?button:s==='.hero-scene'?scene:photo,
    querySelectorAll:s=>s==='.hero-title-line'?lines:s==='.hero-route'?routes:steps };
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

test('real GSAP delivers three notifications in order and repeats without stale screen state',()=>{
  const real=require('../vendor/gsap-3.13.0.min.js').gsap;
  const notifications=Array.from({length:3},()=>({opacity:1,x:0,y:0,scale:1,filter:'blur(0px)'}));
  const messages=Array.from({length:3},()=>({opacity:1,y:0,backgroundColor:'#fafaf6'}));
  const steps=Array.from({length:3},()=>({opacity:0}));
  const route={opacity:1,strokeDashoffset:0},followup={opacity:1},signal={opacity:1,scale:1},camera={y:0};
  const timelines=[];
  const gsap={timeline:vars=>{const t=real.timeline(vars);timelines.push(t);return t;},set:(targets,vars)=>{
    // clearProps is CSSPlugin-only; this test uses plain targets to inspect the actual timeline.
    if(!vars.clearProps)return real.set(targets,vars);
  }};
  const button={hidden:true,setAttribute(){},addEventListener(){},removeEventListener(){}};
  const root={dataset:{},classList:{add(){},remove(){}},querySelector:s=>({'[data-hero-motion]':button,'.hero-camera':camera,'.desk-followup':followup,'.connection-signal':signal}[s]),
    querySelectorAll:s=>({'.hero-title-line':[{y:0,clearProps:''}],'.hero-route':[route],'.hero-scene-step':steps,'.phone-notification':notifications,'.desk-message':messages}[s])};
  const document={querySelector:()=>null,hidden:false,addEventListener(){},removeEventListener(){}};
  const window={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../home-hero.js'),'utf8'),{window,document});
  const controller=window.ppInitHomeHero(root,{gsap,document,media:{matches:false,addEventListener(){},removeEventListener(){}}});
  try{
    const story=timelines[2];timelines.forEach(t=>t.pause());
    story.time(0.1);assert.equal(notifications[0].opacity,0);assert.equal(notifications[1].opacity,0);
    story.time(1.7);assert.ok(notifications[0].opacity>.95);assert.equal(notifications[1].opacity,0);assert.ok(messages[0].opacity>.2);
    story.time(6.8);assert.ok(notifications[2].opacity>.95);assert.ok(messages[2].opacity>.2);
    story.time(9.9);assert.ok(followup.opacity>.95);
    story.totalTime(story.duration()+story.repeatDelay()+0.1);assert.equal(notifications[0].opacity,0);assert.equal(notifications[2].opacity,0);
  }finally{controller.destroy();real.ticker.sleep();}
});
