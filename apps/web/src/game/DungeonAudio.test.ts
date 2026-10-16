import { expect, it, vi } from "vitest"
import { DungeonAudio } from "./DungeonAudio"

function device() {
 const parameter = () => ({value:0,setValueAtTime:vi.fn(),setTargetAtTime:vi.fn(),exponentialRampToValueAtTime:vi.fn(),linearRampToValueAtTime:vi.fn(),cancelScheduledValues:vi.fn()})
 const sources:Array<ReturnType<typeof source>>=[]
 function source() { return {type:"",frequency:parameter(),playbackRate:parameter(),buffer:null,connect:vi.fn(),disconnect:vi.fn(),start:vi.fn(),stop:vi.fn(),onended:null as (()=>void)|null} }
 const node = () => ({connect:vi.fn(),disconnect:vi.fn()})
 const context = {state:"running",currentTime:0,sampleRate:48000,destination:{},resume:vi.fn(async()=>{}),suspend:vi.fn(async()=>{}),close:vi.fn(async()=>{}),
  createGain:()=>({...node(),gain:parameter()}),createStereoPanner:()=>({...node(),pan:parameter()}),createBiquadFilter:()=>({...node(),type:"",frequency:parameter(),Q:parameter()}),
  createDynamicsCompressor:()=>({...node(),threshold:parameter(),knee:parameter(),ratio:parameter(),attack:parameter(),release:parameter()}),
  createBuffer:()=>({getChannelData:()=>new Float32Array(48000)}),createOscillator:()=>{const s=source();sources.push(s);return s},createBufferSource:()=>{const s=source();sources.push(s);return s}}
 vi.stubGlobal("AudioContext",class{constructor(){return context}})
 return {context,sources}
}
it("mixes independent buses, schedules adaptive music and gives health/progression priority without unbounded voices",()=>{
 vi.useFakeTimers()
 const {context,sources}=device(),audio=new DungeonAudio()
 const internal=audio as unknown as {voices:Set<{bus:string}>;buses:Record<string,{gain:{value:number;setTargetAtTime:ReturnType<typeof vi.fn>}}>}
 try{
  audio.play("hurt");expect(sources).toHaveLength(0)
  audio.unlock();audio.setMix(.5,.3,.8)
  expect(internal.buses.effects.gain.setTargetAtTime).toHaveBeenCalledWith(.8,0,.04)
  audio.setScene({mood:"arena",pressure:1,boss:true,critical:true})
  for(let i=0;i<200;i++){
   context.currentTime+=.14;vi.advanceTimersByTime(140)
   audio.play(i%3===0?"hurt":i%3===1?"enemy-skeleton":"pickup")
   expect(internal.voices.size).toBeLessThanOrEqual(40)
   expect([...internal.voices].filter(v=>v.bus==="effects").length).toBeLessThanOrEqual(20)
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
