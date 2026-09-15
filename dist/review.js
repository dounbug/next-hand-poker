import {evaluate} from './engine.js';
import {buildStreetReview} from './street-review.js';
import {roundResult} from './round-result.js';
const stageCards={preflop:0,flop:3,turn:4,river:5};
const boardAt=(g,d)=>d.board??g.board.slice(0,stageCards[d.street]??0);
const face=r=>({T:'10',J:'Jack',Q:'Queen',K:'King',A:'Ace'}[r]||r);
function rankAt(hole,board){return board.length>=3?evaluate([...hole,...board]).name:hole[0][0]===hole[1][0]?`Pocket pair of ${face(hole[0][0])}s`:`${face([...hole].sort((a,b)=>'23456789TJQKA'.indexOf(b[0])-'23456789TJQKA'.indexOf(a[0]))[0][0])}-high starting hand`;}

function unbeatable(hole,board){
 if(board.length!==5)return false;const known=new Set([...hole,...board]);const cards=[...'23456789TJQKA'].flatMap(r=>[...'shdc'].map(s=>r+s)).filter(c=>!known.has(c));const score=evaluate([...hole,...board]).score;
 for(let i=0;i<cards.length;i++)for(let j=i+1;j<cards.length;j++)if(evaluate([cards[i],cards[j],...board]).score>score)return false;
 return true;
}
export function buildReview(g){
 if(g.street!=='complete')return null;
 const hands=g.players.map((p,i)=>{const ranked=g.board.length>=3?evaluate([...p.hole,...g.board]):null;return {name:p.name,hole:p.hole,rank:ranked?.name??rankAt(p.hole,g.board),bestFive:ranked?.cards??[],folded:p.folded,hypothetical:p.folded&&g.board.length===5,winner:g.awards.some(a=>!a.refund&&a.winners.includes(i)),net:p.stack-p.startStack};});
 const choices=g.decisions??[],hero=g.players[0];
 const freeFold=choices.find(d=>d.type==='fold'&&d.owed===0);
 const nutsFold=choices.find(d=>d.type==='fold'&&unbeatable(hero.hole,boardAt(g,d)));
 const riverCall=choices.find(d=>d.street==='river'&&d.type==='call'&&d.owed>=d.pot/2&&evaluate([...hero.hole,...boardAt(g,d)]).category<=1);
 const paid=choices.filter(d=>['call','raise'].includes(d.type)).sort((a,b)=>b.amount-a.amount)[0];
 const decision=freeFold||nutsFold||riverCall||choices.find(d=>d.type==='fold')||paid||choices.at(-1)||null;
 let cue={tone:'neutral',label:'Hand complete',title:'The blinds put you in the hand',body:'There was no voluntary decision to review. You can still compare the hands below.',next:'On the next hand, notice the dealer button and who acts first.'};
 if(decision){
 const d=decision,board=boardAt(g,d),rank=rankAt(hero.hole,board),price=d.owed&&d.callPot?Math.round(d.owed/d.callPot*100):null;
 if(freeFold)cue={tone:'review',label:'Review spot',title:'A check was free',body:`On the ${d.street}, you folded with nothing to call. A check would have kept you in the hand without adding chips.`,next:'Before folding, check whether the free-check button is available.'};
 else if(nutsFold)cue={tone:'review',label:'Review spot',title:'Your hand could not be beaten',body:'On the river, no possible opponent hand could beat your best five cards. Folding gave up a pot you could at least share.',next:'When the board is complete, identify your best five cards before deciding.'};
 else if(riverCall)cue={tone:'review',label:'Worth a second look',title:'A big river call with a modest hand',body:`You called ${d.owed} with ${rank}. ${price===null?"This older hand did not save enough information to calculate your exact call price.":`That call cost ${price}% of the chips you could contest after calling.`} The final result alone cannot tell us whether this call was good.`,next:'Before a big river call, name hands you beat that could bet this way, as well as hands that beat you.'};
 else if(d.type==='check')cue={tone:'good',label:'Good habit',title:'You kept your options open for free',body:`You checked on the ${d.street} when there was no bet to match. That kept you in the hand without adding chips. It does not mean checking was the only good choice.`,next:'When checking, notice whether you want a free card or are hoping someone else bets.'};
 else if(d.type==='call')cue={tone:'neutral',label:'Decision to revisit',title:'Know the price of staying in',body:`On the ${d.street}, you called ${d.owed} into a pot of ${d.pot}. ${price===null?"This older hand did not save enough information to calculate your exact call price.":`That call cost ${price}% of the chips you could contest after calling.`} ${board.length>=3?`Your made hand was ${rank}.`:'Only your two private cards were available.'}`,next:'Compare that price with the hands your opponent could hold. Later bets and possible improvement also matter before the river.'};
 else if(d.type==='raise')cue={tone:'neutral',label:'Decision to revisit',title:'Give your raise a purpose',body:`On the ${d.street}, you ${d.currentBet===0?'bet':'raised to'} ${d.amount}. ${board.length>=3?`Your made hand at that moment was ${rank}.`:'The shared cards had not been dealt yet.'}`,next:'Before raising, decide whether you want weaker hands to call or stronger hands to fold.'};
 else cue={tone:'neutral',label:'Decision to revisit',title:'Judge the fold using what you knew',body:`You folded on the ${d.street} facing ${d.owed} more into a pot of ${d.pot}. Seeing an opponent’s cards afterward does not prove the fold was right or wrong.`,next:'Remember their bet size and previous actions. Treat aggression as information, not proof of a strong hand.'};
 }
 let opponent=null;
 if(decision){
 let end=decision.logIndex;
 if(!Number.isInteger(end)){const heroEvents=g.log.map((text,i)=>({text,i})).filter(x=>/^You: (Fold|Check|Call |Raise to |Bet )/.test(x.text));end=heroEvents[choices.indexOf(decision)]?.i??g.log.length;}
 const before=g.log.slice(0,end);let start=0;for(let i=0;i<before.length;i++)if(/^(Flop|Turn|River) dealt\.$/.test(before[i]))start=i+1;
 for(let i=before.length-1;i>=start;i--){const match=before[i].match(/^([^:]+): ((?:Bet |Raise to ).*)$/);if(!match||match[1]===hero.name)continue;const p=g.players.find(p=>p.name===match[1]);if(p){const board=boardAt(g,decision);opponent={name:p.name,action:match[2],rank:rankAt(p.hole,board),street:decision.street,hole:p.hole,board};break;}}
 }
 const winners=hands.filter(h=>h.winner), heroRank=hands[0].rank;
 let comparison={title:hero.folded?'Your folded hand vs. the winner':'Your hand vs. the winner',body:`You: ${heroRank}. ${winners.map(h=>`${h.name}: ${h.rank}`).join('. ')}.`,result:'',note:''};
 if(g.board.length>=3&&winners.length){
 const yours=evaluate([...hero.hole,...g.board]).score;
 const theirs=Math.max(...g.players.filter((p,i)=>hands[i].winner).map(p=>evaluate([...p.hole,...g.board]).score));
 comparison.result=hands[0].winner?'Your hand won a pot':yours>theirs?'Your hand was stronger':yours<theirs?'Your hand was weaker':'Your hand tied the strongest winner';
 comparison.note=g.board.length===5?(hero.folded?'This compares your folded cards with the actual winners on the final board. Staying in could have changed the betting and outcome.':'This comparison uses the completed board; side pots can have different winners.'):'The hand ended before the river. This compares only the cards dealt; later cards could have changed the result.';
 }else{comparison.result='The hand ended before the flop';comparison.note='These are starting hands, not final five-card ranks. No shared cards were dealt, so we cannot say which hand would have won.';}
 if(hero.folded)comparison.note+=' A weaker revealed hand does not by itself prove the fold was right; judge the price and information you had.';
 const checks=choices.filter(d=>d.type==='check'&&d.owed===0);
 const wentWell=checks.length?`You checked for free on the ${[...new Set(checks.map(d=>d.street))].join(' and ')} and kept your options open without paying. This does not rule out a useful bet.`:'No clear positive decision identified from this hand alone. Winning chips is not enough to grade the play.';
 const overall=!choices.length?'No voluntary decisions to assess this hand.':cue.tone==='review'?'There is a specific decision worth revisiting below.':`You made ${choices.length} decision${choices.length===1?'':'s'}. ${hero.folded?'You chose to fold before the hand ended.':'You stayed in through the end.'} The cards and result alone cannot grade the whole hand.`;
 return {hands,decision,cue,opponent,comparison,wentWell,overall,streets:buildStreetReview(g),result:roundResult(g),finalBoard:g.board.length===5};
}
