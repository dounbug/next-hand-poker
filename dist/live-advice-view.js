import {adviceInput,adviceHTML} from './live-advice.js';
export function createLiveAdvisor(){
 let worker=null,current='',result=null,serial=0,root=null;
 return function update(container,g,seat,legal,enabled){
  root=null;if(!enabled){current='';result=null;serial++;return;}
  container.insertAdjacentHTML('beforeend','<section class="live-advice" aria-label="Live betting estimate"><h3>Suggested play <span>ESTIMATE</span></h3><div data-advice-result role="status" aria-live="polite">Estimating your options…</div></section>');
  root=container.querySelector('[data-advice-result]');
  const input=adviceInput(g,seat,legal),key=JSON.stringify(input);
  if(current===key){if(result)root.innerHTML=adviceHTML(result);return;}
  current=key;result=null;const id=++serial;
  try{
   if(!worker){worker=new Worker(new URL('./live-advice-worker.js',import.meta.url),{type:'module'});worker.onmessage=({data})=>{if(data.id!==serial||!root)return;if(data.error){root.textContent='Estimate unavailable for this turn.';return;}result=data.result;root.innerHTML=adviceHTML(result);};worker.onerror=()=>{if(root)root.textContent='Estimate unavailable. Your action controls still work.';worker.terminate();worker=null;current='';};}
   worker.postMessage({id,input});
  }catch{root.textContent='Estimate unavailable in this browser.';current='';}
 };
}
