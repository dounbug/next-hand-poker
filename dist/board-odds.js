const valid=c=>typeof c==='string'&&/^[2-9TJQKA][shdc]$/.test(c);
export function boardOdds(target,hole,board,draws){
 if(!valid(target)||![...hole,...board].every(valid)||board.length>5||!Number.isInteger(draws)||draws<0||draws>5-board.length)throw Error('Invalid card or remaining board count.');
 const known=new Set([...hole,...board]),unseen=52-known.size;
 const status=board.includes(target)?'board':hole.includes(target)?'hand':'unseen';
 return {probability:status==='unseen'?draws/unseen:0,unseen,draws,status};
}
export function mountBoardOdds(root){
 root.innerHTML=`<details class="board-calculator"><summary>Card odds calculator</summary><div class="odds-inputs"><label>Rank<select data-rank>${[...'AKQJT98765432'].map(r=>`<option value="${r}">${r==='T'?'10':r}</option>`).join('')}</select></label><label>Suit<select data-suit><option value="s">♠ Spades</option><option value="h">♥ Hearts</option><option value="d">♦ Diamonds</option><option value="c">♣ Clubs</option></select></label><label>Board cards ahead<select data-draws></select></label></div><p class="odds-answer" role="status" aria-live="polite"></p><small>Uses your cards and the visible board. Assumes a random deal and that the selected board cards are dealt; this is not your chance of winning.</small></details>`;
 const rank=root.querySelector('[data-rank]'),suit=root.querySelector('[data-suit]'),draw=root.querySelector('[data-draws]'),answer=root.querySelector('.odds-answer');
 let current=null,remaining=-1;
 function paint(){
  if(!current)return;
  const result=boardOdds(rank.value+suit.value,current.hole,current.board,Number(draw.value));
  answer.textContent=result.status==='board'?'Already on the board · cannot appear again.':result.status==='hand'?'In your hand · 0% chance of appearing on the board.':!remaining?'Hand finished · no board cards left.':`${(result.probability*100).toFixed(2)}% · ${result.draws} in ${result.unseen} unseen cards`;
 }
 root.addEventListener('change',paint);
 return {update({hole,board,complete}){
  current={hole,board};const next=complete?0:5-board.length;
  if(next!==remaining){remaining=next;draw.innerHTML=next?Array.from({length:next},(_,i)=>`<option value="${i+1}" ${i+1===next?'selected':''}>${i+1}${i+1===next?' · all remaining':i===0?' · next card':''}</option>`).join(''):'<option value="0">0 · finished</option>';}
  paint();
 }};
}
