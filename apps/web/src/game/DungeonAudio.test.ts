import { expect, it, vi } from "vitest"
import { sfxRecipes } from "./audio/sfxRecipes"
import { depthTracks, titleTrack, bossTrack, type MusicTrack } from "./audio/musicTracks"
import { Orchestra, type VoiceHost } from "./audio/instruments"
import { createStoneHall } from "./audio/reverb"
import { playScoreStep } from "./audio/score"
import { DungeonAudio } from "./DungeonAudio"

function device() {
 const parameter = () => ({value:0,setValueAtTime:vi.fn(),setTargetAtTime:vi.fn(),exponentialRampToValueAtTime:vi.fn(),linearRampToValueAtTime:vi.fn(),cancelScheduledValues:vi.fn()})
 const sources:Array<ReturnType<typeof source>>=[]
 function source() { return {type:"",frequency:parameter(),playbackRate:parameter(),buffer:null,connect:vi.fn(target=>target),disconnect:vi.fn(),start:vi.fn(),stop:vi.fn(),onended:null as (()=>void)|null} }
 const node = () => { const n={connect:vi.fn(),disconnect:vi.fn()};n.connect.mockImplementation(target=>target);return n }
 const context = {state:"running",currentTime:0,sampleRate:48000,destination:{},resume:vi.fn(async()=>{}),suspend:vi.fn(async()=>{}),close:vi.fn(async()=>{}),
  createGain:()=>({...node(),gain:parameter()}),createStereoPanner:()=>({...node(),pan:parameter()}),createBiquadFilter:()=>({...node(),type:"",frequency:parameter(),Q:parameter()}),
  createDynamicsCompressor:()=>({...node(),threshold:parameter(),knee:parameter(),ratio:parameter(),attack:parameter(),release:parameter()}),
  createConvolver:()=>({...node(),buffer:null}),createBuffer:(...sizes:number[])=>({getChannelData:()=>new Float32Array(sizes[1]??48000)}),createOscillator:()=>{const s=source();sources.push(s);return s},createBufferSource:()=>{const s=source();sources.push(s);return s}}
 vi.stubGlobal("AudioContext",class{constructor(){return context}})
 return {context,sources}
}
it("mixes independent buses, schedules adaptive music and gives health/progression priority without unbounded voices",()=>{
 vi.useFakeTimers()
 const {context,sources}=device(),audio=new DungeonAudio()
 const internal=audio as unknown as {voices:Set<{bus:string}>;buses:Record<string,{gain:{value:number;setTargetAtTime:ReturnType<typeof vi.fn>}}>}
 try{
  audio.play("hurt");expect(sources).toHaveLength(0)
  audio.unlock();audio.unlock();expect(audio.volume).toBe(.7);audio.setMix(.5,.3,.8)
  expect(internal.buses.effects.gain.setTargetAtTime).toHaveBeenCalledWith(.8,0,.04)
  audio.setScene({mood:"arena",pressure:1,boss:true,critical:true})
  for(let i=0;i<200;i++){
   context.currentTime+=.14;vi.advanceTimersByTime(140)
   audio.play(i%3===0?"hurt":i%3===1?"enemy-skeleton":"pickup")
   expect(internal.voices.size).toBeLessThanOrEqual(56)
   expect([...internal.voices].filter(v=>v.bus==="effects").length).toBeLessThanOrEqual(30)
  }
  expect([...internal.voices].some(v=>v.bus==="music")).toBe(true)
  expect(sources.some(s=>s.frequency.exponentialRampToValueAtTime.mock.calls.some(([freq])=>freq===62))).toBe(true)
  audio.setVisible(false);expect(internal.voices.size).toBe(0);expect(vi.getTimerCount()).toBe(0)
  const count=sources.length;audio.unlock();audio.play("hurt");expect(sources).toHaveLength(count)
  audio.setVisible(true);audio.setScene({mood:"draft"});vi.advanceTimersByTime(80);audio.play("level");audio.play("upgrade")
  audio.setScene({mood:"paused"});expect(vi.getTimerCount()).toBe(0);expect(internal.voices.size).toBe(0)
  audio.setScene({mood:"dead"});expect([...internal.voices].every(v=>v.bus==="effects")).toBe(true)
  audio.volume=0;expect(internal.voices.size).toBe(0)
  audio.dispose();audio.dispose();expect(context.close).toHaveBeenCalledOnce()
  expect(sources.every(s=>s.disconnect.mock.calls.length>0)).toBe(true)
  audio.unlock();expect(context.close).toHaveBeenCalledOnce()
 }finally{audio.dispose();vi.useRealTimers();vi.unstubAllGlobals()}
})
it("keeps missing devices and rejected autoplay optional",async()=>{
 vi.useFakeTimers()
 const {context}=device(),audio=new DungeonAudio()
 try{
  context.state="suspended";context.resume.mockRejectedValue(new Error("autoplay"));audio.unlock();await Promise.resolve();await Promise.resolve()
  context.suspend.mockRejectedValueOnce(new Error("device"));context.close.mockRejectedValueOnce(new Error("device"))
  context.state="running";audio.suspend();audio.dispose();await Promise.resolve()
  vi.stubGlobal("AudioContext",class{constructor(){throw new Error("No device")}})
  const unavailable=new DungeonAudio();unavailable.unlock();unavailable.dispose()
 }finally{audio.dispose();vi.useRealTimers();vi.unstubAllGlobals()}
})

