import { act,useEffect } from "react"
import { createRoot } from "react-dom/client"
import { expect,it,vi } from "vitest"
import { dungeonSaveKey,useSurvivalRun } from "./useSurvivalRun"
import { SurvivalRun } from "@typecade/game-rules"

it("keeps checkpoints, clocks and input safe across visibility, resize, restore and unmount",async()=>{
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
 vi.useFakeTimers({toFake:["setInterval","clearInterval","Date"]});vi.setSystemTime(10000)
 const performanceNow=vi.spyOn(performance,"now").mockImplementation(()=>Date.now())
 const host=document.createElement("div");document.body.append(host);const root=createRoot(host)
 let controls!:ReturnType<typeof useSurvivalRun>
 function Harness({enabled}:{enabled:boolean}){const value=useSurvivalRun(enabled);useEffect(()=>{controls=value});return <span>{value.view.phase}</span>}
 localStorage.setItem("typecade:dungeon:best:v1","30")
 try{
  await act(()=>root.render(<Harness enabled/>));expect(controls.best).toBe(30)
  await act(()=>vi.advanceTimersByTime(100));expect(controls.view.time).toBe(0)
  await act(()=>{controls.start();controls.resume()});await act(()=>vi.advanceTimersByTime(6000));expect(controls.view.time).toBeGreaterThan(5)
  expect(localStorage.getItem(dungeonSaveKey)).not.toBeNull()
  await act(()=>window.dispatchEvent(new Event("blur")));expect(controls.view.phase).toBe("paused")
  const time=controls.view.time;await act(()=>vi.advanceTimersByTime(1000));expect(controls.view.time).toBe(time)
  await act(()=>controls.resume());vi.stubGlobal("innerWidth",390);await act(()=>window.dispatchEvent(new Event("resize")));expect(controls.view.labelLimit).toBe(4)
  vi.stubGlobal("innerWidth",1000);await act(()=>window.dispatchEvent(new Event("resize")));expect(controls.view.labelLimit).toBe(6)
  const hidden=vi.spyOn(document,"hidden","get").mockReturnValue(false);await act(()=>document.dispatchEvent(new Event("visibilitychange")));expect(controls.view.phase).toBe("arena")
  hidden.mockReturnValue(true);await act(()=>vi.advanceTimersByTime(100));await act(()=>document.dispatchEvent(new Event("visibilitychange")));expect(controls.view.phase).toBe("paused");hidden.mockRestore()
  await act(()=>controls.resume());await act(()=>window.dispatchEvent(new Event("pagehide")));expect(controls.view.phase).toBe("paused")
  let restored=false;await act(()=>{restored=controls.restore("{}");controls.input("x")});expect(restored).toBe(false)
  const next=new SurvivalRun("cloud-restored","id");next.start();next.state.time=40;next.state.worldTime=40
  await act(()=>{restored=controls.restore(next.serialize())});expect(restored).toBe(true);expect(controls.view.seed).toBe("cloud-restored");expect(controls.best).toBe(40)
  expect(controls.checkpoint()).toContain("cloud-restored")
  await act(()=>root.render(<Harness enabled={false}/>));await act(()=>controls.fresh("id"));expect(controls.view.language).toBe("id");expect(controls.view.phase).toBe("ready")
 }finally{await act(()=>root.unmount());host.remove();performanceNow.mockRestore();vi.useRealTimers();vi.unstubAllGlobals();localStorage.clear()}
})
