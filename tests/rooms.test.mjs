import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Rooms} from '../lib/rooms.mjs';
const setup=()=>{let time=100000;const rooms=new Rooms({now:()=>time});const host=rooms.create('Host'),friend=rooms.join(host.id,'Friend');rooms.view(host.id,host.token);rooms.view(host.id,friend.token);return {rooms,host,friend,advance:n=>time+=n};};
test('each member sees only their cards until complete and cannot act for the other seat',()=>{
 const {rooms,host,friend}=setup();rooms.action(host.id,host.token,{type:'start'});
 for(const person of [host,friend]){const v=rooms.view(host.id,person.token);assert.equal(v.game.players.filter(p=>p.hole.every(Boolean)).length,1);assert.equal(v.game.players[v.seat].hole.filter(Boolean).length,2);assert.equal(v.game.deck,undefined);assert.equal(v.review,null);assert.ok(!JSON.stringify(v).includes(host.token));assert.ok(!JSON.stringify(v).includes(friend.token));}
 assert.throws(()=>rooms.view(host.id,'bad-token'));assert.throws(()=>rooms.join(host.id,'Third player'));
 const v=rooms.view(host.id,friend.token);assert.throws(()=>rooms.action(host.id,friend.token,{type:'call',hand:v.game.hand,revision:v.revision}),/turn/);
});
test('invalid or replayed actions cannot alter chips or advance the table',()=>{
 const {rooms,host}=setup();const v=rooms.action(host.id,host.token,{type:'start'}),before=JSON.stringify(v.game);
 assert.throws(()=>rooms.action(host.id,host.token,{type:'raise',amount:1,hand:1,revision:v.revision}));assert.equal(JSON.stringify(rooms.view(host.id,host.token).game),before);
 const request={type:'call',hand:1,revision:v.revision};rooms.action(host.id,host.token,request);assert.throws(()=>rooms.action(host.id,host.token,request));
});
test('two human perspectives receive their own reviews and both must ready the next hand',()=>{
 const {rooms,host,friend}=setup();rooms.action(host.id,host.token,{type:'start'});let count=0;
 while(rooms.room(host.id).game.street!=='complete'&&count++<500){
  rooms.view(host.id,host.token);rooms.view(host.id,friend.token);const actor=rooms.room(host.id).game.actor;
  if([0,3].includes(actor)){const person=actor===0?host:friend,v=rooms.view(host.id,person.token);rooms.action(host.id,person.token,{type:v.game.legal.canCheck?'check':'call',hand:v.game.hand,revision:v.revision});}else rooms.tick();
 }
 assert.ok(count<500);for(const [person,name] of [[host,'Host'],[friend,'Friend']]){const v=rooms.view(host.id,person.token);assert.equal(v.review.hands[0].name,name);assert.equal(v.game.players.filter(p=>p.hole.every(Boolean)).length,6);assert.ok(v.review.overall);}
 const first=rooms.action(host.id,host.token,{type:'ready'});assert.equal(first.game.hand,1);const next=rooms.action(host.id,friend.token,{type:'ready'});assert.equal(next.game.hand,2);assert.equal(next.review,null);assert.deepEqual(next.ready,[]);
});
test('disconnect stops bots, restart preserves cards and resumes paused',()=>{
 const {rooms,host,friend,advance}=setup();const v=rooms.action(host.id,host.token,{type:'start'});rooms.action(host.id,host.token,{type:'call',hand:1,revision:v.revision});const before=JSON.stringify(rooms.room(host.id).game);advance(13000);rooms.tick();assert.equal(JSON.stringify(rooms.room(host.id).game),before);
 const restored=new Rooms({saved:JSON.parse(JSON.stringify(rooms.export()))});const state=restored.view(host.id,friend.token);assert.equal(state.paused,true);assert.deepEqual(state.game.players[3].hole,rooms.room(host.id).game.players[3].hole);assert.throws(()=>restored.action(host.id,friend.token,{type:'resume'}),/host/);
});
test('rename updates both views and action history without altering the hand and survives restart',()=>{
 const {rooms,host,friend}=setup();const v=rooms.action(host.id,host.token,{type:'start'});rooms.action(host.id,host.token,{type:'call',hand:1,revision:v.revision});
 const g=rooms.room(host.id).game,deck=[...g.deck],actor=g.actor,chips=g.players.map(p=>p.stack);
 rooms.action(host.id,host.token,{type:'rename',name:'New name'});
 const view=rooms.view(host.id,friend.token);assert.equal(view.members[0].name,'New name');assert.equal(view.game.players[0].name,'New name');assert.ok(view.game.log.some(l=>l.startsWith('New name: ')));assert.deepEqual(g.deck,deck);assert.equal(g.actor,actor);assert.deepEqual(g.players.map(p=>p.stack),chips);
 const restored=new Rooms({saved:JSON.parse(JSON.stringify(rooms.export()))});assert.equal(restored.view(host.id,host.token).members[0].name,'New name');
});
test('rename requires own credential, valid and unique name; works in lobby and out of turn',()=>{
 const {rooms,host,friend}=setup();assert.throws(()=>rooms.action(host.id,'bad',{type:'rename',name:'Bad'}));
 for(const name of ['', 'friend','<invalid>', 'a'.repeat(19)])assert.throws(()=>rooms.action(host.id,host.token,{type:'rename',name}));
 rooms.action(host.id,friend.token,{type:'rename',name:'Guest'});rooms.action(host.id,host.token,{type:'start'});rooms.action(host.id,friend.token,{type:'rename',name:'Guest two'});assert.equal(rooms.view(host.id,host.token).game.players[3].name,'Guest two');
 const bot=rooms.room(host.id).game.players[1].name;assert.throws(()=>rooms.action(host.id,host.token,{type:'rename',name:bot}));
});
