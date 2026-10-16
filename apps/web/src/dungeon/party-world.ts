import type { PartyWorld } from "@typecade/contracts"
import type { RaceRoomSnapshot } from "@typecade/race-rules"
const colors=[0x4999d4,0xd06b62,0x8ab768,0xd5b35a]
export function partyWorld(room:RaceRoomSnapshot|null,ownId:string|null,casting:boolean):PartyWorld|null{
 if(!room)return null
 const own=room.players.find(p=>p.id===ownId),order=room.combat?.order??room.players.map(p=>p.id)
 const focus={x:room.config.mode==="sprint"||!room.config.mode?(room.combat?.players[ownId??""]?.distance??0)*.4:0,z:0}
 const near=room.players.filter(p=>p.id!==ownId).sort((a,b)=>Math.abs(a.cursor-(own?.cursor??0))-Math.abs(b.cursor-(own?.cursor??0))).slice(0,5)
 const players=(own?[own,...near]:near).map((p,i)=>{
  const action=[...(room.combat?.actions??[])].reverse().find(a=>a.player===p.id),index=order.indexOf(p.id)
  const sprint=room.config.mode==="sprint"||!room.config.mode,clash=room.config.mode==="clash"
  const gap=room.combat?(room.combat.players[p.id]?.distance??0)-(room.combat.players[ownId??""]?.distance??0):p.cursor-(own?.cursor??0)
  const x=sprint?Math.max(-7,Math.min(7,gap*.4)):clash?Math.sin(index*Math.PI*2/order.length)*4:(index%2?-2:1)
  const z=sprint?(i-1.5)*1.8:clash?Math.cos(index*Math.PI*2/order.length)*4:(index<2?1:4)
  return {id:p.id,name:p.name,x:x+focus.x,z,color:colors[index%4]!,hp:room.combat?.players[p.id]?.hp??100,action:action?.kind??"idle",actionAt:action?.at??0,target:action?.target??null,role:room.combat?.players[p.id]?.role??p.role??"dps"}
 })
 const obstacles:NonNullable<PartyWorld["obstacles"]>=room.config.mode==="sprint"&&own?room.text.slice(own.cursor).split(" ").slice(0,6).map((word,i)=>({x:focus.x+2+i*2,z:-2.7,word,kind:["DODGE","LOMPAT"].includes(word)?"barrier" as const:["IGNITE","LEDAKKAN"].includes(word)?"barrel" as const:"goblin" as const})):[]
 const bossAction=room.combat?.actions.findLast(action=>action.kind==="boss-hit")
 return {mode:room.config.mode??"sprint",phase:room.phase,casting,ownId,players,obstacles,boss:room.config.mode==="raid"&&room.combat?{hp:room.combat.bossHp,maxHp:room.combat.bossMaxHp,nextAttack:room.combat.nextAttack,attackAt:bossAction?.at??-1000,target:bossAction?.target??null}:null,now:room.serverNow,focus}
}
