// Original 72 BPM lounge score: eight bars of bass, sparse pentatonic plucks and brushed rhythm.
export const BAR_SECONDS=10/3;
export function casinoPhrase(index){const beat=BAR_SECONDS/4,bar=((index%8)+8)%8,events=[];
 const roots=[55,55,65.406,65.406,49,49,51.913,51.913],root=roots[bar];
 const add=(voice,at,frequency,duration,level)=>events.push({voice,at:at*beat,frequency,duration,level});
 add('bass',0,root,1.3,.36);add('bass',2.5,root*1.5,.65,.2);
 const voicings=[[220,261.626,329.628],[220,293.665,391.995],[207.652,261.626,311.127],[195.998,246.942,293.665]];
 for(const frequency of voicings[Math.floor(bar/2)])add('pad',.08,frequency,2.65,.038);
 const motifs=[[0,2,4],[4,2],[2,1,0],[1,3],[0,4,3],[2,0],[1,2,4],[3,1,0]],scale=[220,261.626,293.665,329.628,391.995];
 motifs[bar].forEach((pitch,i)=>add('pluck',.5+i*1.05,scale[pitch]*(bar%2?2:1),.9,.16));
 for(const at of [0,2])add('kick',at,72,.17,.28);
 for(const at of [1,3])add('brush',at,1100,.11,.04);
 for(const at of [.5,1.5,2.5,3.5])add('hat',at,4300,.04,.018);
 if(bar===3||bar===7){add('chip',3.2,2100,.04,.05);add('chip',3.32,2600,.03,.035);}
 return events;
}
