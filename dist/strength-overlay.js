export function mountStrengthOverlay(box,onClose){
 box.classList.add('strength-overlay');
 box.setAttribute('role','dialog');box.setAttribute('aria-label','Hand strength information');
 document.body.append(box);
 function close(){if(box.hidden)return;box.hidden=true;onClose();document.querySelectorAll('[data-info],[data-hand-info]').forEach(button=>button.setAttribute('aria-expanded','false'));}
 document.addEventListener('click',event=>{if(!box.contains(event.target)&&!event.target.closest('[data-info],[data-hand-info]'))close();});
 document.addEventListener('keydown',event=>{if(event.key==='Escape')close();});
}
