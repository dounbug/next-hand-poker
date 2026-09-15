import test from 'node:test';
import assert from 'node:assert/strict';
import {boardOdds} from '../dist/board-odds.js';
test('exact card odds use only own cards and visible board',()=>{
 assert.equal(boardOdds('As',['Kh','Kd'],[],5).probability,5/50);
 assert.equal(boardOdds('As',['Kh','Kd'],['2c','3d','4h'],2).probability,2/47);
 assert.equal(boardOdds('As',['Kh','Kd'],['2c','3d','4h','8s'],1).probability,1/46);
});
test('known cards cannot appear again and completed hands have no future draws',()=>{
 assert.equal(boardOdds('Kh',['Kh','Kd'],[],5).probability,0);
 assert.equal(boardOdds('As',['Kh','Kd'],['As','3d','4h'],2).status,'board');
 assert.equal(boardOdds('As',['Kh','Kd'],[],0).probability,0);
});
test('rejects invalid cards and impossible draw counts',()=>{
 assert.throws(()=>boardOdds('xx',['Kh','Kd'],[],1));
 assert.throws(()=>boardOdds('As',['Kh','Kd'],['2c','3d','4h'],3));
});
