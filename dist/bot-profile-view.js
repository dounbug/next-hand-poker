import {botProfile} from './bot-profiles.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function botStyleHTML(seat){const p=botProfile(seat);return `<button type="button" class="bot-style" data-bot-profile="${seat}" aria-label="About ${esc(p.label)} playing style">${esc(p.label)} ⓘ</button>`;}
export function mountBotProfiles(){
 const dialog=document.createElement('dialog');dialog.className='bot-profile-dialog';dialog.setAttribute('aria-label','Opponent playing style');document.body.append(dialog);
 document.addEventListener('click',e=>{const button=e.target.closest('[data-bot-profile]');if(!button)return;const p=botProfile(Number(button.dataset.botProfile));dialog.innerHTML=`<h2>${esc(p.label)}</h2><h3>${esc(p.inspiration)}</h3><p>${esc(p.description)}</p><p><strong>Watch for:</strong> ${esc(p.lesson)}</p><p class="small-note">Simplified, randomized training style—not a professional’s strategy, a solver or an endorsement. Trading labels are fictional. Bots only use their own cards and public information.</p><p><a href="${p.source}" target="_blank" rel="noopener noreferrer">Research / match reference ↗</a></p><form method="dialog"><button>Back to table</button></form>`;dialog.showModal();});
}
