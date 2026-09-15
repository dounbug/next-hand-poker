import {evaluate} from './engine.js';
import {startingStrength} from './starting-strength.js';
// Explicit projection: the advisor never receives opponents' cards or the deck.
export function adviceInput(g,seat,legal){return {hole:[...g.players[seat].hole],board:[...g.board],street:g.street,seat,dealer:g.dealer,currentBet:g.currentBet,legal:{...legal},players:g.players.map(p=>({stack:p.stack,bet:p.bet,total:p.total,folded:p.folded}))};}
export function estimateAdvice(s,trials=500){
 const known=new Set([...s.hole,...s.board]);
 if(known.size!==s.hole.length+s.board.length||s.hole.length!==2)throw Error('Invalid known cards');
 const deck=[...'23456789TJQKA'].flatMap(r=>[...'shdc'].map(suit=>r+suit)).filter(c=>!known.has(c));
 const active=s.players.map((p,i)=>!p.folded?i:-1).filter(i=>i>=0),hero=s.players[s.seat],l=s.legal;
 // Model the pot after our call, with existing opponent contributions only.
 const totals=s.players.map((p,i)=>p.total+(i===s.seat?l.call:0)),cap=totals[s.seat];
 const levels=[...new Set(totals.map(t=>Math.min(t,cap)).filter(t=>t>0))].sort((a,b)=>a-b);
 let previous=0;const layers=levels.map(level=>{const amount=(level-previous)*totals.filter(t=>t>=level).length;previous=level;return {amount,eligible:active.filter(i=>totals[i]>=level)};});
 const pot=layers.reduce((v,p)=>v+p.amount,0);
 let seed=2166136261;for(const c of JSON.stringify(s))seed=Math.imul(seed^c.charCodeAt(0),16777619)>>>0;
 const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)/4294967296;};
 let share=0;
 for(let t=0;t<trials;t++){
  const cards=[...deck];let used=0;
  const take=()=>{const j=used+Math.floor(random()*(cards.length-used));[cards[used],cards[j]]=[cards[j],cards[used]];return cards[used++];};
  const board=[...s.board];while(board.length<5)board.push(take());
  const scores=new Map(active.map(i=>[i,evaluate([...(i===s.seat?s.hole:[take(),take()]),...board]).score]));
  for(const layer of layers){if(!layer.eligible.includes(s.seat))continue;const best=Math.max(...layer.eligible.map(i=>scores.get(i))),winners=layer.eligible.filter(i=>scores.get(i)===best);if(winners.includes(s.seat))share+=layer.amount/winners.length;}
 }
 const equity=pot?share/trials/pot:0,price=l.call&&pot?l.call/pot:0;
 const position=(s.seat-s.dealer+6)%6,late=position===0||position===5;
 const premium=s.street==='preflop'&&startingStrength(s.hole)>=(late?90:95);
 let action=l.canCheck?'Check':'Fold',amount=null,reason=l.canCheck?'Keep the free option to improve without growing the pot.':'The estimated pot share does not clear the call price with a margin for uncertainty.';
 if(!l.canCheck&&equity>price+.06){action='Call';reason='The estimated pot share clears the call price in this random-hand model. Strong betting ranges could still make folding better.';}
 const raiseCandidate=(s.street==='preflop'?premium&&s.currentBet<=20:equity>.7&&l.canCheck);
 if(l.canRaise&&raiseCandidate){
  const livePot=s.players.reduce((n,p)=>n+p.total,0);
  const target=Math.min(l.max,Math.max(l.min,Math.round(s.street==='preflop'?50+20*s.players.filter((p,i)=>i!==s.seat&&p.bet===20).length:s.currentBet+livePot*.5)));
  if(target-hero.bet<=hero.stack*.35){action=s.currentBet?'Raise':'Bet';amount=target;reason=s.street==='preflop'?'A strong starting hand supports a modest value raise. Reassess if another player raises.':'A strong estimated share supports a small value bet. This assumes random opposing hands; it does not prove worse hands will call.';}
 }
 return {action,amount,reason,equity,price,trials,opponents:active.length-1,call:l.call};
}
const pct=x=>(100*x).toFixed(0)+'%';
export function adviceHTML(a){return `<strong>${a.action}${a.amount!==null?' to '+a.amount.toLocaleString('en-US'):a.action==='Call'?' '+a.call.toLocaleString('en-US'):''}</strong><p>${a.reason}</p><p class="advice-metrics">Estimated pot share ≈ ${pct(a.equity)}${a.call?' · Call price '+pct(a.price):' · Checking is free'}</p><small>Estimate, not GTO · ${a.trials} simulated runouts against ${a.opponents} random hand${a.opponents===1?'':'s'}. Uses only your cards, the board and public chips. Assumes a showdown with no further bets; opponents’ actual ranges may be stronger.</small>`;}
