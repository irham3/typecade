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
  const cases:Array<[DungeonEffect["kind"],DungeonEffect["source"],number,string]>=[["barrier",undefined,0,"BARRICADE BROKEN"],["barrier",undefined,23,"BARRICADE -1"],["hit",undefined,-1,"-1 HP"],["blast",undefined,-2,"FUSE BURST"],["blast",undefined,1,"BLAST"],["heal",undefined,0,"HP FULL"],["mana",undefined,0,"MANA FULL"],["heal",undefined,2,"+2 HP"],["mana",undefined,30,"+30 MP"],["mana",undefined,12.34567,"+12.3 MP"],["shield",undefined,4,"4 SHIELD"],["block",undefined,2,"BLOCK 2"],["block",undefined,0,"PARRY"],["treasure",undefined,50,"+25 GOLD"],["pickup",undefined,25,"+25 XP"],["pickup",undefined,0,"COLLECTED"],["level",undefined,5,"LEVEL 5"],["upgrade",undefined,2,"RANK 2"],["shatter","lightning",1,"CHAIN ZAP"],["shatter","vowels",1,"FIREBOLT"],["shatter","sentry",1,"SENTRY HIT"],["shatter","explosion",1,"BLAST"],["shatter","storm",1,"STORM"],["shatter","cleave",1,"CLEAVE"],["shatter","blade",1,"STRIKE"]]
  for(const [i,[kind,source,value,text]] of cases.entries()) {
   s.effects=[{id:i+1,kind,source,value,x:0,z:0,life:.55}]
   await act(()=>{root.render(<CombatFeedback view={{...s}} bridge={bridge}/>);bridge.emit("projected",[])})
   expect(host.querySelector(".combat-caption")).toBeNull()
   await act(()=>bridge.emit("projected",[{id:i+1,x:i%2?0:500,y:300,visible:true}]))
   expect(host.textContent).toContain(text);expect(host.querySelector("svg")).not.toBeNull()
  }
 }finally{await act(()=>root.unmount());bridge.clear();host.remove()}
})
