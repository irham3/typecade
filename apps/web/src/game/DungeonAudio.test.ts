import { expect, it, vi } from "vitest"
import { DungeonAudio } from "./DungeonAudio"

it("bounds voices, resumes only on a gesture and releases every audio resource",async()=>{
 const oscillators:Array<{onended:(()=>void)|null;stop:ReturnType<typeof vi.fn>;disconnect:ReturnType<typeof vi.fn>}> = []
 const parameter=()=>({setValueAtTime:vi.fn(),exponentialRampToValueAtTime:vi.fn()})
 const context={state:"running",currentTime:0,destination:{},resume:vi.fn(async()=>{}),suspend:vi.fn(async()=>{}),close:vi.fn(async()=>{}),createGain:()=>({gain:parameter(),connect:vi.fn(),disconnect:vi.fn()}),createOscillator:()=>{const oscillator={type:"",frequency:parameter(),connect:vi.fn(),stop:vi.fn(),start:vi.fn(),disconnect:vi.fn(),onended:null as (()=>void)|null};oscillators.push(oscillator);return oscillator}}
 vi.stubGlobal("AudioContext",class{constructor(){return context}})
 try{
  const audio=new DungeonAudio();audio.play("tick");audio.suspend();audio.unlock();audio.unlock()
  for(const kind of ["hit","storm","heal","pickup","shatter","tick","slash","tick","tick"])audio.play(kind)
  expect(oscillators).toHaveLength(8);oscillators[0]!.onended!();audio.play("tick");expect(oscillators).toHaveLength(9)
  audio.volume=0;audio.unlock();audio.play("tick");audio.volume=1;context.state="suspended";audio.play("tick");audio.suspend();context.state="running";audio.suspend();audio.dispose();audio.dispose()
  expect(context.close).toHaveBeenCalledOnce();expect(oscillators.every(voice=>voice.disconnect.mock.calls.length>0)).toBe(true)
  context.resume.mockRejectedValueOnce(new Error("device"));context.suspend.mockRejectedValueOnce(new Error("device"));context.close.mockRejectedValueOnce(new Error("device"))
  const rejected=new DungeonAudio();rejected.unlock();rejected.suspend();rejected.dispose();await Promise.resolve()
  vi.stubGlobal("AudioContext",class{constructor(){throw new Error("No device")}});new DungeonAudio().unlock()
 }finally{vi.unstubAllGlobals()}
})
