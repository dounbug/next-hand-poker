import test from 'node:test';
import assert from 'node:assert/strict';
import {currentHand,currentHandHTML} from '../dist/current-hand.js';
test('recognizes fours full of kings before a fold using the visible board',()=>{
 const h=currentHand(['4s','4h'],['Kd','Kc','4d']);
 assert.equal(h.name,'Full house');assert.equal(h.detail,'Fours full of Kings');assert.equal(h.cards.length,5);
 assert.match(currentHandHTML(['4s','4h'],['Kd','Kc','4d']),/Full house/);
});
test('updates on each street and identifies when the board plays',()=>{
 assert.equal(currentHand(['4s','4h'],[]).name,'Pocket pair');
 assert.equal(currentHand(['4s','4h'],['Kd','Qc','4d']).name,'Three of a kind');
 assert.equal(currentHand(['4s','4h'],['Kd','Qc','4d','Kh']).name,'Full house');
 assert.equal(currentHand(['4s','4h'],['Kd','Qc','4d','Kh','4c']).name,'Four of a kind');
 const h=currentHand(['2c','3d'],['Ts','Js','Qs','Ks','As']);
 assert.equal(h.name,'Straight flush');assert.equal(h.boardPlays,true);
 assert.match(currentHandHTML(['2c','3d'],['Ts','Js','Qs','Ks','As']),/Board plays/);
});
test('handles a wheel and selects the higher trips for a double-trips full house',()=>{
 assert.equal(currentHand(['As','2d'],['3c','4h','5d']).detail,'Five-high');
 assert.equal(currentHand(['4s','Kh'],['Kd','Kc','4d','4h','2c']).detail,'Kings full of Fours');
});
