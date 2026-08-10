(function(){
  var nav=document.querySelector('.nav'),navInner=document.querySelector('.nav-inner'),logo=document.querySelector('.nav-logo'),hero=document.querySelector('.svc-hero');
  if(logo)logo.innerHTML='<span class="pp-brand"><span class="pp-brand-copy"><span class="pp-brand-line">p<span class="pp-brand-orb" aria-hidden="true"></span>tenciar</span><span class="pp-brand-line pp-brand-line--lower">pymes</span></span></span>';
  if(navInner&&!navInner.querySelector('.service-nav-links')){
    var links=document.createElement('div');links.className='service-nav-links';links.innerHTML='<a href="/soluciones">Soluciones</a><a href="/#casos">Experiencia</a><a href="/recursos">Recursos</a><a href="/#contacto">Contacto</a>';navInner.insertBefore(links,navInner.lastElementChild);
  }
  if(hero){
    var service=document.body.getAttribute('data-service')||'sistema digital',tag=hero.querySelector('.svc-tag');hero.dataset.watermark=service.replace(/-/g,' ');
    var index=document.createElement('span');index.className='svc-index';index.textContent='[ 02 — '+(tag?tag.textContent:'SOLUCIONES')+' ]';hero.appendChild(index);
    if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){hero.addEventListener('pointermove',function(event){var rect=hero.getBoundingClientRect();hero.style.setProperty('--hero-x',((event.clientX-rect.left)/rect.width-.5).toFixed(3));hero.style.setProperty('--hero-y',((event.clientY-rect.top)/rect.height-.5).toFixed(3))});hero.addEventListener('pointerleave',function(){hero.style.setProperty('--hero-x',0);hero.style.setProperty('--hero-y',0)})}
  }
  window.addEventListener('scroll',function(){if(nav)nav.classList.toggle('scrolled',window.scrollY>30)},{passive:true});
  var footerLinks=document.querySelectorAll('.footer-links');if(footerLinks[0])footerLinks[0].innerHTML='<a href="/soluciones">Soluciones</a><a href="/recursos">Recursos</a><a href="/diagnostico">Diagnóstico</a><a href="/#contacto">Contacto</a>';
  var copy=document.querySelector('.footer-copy');if(copy)copy.textContent='© 2026 Potenciar Pymes · Buenos Aires';
})();
