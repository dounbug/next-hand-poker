import {test} from 'node:test';
import assert from 'node:assert/strict';
import {evaluate,createGame,act,legal,settle,botAction} from '../dist/engine.js';
const cards=s=>s.split(' ');
test('ranks seven cards, wheel, kickers and board ties',()=>{
 assert.equal(evaluate(cards('As Ks Qs Js Ts 2d 3c')).name,'Straight flush');
 assert.ok(evaluate(cards('Ah Ad Ac As 2d 3d 4d')).score>evaluate(cards('Kh Kd Kc 2s 2d 3d 4d')).score);
 assert.ok(evaluate(cards('2s 3h 4d 5c 6s 9h Td')).score>evaluate(cards('As 2h 3d 4c 5s 9h Td')).score);
 assert.equal(evaluate(cards('As Ks Qs Js Ts 2h 3h')).score,evaluate(cards('As Ks Qs Js Ts 9h 9d')).score);
 assert.ok(evaluate(cards('Ah Ad Ks Qs Jc 9d 2d')).score>evaluate(cards('Ac As Kh Qh Tc 9s 2c')).score);
});
test('blinds, turn order, big blind option and flop order',()=>{
 const g=createGame(); assert.equal(g.actor,0); assert.equal(g.currentBet,20);
 assert.equal(g.players[4].bet,10); assert.equal(g.players[5].bet,20);
 for(let i=0;i<5;i++)act(g,'call');
 assert.equal(g.actor,5); assert.equal(g.street,'preflop'); act(g,'check');
 assert.equal(g.street,'flop'); assert.equal(g.board.length,3); assert.equal(g.actor,4);
});
test('illegal action leaves state unchanged; min raise and short all-in reopening',()=>{
 const g=createGame();const before=JSON.stringify(g);assert.throws(()=>act(g,'check'));assert.equal(JSON.stringify(g),before);
 assert.throws(()=>act(g,'raise',30));act(g,'raise',100);
 g.players[1].stack=110;act(g,'raise',110);act(g,'call');act(g,'call');act(g,'call');act(g,'call');
 assert.equal(g.actor,0);assert.equal(legal(g).canRaise,false); assert.throws(()=>act(g,'raise',200));act(g,'call');assert.equal(g.street,'flop');
});
test('side pots and uncalled excess return chips only to eligible players',()=>{
 const g=createGame();g.board=cards('2s 3h 7d 8c 9s');
 g.players.forEach((p,i)=>{p.stack=0;p.total=[50,100,200,100,0,0][i];p.folded=i>=3;p.hole=cards(['As Ad','Ks Kd','Qs Qd','Js Jd','Ts Td','6s 6d'][i]);});
 settle(g);assert.equal(g.players[0].stack,200);assert.equal(g.players[1].stack,150);assert.equal(g.players[2].stack,100);
 assert.equal(g.players.reduce((a,p)=>a+p.stack,0),450);
});
test('split pot odd chip goes clockwise from button',()=>{
 const g=createGame();g.dealer=0;g.board=cards('As Ks Qs Js Ts');g.players.forEach((p,i)=>{p.stack=0;p.total=i<3?1:0;p.folded=i>=2;});
 settle(g);assert.equal(g.players[1].stack,2);assert.equal(g.players[0].stack,1);
});
test('hundreds of simulated hands terminate, conserve chips and have unique cards',()=>{
 for(let k=0;k<300;k++){
 const g=createGame();const total=g.players.reduce((a,p)=>a+p.stack+p.total,0);let steps=0;
 while(g.street!=='complete'&&steps++<200){const b=botAction(g);act(g,b.type,b.amount);}
 assert.equal(g.street,'complete');assert.equal(g.players.reduce((a,p)=>a+p.stack,0),total);
 assert.ok(g.players.every(p=>p.stack>=0&&Number.isInteger(p.stack)));
 const dealt=[...g.board,...g.players.flatMap(p=>p.hole)];assert.equal(new Set(dealt).size,dealt.length);
 }
});
test('cumulative short all-ins reopen action when a full raise is faced',()=>{
 const g=createGame();act(g,'raise',100);g.players[1].stack=140;act(g,'raise',140);g.players[2].stack=180;act(g,'raise',180);act(g,'call');act(g,'call');act(g,'call');
 assert.equal(g.actor,0);assert.equal(legal(g).canRaise,true);assert.equal(legal(g).min,260);
});
test('an all-in call does not require chips beyond the remaining stack',()=>{
 const g=createGame();g.players[0].stack=7;assert.equal(legal(g).call,7);act(g,'call');assert.equal(g.players[0].stack,0);assert.equal(g.players[0].total,7);
});
test('only player with chips must answer a bet but cannot create a dry side pot',()=>{
 const g=createGame();g.players.forEach((p,i)=>{p.folded=i>1;p.stack=i===0?500:0;p.bet=i===0?20:100;p.total=p.bet;p.actedAt=20;});g.actor=0;g.currentBet=100;
 assert.equal(legal(g).canRaise,false);act(g,'call');assert.equal(g.street,'complete');assert.equal(g.board.length,5);
});
test('a saved hand resumes deterministically with its original deck and action',()=>{
 const g=createGame();act(g,'call');const resumed=JSON.parse(JSON.stringify(g));
 for(const state of [g,resumed])while(state.street!=='complete'){act(state,legal(state).canCheck?'check':'call');}
 assert.deepEqual(resumed,g);
});
test('button rotates, stacks carry over, and only empty stacks refill',()=>{
 const g=createGame();g.players[0].stack=0;g.players[1].stack=1234;g.dealer=5;const h=createGame(g);
 assert.equal(h.dealer,0);assert.equal(h.players[0].startStack,2000);assert.equal(h.players[1].startStack,1234);assert.deepEqual(h.refilled,['You']);
});
test('random legal actions across unequal stacks preserve chips and always finish',()=>{
 let seed=12345;const rng=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let hand=0;hand<2000;hand++){
 const previous={hand:0,dealer:Math.floor(rng()*6),players:Array.from({length:6},()=>({stack:1+Math.floor(rng()*1000)}))};
 const g=createGame(previous),initial=g.players.reduce((a,p)=>a+p.stack+p.total,0);let steps=0;
 while(g.street!=='complete'&&steps++<250){const l=legal(g),r=rng();if(l.canRaise&&r<.25){const amount=r<.12?l.max:l.min+Math.floor(rng()*(l.max-l.min+1));act(g,'raise',amount);}else if(r<.4)act(g,'fold');else act(g,l.canCheck?'check':'call');}
 assert.equal(g.street,'complete',`hand ${hand}`);assert.equal(g.players.reduce((a,p)=>a+p.stack,0),initial);assert.ok(g.players.every(p=>p.stack>=0));
 }
});
test('short big blind does not force the lone small blind to call a phantom bet',()=>{
 const prior={hand:0,dealer:2,players:Array.from({length:6},(_,i)=>({stack:i===5?5:2000}))};const g=createGame(prior);
 assert.equal(g.smallBlind,4);assert.equal(g.bigBlind,5);for(let i=0;i<4;i++)act(g,'fold');
 assert.equal(g.street,'complete');assert.equal(g.board.length,5);assert.equal(g.players.reduce((s,p)=>s+p.stack,0),10005);
});
test('a prior checker cannot raise an opening all-in below the minimum bet',()=>{
 const prior={hand:0,dealer:2,players:Array.from({length:6},(_,i)=>({stack:i===5?30:2000}))};const g=createGame(prior);
 for(let i=0;i<5;i++)act(g,'call');act(g,'check');assert.equal(g.street,'flop');assert.equal(g.actor,4);
 act(g,'check');act(g,'raise',10);for(let i=0;i<4;i++)act(g,'call');
 assert.equal(g.actor,4);assert.equal(legal(g).canRaise,false);assert.throws(()=>act(g,'raise',30));act(g,'call');assert.equal(g.street,'turn');
});
test('call price excludes chips a short stack cannot win',()=>{
 const g=createGame();g.players.forEach((p,i)=>{p.total=i<2?20:0;p.bet=0;p.folded=i>=2;p.stack=i===0?20:1000;p.actedAt=null;});g.actor=1;g.currentBet=0;g.minRaise=20;
 act(g,'raise',1000);assert.equal(g.actor,0);assert.equal(legal(g).callPot,80);act(g,'call');assert.equal(g.decisions.at(-1).callPot,80);
});
