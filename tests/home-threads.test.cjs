const test = require('node:test');
const assert = require('node:assert/strict');
const {pathToFileURL} = require('node:url');
const path = require('node:path');
const policy = import(pathToFileURL(path.join(__dirname,'../frontend/hero-threads/motion-policy.mjs')).href);
test('Threads only animates while the shared hero controller is running', async()=>{
 const {canAnimateThreads} = await policy;
 assert.equal(canAnimateThreads('running',false,false),true);
 for(const motion of ['paused','still',undefined]) assert.equal(canAnimateThreads(motion,false,false),false);
});
test('Threads respects reduced motion and hidden tab independently of hero state', async()=>{
 const {canAnimateThreads} = await policy;
 assert.equal(canAnimateThreads('running',true,false),false);
 assert.equal(canAnimateThreads('running',false,true),false);
 assert.equal(canAnimateThreads('running',true,true),false);
});