it("sounds every real feedback family, decays voices and changes arrangement without restarting the beat grid",async()=>{
 vi.useFakeTimers()
 const {context,sources}=device(),audio=new DungeonAudio()
 const a=audio as unknown as {voices:Set<{source:{onended:(()=>void)|null};bus:string}>;schedule:()=>void;release:(v:unknown,stop?:boolean)=>void;nextBeat:number;step:number;intensity:number;sound:(f:number,d:number,l:number,b:string,t:number)=>void}
 const end=()=>{for(const source of sources)source.onended?.()}
 try{
  audio.setMix(NaN,1,1);audio.unlock();expect(sources).toHaveLength(0);audio.setMix(.5)
  audio.setVisible(false);audio.unlock();audio.setVisible(true);audio.setScene({mood:"paused"});audio.unlock();audio.setScene({mood:"title"});audio.unlock()
  for(const kind of ["ui","tick","slash","dust","cleave","hurt","hit","shatter","block","storm","explosion","heal","pickup","chest","magnet","level","upgrade","boss","warning","defeat","enemy-skeleton","enemy-mage","enemy-guard","enemy-goblin","enemy-bomber","enemy-minotaur","enemy-boss","death-skeleton","death-guard","death-mage","death-goblin","death-minotaur","victory","shield","mana","deploy","sentry","enemy-bat","death-bat","enemy-wolf","death-wolf","enemy-slime","death-slime","enemy-spider","death-spider","enemy-wraith","death-wraith","enemy-archer","death-archer","enemy-shaman","death-shaman","enemy-golem","death-golem","enemy-imp","death-imp","enemy-rat","death-rat","enemy-necromancer","death-necromancer","enemy-serpent","death-serpent","enemy-beetle","death-beetle","enemy-assassin","death-assassin","enemy-troll","death-troll","enemy-wisp","death-wisp"]){
   context.currentTime+=2;audio.play(kind,.4);const count=sources.length;audio.play(kind);expect(sources.length).toBe(count);end()
  }
  audio.play("enemy-goblin");audio.play("enemy-mage");end()
  for(const mood of ["title","dojo","draft","arena"] as const){
   audio.setScene({mood,pressure:0});a.intensity=0
   for(let i=0;i<130;i++){context.currentTime+=.134;a.schedule();end()}
  }
  audio.setScene({mood:"arena",critical:true});context.currentTime+=.2;a.schedule();end();audio.setScene({mood:"arena",boss:true,critical:true,pressure:1})
  for(let i=0;i<130;i++){context.currentTime+=.134;a.schedule();end()}
  audio.setMix(.5,0,1);a.schedule();audio.play("hurt");end()
  audio.setMix(.5,1,0);audio.play("hurt");a.step=0;a.nextBeat=context.currentTime+.02;a.schedule();end()
  audio.setMix(.5,0,0);expect(vi.getTimerCount()).toBe(0)
  audio.setMix(.5,1,1);context.state="suspended";a.schedule();audio.play("hurt");audio.setScene({mood:"arena"});audio.setVisible(false);await Promise.resolve();await Promise.resolve();await Promise.resolve();context.state="running";audio.setVisible(true)
  for(let i=0;i<15;i++){context.currentTime+=1;audio.play("storm")}
  context.currentTime+=1;audio.play("tick");audio.play("hurt");expect(a.voices.size).toBeLessThanOrEqual(30)
  const voice=[...a.voices][0]!;a.release(voice);a.release(voice)
  a.nextBeat=context.currentTime+.02;a.step=0;a.schedule();audio.setScene({mood:"dead"});audio.setScene({mood:"dead"});audio.suspend();
  context.state="suspended";audio.setScene({mood:"arena"});audio.setMix(.5,0,0);for(let i=0;i<5;i++)await Promise.resolve();
  context.state="running";audio.setMix(.5,1,1);audio.suspend();audio.dispose();a.schedule();a.sound(100,.1,.1,"music",0)
 }finally{audio.dispose();vi.useRealTimers();vi.unstubAllGlobals()}
})

