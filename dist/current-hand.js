import {evaluate} from './engine.js';
const ranks='23456789TJQKA';
const names=['Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Jack','Queen','King','Ace'];
const name=r=>names[r-2],plural=r=>name(r)+(r===6?'es':'s');
export function currentHand(hole,board){
 if(hole.length!==2||hole.some(c=>!c))return null;
 if(board.length<3){const pair=hole[0][0]===hole[1][0];return {name:pair?'Pocket pair':'Starting hand',detail:pair?plural(ranks.indexOf(hole[0][0])+2):hole.map(c=>name(ranks.indexOf(c[0])+2)).join(' · ')+(hole[0][1]===hole[1][1]?' · suited':''),cards:hole,boardPlays:false};}
 const h=evaluate([...hole,...board]);
 const first=Math.floor(h.score/15**4)%15,second=Math.floor(h.score/15**3)%15;
 const detail=h.category===6?`${plural(first)} full of ${plural(second)}`:h.category===2?`${plural(first)} and ${plural(second)}`:[1,3,7].includes(h.category)?plural(first):`${name(first)}-high`;
 return {name:h.name,detail,cards:h.cards,boardPlays:board.length===5&&evaluate(board).score===h.score};
}
export function currentHandHTML(hole,board){const h=currentHand(hole,board);if(!h)return '';const suits={s:'♠',h:'♥',d:'♦',c:'♣'};return `<details class="hand-hint"><summary>Your hand now <span>Reveal hint</span></summary><section class="current-hand" aria-label="Your current hand"><div><span class="current-hand-label">YOUR HAND NOW</span>${h.name==='Starting hand'?'':`<strong>${h.name}</strong>`}<span>${h.detail}${h.boardPlays?' · Board plays':''}</span></div><div class="made-hand-cards" aria-label="${board.length>=3?'Best five cards':'Your cards'}">${h.cards.map(c=>`<span class="made-card ${'hd'.includes(c[1])?'red':''}">${c[0]==='T'?'10':c[0]}${suits[c[1]]}</span>`).join('')}</div></section></details>`;}
