import {roundResult} from './round-result.js';
export function rememberHand(history,g){
 if(!g||g.street!=='complete')return false;
 const existing=history.findIndex(h=>h.hand===g.hand),result=roundResult(g);
 if(existing>=0&&!(result.hypothetical&&history[existing].board.length<5))return false;
 const entry=structuredClone({hand:g.hand,board:result.board,result});
 if(existing>=0)history[existing]=entry;else history.push(entry);return true;
}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderHandHistory(root,history,card){
 const key=JSON.stringify(history);if(root.dataset.history===key)return;
 const open=new Set([...root.querySelectorAll('details[open]')].map(d=>d.dataset.hand));
 root.innerHTML=history.length?[...history].reverse().map(h=>`<details class="past-hand" data-hand="${h.hand}" ${open.has(String(h.hand))?'open':''}><summary><strong>Hand ${h.hand}</strong><span>${esc(h.result.title)}</span></summary>${h.result.hypothetical?'<p>Hypothetical runout · actual payouts unchanged</p>':''}<div class="history-board cards">${h.board.map(c=>card(c)).join('')}</div><ol>${h.result.ranking.map(p=>`<li><div class="past-hand-player"><strong>${p.place===null?'—':'#'+p.place} ${esc(p.name)}</strong><span>${p.winner?'Won chips':p.folded?'Folded':''}</span></div><div class="past-hand-cards"><div class="cards">${p.hole.map(c=>card(c)).join('')}</div><span>${esc(p.rank)}</span></div></li>`).join('')}</ol><p>${esc(h.result.note)}</p></details>`).join(''):'<p class="history-empty">Completed hands will appear here. Expand a hand to see every player’s cards and ranking.</p>';
 root.dataset.history=key;
}
