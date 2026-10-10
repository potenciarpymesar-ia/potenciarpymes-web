'use strict';
(function () {
 const presets={
  studio:{photo:'Fotografía limpia de catálogo',background:'Fondo neutro color blanco cálido',surface:'Superficie mate sencilla',lighting:'Luz suave y difusa, sin dominantes de color',context:'Estudio fotográfico, producto protagonista',secondary:'Ninguno',framing:'Producto completo centrado, con margen alrededor',format:'1:1',style:'Fotografía comercial realista, limpia y fiel'},
  lifestyle:{photo:'Fotografía lifestyle',background:'Ambiente cotidiano realista con profundidad suave',surface:'Mesa sencilla de madera natural',lighting:'Luz natural lateral de ventana',context:'Situación de uso cotidiana acorde al producto, sin modificarlo',secondary:'Decoración mínima secundaria, sin tapar el producto',framing:'Producto completo en primer plano, contexto visible',format:'4:5',style:'Fotografía natural y realista, sin filtros intensos'},
  hero:{photo:'Fotografía comercial destacada',background:'Fondo editorial con profundidad y separación del producto',surface:'Base mate sobria acorde al producto',lighting:'Iluminación cuidada con luz principal suave y contraluz ambiental',context:'Campaña comercial editorial con el producto como protagonista',secondary:'Elementos discretos que no compitan con el producto',framing:'Producto completo protagonista con espacio para composición',format:'3:4',style:'Fotografía editorial premium, realista y fiel'}
 };
 function buildPrompt(values){
  if(!values.product||!values.product.trim())throw new Error('Describí el producto antes de generar el prompt.');
  const labels={product:'Producto de referencia',photo:'Tipo de fotografía',background:'Fondo',surface:'Superficie',lighting:'Iluminación',context:'Contexto',secondary:'Elementos secundarios',framing:'Encuadre',format:'Formato',style:'Estilo fotográfico'};
  const scene=Object.entries(labels).map(([key,label])=>label+': '+(String(values[key]||'').trim()||'Sin indicación adicional')).join('\n');
  return `EDITAR LA FOTOGRAFÍA ORIGINAL ADJUNTA — PRODUCT LOCK
Usá la fotografía original como referencia principal y fuente de verdad. Editá el entorno, no el producto. La descripción orienta el escenario; no reemplaza la evidencia de la foto. Si hay contradicciones, preservá el original.

ESCENARIO SOLICITADO
${scene}

PRODUCT LOCK — INALTERABLE
- Conservar geometría y silueta.
- Mantener proporciones y volumen.
- Preservar colores, materiales y texturas.
- Respetar etiquetas, logos, símbolos y textos tal como aparecen en el original.
- No agregar, eliminar ni inventar componentes.
- No rediseñar ni reinterpretar el producto.

CAMBIOS PERMITIDOS
- Fondo y superficie.
- Ambientación e iluminación ambiental.
- Sombras y reflejos coherentes con la escena, sin alterar el color o material real del producto.
- Contexto comercial. Adaptar el encuadre al formato sin deformar ni recortar partes del producto.

RESTRICCIONES
- No modificar el diseño original ni inventar características.
- No alterar información comercial ni completar textos ilegibles por suposición.
- No agregar elementos que oculten el producto.
- Las indicaciones del escenario nunca anulan PRODUCT LOCK.
- Priorizar la fidelidad sobre la estética. Si un cambio exige reinterpretar el producto, omitir ese cambio.

VALIDACIÓN ANTES DE USO COMERCIAL
Compará el resultado generado con la fotografía original: silueta, proporciones, componentes, colores, materiales, etiquetas y textos. Un prompt no garantiza fidelidad absoluta. Las imágenes con deformaciones, etiquetas incorrectas o diferencias relevantes deben corregirse antes de utilizarlas comercialmente.`;
 }
 if(typeof module!=='undefined'&&module.exports)module.exports={presets,buildPrompt};
 if(typeof document==='undefined')return;
 const form=document.getElementById('product-lock-form');if(!form)return;
 const output=document.getElementById('prompt-output'),copy=document.getElementById('copy-prompt'),status=document.getElementById('prompt-status');
 let preset='studio',currentPrompt='',dirty=false;
 const track=event=>{window.dataLayer=window.dataLayer||[];window.dataLayer.push({event,tool:'product_lock',preset});};
 function markDirty(){if(!currentPrompt)return;dirty=true;copy.disabled=true;status.textContent='Cambiaste el escenario. Generá de nuevo antes de copiar.';}
 function applyPreset(name){preset=name;for(const [key,value]of Object.entries(presets[name]))form.elements[key].value=value;document.querySelectorAll('[data-preset]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.preset===name)));markDirty();}
 document.querySelectorAll('[data-preset]').forEach(button=>button.addEventListener('click',()=>{applyPreset(button.dataset.preset);track('product_lock_preset_selected');}));
 form.addEventListener('input',markDirty);
 form.addEventListener('submit',event=>{event.preventDefault();if(!form.reportValidity())return;const values=Object.fromEntries(new FormData(form));try{currentPrompt=buildPrompt(values);output.value=currentPrompt;dirty=false;copy.disabled=false;status.textContent='Prompt completo generado. Adjuntalo junto a tu fotografía original.';track('product_lock_prompt_generated');output.focus();}catch(error){status.textContent=error.message;}});
 copy.addEventListener('click',async()=>{if(!currentPrompt||dirty)return;copy.disabled=true;try{if(!navigator.clipboard||!window.isSecureContext)throw Error('Clipboard unavailable');await navigator.clipboard.writeText(currentPrompt);status.textContent='Prompt completo copiado. Ahora adjuntá tu fotografía original en la herramienta de IA.';track('product_lock_prompt_copied');}catch(error){output.focus();output.select();status.textContent='No se pudo copiar automáticamente. El prompt está seleccionado: usá Copiar en tu dispositivo.';}finally{copy.disabled=dirty;}});
 applyPreset('studio');
 document.getElementById('generate-prompt').disabled=false;
})();
