import {casinoPhrase,BAR_SECONDS} from './casino-score.js';
// Original synthesized ambience and cues; no recordings or network audio downloads.
export function soundEvents(previous,current){
 if(!current)return [];const events=[],fresh=!previous||previous.room!==current.room||previous.hand!==current.hand;
 if(fresh)events.push('deal');
 else if(current.street==='complete'&&previous.street!=='complete')events.push('finish');
 else if(current.street!==previous.street&&current.street!=='complete')events.push('deal');
 else if(current.actionCount!==previous.actionCount)events.push('chips');
 const yourTurn=current.actor===current.seat&&!current.paused&&current.street!=='complete';
 const wasYourTurn=previous&&previous.actor===previous.seat&&!previous.paused&&previous.street!=='complete';
 if(yourTurn&&(fresh||!wasYourTurn||previous.street!==current.street))events.push('turn');return events;
}
export function mountAudio(container){
 let preferences={sound:false,music:false,volume:30};try{preferences={...preferences,...JSON.parse(localStorage.getItem('poker-audio-v1')||'{}')};}catch{}
 let context,master,soundBus,musicBus,timer=null,previous=null,bar=0;
 container.innerHTML='<button type="button" data-sound aria-pressed="false">Sound off</button><button type="button" data-music aria-pressed="false">Music off</button><label class="audio-volume">Volume <input data-volume type="range" min="0" max="100" step="5" aria-label="Audio volume"></label><span data-audio-status class="sr-only" role="status"></span>';
 const sound=container.querySelector('[data-sound]'),music=container.querySelector('[data-music]'),volume=container.querySelector('[data-volume]'),status=container.querySelector('[data-audio-status]');
 function save(){try{localStorage.setItem('poker-audio-v1',JSON.stringify(preferences));}catch{}}
 music.title='Macau after hours · bass, plucked strings and brushed lounge rhythm';
 function paint(){sound.textContent=preferences.sound?'Sound on':'Sound off';sound.setAttribute('aria-pressed',String(preferences.sound));music.textContent=preferences.music?'Music on':'Music off';music.setAttribute('aria-pressed',String(preferences.music));volume.value=preferences.volume;}
 async function unlock(){try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error('Audio unavailable');if(!context){context=new Audio();master=context.createGain();master.connect(context.destination);soundBus=context.createGain();soundBus.connect(master);musicBus=context.createGain();musicBus.connect(master);}await context.resume();levels();return context.state==='running';}catch{status.textContent='Audio is unavailable in this browser. The game still works.';return false;}}
 function levels(){if(!context)return;master.gain.setValueAtTime(Math.max(0,Math.min(100,Number(preferences.volume)||0))/100,context.currentTime);soundBus.gain.setValueAtTime(preferences.sound?.28:0,context.currentTime);musicBus.gain.setValueAtTime(preferences.music&&!document.hidden?.10:0,context.currentTime);}
 function note(frequency,delay,duration,level,bus,type='sine'){if(!context||context.state!=='running')return;const oscillator=context.createOscillator(),gain=context.createGain(),at=context.currentTime+delay;oscillator.type=type;oscillator.frequency.value=frequency;gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(level,at+.025);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);oscillator.connect(gain);gain.connect(bus);oscillator.start(at);oscillator.stop(at+duration+.02);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};}
 function cue(event){if(!preferences.sound||!context)return;if(event==='turn'){note(660,0,.24,.7,soundBus);note(880,.16,.4,.7,soundBus);}else if(event==='deal'){note(330,0,.11,.25,soundBus,'triangle');note(440,.09,.11,.25,soundBus,'triangle');}else if(event==='finish'){note(440,0,.3,.35,soundBus);note(554,.13,.3,.35,soundBus);note(660,.26,.5,.35,soundBus);}else note(1200,0,.055,.12,soundBus,'triangle');}
 let roomReady=false,noiseBuffer;
 function prepareRoom(){if(roomReady||!context)return;const filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=4200;musicBus.disconnect();musicBus.connect(filter);filter.connect(master);const echo=context.createDelay(1);echo.delayTime.value=.23;const feedback=context.createGain();feedback.gain.value=.14;filter.connect(echo);echo.connect(feedback);feedback.connect(echo);feedback.connect(master);roomReady=true;}
 function brushedNoise(event){if(!noiseBuffer){noiseBuffer=context.createBuffer(1,Math.ceil(context.sampleRate*.2),context.sampleRate);const data=noiseBuffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;}
 const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain(),at=context.currentTime+event.at;source.buffer=noiseBuffer;filter.type='bandpass';filter.frequency.value=event.frequency;filter.Q.value=event.voice==='brush'?.6:1.8;gain.gain.setValueAtTime(event.level,at);gain.gain.exponentialRampToValueAtTime(.0001,at+event.duration);source.connect(filter);filter.connect(gain);gain.connect(musicBus);source.start(at);source.stop(at+event.duration);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};}
 function musicPhrase(){if(!preferences.music||document.hidden||!context||context.state!=='running')return;prepareRoom();for(const e of casinoPhrase(bar++)){
  if(e.voice==='brush'||e.voice==='hat'){brushedNoise(e);continue;}
  if(e.voice==='pluck'){note(e.frequency,e.at,e.duration,e.level,musicBus,'triangle');note(e.frequency*2.01,e.at,.2,e.level*.17,musicBus);note(e.frequency,e.at+.23,.55,e.level*.18,musicBus);}
  else if(e.voice==='kick'){note(e.frequency,e.at,e.duration,e.level,musicBus);note(e.frequency/2,e.at+.035,.17,e.level*.4,musicBus);}
  else note(e.frequency,e.at,e.duration,e.level,musicBus,e.voice==='chip'?'triangle':'sine');
 }}
 function syncMusic(){levels();if(!preferences.music||document.hidden||!context){if(timer)clearInterval(timer);timer=null;return;}if(timer)return;musicPhrase();timer=setInterval(musicPhrase,BAR_SECONDS*1000);}
 sound.addEventListener('click',async()=>{preferences.sound=!preferences.sound;paint();save();if(preferences.sound&&await unlock())cue('turn');levels();});
 music.addEventListener('click',async()=>{preferences.music=!preferences.music;paint();save();if(preferences.music)await unlock();syncMusic();});
 volume.addEventListener('input',()=>{preferences.volume=Number(volume.value);levels();save();});
 const restore=async()=>{if(preferences.sound||preferences.music){await unlock();syncMusic();}};
 document.addEventListener('pointerdown',restore,{once:true});document.addEventListener('keydown',restore,{once:true});
 document.addEventListener('visibilitychange',()=>syncMusic());window.addEventListener('pagehide',()=>{if(timer)clearInterval(timer);context?.close().catch(()=>{});});paint();
 return {update(current){const events=soundEvents(previous,current);previous=current;if(events.includes('turn'))cue('turn');else for(const event of events)cue(event);}};
}