it("sounds all weapon and enemy recipes and changes themes only at musical boundaries",()=>{
 vi.useFakeTimers();const {context,sources}=device(),audio=new DungeonAudio()
 const a=audio as unknown as {step:number;nextBeat:number;track:{name:string};schedule:()=>void}
 try{
  audio.unlock()
  for(const kind of Object.keys(sfxRecipes)){context.currentTime+=2;audio.play(kind);for(const source of sources)source.onended?.()}
  for(let depth=0;depth<depthTracks.length;depth++){
   audio.setScene({mood:"arena",depth});a.step=128;a.nextBeat=context.currentTime+.02;a.schedule();expect(a.track.name).toBe(depthTracks[depth]!.name)
   for(const source of sources)source.onended?.()
  }
  audio.setScene({mood:"arena",boss:true});a.step=16;a.nextBeat=context.currentTime+.02;a.schedule();expect(a.track.name).toBe("Obsidian Duel")
 }finally{audio.dispose();vi.useRealTimers();vi.unstubAllGlobals()}
})

it("supports optional sweep shaping and disconnects vibrato voices on suspension",()=>{
 vi.useFakeTimers();const {sources}=device(),audio=new DungeonAudio()
 sfxRecipes["sweep-contract"]=voice=>{
  voice.sweep(400,800,.2,.1,"sine")
  voice.sweep(200,100,.3,.1,"triangle",{attack:.05,vibratoRate:6,vibratoDepth:.03})
 }
 try{
  audio.unlock();audio.play("sweep-contract")
  expect(sources).toHaveLength(3)
  expect(sources.some(source=>source.frequency.value===6)).toBe(true)
  audio.suspend();expect(sources.every(source=>source.disconnect.mock.calls.length>0)).toBe(true)
 }finally{delete sfxRecipes["sweep-contract"];audio.dispose();vi.useRealTimers();vi.unstubAllGlobals()}
})


