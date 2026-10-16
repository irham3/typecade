import { useEffect, useState } from "react"
import type { DungeonEvents } from "@typecade/contracts"
import type { GameEventBridge } from "../bridge/game-event-bridge"
export function PartyLabels({bridge}:{bridge:GameEventBridge<DungeonEvents>}){
 const [labels,setLabels]=useState<DungeonEvents["partyProjected"]>([])
 useEffect(()=>bridge.on("partyProjected",setLabels),[bridge])
 const placed:Array<{x:number;y:number;w:number}>=[]
 return <div className="party-labels" aria-hidden="true">{labels.map(p=>{
  const w=Math.min(150,p.name.length*(window.innerWidth<700?5:7)+20),x=Math.max(w/2+8,Math.min(window.innerWidth-w/2-8,p.x))
  let y=p.y
  for(let i=0;i<6&&placed.some(a=>Math.abs(x-a.x)<(w+a.w)/2+4&&Math.abs(y-a.y)<32);i++)y-=34
  placed.push({x,y,w})
  return <div key={p.id} className="party-name" style={{left:x,top:y,maxWidth:w,color:`#${p.color.toString(16).padStart(6,"0")}`}}><strong>{p.name}</strong><small>{p.role.toUpperCase()}{p.hp===0?" · DOWNED":""}</small></div>
 })}</div>
}
