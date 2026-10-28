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
    var animations = [], userPaused = false, inView = true, observer;

    function sync() {
      var still = !gsap || media.matches;
      var running = !still && !userPaused && !doc.hidden && inView;
      root.dataset.motion = still ? 'still' : running ? 'running' : 'paused';
      animations.forEach(function (animation) { running ? animation.play() : animation.pause(); });
      button.hidden = still;
      button.setAttribute('aria-pressed', String(userPaused));
      button.textContent = userPaused ? 'Reanudar animación' : 'Pausar animación';
    }

    function clear() {
      animations.forEach(function (animation) { animation.kill(); });
      animations = [];
      root.classList.remove('has-hero-motion');
      if (gsap) gsap.set([photo].concat(Array.from(lines), Array.from(routes), Array.from(steps)), { clearProps:'transform,opacity,visibility,strokeDashoffset' });
    }

    function build() {
      clear();
      if (gsap && !media.matches) {
        root.classList.add('has-hero-motion');
        var entrance = gsap.timeline({ paused:true, defaults:{ ease:'power3.out' } });
        // Never fade out the title or CTA: both remain readable throughout entry.
        entrance.from(lines, { y:20, duration:0.85, stagger:0.09, clearProps:'transform' });
        var camera = gsap.timeline({ paused:true, repeat:-1, yoyo:true, defaults:{ ease:'sine.inOut' } });
        camera.fromTo(photo, { scale:1.015, xPercent:-0.3 }, { scale:1.075, xPercent:0.3, duration:13 });
        var story = gsap.timeline({ paused:true, repeat:-1, repeatDelay:3, defaults:{ ease:'power2.inOut' } });
        story.addLabel('accumulation',0)
          .set(routes,{ strokeDashoffset:1 },0)
          .set(steps,{ opacity:0 },0).set(steps[0],{ opacity:1 },0)
          .addLabel('connection',3)
          .to(steps[0],{ opacity:0,duration:0.4 },'connection')
          .to(steps[1],{ opacity:1,duration:0.4 },'connection+=0.4')
          .to(routes,{ strokeDashoffset:0,duration:3,stagger:0.7 },'connection')
          .addLabel('clarity',8)
          .to(steps[1],{ opacity:0,duration:0.4 },'clarity')
          .to(steps[2],{ opacity:1,duration:0.4 },'clarity+=0.4')
          .to(routes,{ opacity:0.85,duration:2 },'clarity')
          .to([routes,steps[2]],{ opacity:0,duration:1 },12);
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
