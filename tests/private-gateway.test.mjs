import {test} from 'node:test';import assert from 'node:assert/strict';import http from 'node:http';import {once} from 'node:events';import {createGateway} from '../lib/private-gateway.mjs';
test('internet gateway blocks every route until private invite is redeemed',async()=>{
 let requests=0;const upstream=http.createServer((req,res)=>{requests++;res.end('private game');});upstream.listen(0,'127.0.0.1');await once(upstream,'listening');const key='test-only-invitation-key',gateway=createGateway({key,upstreamPort:upstream.address().port});gateway.listen(0,'127.0.0.1');await once(gateway,'listening');const base='http://127.0.0.1:'+gateway.address().port;
 try{
  for(const path of ['/','/api/local','/api/rooms/abcdefabcdef','/multiplayer.js','/.local-private/rooms.json'])assert.equal((await fetch(base+path)).status,401);
  assert.equal((await fetch(base+'/?access=wrong')).status,403);assert.equal(requests,0);
  const redeem=await fetch(base+'/?room=example&access='+key,{redirect:'manual'});assert.equal(redeem.status,303);assert.equal(redeem.headers.get('location'),'/?room=example');assert.match(redeem.headers.get('set-cookie'),/HttpOnly; Secure; SameSite=Lax/);
  assert.equal(await (await fetch(base+'/game',{headers:{Cookie:'poker_access='+key}})).text(),'private game');assert.equal(requests,1);
  const info=await (await fetch(base+'/api/local',{headers:{Cookie:'poker_access='+key}})).json();assert.equal(new URL(info.inviteBase).searchParams.get('access'),key);
 }finally{gateway.closeAllConnections();upstream.closeAllConnections();await Promise.all([new Promise(r=>gateway.close(r)),new Promise(r=>upstream.close(r))]);}
});
