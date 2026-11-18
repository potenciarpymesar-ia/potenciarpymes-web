(function () {
  'use strict';

  var STEP = 2.6; // segundos que se resalta cada canal

  // Controla el estado de movimiento del hero (running | paused | still), el revelado del
  // titular, las letras reactivas y el resaltado de los canales. El texto siempre está en HTML.
  window.ppInitHomeHero = function (root, environment) {
    if (!root) return null;
    var env = environment || window;
    var gsap = env.gsap;
    var doc = env.document || document;
    var media = env.media || window.matchMedia('(prefers-reduced-motion: reduce)');
    var button = root.querySelector('[data-hero-motion]');
    var lines = root.querySelectorAll('.hero-title-line');
    var inners = [];
    var channels = root.querySelectorAll('.hero-channel');
    var animations = [], userPaused = false, inView = true, observer;
    var title = root.querySelector('#hero-title'), glyphs = [], centers = [], titleBox;
    var pointerMedia = env.pointerMedia || window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)');
    if (title && title.querySelectorAll) {
      Array.from(title.querySelectorAll('.hero-title-line')).forEach(function(line) {
        var text = line.textContent;
        line.textContent = '';
        line.setAttribute('aria-hidden','true');
        var inner = doc.createElement('span');
        inner.className = 'hero-line-inner';
        inner.style.display = 'inline-block';
        Array.from(text).forEach(function(character) {
          var glyph = doc.createElement('span');
          glyph.className = 'hero-glyph'; glyph.textContent = character;
          inner.appendChild(glyph); glyphs.push(glyph);
        });
        line.appendChild(inner);
        inners.push(inner);
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

    function setLit(index) {
      Array.from(channels).forEach(function (channel, i) {
        if (channel.classList) channel.classList.toggle('is-lit', i === index);
      });
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
      setLit(-1);
      if (gsap) gsap.set(Array.from(lines).concat(inners), { clearProps:'transform,overflow' });
    }

    function build() {
      clear();
      if (gsap && !media.matches) {
        root.classList.add('has-hero-motion');
        var entrance = gsap.timeline({ paused:true, defaults:{ ease:'power3.out' } });
        // Revelado tipo cortina: cada línea sube desde su máscara. El texto nunca se desvanece
        // y, si el script falla, queda visible en su lugar.
        entrance.set(lines, { overflow:'hidden' }, 0)
          .from(inners, { yPercent:105, duration:0.8, stagger:0.09, clearProps:'transform' }, 0)
          .set(lines, { clearProps:'overflow' }, '>');
        // Los cinco canales se resaltan de a uno, en bucle, mientras el hero está visible.
        var story = gsap.timeline({ paused:true, repeat:-1 });
        Array.from(channels).forEach(function (channel, i) { story.call(setLit, [i], i * STEP); });
        story.to({}, { duration: Math.max(1, channels.length) * STEP });
        animations = [entrance, story];
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
