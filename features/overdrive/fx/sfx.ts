let ctx:AudioContext|null=null,volume=.5,muted=false
function ac(){if(!ctx)ctx=new AudioContext();if(ctx.state==="suspended")void ctx.resume();return ctx}
function tone(freq:number,type:OscillatorType,ms:number,peak=.15,slide?:number,delay=0){if(muted||volume===0)return;const a=ac(),at=a.currentTime+delay,osc=a.createOscillator(),gain=a.createGain();osc.type=type;osc.frequency.setValueAtTime(freq,at);if(slide)osc.frequency.exponentialRampToValueAtTime(slide,at+ms/1000);gain.gain.setValueAtTime(.001,at);gain.gain.exponentialRampToValueAtTime(peak*volume,at+.008);gain.gain.exponentialRampToValueAtTime(.001,at+ms/1000);osc.connect(gain).connect(a.destination);osc.start(at);osc.stop(at+ms/1000+.02)}
function noise(ms:number,peak=.08){if(muted||volume===0)return;const a=ac(),length=Math.floor(a.sampleRate*ms/1000),buffer=a.createBuffer(1,length,a.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*(1-i/length);const src=a.createBufferSource(),gain=a.createGain();src.buffer=buffer;gain.gain.value=peak*volume;src.connect(gain).connect(a.destination);src.start()}
export const sfx={
  key(){tone(1450+Math.random()*240,"square",24,.045)},
  shot(combo:number){tone(520+Math.min(combo,30)*9,"square",65,.09,900+combo*8)},
  hit(){tone(180,"triangle",55,.08,110);noise(45,.035)},
  typo(){tone(190,"sawtooth",170,.18,72);noise(120,.08)},
  word(combo:number){tone(440*Math.pow(2,(combo%12)/12),"sine",110,.14);setTimeout(()=>tone(660,"triangle",70,.08),35)},
  mult(mult:number){[0,1,2].forEach(i=>tone(620+mult*45+i*110,"triangle",130,.13,undefined,i*.055))},
  stageClear(){[523,659,784,1047].forEach((f,i)=>tone(f,"square",150,.14,undefined,i*.09))},
  boss(){tone(92,"sawtooth",600,.16,55);tone(184,"square",400,.07,92,.12)},
  runOver(){[392,311,262,196].forEach((f,i)=>tone(f,"sawtooth",210,.14,undefined,i*.14))},
  setVolume(v:number){volume=Math.max(0,Math.min(1,v))},setMuted(v:boolean){muted=v},
}
