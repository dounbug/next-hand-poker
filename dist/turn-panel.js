import {currentHandHTML} from './current-hand.js';
export function createTurnPanel(){
 let saved='',hand=null;
 return {
  capture(root,id){if(hand!==id){saved='';hand=id;}else if(!root.inert&&root.querySelector('.basic-actions'))saved=root.innerHTML;},
  waiting(hole,board){return saved||`<div class="turn-summary"><h2>Your move</h2><p>Waiting for your turn</p></div>${currentHandHTML(hole,board)}<div class="basic-actions action-buttons"><button disabled>Fold</button><button disabled>Call</button><button disabled>Raise ⌄</button></div><section class="live-advice"><h3>Your coach <span>ESTIMATE</span></h3><p>Your suggestion appears when it is your turn.</p></section>`;},
  update(root,g,seat,paused){
   const waiting=!paused&&g.street!=='complete'&&g.actor!==seat;
   root.inert=waiting;root.classList.toggle('turn-waiting',waiting);root.setAttribute('aria-disabled',String(waiting));
   if(waiting){root.querySelectorAll('button,input').forEach(e=>e.disabled=true);const title=root.querySelector('.live-advice h3');if(title&&saved)title.textContent='Your coach · previous turn';}
   let bubble=document.getElementById('turn-bubble');if(!bubble){bubble=document.createElement('div');bubble.id='turn-bubble';bubble.className='turn-bubble';bubble.setAttribute('role','status');document.querySelector('.play-column').prepend(bubble);}
   bubble.hidden=!waiting; if(waiting){bubble.replaceChildren();const label=document.createElement('span');label.textContent=(g.players[g.actor]?.name||'Opponent')+'’s turn';const dots=document.createElement('span');dots.className='thinking-dots';dots.setAttribute('aria-hidden','true');dots.innerHTML='<i></i><i></i><i></i>';bubble.append(label,dots);}
  }
 };
}
