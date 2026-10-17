import { act } from "react"
import { createRoot } from "react-dom/client"
import { expect,it } from "vitest"
import { SurvivalRun } from "@typecade/game-rules"
import type { DungeonEffect,DungeonEvents } from "@typecade/contracts"
import { GameEventBridge } from "../bridge/game-event-bridge"
import { CombatFeedback } from "./CombatFeedback"
it("shows actual resources, levels and damage sources at their projected world positions",async()=>{
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
 const host=document.createElement("div");document.body.append(host);const root=createRoot(host),bridge=new GameEventBridge<DungeonEvents>(),s=new SurvivalRun("feedback").state
 try {
  await act(()=>root.render(<CombatFeedback view={s} bridge={bridge}/>))
  const cases:Array<[DungeonEffect["kind"],DungeonEffect["source"],number,string]>=[["barrier",undefined,0,"BROKEN"],["barrier",undefined,23,"-1"],["hit",undefined,-1,"-1"],["heal",undefined,0,"FULL"],["mana",undefined,0,"FULL"],["heal",undefined,2,"+2"],["mana",undefined,30,"+30"],["mana",undefined,12.34567,"+12.3"],["shield",undefined,4,"+4"],["block",undefined,2,"2"],["block",undefined,0,"PARRY"],["treasure",undefined,50,"+25"],["gold",undefined,5,"+5"],["level",undefined,5,"LV 5"],["upgrade",undefined,2,"RANK 2"],["finisher",undefined,1,"FATALITY"]]
  for(const [i,[kind,source,value,text]] of cases.entries()) {
   s.effects=[{id:i+1,kind,source,value,x:0,z:0,life:.55}]
   await act(()=>{root.render(<CombatFeedback view={{...s}} bridge={bridge}/>);bridge.emit("projected",[])})
   expect(host.querySelector(".combat-caption")).toBeNull()
   await act(()=>bridge.emit("projected",[{id:i+1,x:i%2?0:500,y:300,visible:true}]))
   expect(host.textContent).toContain(text);expect(host.querySelector("svg")).not.toBeNull()
  }
 }finally{await act(()=>root.unmount());bridge.clear();host.remove()}
})