it("schedules every ensemble with mood-specific melody and percussion",()=>{
 const parts={pluck:vi.fn(),choir:vi.fn(),strings:vi.fn(),horn:vi.fn(),flute:vi.fn(),bell:vi.fn(),organ:vi.fn(),drum:vi.fn()}
 const orchestra=parts as unknown as Orchestra
 const tracks=[titleTrack,...depthTracks,bossTrack,...(["lute","organ"] as const).map(lead=>({...titleTrack,ensemble:{...titleTrack.ensemble,lead}} satisfies MusicTrack))]
 for(const track of tracks)for(const energy of [0,.5,1])for(let step=0;step<128;step++){
  playScoreStep(orchestra,track,step,step*.15,.15,{energy,calm:energy===0,title:track===titleTrack,hushed:false,boss:track===bossTrack})
 }
 for(const part of Object.values(parts))expect(part).toHaveBeenCalled()
 for(const part of Object.values(parts))part.mockClear()
 playScoreStep(orchestra,titleTrack,2,0,.15,{energy:0,calm:true,title:true,hushed:true,boss:false})
 expect(parts.pluck).not.toHaveBeenCalled();expect(parts.drum).not.toHaveBeenCalled()
})

it("builds finite instrument graphs and discards every node when the voice budget rejects a note",()=>{
 const {context,sources}=device(),adopt=vi.fn(()=>true),destination=context.createGain()
 const host={ctx:context,noise:context.createBuffer(),destination,adopt} as unknown as VoiceHost
 const orchestra=new Orchestra(host)
 try{
  orchestra.pluck(60,0,.4,.1);orchestra.strings(48,0,1,.1);orchestra.horn(60,0,.5,.1);orchestra.flute(72,0,.4,.1);orchestra.bell(72,0,.1)
  orchestra.choir([60,64,67],0,1,.1);orchestra.organ([60,64,67],0,1,.1)
  for(const kind of ["war","tom","anvil","frame","shaker"] as const)orchestra.drum(kind,0,.1)
  expect(adopt).toHaveBeenCalledTimes(14)
  for(const source of sources){expect(source.start).toHaveBeenCalledWith(0);expect(source.stop).toHaveBeenCalled()}
  const accepted=sources.length;adopt.mockReturnValue(false);orchestra.pluck(60,0,.4,.1)
  for(const source of sources.slice(accepted)){expect(source.start).not.toHaveBeenCalled();expect(source.disconnect).toHaveBeenCalled()}
  const shortHall=createStoneHall(context as unknown as AudioContext,.001)
  expect(shortHall.buffer).not.toBeNull()
 }finally{vi.unstubAllGlobals()}
})

it("rejects instrument notes while muted or paused and keeps total voices within the shared cap",()=>{
 vi.useFakeTimers();const {context,sources}=device(),audio=new DungeonAudio()
 const a=audio as unknown as {voiceHost:(ctx:AudioContext)=>VoiceHost;orchestra:Orchestra;voices:Set<{bus:string}>}
 try{
  audio.unlock();const host=a.voiceHost(context as unknown as AudioContext)
  audio.setMix(.7,0,1);expect(host.adopt(context.createOscillator() as unknown as OscillatorNode,[])).toBe(false)
  audio.setMix(.7,1,1);audio.setScene({mood:"paused"});expect(host.adopt(context.createOscillator() as unknown as OscillatorNode,[])).toBe(false)
  audio.setScene({mood:"arena"})
  for(let i=0;i<50;i++)a.orchestra.pluck(60,0,.4,.1)
  expect([...a.voices].filter(v=>v.bus==="music")).toHaveLength(40)
  for(let i=0;i<40;i++){context.currentTime+=1;audio.play("hurt")}
  a.orchestra.pluck(60,0,.4,.1);expect(a.voices.size).toBe(56)
  audio.suspend();expect(a.voices.size).toBe(0)
  expect(sources.filter(s=>s.start.mock.calls.length).every(s=>s.disconnect.mock.calls.length>0)).toBe(true)
 }finally{audio.dispose();vi.useRealTimers();vi.unstubAllGlobals()}
})
