const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=path.join(__dirname,'../herramientas/product-lock.js');
test('Product Lock generator exists',()=>assert.ok(fs.existsSync(source),'Missing Product Lock generator'));
for(const preset of ['studio','lifestyle','hero'])test(preset+' produces complete editable master prompt',()=>{
 const {presets,buildPrompt}=require(source);
 const fields={...presets[preset],product:'Botella con etiqueta TEST',background:'Fondo personalizado'};
 const prompt=buildPrompt(fields);
 for(const text of ['PRODUCT LOCK','CAMBIOS PERMITIDOS','RESTRICCIONES','VALIDACIÓN','geometría','etiquetas','No rediseñar','fidelidad absoluta','Botella con etiqueta TEST','Fondo personalizado'])assert.ok(prompt.includes(text),text);
 for(const field of ['photo','background','surface','lighting','context','secondary','framing','format','style'])assert.ok(presets[preset][field],field);
});
test('presets fully replace scene without mutating other presets',()=>{
 const {presets}=require(source);const keys=Object.keys(presets.studio).sort();
 for(const value of Object.values(presets))assert.deepEqual(Object.keys(value).sort(),keys);
 const edited={...presets.hero,background:'EDITADO'};Object.assign(edited,presets.studio);assert.equal(edited.background,presets.studio.background);
 assert.notEqual(presets.hero.background,presets.studio.background);
});
test('blank product is rejected and text stays literal',()=>{
 const {presets,buildPrompt}=require(source);assert.throws(()=>buildPrompt({...presets.studio,product:' '}),/producto/i);
 assert.ok(buildPrompt({...presets.studio,product:'<script>TEST</script>'}).includes('<script>TEST</script>'));
});
