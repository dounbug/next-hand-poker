import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,botAction,legal,act} from '../dist/engine.js';
import {botObservation} from '../dist/bot-policy.js';
const rng=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
test('bot observation and decision ignore other hole cards and deck',()=>{const g=createGame();g.actor=4;const observation=botObservation(g),a=botAction(g,rng(123));g.deck.reverse();g.players[1].hole=['As','Ah'];assert.deepEqual(botObservation(g),observation);assert.deepEqual(botAction(g,rng(123)),a);assert.equal(observation.deck,undefined);assert.ok(observation.players.every(p=>!p.hole));});
test('profiles widen late-position openings and volatility profile plays more hands',()=>{
 const ranges=(seat,dealer)=>{let opens=0;for(let n=1;n<=120;n++){const g=createGame();g.actor=seat;g.dealer=dealer;g.players[seat].hole=['Qh','8c'];g.players.forEach(p=>{p.actedAt=null;});if(botAction(g,rng(n)).type==='raise')opens++;}return opens;};
 assert.ok(ranges(4,4)>ranges(4,1));assert.ok(ranges(2,2)>ranges(1,1));
});
test('new policies complete hands with only legal actions and conserve chips',()=>{for(let n=0;n<60;n++){const g=createGame();let actions=0;while(g.street!=='complete'&&actions++<250){const a=botAction(g),l=legal(g);if(a.type==='raise'){assert.ok(l.canRaise);assert.ok(a.amount>=l.min&&a.amount<=l.max);}act(g,a.type,a.amount);}assert.equal(g.street,'complete');assert.equal(g.players.reduce((s,p)=>s+p.stack,0),12000);}});
test('postflop policy cannot see the true opposing cards or undealt runout',()=>{const g=createGame();g.actor=4;g.street='turn';g.board=['Qs','9s','3d','2c'];g.players[4].hole=['As','5s'];g.currentBet=0;g.players.forEach(p=>{p.bet=0;p.total=100;p.actedAt=null;});const before=botAction(g,rng(99));for(let i=0;i<6;i++)if(i!==4)g.players[i].hole=['Ac','Ad'];g.deck=['Kh','Kd'];assert.deepEqual(botAction(g,rng(99)),before);});
test('shared royal-flush board is checked rather than value-bet as a private monster',()=>{const g=createGame();g.actor=5;g.street='river';g.board=['As','Ks','Qs','Js','Ts'];g.players[5].hole=['2c','3d'];g.currentBet=0;g.players.forEach(p=>{p.bet=0;p.total=100;p.actedAt=null;});for(let n=1;n<30;n++)assert.equal(botAction(g,rng(n)).type,'check');});
