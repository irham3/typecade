import { act } from "react"
import { createRoot } from "react-dom/client"
import { expect,it } from "vitest"
import { SurvivalRun, weaponIds } from "@typecade/game-rules"
import type { DungeonEffect } from "@typecade/contracts"
import { GameEventBridge } from "../bridge/game-event-bridge"
import { CombatFeedback } from "./CombatFeedback"
import { BuildStrip } from "./RunHud"

it("shows weapon ranks, charges and every attributed combat caption over its target",async()=>{
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
 const host=document.createElement("div");document.body.append(host);const root=createRoot(host),r=new SurvivalRun("equipment-ui"),s=r.state,bridge=new GameEventBridge()
 try{
  for(const rank of [1,5]){
   for(const id of weaponIds)s.weapons[id]={level:rank,timer:rank===1?0:50}
   await act(()=>root.render(<BuildStrip view={s}/>))
   expect(host.querySelectorAll(".weapon-badge")).toHaveLength(4)
   expect(host.querySelectorAll(".weapon-badge.evolved")).toHaveLength(rank===5?4:0)
  }
  await act(()=>root.render(<CombatFeedback view={s} bridge={bridge}/>))
  const heroEvents: Array<[DungeonEffect["kind"], number, string]> = [
   ["gold", 3, "+3"],
   ["heal", 2, "+2"],
   ["shield", 2, "+2"],
   ["level", 4, "LV 4"],
   ["upgrade", 2, "RANK 2"],
   ["barrier", 0, "BROKEN"],
   ["finisher", 1, "FATALITY"],
  ]
  for (const [kind, value, text] of heroEvents) {
   s.effects = [{ id: s.nextId++, kind, value, x: 0, z: 0, life: 1 } as DungeonEffect]
   await act(() => {
    root.render(<CombatFeedback view={{ ...s }} bridge={bridge} />)
    bridge.emit("projected", [{ id: s.effects[0]!.id, x: 300, y: 300, visible: true }])
   })
   expect(host.querySelector(".combat-caption")?.textContent).toContain(text)
  }
 }finally{await act(()=>root.unmount());host.remove();bridge.clear()}
})
