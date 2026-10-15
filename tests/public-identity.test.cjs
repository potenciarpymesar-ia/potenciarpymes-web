const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
// Keep the private identifier out of this potentially downloadable test file.
const privateName=String.fromCharCode(102,114,101,110,113,117,101,108);
test('public text and asset paths do not disclose the private identity',()=>{
 const violations=[];
 function visit(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
   if(entry.name.startsWith('.')||['node_modules','api','tests','db'].includes(entry.name))continue;
   const file=path.join(dir,entry.name);
   const relative=path.relative(root,file);
   if(relative.toLowerCase().includes(privateName))violations.push(relative);
   if(entry.isDirectory())visit(file);
   else if(/\.(html|css|js|json|txt|xml|svg|md|webmanifest)$/i.test(entry.name)&&fs.readFileSync(file,'utf8').toLowerCase().includes(privateName))violations.push(relative);
  }
 }
 visit(root);
 assert.deepEqual(violations,[],'Private identity remains in public artifacts');
});
