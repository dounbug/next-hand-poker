import test from 'node:test';import assert from 'node:assert/strict';
import {reviewBoard} from '../dist/review-board.js';
import {createGame,act,legal} from '../dist/engine.js';
import {roundResult} from '../dist/round-result.js';
import {buildReview} from '../dist/review.js';
import {rememberHand} from '../dist/hand-history.js';
test('review runs out the original shuffle with correct burns, without touching real results',()=>{
 const g=createGame(),deck=[...g.deck],expected=[];
 for(const n of [3,1,1]){deck.pop();for(let i=0;i<n;i++)expected.push(deck.pop());}
 assert.deepEqual(reviewBoard(g),{board:[],hypothetical:false});
 while(g.street!=='complete')act(g,legal(g).canCheck?'check':'fold');
 const before=JSON.stringify(g),r=roundResult(g);assert.equal(r.hypothetical,true);assert.deepEqual(r.board,expected);assert.equal(r.ranking.length,6);assert.ok(r.ranking.every(p=>p.place!==null));assert.equal(JSON.stringify(g),before);
 const review=buildReview(g);assert.ok(review.hands.every(p=>p.bestFive.length===5));assert.match(review.comparison.note,/Hypothetical/);assert.equal(review.streets[1].status,'Not dealt — the hand ended earlier.');
 const history=[];rememberHand(history,g);assert.deepEqual(history[0].board,expected);assert.equal(history[0].result.hypothetical,true);assert.equal(JSON.stringify(g),before);
});
test('flop and turn runouts preserve exposed cards and do not reveal before completion',()=>{
 const g={street:'complete',board:['As','Kh','7d'],deck:['2c','3c','4c','5c']};assert.deepEqual(reviewBoard(g).board,['As','Kh','7d','4c','2c']);
 g.board.push('4c');g.deck=['2c','3c'];assert.deepEqual(reviewBoard(g).board,['As','Kh','7d','4c','2c']);g.street='turn';assert.equal(reviewBoard(g).board.length,4);
});
test('old archived hands without their deck retain their truthful dealt-card result',()=>{assert.deepEqual(reviewBoard({street:'complete',board:[]}),{board:[],hypothetical:false});});
