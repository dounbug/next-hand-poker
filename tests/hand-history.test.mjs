import test from 'node:test';import assert from 'node:assert/strict';
import {createGame,act,legal} from '../dist/engine.js';
import {rememberHand} from '../dist/hand-history.js';
test('archive records completed hands once and never includes live hidden cards or decks',()=>{
 const g=createGame(),history=[];assert.equal(rememberHand(history,g),false);assert.deepEqual(history,[]);
 while(g.street!=='complete')act(g,legal(g).canCheck?'check':'fold');
 assert.equal(rememberHand(history,g),true);assert.equal(history[0].result.ranking.length,6);assert.equal(rememberHand(history,g),false);assert.equal(history.length,1);assert.equal(history[0].deck,undefined);
 const snapshot=JSON.stringify(history);g.players[0].name='Changed';g.players[0].hole[0]='As';assert.equal(JSON.stringify(history),snapshot);
});
