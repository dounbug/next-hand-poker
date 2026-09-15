import {evaluate} from './engine.js';
import {startingStrength} from './starting-strength.js';
const cache=new Map();
export function handStrength(hole,board){
 const key=[...hole].sort().join('')+':'+board.join('');if(cache.has(key))return cache.get(key);
 if(board.length<3)return {percentile:startingStrength(hole),rank:'Starting hand',basis:'Estimated starting-hand ranking against one random opponent. Not your chance of winning.'};
 const known=new Set([...hole,...board]),deck=[...'23456789TJQKA'].flatMap(r=>[...'shdc'].map(s=>r+s)).filter(c=>!known.has(c));
 const hand=evaluate([...hole,...board]);let below=0,ties=0,total=0;
 for(let a=0;a<deck.length;a++)for(let b=a+1;b<deck.length;b++){const score=evaluate([deck[a],deck[b],...board]).score;below+=score<hand.score;ties+=score===hand.score;total++;}
 const result={percentile:Math.round(100*(below+ties/2)/total),rank:hand.name,basis:'Current made-hand percentile versus all possible opponent card pairs on this board; ties count halfway. Does not use hidden cards or predict future cards, betting ranges, or your chance of winning.'};
 if(cache.size>100)cache.clear();cache.set(key,result);return result;
}
