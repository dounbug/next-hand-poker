import {botProfile} from './bot-profiles.js';
import {botObservation,chooseBot} from './bot-policy.js';
const RANKS='23456789TJQKA';
export const HAND_NAMES=['High card','One pair','Two pair','Three of a kind','Straight','Flush','Full house','Four of a kind','Straight flush'];
function five(cards){
 const ranks=cards.map(c=>RANKS.indexOf(c[0])+2).sort((a,b)=>b-a);
 const counts=new Map();ranks.forEach(r=>counts.set(r,(counts.get(r)||0)+1));
 const groups=[...counts].sort((a,b)=>b[1]-a[1]||b[0]-a[0]);
 const unique=[...new Set(ranks)];if(unique[0]===14)unique.push(1);
 let straight=0;for(let i=0;i<=unique.length-5;i++)if(unique[i]-unique[i+4]===4){straight=unique[i];break;}
 const flush=cards.every(c=>c[1]===cards[0][1]);let category=0,tie=ranks;
 if(flush&&straight){category=8;tie=[straight];}
 else if(groups[0][1]===4){category=7;tie=groups.map(x=>x[0]);}
 else if(groups[0][1]===3&&groups[1][1]===2){category=6;tie=groups.map(x=>x[0]);}
 else if(flush){category=5;}
 else if(straight){category=4;tie=[straight];}
 else if(groups[0][1]===3){category=3;tie=groups.map(x=>x[0]);}
 else if(groups[0][1]===2&&groups[1][1]===2){category=2;tie=groups.map(x=>x[0]);}
 else if(groups[0][1]===2){category=1;tie=groups.map(x=>x[0]);}
 let score=category;for(let i=0;i<5;i++)score=score*15+(tie[i]||0);
 return {score,category,name:HAND_NAMES[category],cards};
}
export function evaluate(cards){
 if(cards.length<5||cards.length>7)throw Error('Need five to seven cards');
 let best={score:-1};
 for(let a=0;a<cards.length-4;a++)for(let b=a+1;b<cards.length-3;b++)for(let c=b+1;c<cards.length-2;c++)for(let d=c+1;d<cards.length-1;d++)for(let e=d+1;e<cards.length;e++){
 const hand=five([cards[a],cards[b],cards[c],cards[d],cards[e]]);if(hand.score>best.score)best=hand;
 }return best;
}
const PROFILES=[['You','Learning'],['Maya','Tight · patient'],['Leo','Loose · curious'],['Nina','Tight · aggressive'],['Omar','Loose · aggressive'],['Alex','Balanced']];
const next=(i)=>(i+1)%6;
export function createGame(previous){
 const players=PROFILES.map(([name,style],i)=>({name,style:i?botProfile(i).label:style,stack:previous?.players[i].stack||2000,hole:[],bet:0,total:0,folded:false,actedAt:null,lastAction:'',startStack:previous?.players[i].stack||2000}));
 const deck=[...RANKS].flatMap(r=>[...'shdc'].map(s=>r+s));
 for(let i=deck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
 const g={version:1,hand:(previous?.hand||0)+1,dealer:previous?next(previous.dealer):3,players,deck,board:[],street:'preflop',currentBet:20,minRaise:20,actor:0,log:[],awards:[],decisions:[],refilled:previous?players.filter((p,i)=>previous.players[i].stack===0).map(p=>p.name):[]};
 for(let round=0;round<2;round++)for(let offset=1;offset<=6;offset++)players[(g.dealer+offset)%6].hole.push(deck.pop());
 g.smallBlind=next(g.dealer);g.bigBlind=next(g.smallBlind);
 pay(g,g.smallBlind,10);pay(g,g.bigBlind,20);
 players[g.smallBlind].lastAction='Small blind';players[g.bigBlind].lastAction='Big blind';
 g.log.push('Blinds posted: 10 / 20.');g.actor=next(g.bigBlind);progress(g,g.bigBlind);return g;
}
function pay(g,i,amount){const p=g.players[i];const paid=Math.min(amount,p.stack);p.stack-=paid;p.bet+=paid;p.total+=paid;return paid;}
export function legal(g){
 if(g.street==='complete'||g.actor==null)return {call:0,canCheck:false,canRaise:false};
 const p=g.players[g.actor],owed=Math.max(0,g.currentBet-p.bet),max=p.bet+p.stack;
 const reopened=p.actedAt===null||g.currentBet-p.actedAt>=g.minRaise;
 const call=Math.min(owed,p.stack),cap=p.total+call;
 const callPot=g.players.reduce((sum,q)=>sum+Math.min(q.total+(q===p?call:0),cap),0);
 return {call,callPot,owed,canCheck:owed===0,canRaise:max>g.currentBet&&reopened&&g.players.some((q,i)=>i!==g.actor&&!q.folded&&q.stack>0),min:Math.min(max,g.currentBet+g.minRaise),max};
}
export function act(g,type,amount){
 if(g.street==='complete')throw Error('This hand is complete.');
 const options=legal(g),i=g.actor,p=g.players[i];let label;
 if(type==='check'&&!options.canCheck)throw Error('You must call or fold when facing a bet.');
 if(type==='call'&&options.canCheck)throw Error('No bet to call. Check instead.');
 if(type==='raise'&&(!options.canRaise||!Number.isInteger(amount)||amount<options.min||amount>options.max))throw Error('Choose a legal raise amount.');
 if(!['fold','check','call','raise'].includes(type))throw Error('Unknown action.');
 if(i===0)g.decisions.push({position:['Button','Small blind','Big blind','Under the gun','Hijack','Cutoff'][(i-g.dealer+6)%6],street:g.street,type,amount:type==='raise'?amount:type==='call'?options.call:0,pot:g.players.reduce((a,q)=>a+q.total,0),owed:options.call,callPot:options.callPot,board:[...g.board],logIndex:g.log.length,stack:p.stack,currentBet:g.currentBet,alreadyBet:p.bet});
 if(type==='fold'){p.folded=true;label='Fold';}
 if(type==='check')label='Check';
 if(type==='call'){pay(g,i,options.call);label=`Call ${options.call}`;}
 if(type==='raise'){
 const increase=amount-g.currentBet;pay(g,i,amount-p.bet);label=`${g.currentBet===0?'Bet':'Raise to'} ${amount}`;
 if(increase>=g.minRaise)g.minRaise=increase;g.currentBet=amount;
 }
 p.actedAt=g.currentBet;if(p.stack===0&&!p.folded)label+=' · all-in';p.lastAction=label;
 g.log.push(`${p.name}: ${label}.`);progress(g,i);return g;
}
function needs(g,p){return !p.folded&&p.stack>0&&(p.actedAt===null||p.bet<g.currentBet);}
function progress(g,after){
 const alive=g.players.filter(p=>!p.folded);
 if(alive.length===1){settle(g);return;}
 const active=alive.filter(p=>p.stack>0);
 // The nominal big blind is a bring-in only while multiple players can still bet.
 // A lone funded player only needs to match actual opposing chips.
 if(active.length===1)g.currentBet=Math.max(...alive.filter(p=>p!==active[0]).map(p=>p.bet));
 // A lone player with chips still must answer an outstanding bet, but cannot bet into a dry side pot.
 if(active.length<=1&&(!active.length||active[0].bet>=g.currentBet)){
 while(g.board.length<5){g.deck.pop();const count=g.board.length===0?3:1;for(let j=0;j<count;j++)g.board.push(g.deck.pop());}
 g.log.push('All-in: the remaining board is dealt.');settle(g);return;
 }
 for(let offset=1;offset<=6;offset++){const i=(after+offset)%6;if(needs(g,g.players[i])){g.actor=i;return;}}
 if(g.street==='river'){settle(g);return;}
 g.street={preflop:'flop',flop:'turn',turn:'river'}[g.street];g.currentBet=0;g.minRaise=20;
 g.players.forEach(p=>{p.bet=0;p.actedAt=null;if(!p.folded)p.lastAction=p.stack===0?'All-in':'';});
 g.deck.pop();for(let j=0;j<(g.street==='flop'?3:1);j++)g.board.push(g.deck.pop());g.log.push(`${g.street[0].toUpperCase()+g.street.slice(1)} dealt.`);
 progress(g,g.dealer);
}
export function settle(g){
 const alive=g.players.filter(p=>!p.folded);g.awards=[];
 if(alive.length===1){const winner=alive[0];const amount=g.players.reduce((a,p)=>a+p.total,0);winner.stack+=amount;g.awards.push({amount,winners:[g.players.indexOf(winner)],name:'Everyone else folded'});}
 else{
 const levels=[...new Set(g.players.map(p=>p.total).filter(Boolean))].sort((a,b)=>a-b);let previous=0;
 for(const level of levels){const contributors=g.players.map((p,i)=>({p,i})).filter(({p})=>p.total>=level);const amount=(level-previous)*contributors.length;previous=level;
 if(contributors.length===1){const {p,i}=contributors[0];p.stack+=amount;g.awards.push({amount,winners:[i],name:'Uncalled chips returned',refund:true});continue;}
 const eligible=contributors.filter(({p})=>!p.folded).map(({p,i})=>({i,...evaluate([...p.hole,...g.board])}));
 const high=Math.max(...eligible.map(p=>p.score));const winners=eligible.filter(p=>p.score===high).sort((a,b)=>((a.i-g.dealer+5)%6)-((b.i-g.dealer+5)%6));
 if(!winners.length)throw Error('Pot has no eligible winner');
 winners.forEach((p,index)=>{g.players[p.i].stack+=Math.floor(amount/winners.length)+(index<amount%winners.length?1:0);});
 g.awards.push({amount,winners:winners.map(p=>p.i),name:winners[0].name});
 }
 }
 g.pot=g.players.reduce((a,p)=>a+p.total,0);g.street='complete';g.actor=null;
 for(const award of g.awards)g.log.push(`${award.winners.map(i=>g.players[i].name).join(' & ')}: ${award.refund?'returned':'win'} ${award.amount} — ${award.name}.`);
 return g;
}
export function botAction(g,rng=Math.random){return chooseBot(botObservation(g),legal(g),evaluate,rng);}
