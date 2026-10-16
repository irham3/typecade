import { expect,it } from "vitest"
import { partyWorld } from "./party-world"
import { createArenaCombat,createRacePlayer,defaultRaceConfig,type RaceRoomSnapshot } from "@typecade/race-rules"
it("projects only actual nearby peers and preserves stable identity, actions and role state",()=>{
 expect(partyWorld(null,null,false)).toBeNull()
 const players=Array.from({length:100},(_,i)=>({...createRacePlayer(String(i),`Knight ${i}`,"classic"),cursor:i*100}))
 const room:RaceRoomSnapshot={code:"ABCDEFGH",hostId:"0",phase:"racing",config:{...defaultRaceConfig},text:"hit",players,startsAt:0,endsAt:1000,serverNow:100}
 expect(partyWorld(room,"50",false)!.players).toHaveLength(6)
 expect(partyWorld(room,"50",false)!.players[1]!.id).toBe("49")
 expect(partyWorld(room,null,false)!.players).toHaveLength(5)
 room.config.mode="clash";room.combat=createArenaCombat("clash",players.slice(0,4),0);room.players=players.slice(0,4)
 room.combat.actions=[{id:1,player:"0",target:"1",kind:"strike",value:12,at:50}]
 expect(partyWorld(room,"0",true)!.players[0]).toMatchObject({action:"strike",target:"1",actionAt:50})
 room.config.mode="raid";room.combat.mode="raid";room.combat.players["3"]!.hp=0
 expect(partyWorld(room,"3",false)!.players[0]).toMatchObject({role:"tank",hp:0})
 expect(partyWorld(room,"0",false)!.boss?.maxHp).toBe(1000)
 room.config.mode="sprint";room.combat.mode="sprint";room.text="DODGE IGNITE hit";expect(partyWorld(room,null,false)!.players).toHaveLength(4);expect(partyWorld(room,"0",false)!.obstacles).toHaveLength(3);expect(partyWorld(room,"missing",false)!.players).toHaveLength(4);
 delete room.combat.players["3"];expect(partyWorld(room,"0",false)!.players.find(p=>p.id==="3")!.hp).toBe(100);
 room.config.mode=undefined;room.combat=undefined;expect(partyWorld(room,"0",false)!.mode).toBe("sprint")
})
