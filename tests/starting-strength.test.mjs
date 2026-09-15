import {test} from 'node:test';
import assert from 'node:assert/strict';
import {startingStrength} from '../dist/starting-strength.js';
test('every legal starting deal has a bounded suit-invariant percentile',()=>{
 const ranks='23456789TJQKA',deck=[...ranks].flatMap(r=>[...'shdc'].map(s=>r+s));
 for(let a=0;a<52;a++)for(let b=a+1;b<52;b++){
  const value=startingStrength([deck[a],deck[b]]);assert.ok(Number.isInteger(value)&&value>=0&&value<=100);assert.equal(value,startingStrength([deck[b],deck[a]]));
 }
 assert.equal(startingStrength(['As','Ah']),100);
 assert.ok(startingStrength(['As','Ks'])>startingStrength(['As','Kh']));
 assert.ok(startingStrength(['2s','7h'])<20);
});
