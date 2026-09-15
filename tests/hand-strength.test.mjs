import {test} from 'node:test';
import assert from 'node:assert/strict';
import {handStrength} from '../dist/hand-strength.js';
import {buildReview} from '../dist/review.js';
test('strength updates from starting hand to board without using hidden cards',()=>{
 const hole=['As','Ks'];const board=['Qs','Js','Ts'];const before=JSON.stringify({hole,board});
 assert.equal(handStrength(hole,[]).rank,'Starting hand');
 const r=handStrength(hole,board);assert.equal(r.rank,'Straight flush');assert.equal(r.percentile,100);assert.equal(JSON.stringify({hole,board}),before);
});
test('shared royal flush is a tie percentile, not a claimed guaranteed win',()=>{
 const r=handStrength(['2h','3d'],['As','Ks','Qs','Js','Ts']);assert.equal(r.percentile,50);assert.match(r.basis,/ties count halfway/);
});
test('review separates observed good habits from unsupported praise',()=>{
 const g={street:'complete',board:[],players:[{name:'You',hole:['Ah','Ad'],folded:false,stack:2000,startStack:2000}],awards:[{winners:[0],amount:20}],decisions:[],log:[]};
 assert.match(buildReview(g).wentWell,/No clear positive/);assert.match(buildReview(g).overall,/No voluntary/);
 g.decisions=[{type:'check',street:'preflop',owed:0,pot:20}];assert.match(buildReview(g).wentWell,/checked for free/);
});
