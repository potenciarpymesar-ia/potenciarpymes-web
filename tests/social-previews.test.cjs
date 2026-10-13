const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const covers={
 'index.html':'home',
 'privacidad.html':'privacidad',
 'diagnostico-digital.html':'diagnostico-digital',
 'diagnostico.html':'diagnostico-inicial',
 'auditoria-web.html':'chequeo-web',
 'herramientas/product-lock.html':'product-lock',
 'web-profesional.html':'web-profesional',
 'tiendanube.html':'tiendanube',
 'mercado-libre.html':'mercado-libre',
 'soluciones.html':'soluciones',
 'recursos.html':'recursos'
};
function metadata(html,key){
 return [...html.matchAll(/<meta\b[^>]*>/gi)].flatMap(([tag])=>{
  const attrs=Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/g)].map(m=>[m[1],m[3]]));
  return attrs.property===key||attrs.name===key?[attrs.content]:[];
 });
}
for(const [page,cover] of Object.entries(covers))test(page+' shares its approved cover',()=>{
 const html=fs.readFileSync(path.join(root,page),'utf8');
 const expected='https://potenciarpymes.ar/assets/social/'+cover+'-2026-10.jpg';
 assert.deepEqual(metadata(html,'og:image'),[expected]);
 assert.deepEqual(metadata(html,'twitter:image'),[expected]);
});
const pages=['', 'blog', 'herramientas'].flatMap(dir=>fs.readdirSync(path.join(root,dir)).filter(f=>f.endsWith('.html')&&f!=='design-system.html').map(f=>path.join(dir,f)));
test('every public page exposes one complete, accessible social image',()=>{
 for(const page of pages){
  const html=fs.readFileSync(path.join(root,page),'utf8');
  const images=metadata(html,'og:image');
  assert.equal(images.length,1,page);
  assert.deepEqual(metadata(html,'twitter:image'),images,page);
  assert.deepEqual(metadata(html,'twitter:card'),['summary_large_image'],page);
  assert.deepEqual(metadata(html,'og:image:width'),['1200'],page);
  assert.deepEqual(metadata(html,'og:image:height'),['630'],page);
  assert.deepEqual(metadata(html,'og:image:type'),['image/jpeg'],page);
  assert.equal(metadata(html,'og:image:alt').length,1,page);
  assert.deepEqual(metadata(html,'twitter:image:alt'),metadata(html,'og:image:alt'),page);
  assert.ok(metadata(html,'og:image:alt')[0].length>10,page);
  const url=new URL(images[0]);
  assert.equal(url.origin,'https://potenciarpymes.ar',page);
  assert.ok(fs.existsSync(path.join(root,url.pathname)),page);
 }
});
function jpegSize(buffer){
 assert.equal(buffer.readUInt16BE(0),0xffd8);
 let offset=2;
 while(offset<buffer.length){
  while(buffer[offset]===0xff)offset++;
  const marker=buffer[offset++];
  const length=buffer.readUInt16BE(offset);
  if([0xc0,0xc1,0xc2].includes(marker))return [buffer.readUInt16BE(offset+5),buffer.readUInt16BE(offset+3)];
  offset+=length;
 }
 throw new Error('JPEG dimensions missing');
}
test('the eleven covers are real 1200x630 JPEGs under 500 KB each',()=>{
 for(const cover of Object.values(covers)){
  const buffer=fs.readFileSync(path.join(root,'assets/social',cover+'-2026-10.jpg'));
  assert.deepEqual(jpegSize(buffer),[1200,630],cover);
  assert.ok(buffer.length<500000,cover+' exceeds image budget');
 }
});
