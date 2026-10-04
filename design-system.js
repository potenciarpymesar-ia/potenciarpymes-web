(function(){
  'use strict';
  document.querySelectorAll('[data-reference-theme]').forEach(function(input){input.addEventListener('change',function(){if(input.checked)document.body.setAttribute('data-theme',input.value);});});
  var demoForm=document.querySelector('[data-reference-form]');if(demoForm)demoForm.addEventListener('submit',function(e){e.preventDefault();demoForm.querySelector('[data-reference-status]').textContent='Prueba local completada. No se envió ningún dato.';});
  var main=document.querySelector('main')||document.querySelector('.page');
  if(main&&main.tagName!=='MAIN')main.setAttribute('role','main');
  if(main&&!document.querySelector('.skip,.skip-link,.pp-skip-link')){
    if(!main.id)main.id='pp-main';
    var skip=document.createElement('a');skip.href='#'+main.id;skip.className='pp-skip-link';skip.textContent='Saltar al contenido';document.body.insertBefore(skip,document.body.firstChild);
  }
  document.querySelectorAll('.nav-inner').forEach(function(inner,index){
    var links=inner.querySelector('.service-nav-links,.nav-links');
    if(!links)return;
    links.classList.add('pp-mobile-links');links.id=links.id||'pp-navigation-'+index;
    var toggle=document.createElement('button');toggle.type='button';toggle.className='pp-nav-toggle';toggle.textContent='Menú';toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls',links.id);
    inner.insertBefore(toggle,links);inner.classList.add('pp-nav-ready');
    var home=!!inner.closest('[data-home-mobile-nav]'),mobile=home?window.matchMedia('(max-width:767px)'):null;
    function close(){links.classList.remove('is-open');toggle.setAttribute('aria-expanded','false');toggle.textContent='Menú';}
    toggle.addEventListener('click',function(){var open=toggle.getAttribute('aria-expanded')!=='true';links.classList.toggle('is-open',open);toggle.setAttribute('aria-expanded',String(open));toggle.textContent=home&&mobile.matches?'Menú':open?'Cerrar menú':'Menú';});
    inner.addEventListener('keydown',function(e){if(e.key==='Escape'&&toggle.getAttribute('aria-expanded')==='true'){close();toggle.focus();}});
    links.addEventListener('click',function(e){if(e.target.closest('a'))close();});
    if(home){
      document.addEventListener('click',function(e){if(mobile.matches&&!inner.contains(e.target))close();});
      inner.addEventListener('focusout',function(e){if(mobile.matches&&!inner.contains(e.relatedTarget))close();});
      mobile.addEventListener('change',close);
    }
  });
  var modal=document.querySelector('[data-cover-lightbox]');
  if(modal){
    modal.setAttribute('aria-modal','true');modal.setAttribute('role','dialog');modal.setAttribute('aria-label','Vista ampliada del ejemplo');
    var restored=[],returnFocus;
    document.addEventListener('click',function(e){var root=e.target.closest('[data-coverflow]');if(root)returnFocus=root;},true);
    document.addEventListener('keydown',function(e){if(e.target.matches('[data-coverflow]')&&(e.key==='Enter'||e.key===' '))returnFocus=e.target;},true);
    function syncModal(){
      var open=modal.classList.contains('is-open');
      if(open){if(restored.length)return;Array.from(document.body.children).forEach(function(el){if(el!==modal&&el.tagName!=='SCRIPT'){restored.push([el,el.inert]);el.inert=true;}});}
      else{restored.forEach(function(item){item[0].inert=item[1];});restored=[];if(returnFocus&&returnFocus.isConnected)returnFocus.focus();}
    }
    new MutationObserver(syncModal).observe(modal,{attributes:true,attributeFilter:['class']});
    modal.addEventListener('keydown',function(e){if(e.key!=='Tab')return;var items=Array.from(modal.querySelectorAll('button,a[href],[tabindex="0"]')).filter(function(el){return !el.hidden&&!el.disabled&&el.getClientRects().length;});if(!items.length)return;var first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}});
  }
  document.querySelectorAll('[data-coverflow]').forEach(function(root){
    var paused=false,control=document.createElement('button');control.type='button';control.className='pp-motion-control';control.textContent='Pausar animación';control.setAttribute('aria-pressed','false');root.parentNode.insertBefore(control,root.nextSibling);
    control.addEventListener('click',function(){paused=!paused;root.dataset.motionPaused=String(paused);control.textContent=paused?'Reanudar animación':'Pausar animación';control.setAttribute('aria-pressed',String(paused));root.dispatchEvent(new Event('pp-motion-change'));});
  });
})();
