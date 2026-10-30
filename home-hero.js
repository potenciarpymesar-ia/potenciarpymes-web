(function () {
  'use strict';

  window.ppInitHomeHero = function (root, environment) {
    if (!root) return null;
    var env = environment || window;
    var gsap = env.gsap;
    var doc = env.document || document;
    var media = env.media || window.matchMedia('(prefers-reduced-motion: reduce)');
    var button = root.querySelector('[data-hero-motion]');
    var photo = root.querySelector('.hero-camera');
    var lines = root.querySelectorAll('.hero-title-line');
    var routes = root.querySelectorAll('.hero-route');
    var steps = root.querySelectorAll('.hero-scene-step');
    var notifications = root.querySelectorAll('.phone-notification');
    var messages = root.querySelectorAll('.desk-message');
    var followup = root.querySelector('.desk-followup');
    var signal = root.querySelector('.connection-signal');
    var animations = [], userPaused = false, inView = true, observer;
    var title = root.querySelector('#hero-title'), glyphs = [], centers = [], titleBox;
    var pointerMedia = env.pointerMedia || window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)');
    if (title && title.querySelectorAll) {
      Array.from(title.querySelectorAll('.hero-title-line')).forEach(function(line) {
        var text = line.textContent;
        line.textContent = '';
        line.setAttribute('aria-hidden','true');
        Array.from(text).forEach(function(character) {
          var glyph = doc.createElement('span');
          glyph.className = 'hero-glyph'; glyph.textContent = character;
          line.appendChild(glyph); glyphs.push(glyph);
        });
      });
    }
    function resetType() {
      glyphs.forEach(function(glyph) { glyph.style.transform = ''; });
    }
    function measureType() {
      resetType(); titleBox = title.getBoundingClientRect();
      centers = glyphs.map(function(glyph) { var box = glyph.getBoundingClientRect(); return { x:box.left+box.width/2, y:box.top+box.height/2 }; });
    }
    function moveType(event) {
      if (root.dataset.motion !== 'running' || !pointerMedia || !pointerMedia.matches || event.pointerType === 'touch') return;
      if (!titleBox) measureType();
      glyphs.forEach(function(glyph,index) {
        var dx = centers[index].x-event.clientX, dy = centers[index].y-event.clientY;
        var distance = Math.sqrt(dx*dx+dy*dy), influence = Math.max(0,1-distance/145);
        glyph.style.transform = 'translate3d('+((dx/Math.max(distance,1))*influence*5).toFixed(2)+'px,'+(-influence*9).toFixed(2)+'px,0) rotate('+(dx/145*influence*4).toFixed(2)+'deg)';
      });
    }
    function focusType() {
      if (root.dataset.motion !== 'running') return;
      glyphs.forEach(function(glyph,index) { glyph.style.transform = 'translateY('+(index%3===0?-3:0)+'px)'; });
    }
    function leaveType() { resetType(); titleBox = null; }
    if (glyphs.length) {
      title.addEventListener('pointerenter',measureType);
      title.addEventListener('pointermove',moveType);
      title.addEventListener('pointerleave',leaveType);
      title.addEventListener('focus',focusType);
      title.addEventListener('blur',leaveType);
      env.addEventListener('resize',leaveType);
      env.addEventListener('scroll',leaveType,{passive:true});
    }

    function sync() {
      var still = !gsap || media.matches;
      var running = !still && !userPaused && !doc.hidden && inView;
      root.dataset.motion = still ? 'still' : running ? 'running' : 'paused';
      animations.forEach(function (animation) { running ? animation.play() : animation.pause(); });
      if (!running) resetType();
      button.hidden = still;
      button.setAttribute('aria-pressed', String(userPaused));
      button.textContent = userPaused ? 'Reanudar animación' : 'Pausar animación';
    }

    function clear() {
      animations.forEach(function (animation) { animation.kill(); });
      animations = [];
      root.classList.remove('has-hero-motion');
      if (gsap) gsap.set([photo].concat(Array.from(lines), Array.from(routes), Array.from(steps), Array.from(notifications), Array.from(messages), [followup,signal]), { clearProps:'transform,opacity,visibility,strokeDashoffset,filter,backgroundColor' });
    }

    function build() {
      clear();
      if (gsap && !media.matches) {
        root.classList.add('has-hero-motion');
        var entrance = gsap.timeline({ paused:true, defaults:{ ease:'power3.out' } });
        // Never fade out the title or CTA: both remain readable throughout entry.
        entrance.from(lines, { y:20, duration:0.85, stagger:0.09, clearProps:'transform' });
        var camera = gsap.timeline({ paused:true, repeat:-1, yoyo:true, defaults:{ ease:'sine.inOut' } });
        camera.fromTo(photo, { y:0 }, { y:-3, duration:8 });
        var story = gsap.timeline({ paused:true, repeat:-1, repeatDelay:0.3, defaults:{ ease:'power2.inOut' } });
        story.addLabel('arrival',0)
          .set(routes,{ strokeDashoffset:1,opacity:0.8 },0)
          .set(notifications,{ opacity:0,x:28,y:-8,scale:0.97,filter:'blur(3px)' },0)
          .set(messages,{ opacity:0,y:0 },0).set(messages[0],{ opacity:1 },0)
          .set(followup,{ opacity:0.3 },0)
          .set(signal,{ opacity:0 },0)
          .set(steps,{ opacity:0 },0).set(steps[0],{ opacity:1 },0);
        Array.from(notifications).forEach(function(notification,index){
          var at=0.35+index*2.5;
          story.to(notification,{ opacity:1,x:0,y:0,scale:1,filter:'blur(0px)',duration:0.65,ease:'power3.out' },at)
            .to(messages,{ opacity:0,duration:0.25 },at+0.35)
            .to(messages[index],{ opacity:1,y:0,duration:0.5 },at+0.6)
            .fromTo(signal,{ opacity:0,scale:0.5 },{ opacity:1,scale:1,duration:0.6 },at+0.4);
        });
        story.addLabel('connection',4)
          .to(steps[0],{ opacity:0,duration:0.3 },'connection')
          .to(steps[1],{ opacity:1,duration:0.3 },'connection+=0.3')
          .to(routes,{ strokeDashoffset:0,duration:3 },'connection')
          .addLabel('clarity',9)
          .to(steps[1],{ opacity:0,duration:0.3 },'clarity')
          .to(steps[2],{ opacity:1,duration:0.3 },'clarity+=0.3')
          .to(followup,{ opacity:1,duration:0.8 },'clarity')
          .to(notifications,{ opacity:0,x:-12,duration:0.5,stagger:0.12 },13)
          .to([routes,steps[2],signal],{ opacity:0,duration:0.7 },13.5);
        animations = [entrance,camera,story];
      }
      sync();
    }

    function toggle() { userPaused = !userPaused; sync(); }
    button.addEventListener('click',toggle);
    doc.addEventListener('visibilitychange',sync);
    media.addEventListener('change',build);
    if (env.IntersectionObserver) {
      observer = new env.IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting; sync();
      },{ threshold:0.01 });
      observer.observe(root);
    }
    build();
    return { destroy:function () {
      clear();
      leaveType();
      if (glyphs.length) {
        title.removeEventListener('pointerenter',measureType);
        title.removeEventListener('pointermove',moveType);
        title.removeEventListener('pointerleave',leaveType);
        title.removeEventListener('focus',focusType);
        title.removeEventListener('blur',leaveType);
        env.removeEventListener('resize',leaveType);
        env.removeEventListener('scroll',leaveType);
      }
      if (observer) observer.disconnect();
      button.removeEventListener('click',toggle);
      doc.removeEventListener('visibilitychange',sync);
      media.removeEventListener('change',build);
      button.hidden = true;
      root.dataset.motion = 'still';
    }};
  };

  window.ppInitHomeHero(document.querySelector('[data-cinematic-hero]'));
})();
