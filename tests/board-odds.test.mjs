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
test('any suit defaults to at least one of the remaining rank, without replacement',()=>{
 const a=boardOdds('A',['Kh','Kd'],[],5);assert.equal(a.matches,4);let miss=1;for(let i=0;i<5;i++)miss*=(46-i)/(50-i);assert.ok(Math.abs(a.probability-(1-miss))<1e-12);
 const b=boardOdds('A',['Ah','Kd'],['Ac','3d','4h'],2);assert.equal(b.matches,2);assert.ok(Math.abs(b.probability-(1-45*44/(47*46)))<1e-12);
 assert.equal(boardOdds('A',['Ah','Ad'],['Ac','As','4h'],2).probability,0);
});
