import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildReview} from '../dist/review.js';
const make=(decisions=[],board=['2s','7h','9d','Jc','Ks'])=>({street:'complete',board,hand:1,players:[{name:'You',hole:['Ah','Ad'],folded:false,stack:2000,startStack:2000},{name:'Maya',hole:['Kh','Kd'],folded:false,stack:2000,startStack:2000}],decisions,log:[],awards:[{amount:100,winners:[1],name:'Three of a kind'}]});
test('review stays unavailable while a hand is in play',()=>{assert.equal(buildReview({...make(),street:'river'}),null);});
test('finished review shows every final ranking and the best five cards',()=>{
 const r=buildReview(make());assert.equal(r.hands[0].rank,'One pair');assert.equal(r.hands[1].rank,'Three of a kind');assert.equal(r.hands[1].winner,true);assert.equal(r.hands[0].bestFive.length,5);
});
test('folded cards are labelled hypothetical and early wins do not invent a final board',()=>{
 const g=make();g.players[0].folded=true;assert.equal(buildReview(g).hands[0].hypothetical,true);
 const early=buildReview(make([],[]));assert.equal(early.hands[0].rank,'Pocket pair of Aces');assert.equal(early.hands[0].bestFive.length,0);
});
test('folding with a free check gets a concrete review cue regardless of result',()=>{
 const r=buildReview(make([{type:'fold',street:'flop',owed:0,pot:100,amount:0}]));assert.equal(r.cue.tone,'review');assert.match(r.cue.title,/check was free/i);
});
test('folding an unbeatable river hand is a substantive review cue',()=>{
 const g=make([{type:'fold',street:'river',owed:100,pot:200,amount:0}],['As','Ks','Qs','Js','Ts']);
 assert.match(buildReview(g).cue.title,/could not be beaten/i);
});
test('large river calls get pot-price context, not an invented pass/fail grade',()=>{
 const g=make([{type:'call',street:'river',owed:100,pot:200,amount:100,callPot:300}]);const r=buildReview(g);
 assert.equal(r.cue.tone,'review');assert.match(r.cue.body,/33%/);assert.match(r.cue.body,/One pair/);
});
test('opponent aggression is linked to revealed strength only after the hand',()=>{
 const g=make([{type:'call',street:'river',owed:100,pot:200,amount:100,logIndex:2}]);g.log=['River dealt.','Maya: Bet 100.','You: Call 100.'];
 const r=buildReview(g);assert.equal(r.opponent.name,'Maya');assert.equal(r.opponent.rank,'Three of a kind');assert.match(r.opponent.action,/Bet 100/);
});
test('existing saves without new decision snapshots remain reviewable',()=>{
 const g=make([{type:'check',street:'flop',owed:0,pot:100,amount:0}]);const r=buildReview(g);assert.equal(r.cue.tone,'good');assert.equal(r.decision.street,'flop');
});
test('capped all-in teaching uses only the contestable pot',()=>{
 const g=make([{type:'call',street:'river',owed:20,pot:1040,amount:20,callPot:80}]);const r=buildReview(g);assert.match(r.cue.body,/25%/);assert.doesNotMatch(r.cue.body,/2%/);
});
test('old saves omit a numerical price when pot eligibility was not saved',()=>{
 const g=make([{type:'call',street:'preflop',owed:20,pot:1040,amount:20}]);assert.doesNotMatch(buildReview(g).cue.body,/%/);
});

test('fold comparison explicitly reports weaker final hand and prioritizes fold',()=>{
 const g=make([{type:'call',street:'preflop',owed:20,pot:100,amount:20},{type:'fold',street:'river',owed:100,pot:300,amount:0}]);g.players[0].folded=true;
 const r=buildReview(g);assert.equal(r.decision.type,'fold');assert.equal(r.comparison.result,'Your hand was weaker');assert.match(r.comparison.body,/One pair.*Three of a kind/);
});
test('early fold comparison does not claim a final result or mutate the deck',()=>{
 const g=make([],['2s','7h','9d']);g.players[0].folded=true;const before=JSON.stringify(g);
 const r=buildReview(g);assert.equal(r.comparison.result,'Your hand was stronger');assert.match(r.comparison.note,/before the river/);assert.equal(JSON.stringify(g),before);
});
