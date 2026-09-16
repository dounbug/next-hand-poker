import {botProfile} from './bot-profiles.js';
import {startingStrength} from './starting-strength.js';
const ranks='23456789TJQKA';
// Only this explicit observation reaches the policy: no deck or other hole cards.
export function botObservation(g){const seat=g.actor;return {seat,dealer:g.dealer,hole:[...g.players[seat].hole],board:[...g.board],street:g.street,currentBet:g.currentBet,players:g.players.map(p=>({name:p.name,stack:p.stack,bet:p.bet,total:p.total,folded:p.folded})),log:[...g.log]};}
export function chooseBot(s,l,evaluate,rng=Math.random){
 const cfg=botProfile(s.seat),me=s.players[s.seat],others=s.players.filter((p,i)=>i!==s.seat&&!p.folded),multi=others.length>1,pot=s.players.reduce((a,p)=>a+p.total,0),price=l.call/Math.max(1,l.callPot),pos=(s.seat-s.dealer+6)%6,late=pos===0||pos===5;
 const effective=Math.min(me.stack,Math.max(0,...others.map(p=>p.stack))),spr=effective/Math.max(20,pot);
 const raise=target=>({type:'raise',amount:Math.min(l.max,Math.max(l.min,Math.round(target)))});
 const checkOrFold=()=>({type:l.canCheck?'check':'fold'});
 const r=s.hole.map(c=>ranks.indexOf(c[0])+2),pair=r[0]===r[1],suited=s.hole[0][1]===s.hole[1][1],connector=suited&&Math.abs(r[0]-r[1])<=2,ace=r.includes(14);
 if(!s.board.length){
  const quality=startingStrength(s.hole)+(connector?12:0),threshold=(late?63:pos===3?83:pos===4?77:73)-cfg.width;
  if(s.currentBet<=20){
   if(l.canRaise&&quality>=threshold&&rng()<cfg.aggression+.12){const limpers=s.players.filter((p,i)=>i!==s.seat&&p.bet===20&&i!==(s.dealer+2)%6).length;return raise(20*(late?2.5:3)+20*limpers);}
   if(l.canCheck)return {type:'check'};
   return {type:quality>=threshold+3&&price<.3?'call':'fold'};
  }
  const premium=(pair&&Math.min(...r)>=12)||(ace&&Math.min(...r)>=13),bigPressure=l.call>effective*.22;
  const blockerBluff=ace&&suited&&Math.min(...r)<=5&&late&&!multi&&s.currentBet<=100&&!bigPressure&&rng()<cfg.bluff;
  if(l.canRaise&&((premium&&rng()<cfg.aggression)||blockerBluff))return raise(s.currentBet*(late?3:3.6));
  if(l.canCheck)return {type:'check'};
  if(premium||quality>=threshold+10+(bigPressure?10:0)&&price<.32)return {type:'call'};
  if((pair||connector)&&late&&spr>4&&l.call<effective*.06&&rng()<.5)return {type:'call'};
  return {type:'fold'};
 }
 const known=new Set([...s.hole,...s.board]),deck=[...ranks].flatMap(r=>[...'shdc'].map(u=>r+u)).filter(c=>!known.has(c)),score=evaluate([...s.hole,...s.board]).score;
 let below=0;
 for(let i=0;i<24;i++){const a=Math.floor(rng()*deck.length);let b=Math.floor(rng()*(deck.length-1));if(b>=a)b++;const other=evaluate([deck[a],deck[b],...s.board]).score;below+=score>other?1:score===other?.5:0;}
 const strength=below/24,share=Math.pow(strength,others.length);
 const cards=[...s.hole,...s.board],suits=[...'shdc'].map(u=>({u,count:cards.filter(c=>c[1]===u).length,board:s.board.filter(c=>c[1]===u).length}));
 const flushDraw=s.board.length<5&&suits.some(x=>x.count===4&&x.board<4);
 const unique=new Set(cards.map(c=>ranks.indexOf(c[0])+2));if(unique.has(14))unique.add(1);
 const straightDraw=s.board.length<5&&Array.from({length:10},(_,i)=>i+1).some(start=>Array.from({length:5},(_,j)=>start+j).filter(r=>unique.has(r)).length===4&&s.hole.some(c=>{const n=ranks.indexOf(c[0])+2;return n>=start&&n<=start+4||n===14&&start===1;}));
 const draw=flushDraw||straightDraw,wet=suits.some(x=>x.board>=2)||s.board.some((c,i)=>s.board.some((d,j)=>i!==j&&Math.abs(ranks.indexOf(c[0])-ranks.indexOf(d[0]))<=2));
 const blocker=s.hole.some(c=>c[0]==='A'&&s.board.filter(b=>b[1]===c[1]).length>=3);
 const streetLog=s.log.slice(Math.max(0,s.log.map(x=>/^(Flop|Turn|River) dealt/.test(x)).lastIndexOf(true)));
 const facingRaise=streetLog.some(x=>x.includes(': Raise'));
 const veryStrong=strength>=.96,value=share>(multi?.76:.7),bluffChance=cfg.bluff*(multi?.2:1)*(facingRaise?.25:1);
 const flopAt=s.log.indexOf('Flop dealt.'),preflop=s.log.slice(0,flopAt<0?s.log.length:flopAt),lastRaise=preflop.filter(x=>x.includes(': Raise')).at(-1);
 const continuation=s.street==='flop'&&!multi&&!wet&&l.canCheck&&lastRaise?.startsWith(me.name+': ')&&rng()<cfg.bluff;
 const bluff=continuation||(draw&&s.board.length<5||blocker&&strength<.5)&&rng()<bluffChance;
 const fraction=veryStrong&&!multi&&spr>2&&rng()<cfg.overbet?1.25:wet?.75:s.street==='flop'?.33:.6;
 if(l.canRaise&&((value&&rng()<cfg.aggression&&rng()>cfg.trap)||bluff)){
  if(l.canCheck||veryStrong||bluff&&draw&&price<.25)return raise(s.currentBet+Math.max(20,(pot+l.call)*fraction));
 }
 if(l.canCheck)return {type:'check'};
 // Draw credit is deliberately conservative: not every improvement is a clean winning out.
 const drawCredit=draw?(s.street==='flop'?.12:.07):0;
 if(share+drawCredit>price+.08+(multi?.07:0)+(facingRaise?.07:0))return {type:'call'};
 return checkOrFold();
}
