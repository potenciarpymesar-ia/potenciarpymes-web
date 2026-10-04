(function(){
  var nav=document.querySelector('.nav'),navInner=document.querySelector('.nav-inner'),hero=document.querySelector('.svc-hero');
  if(navInner&&!navInner.querySelector('.service-nav-links')){
    var links=document.createElement('div');links.className='service-nav-links';links.innerHTML='<a href="/soluciones">Soluciones</a><a href="/#casos">Experiencia</a><a href="/recursos">Recursos</a><a href="/#contacto">Contacto</a>';navInner.insertBefore(links,navInner.lastElementChild);
  }
  if(hero){
    var service=document.body.getAttribute('data-service')||'sistema digital',tag=hero.querySelector('.svc-tag');hero.dataset.watermark=service.replace(/-/g,' ');
    var index=document.createElement('span');index.className='svc-index';index.textContent='[ 02 — '+(tag?tag.textContent:'SOLUCIONES')+' ]';hero.appendChild(index);
    var reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
    function resetHeroMotion(){hero.style.setProperty('--hero-x',0);hero.style.setProperty('--hero-y',0)}
    hero.addEventListener('pointermove',function(event){if(reducedMotion.matches)return;var rect=hero.getBoundingClientRect();hero.style.setProperty('--hero-x',((event.clientX-rect.left)/rect.width-.5).toFixed(3));hero.style.setProperty('--hero-y',((event.clientY-rect.top)/rect.height-.5).toFixed(3))});
    hero.addEventListener('pointerleave',resetHeroMotion);
    if(reducedMotion.addEventListener)reducedMotion.addEventListener('change',resetHeroMotion);
  }
  window.addEventListener('scroll',function(){if(nav)nav.classList.toggle('scrolled',window.scrollY>30)},{passive:true});
  var footerLinks=document.querySelectorAll('.footer-links');if(footerLinks[0])footerLinks[0].innerHTML='<a href="/soluciones">Soluciones</a><a href="/recursos">Recursos</a><a href="/#diagnostico">Por dónde empezar</a><a href="/#contacto">Contacto</a>';
  var copy=document.querySelector('.footer-copy');if(copy)copy.textContent='© 2026 Potenciar Pymes · Buenos Aires';
})();
