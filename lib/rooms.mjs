import {randomBytes} from 'node:crypto';
import {createGame,act,legal,botAction} from '../dist/engine.js';
import {buildReview} from '../dist/review.js';
const secret=()=>randomBytes(24).toString('hex');
export class Rooms {
 constructor({now=Date.now,onChange=()=>{},saved=[]}={}){this.now=now;this.onChange=onChange;this.rooms=new Map(saved.map(r=>{r.paused=true;r.lastSeen={};return [r.id,r];}));}
 name(value){const name=String(value??'').trim();if(!name||name.length>18||/[\x00-\x1f<>:]/.test(name))throw Error('Choose a name of 1–18 characters without <, > or colon.');return name;}
 create(name){if(this.rooms.size>=100)throw Error('Local room limit reached.');const r={id:randomBytes(6).toString('hex'),members:[{seat:0,name:this.name(name),token:secret()}],game:null,decisions:{},paused:false,ready:[],revision:1,lastSeen:{},created:this.now()};this.rooms.set(r.id,r);this.onChange();return {id:r.id,token:r.members[0].token};}
 room(id){const r=this.rooms.get(id);if(!r)throw Error('Room not found.');return r;}
 join(id,name){const r=this.room(id);if(r.members.length>=2)throw Error('Both human seats are taken. Reopen this room in the browser you joined with.');const n=this.name(name);if(r.members.some(m=>m.name.toLowerCase()===n.toLowerCase()))throw Error('Use a different player name.');r.members.push({seat:3,name:n,token:secret()});this.changed(r);return {id:r.id,token:r.members[1].token};}
 member(r,token){const m=r.members.find(m=>m.token===token);if(!m)throw Error('Join this room before playing.');return m;}
 changed(r){r.revision++;this.onChange();}
 start(r){r.game=createGame(r.game);r.decisions={0:[],3:[]};r.ready=[];r.paused=false;for(const m of r.members){r.game.players[m.seat].name=m.name;r.game.players[m.seat].style='Human';}for(const [i,p] of r.game.players.entries())if(![0,3].includes(i)&&r.members.some(m=>m.name===p.name))p.name+=' (bot)';}
 action(id,token,input){const r=this.room(id),m=this.member(r,token);r.lastSeen[m.seat]=this.now();
 if(input.type==='rename'){
 const name=this.name(input.name),old=m.name;
 if(r.members.some(p=>p.seat!==m.seat&&p.name.toLowerCase()===name.toLowerCase())||r.game?.players.some((p,i)=>i!==m.seat&&p.name.toLowerCase()===name.toLowerCase()))throw Error('That name is already at this table. Choose another.');
 m.name=name;
 if(r.game){const g=r.game;g.players[m.seat].name=name;g.log=g.log.map(line=>line.startsWith(old+': ')?name+line.slice(old.length):line);g.refilled=(g.refilled||[]).map(n=>n===old?name:n);
 if(g.street==='complete')g.awards.forEach((a,i)=>{g.log[g.log.length-g.awards.length+i]=`${a.winners.map(seat=>g.players[seat].name).join(' & ')}: ${a.refund?'returned':'win'} ${a.amount} — ${a.name}.`;});}
 }
 else if(input.type==='start'){if(m.seat!==0||r.members.length!==2||r.game)throw Error('The host can start once both players have joined.');this.start(r);}
 else if(input.type==='pause'||input.type==='resume'){if(m.seat!==0||!r.game)throw Error('Only the host controls the shared pause.');r.paused=input.type==='pause';}
 else if(input.type==='ready'){if(r.game?.street!=='complete')throw Error('Finish this hand first.');if(!r.ready.includes(m.seat))r.ready.push(m.seat);if(r.ready.length===2)this.start(r);}
 else {const g=r.game;if(!g||r.paused||g.street==='complete'||g.actor!==m.seat)throw Error('Wait for your turn in the active hand.');if(input.hand!==g.hand||input.revision!==r.revision)throw Error('The table changed. Refreshing your controls; try again.');const l=legal(g),p=g.players[m.seat];const d={position:['Button','Small blind','Big blind','Under the gun','Hijack','Cutoff'][(m.seat-g.dealer+6)%6],street:g.street,type:input.type,amount:input.type==='raise'?input.amount:input.type==='call'?l.call:0,pot:g.players.reduce((a,p)=>a+p.total,0),owed:l.call,callPot:l.callPot,board:[...g.board],logIndex:g.log.length,stack:p.stack,currentBet:g.currentBet,alreadyBet:p.bet};act(g,input.type,input.amount);r.decisions[m.seat].push(d);}
 this.changed(r);return this.view(id,token);
 }
 tick(){for(const r of this.rooms.values()){const g=r.game;if(!g||r.paused||g.street==='complete'||[0,3].includes(g.actor))continue;if(r.members.some(m=>this.now()-(r.lastSeen[m.seat]??0)>12000))continue;const a=botAction(g);act(g,a.type,a.amount);this.changed(r);}}
 view(id,token){const r=this.room(id),m=this.member(r,token);r.lastSeen[m.seat]=this.now();const g=r.game,done=g?.street==='complete';const members=r.members.map(p=>({seat:p.seat,name:p.name,online:this.now()-(r.lastSeen[p.seat]??0)<12000}));
 const result={id:r.id,seat:m.seat,host:m.seat===0,revision:r.revision,paused:r.paused,ready:[...r.ready],members,game:null,review:null};if(!g)return result;
 result.game={hand:g.hand,street:g.street,actor:g.actor,dealer:g.dealer,smallBlind:g.smallBlind,bigBlind:g.bigBlind,currentBet:g.currentBet,board:[...g.board],pot:done?g.pot:g.players.reduce((s,p)=>s+p.total,0),log:[...g.log],players:g.players.map((p,i)=>({name:p.name,style:p.style,stack:p.stack,startStack:p.startStack,bet:p.bet,total:p.total,folded:p.folded,lastAction:p.lastAction,hole:i===m.seat||done?[...p.hole]:[null,null]})),legal:g.actor===m.seat&&!r.paused?legal(g):null};
 if(done){const order=Array.from({length:6},(_,i)=>(i+m.seat)%6),mapped={...g,players:order.map(i=>g.players[i]),decisions:r.decisions[m.seat],awards:g.awards.map(a=>({...a,winners:a.winners.map(i=>order.indexOf(i))}))};result.review=buildReview(mapped);}
 return result;
 }
 export(){return [...this.rooms.values()].map(({lastSeen,...r})=>r);}
}
