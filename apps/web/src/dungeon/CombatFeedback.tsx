import { useEffect,useState } from "react"
import type { DungeonEvents,DungeonLabel,DungeonState } from "@typecade/contracts"
import type { GameEventBridge } from "../bridge/game-event-bridge"
import { Glyph } from "./Glyph"
import { CoinIcon } from "./ui/CoinIcon"
import { captionFor, type CaptionIcon } from "./feedbackCaptions"

function CaptionMark({icon}:{icon:CaptionIcon}) {
 if(icon==="coin")return <CoinIcon/>
 return <Glyph name={icon==="mana"?"gem":icon}/>
}

/** Floating icon + number pops beside the hero. No plates: outlined text over the world. */
export function CombatFeedback({view,bridge}:{view:DungeonState;bridge:GameEventBridge<DungeonEvents>}) {
 const [points,setPoints]=useState<DungeonLabel[]>([])
 useEffect(()=>bridge.on("projected",setPoints),[bridge])
 const captions=view.effects.flatMap(fx=>{const caption=captionFor(fx);return caption?[{fx,caption}]:[]}).slice(-6)
 return <div className="combat-feedback" aria-hidden="true">{captions.map(({fx,caption},i)=>{
  const point=points.find(p=>p.id===fx.id)
  if(!point)return null
  return <span key={fx.id} className={`combat-caption tone-${caption.tone}`} style={{left:Math.max(60,Math.min(window.innerWidth-60,point.x)),top:point.y+46+(i%3)*20}}><CaptionMark icon={caption.icon}/>{caption.text}</span>
 })}</div>
}
