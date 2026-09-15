// Reproducible estimates against one uniformly random opponent, with a random board.
import {evaluate} from '../dist/engine.js';
import {writeFileSync} from 'node:fs';
const ranks='23456789TJQKA', suits='shdc', full=[...ranks].flatMap(r=>[...suits].map(s=>r+s));
let seed=729184;const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)/4294967296;};
const entries=[],samples=3000;
for(let hi=12;hi>=0;hi--)for(let lo=hi;lo>=0;lo--)for(const suited of hi===lo?[false]:[true,false]){
 const hole=[ranks[hi]+'s',ranks[lo]+(suited?'s':'h')],deck=full.filter(c=>!hole.includes(c));let wins=0;
 for(let t=0;t<samples;t++){
  const chosen=new Set();while(chosen.size<7)chosen.add(Math.floor(random()*50));
  const cards=[...chosen].map(i=>deck[i]),board=cards.slice(2),a=evaluate([...hole,...board]).score,b=evaluate([...cards.slice(0,2),...board]).score;
  wins+=a>b?1:a===b?.5:0;
 }
 entries.push({key:ranks[hi]+ranks[lo]+(hi===lo?'':suited?'s':'o'),weight:hi===lo?6:suited?4:12,equity:wins/samples});
}
entries.sort((a,b)=>a.equity-b.equity);let below=0;const table={};
for(const e of entries){table[e.key]=Math.round((below+e.weight/2)/1326*100);below+=e.weight;}
writeFileSync('dist/starting-strength.js',`// Estimated percentile by heads-up all-in equity; 3,000 seeded boards per class.\nconst table=${JSON.stringify(table)};\nexport function startingStrength(hole){const r='23456789TJQKA',h=[...hole].sort((a,b)=>r.indexOf(b[0])-r.indexOf(a[0]));return table[h[0][0]+h[1][0]+(h[0][0]===h[1][0]?'':h[0][1]===h[1][1]?'s':'o')];}\n`);
console.log('Generated 169 starting-hand classes, weighted across 1,326 deals.');
