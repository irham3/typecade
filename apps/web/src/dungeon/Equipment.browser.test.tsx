import { act } from "react"
import { createRoot } from "react-dom/client"
import { expect,it } from "vitest"
import { SurvivalRun, weaponIds } from "@typecade/game-rules"
import type { DamageSource, DungeonEffect } from "@typecade/contracts"
import { GameEventBridge } from "../bridge/game-event-bridge"
import { CombatFeedback } from "./CombatFeedback"
import { BuildStrip } from "./RunHud"
import { EmberField } from "./ui/Ornament"

it("shows weapon ranks, charges and every attributed combat caption over its target",async()=>{
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
 const host=document.createElement("div");document.body.append(host);const root=createRoot(host),r=new SurvivalRun("equipment-ui"),s=r.state,bridge=new GameEventBridge()
 try{
  for(const rank of [1,5]){
   for(const id of weaponIds)s.weapons[id]={level:rank,timer:rank===1?0:50}
   await act(()=>root.render(<><BuildStrip view={s}/><EmberField/></>))
   expect(host.querySelectorAll(".weapon-badge")).toHaveLength(4)
   expect(host.querySelectorAll(".weapon-badge.evolved")).toHaveLength(rank===5?4:0)
  }
  await act(()=>root.render(<CombatFeedback view={s} bridge={bridge}/>))
  const sources:DamageSource[]=["blade","cleave","storm","lightning","vowels","sentry","explosion","orbit","nova","meteor","frost","whirl","finisher"]
  for(const source of sources){
   s.effects=[{id:s.nextId++,kind:"shatter",source,x:0,z:0,value:1,life:1}]
   await act(()=>{root.render(<CombatFeedback view={{...s}} bridge={bridge}/>);bridge.emit("projected",[{id:s.effects[0]!.id,x:300,y:300,visible:true}])})
   expect(host.querySelector(".combat-caption")?.textContent).toBeTruthy()
  }
  s.effects=[{id:s.nextId++,kind:"finisher",x:0,z:0,value:1,life:1} as DungeonEffect]
  await act(()=>{root.render(<CombatFeedback view={{...s}} bridge={bridge}/>);bridge.emit("projected",[{id:s.effects[0]!.id,x:300,y:300,visible:true}])})
  expect(host.textContent).toContain("FATALITY!")
 }finally{await act(()=>root.unmount());host.remove();bridge.clear()}
})
