import {test} from 'node:test';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import {once} from 'node:events';
test('local HTTP host serves two isolated seats and keeps private saves inaccessible',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'next-hand-http-'));const child=spawn(process.execPath,['server.mjs'],{cwd:new URL('..',import.meta.url),env:{...process.env,PORT:'0',POKER_DATA_DIR:dir},stdio:['ignore','pipe','pipe']});
 try{
 const port=await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Server startup timed out')),5000);child.stdout.on('data',b=>{const m=b.toString().match(/Local poker: http:\/\/localhost:(\d+)/);if(m){clearTimeout(timeout);resolve(m[1]);}});child.on('error',reject);child.on('exit',code=>{clearTimeout(timeout);reject(Error('Server exited '+code));});});const base='http://127.0.0.1:'+port;
 const request=async(path,body,token)=>{const r=await fetch(base+path,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,body:await r.json()};};
 assert.match(await (await fetch(base)).text(),/id="join-form"/);assert.match(await (await fetch(base+'/solo')).text(),/NEXT HAND/);
 const h=(await request('/api/rooms',{name:'One'})).body,f=(await request('/api/rooms/'+h.id+'/join',{name:'Two'})).body;
 assert.equal((await request('/api/rooms/'+h.id+'/action',{type:'start'},h.token)).status,200);
 const hv=(await request('/api/rooms/'+h.id,null,h.token)).body,fv=(await request('/api/rooms/'+h.id,null,f.token)).body;
 assert.equal(hv.seat,0);assert.equal(fv.seat,3);assert.deepEqual(hv.game.players[3].hole,[null,null]);assert.deepEqual(fv.game.players[0].hole,[null,null]);
 assert.equal((await request('/api/rooms/'+h.id,null,'wrong')).status,400);assert.equal((await fetch(base+'/.local-private/rooms.json')).status,404);
 const cross=await fetch(base+'/api/rooms',{method:'POST',headers:{Origin:'https://unrelated.example','Content-Type':'application/json'},body:JSON.stringify({name:'Bad'})});assert.equal(cross.status,403);
 }finally{if(child.exitCode===null&&child.signalCode===null){const exited=once(child,'exit');child.kill('SIGTERM');await exited;}await rm(dir,{recursive:true,force:true});}
});
