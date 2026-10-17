import { useEffect,useState } from "react"
import type { DungeonEvents,DungeonLabel,DungeonState } from "@typecade/contracts"
import type { GameEventBridge } from "../bridge/game-event-bridge"
import { Glyph } from "./Glyph"
export function CombatFeedback({view,bridge}:{view:DungeonState;bridge:GameEventBridge<DungeonEvents>}) {
 const [points,setPoints]=useState<DungeonLabel[]>([])
 useEffect(()=>bridge.on("projected",setPoints),[bridge])
 const effects=view.effects.filter(f=>f.source&&f.kind==="shatter"||f.kind==="hit"&&f.value<0||["blast","treasure","heal","mana","shield","block","pickup","level","upgrade","barrier"].includes(f.kind)).slice(-6)
 return <div className="combat-feedback" aria-hidden="true">{effects.map((fx,i)=>{
  const point=points.find(p=>p.id===fx.id)
  if(!point)return null
  const text=fx.kind==="barrier"?fx.value===0?"BARRICADE BROKEN":"BARRICADE -1":fx.kind==="hit"?`${fx.value} HP`:fx.kind==="blast"?fx.value<0?"FUSE BURST":"BLAST":fx.kind==="heal"?fx.value?`+${fx.value} HP`:"HP FULL":fx.kind==="mana"?fx.value?`+${Math.round(fx.value*10)/10} MP`:"MANA FULL":fx.kind==="shield"?`${fx.value} SHIELD`:fx.kind==="block"?fx.value?`BLOCK ${fx.value}`:"PARRY":fx.kind==="treasure"?"CHEST OPEN · +25 GOLD":fx.kind==="pickup"?fx.value?`+${fx.value} XP`:"COLLECTED":fx.kind==="level"?`LEVEL ${fx.value}`:fx.kind==="upgrade"?`RANK ${fx.value}`:fx.source==="lightning"?"CHAIN ZAP":fx.source==="vowels"?"FIREBOLT":fx.source==="sentry"?"SENTRY HIT":fx.source==="explosion"?"BLAST":fx.source==="storm"?"STORM":fx.source==="cleave"?"CLEAVE":"STRIKE"
  return <span key={fx.id} className={`combat-caption source-${fx.source??fx.kind}`} style={{left:Math.max(100,Math.min(window.innerWidth-100,point.x)),top:point.y+18+(i%3)*24}}><Glyph name={fx.kind==="heal"||fx.kind==="hit"?"heart":fx.kind==="mana"||fx.kind==="pickup"||fx.kind==="level"||fx.kind==="treasure"?"gem":fx.kind==="shield"||fx.kind==="block"||fx.kind==="barrier"?"shield":fx.source==="vowels"?"flame":fx.source==="lightning"?"bolt":"sword"}/>{text}</span>
 })}</div>
}
