export function mountModernUI(){
 const header=document.querySelector('.header-actions');
 const settings=document.createElement('details');settings.className='table-settings';settings.innerHTML='<summary>Settings <span aria-hidden="true">⌄</span></summary><div class="settings-content"></div>';
 header.append(settings);const content=settings.querySelector('.settings-content');
 for(const id of ['audio-controls','rename-player','help']){const element=document.getElementById(id);if(element)content.append(element);}
 const practice=header.querySelector('a[href="/solo"]');if(practice)content.append(practice);
 const tips=document.querySelector('.guide-toggle');if(tips)content.append(tips);
 const label=document.createElement('label');label.className='coach-toggle';label.innerHTML='<input type="checkbox" checked> Show live coach';content.append(label);
 let show=true;try{show=localStorage.getItem('next-hand-coach')!=='off';}catch{}
 const checkbox=label.querySelector('input');checkbox.checked=show;document.body.classList.toggle('coach-hidden',!show);
 checkbox.addEventListener('change',()=>{document.body.classList.toggle('coach-hidden',!checkbox.checked);try{localStorage.setItem('next-hand-coach',checkbox.checked?'on':'off');}catch{}});
 document.addEventListener('keydown',event=>{if(event.key==='Escape')settings.open=false;});
 document.addEventListener('click',event=>{if(!settings.contains(event.target))settings.open=false;});
 const sidebar=document.querySelector('.decision-sidebar');const title=document.createElement('div');title.className='sidebar-heading';title.innerHTML='<span class="section-kicker">PLAY & LEARN</span><span class="practice-chip">Practice chips</span>';sidebar.prepend(title);
 const footer=document.querySelector('.room-footer');if(footer){footer.classList.add('session-toolbar');content.append(footer);document.getElementById('invite').textContent='Invite friend';}
 const odds=document.getElementById('board-odds');
 if(odds){
  const button=document.createElement('button');button.type='button';button.textContent='Card odds';button.setAttribute('aria-haspopup','dialog');header.prepend(button);
  const dialog=document.createElement('dialog');dialog.className='odds-dialog';dialog.setAttribute('aria-labelledby','odds-title');dialog.innerHTML='<div class="odds-dialog-heading"><h2 id="odds-title">Card odds calculator</h2><button type="button" aria-label="Close card odds">Close</button></div>';
  const calculator=odds.querySelector('details');calculator.open=true;calculator.querySelector('summary').hidden=true;dialog.append(odds);document.body.append(dialog);
  button.addEventListener('click',()=>dialog.showModal());dialog.querySelector('button').addEventListener('click',()=>dialog.close());
 }
 const history=document.querySelector('.past-hands .panel-heading');if(history){const note=document.createElement('span');note.textContent='Your session · newest first';history.append(note);}
}
