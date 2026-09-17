import {mountStrengthOverlay} from './strength-overlay.js';
import {createTurnPanel} from './turn-panel.js';
import {currentHandHTML} from './current-hand.js';
import {mountModernUI} from './modern-ui.js';
import {botStyleHTML,mountBotProfiles} from './bot-profile-view.js';
import {rememberHand,renderHandHistory} from './hand-history.js';
import {createLiveAdvisor} from './live-advice-view.js';
import {mountBoardOdds} from './board-odds.js';
import {createGame,act,legal,botAction,evaluate} from './engine.js';
import {buildReview} from './review.js';
import {handStrength} from './hand-strength.js';
import {mountAudio} from './audio.js';
import {streetReviewHTML} from './street-review-view.js';
import {winnerHTML,rankingHTML} from './round-result.js';
import {actionControlsHTML,toggleBetPanel,updateBetPanel} from './bet-sizing.js';
const $=s=>document.querySelector(s),KEY='next-hand-practice-v1';
const audio=mountAudio($('#audio-controls'));
const boardCalculator=mountBoardOdds($('#board-odds'));
const liveAdvisor=createLiveAdvisor();
const turnPanel=createTurnPanel();
mountBotProfiles();
mountModernUI();
const suits={s:'♠',h:'♥',d:'♦',c:'♣'},suitNames={s:'spades',h:'hearts',d:'diamonds',c:'clubs'},rankNames={T:'10',J:'Jack',Q:'Queen',K:'King',A:'Ace'};
let strengthRevealed=false,strengthHand=null;
let pastHands=[];
let game,paused=false,guided=true,timer=null,storageOk=true,error='',restored=false;
try{const saved=JSON.parse(localStorage.getItem(KEY));if(saved?.game?.version===1&&saved.game.players?.length===6&&saved.game.deck){game=saved.game;pastHands=Array.isArray(saved.pastHands)?saved.pastHands:[];guided=saved.guided!==false;paused=true;restored=true;}}catch{storageOk=false;}
if(!game)game=createGame();
function save(){try{localStorage.setItem(KEY,JSON.stringify({game,paused,guided,pastHands}));storageOk=true;}catch{storageOk=false;}$('#save-status').textContent=storageOk?'Saved on this device':'Saving unavailable';}
function card(c,back=false){if(back)return '<span class="card back" aria-label="Face-down card"></span>';if(!c)return '<span class="card empty" aria-hidden="true">·</span>';return `<span class="card ${'hd'.includes(c[1])?'red':''}" aria-label="${rankNames[c[0]]||c[0]} of ${suitNames[c[1]]}"><span>${c[0]==='T'?'10':c[0]}</span><span class="suit">${suits[c[1]]}</span></span>`;}
const n=x=>x.toLocaleString('en-US');
const streetName=()=>game.street[0].toUpperCase()+game.street.slice(1);
function renderStrength(){
 const box=$('#starting-strength');const key=game.hand+':'+game.players[0].hole.join('');if(strengthHand!==key){strengthRevealed=false;strengthHand=key;}
 box.hidden=!strengthRevealed;if(!strengthRevealed)return;
 const strength=handStrength(game.players[0].hole,game.board),p=strength.percentile;
 box.innerHTML=`<div id="strength-answer"><strong>${strength.rank} · about the ${p}${p%100>=11&&p%100<=13?'th':p%10===1?'st':p%10===2?'nd':p%10===3?'rd':'th'} percentile</strong><p>${game.board.length<3?'Starting-hand strength':'Strength on the current board'}${game.players[0].folded?' · your folded cards':''}</p><small>${strength.basis}</small></div>`;
}
mountStrengthOverlay($('#starting-strength'),()=>{strengthRevealed=false;});
$('#table').addEventListener('click',e=>{const button=e.target.closest('[data-hand-info]');if(button){strengthRevealed=!strengthRevealed;renderStrength();button.setAttribute('aria-expanded',String(strengthRevealed));}});
function render(){
 boardCalculator.update({hole:game.players[0].hole,board:game.board,complete:game.street==='complete'});
 renderStrength();
 clearTimeout(timer);timer=null;const done=game.street==='complete',l=legal(game),hero=game.players[0];
 audio.update({room:'solo',hand:game.hand,street:game.street,actor:game.actor,seat:0,paused,actionCount:game.log.length});
 document.title=!paused&&!done&&game.actor===0?'Your turn · Next Hand':'Next Hand · Macau After Hours';
 $('#hand-number').textContent=`Hand ${game.hand}`;$('#street-label').textContent=done?'Hand complete':streetName();$('#guide').checked=guided;$('#pause').textContent=paused?'Resume':'Pause';
 $('#table').innerHTML=game.players.map((p,i)=>{
 const show=i===0||done;
 const badge=`${i===game.dealer?'<span class="badge" title="Dealer button">D</span>':''}${i===game.smallBlind?'<span class="badge blind" title="Small blind">SB</span>':''}${i===game.bigBlind?'<span class="badge blind" title="Big blind">BB</span>':''}`;
 return `<div class="seat seat-${i} ${p.folded?'folded':''} ${game.actor===i&&!paused?'active':''}" aria-label="${p.name}, ${p.style}, ${p.stack} chips${p.folded?', folded':''}"><div class="cards">${p.hole.map(c=>card(c,!show)).join('')}${i===0?`<button class="hand-info" data-hand-info aria-label="Show hand strength information" aria-expanded="${strengthRevealed}" aria-controls="starting-strength">i</button>`:''}</div><div class="seat-info"><div class="seat-name">${p.name}${badge}</div><div class="seat-style">${i===0?`${Math.round(p.stack/20*10)/10} big blinds`:botStyleHTML(i)}</div><div class="stack">${n(p.stack)}</div></div><div class="seat-action">${p.lastAction||' '}</div></div>`;
 }).join('')+`<div class="board"><div class="pot-label">${done?'Pot awarded':'Total pot'}</div><div class="pot-value">${n(done?game.pot:game.players.reduce((a,p)=>a+p.total,0))}</div><div class="cards">${Array.from({length:5},(_,i)=>card(game.board[i])).join('')}</div><p class="board-caption">${done?'Every hand is another repetition.':game.board.length?'Shared cards · make your best five':'Your two cards are private'}</p></div>`;
 rememberHand(pastHands,game);renderHandHistory($('#past-hands'),pastHands,c=>card(c));
 turnPanel.capture($('#decision'),game.hand);
 if(paused){$('#decision').innerHTML=`<div class="paused"><h2>${restored?'Welcome back.':'Take your time.'}</h2><p>${storageOk?'Your exact hand is saved here. Resume whenever you are ready.':'This hand is paused. Browser storage is unavailable, so closing this page may lose it.'}</p><button class="primary" data-action="resume">Resume hand</button></div>`;}
 else if(done){
 const change=hero.stack-hero.startStack,review=buildReview(game),winning=game.awards.filter(a=>!a.refund);
 $('#decision').innerHTML=`${winnerHTML(review.result)}<div class="next-hand-actions"><button class="primary" data-action="next">Deal next hand <span aria-hidden="true">→</span></button></div>${rankingHTML(review.result,card)}<div class="review compact-review"><div class="review-heading"><h2>Hand review</h2><span class="review-net ${change>=0?'positive':''}">${change>=0?'+':''}${n(change)}</span></div><p><strong>${review.comparison.result}</strong> · You: ${review.hands[0].rank}</p><p>${review.overall}</p><div class="review-sections"><section><h3>What went well</h3><p>${review.wentWell}</p></section><section><h3>Decisions to revisit</h3><p><strong>${review.cue.tone==='good'?'Next question':review.cue.title}</strong></p><p>${review.cue.tone==='good'?review.cue.next:review.cue.body}</p>${review.cue.tone==='good'?'':`<p>${review.cue.next}</p>`}</section></div>${review.opponent?`<p class="opponent-cue">${review.opponent.name}: ${review.opponent.action} on the ${review.opponent.street}, holding ${review.opponent.rank}. These cards were hidden when you acted.</p>`:''}${streetReviewHTML(review.streets,card)}<p class="review-note">Player rows show the revealed hands. Style describes behavior, not a good/bad grade; a strong final hand alone does not prove good play.</p></div>`;
 }else if(game.actor!==0){$('#decision').innerHTML=turnPanel.waiting(hero.hole,game.board);timer=setTimeout(takeBot,850);}
 else{
 const pot=game.players.reduce((a,p)=>a+p.total,0);const odds=l.call?Math.round(100*l.call/l.callPot):0;
 $('#decision').innerHTML=`<div class="turn-summary"><h2>Your move</h2><p>Pot: <strong>${n(pot)}</strong> · Stack: <strong>${n(hero.stack)}</strong> · ${l.canCheck?'Check for free':`Call <strong>${n(l.call)}</strong> more`}</p></div>${currentHandHTML(hero.hole,game.board)}${actionControlsHTML(l,pot,game.currentBet,hero)}${error?`<p class="error" role="alert">${error}</p>`:''}`;

 }
 liveAdvisor($('#decision'),game,0,l,!paused&&!done&&game.actor===0);
 turnPanel.update($('#decision'),game,0,paused);
 save();$('#announcement').textContent=paused?'Practice paused.':done?'Hand complete. Review available.':game.actor===0?`Your turn. ${l.canCheck?'You can check.':`Call ${l.call} to stay in.`}`:`${game.players[game.actor].name} to act.`;
}
function takeBot(){if(paused||game.street==='complete'||game.actor===0)return;const b=botAction(game);act(game,b.type,b.amount);render();}
$('#decision').addEventListener('click',e=>{
 if(toggleBetPanel($('#decision'),e.target))return;
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.betSize){$('#raise-amount').value=b.dataset.betSize;updateRaise();return;}
 const action=b.dataset.action;error='';clearTimeout(timer);
 if(action==='resume'){paused=false;restored=false;}
 else if(action==='next')game=createGame(game);
 else if(action==='step'){takeBot();return;}
 else{try{act(game,action,action==='raise'?Number($('#raise-amount').value):undefined);}catch(err){error=err.message;}}
 render();
});
function updateRaise(source){const pot=game.players.reduce((s,p)=>s+p.total,0);updateBetPanel($('#decision'),legal(game),pot,game.currentBet,game.players[0],source);}
$('#decision').addEventListener('input',e=>{if(['raise-amount','raise-slider'].includes(e.target.id))updateRaise(e.target);});
$('#pause').addEventListener('click',()=>{paused=!paused;restored=false;render();});
$('#guide').addEventListener('change',e=>{guided=e.target.checked;render();});
$('#help').addEventListener('click',()=>{$('#help-dialog').showModal();});
$('#close-help').addEventListener('click',()=>{$('#help-dialog').close();});
$('#reset').addEventListener('click',()=>{paused=true;render();$('#reset-dialog').showModal();});
$('#cancel-reset').addEventListener('click',()=>{$('#reset-dialog').close();paused=false;render();});
$('#confirm-reset').addEventListener('click',()=>{$('#reset-dialog').close();game=createGame();pastHands=[];paused=false;restored=false;render();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&!paused){paused=true;render();}});
window.addEventListener('pagehide',save);
render();
// Optional imperative browser tools expose only the information visible at the table.
const context=document.modelContext;
if(context?.registerTool){
 const lifecycle=new AbortController();
 const visibleState=()=>({hand:game.hand,street:game.street,paused,actor:game.actor===null?null:game.players[game.actor].name,board:game.board,heroCards:game.players[0].hole,heroStack:game.players[0].stack,pot:game.street==='complete'?game.pot:game.players.reduce((a,p)=>a+p.total,0),legal:game.actor===0&&!paused?legal(game):null});
 const specs=[{name:'read_practice_table',title:'Read practice table',description:'Read the visible hand, your cards and legal options. Opponent private cards are never returned.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>visibleState()},
 {name:'play_practice_action',title:'Play a practice action',description:'Take your turn at the practice table. Raise amounts are total chips for this betting round. Works only while unpaused and on your turn.',inputSchema:{type:'object',properties:{action:{type:'string',enum:['fold','check','call','raise']},amount:{type:'integer',minimum:1}},required:['action'],additionalProperties:false},annotations:{readOnlyHint:false},execute:input=>{if(paused||game.actor!==0)throw Error('Resume and wait for your turn.');if(!input||typeof input!=='object'||Object.keys(input).some(k=>!['action','amount'].includes(k)))throw Error('Invalid action input.');act(game,input.action,input.amount);error='';render();return visibleState();}}];
 for(const spec of specs){try{Promise.resolve(context.registerTool(spec,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
 window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
