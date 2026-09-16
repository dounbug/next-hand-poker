import {reviewBoard} from './review-board.js';
import {evaluate} from './engine.js';
export function roundResult(g){
 if(g.street!=='complete')return null;
 const {board,hypothetical}=reviewBoard(g);
 const awards=g.awards.filter(a=>!a.refund),totals=new Map();
 for(const a of awards)for(const [index,seat] of a.winners.entries())totals.set(seat,(totals.get(seat)||0)+Math.floor(a.amount/a.winners.length)+(index<a.amount%a.winners.length?1:0));
 const winners=[...totals].map(([seat,amount])=>({name:g.players[seat].name,amount}));
 const names=winners.map(w=>w.name).join(' & '),sameWinners=awards.length>0&&awards.every(a=>a.winners.length===totals.size&&a.winners.every(i=>totals.has(i)));
 const title=winners.length===1?`${names} ${names==='You'?'win':'wins'} the hand`:sameWinners?`${names} split the pot`:`Pot winners: ${names}`;
 const ranking=g.players.map((p,seat)=>{const hand=board.length>=3?evaluate([...p.hole,...board]):null;return {name:p.name,hole:p.hole,folded:!!p.folded,winner:totals.has(seat),rank:hand?.name??'No five-card hand',score:hand?.score??null,place:null};}).sort((a,b)=>(b.score??0)-(a.score??0));
 ranking.forEach((p,i)=>{if(p.score!==null)p.place=i&&p.score===ranking[i-1].score?ranking[i-1].place:i+1;});
 const note=hypothetical?'Hypothetical runout from the saved deck, including burn cards. These ranks show what each hand would make if the board ran out. The actual pot winner and payouts do not change; future cards do not prove an earlier decision right or wrong.':g.board.length===5?'Strongest cards first, including kickers. Equal hands share a rank. Folded hands are comparison only and cannot win.':g.board.length>=3?'Ranked using only the cards dealt; the hand ended before the river. Folded hands are comparison only.':'The hand ended before the flop. There are no final five-card hands to rank.';
 return {title,winners,ranking,note,board,hypothetical};
}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function winnerHTML(result){if(!result)return '';return `<div class="winner-banner" role="status"><span class="winner-mark" aria-hidden="true">♠</span><div><p>HAND RESULT</p><h2>${esc(result.title)}</h2><span>${result.winners.map(w=>`${esc(w.name)} collected ${w.amount.toLocaleString('en-US')} chips`).join(' · ')}</span></div></div>`;}
export function rankingHTML(result,card){if(!result)return '';return `<section class="ranked-hands"><h3>${result.hypothetical?'What would have happened':'Hand rankings'}</h3>${result.hypothetical?`<p class="review-note">Hypothetical board · revealed after the hand ended</p><div class="cards review-runout">${result.board.map(c=>card(c)).join('')}</div>`:''}<ol>${result.ranking.map(p=>`<li class="ranked-row ${p.winner?'ranked-winner':''}"><span class="rank-place">${p.place===null?'—':'#'+p.place}</span><div class="rank-person"><strong>${esc(p.name)}</strong><small>${p.winner?'POT WINNER':p.folded?'Folded · comparison only':'Showdown'}</small></div><div class="cards">${p.hole.map(card).join('')}</div><strong class="rank-label">${esc(p.rank)}</strong></li>`).join('')}</ol><p class="review-note">${esc(result.note)}</p></section>`;}
