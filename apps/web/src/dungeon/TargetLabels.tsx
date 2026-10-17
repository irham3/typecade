import { useEffect, useRef, useState } from "react"
import type { CSSProperties } from "react"
import type { DungeonEvents, DungeonLabel, DungeonState, SupplyKind } from "@typecade/contracts"
import type { GameEventBridge } from "../bridge/game-event-bridge"
import { dungeonObjects, dungeonSupplies, enemyProfiles } from "@typecade/content"
import { Glyph } from "./Glyph"
import { LifeDrops } from "./ui/LifeDrops"
import { useTypoPulse } from "./TypingBar"

/** Gap in pixels between a label's bottom edge and the enemy's projected head. */
const LABEL_GAP = 18

export function TargetLabels({ view, bridge, tutorial=false }: { view: DungeonState; bridge: GameEventBridge<DungeonEvents>; tutorial?:boolean }) {
 const [points, setPoints] = useState<DungeonLabel[]>([])
 const [size, setSize] = useState({width:window.innerWidth,height:window.innerHeight})
 const layer = useRef<HTMLDivElement>(null)
 const typo = useTypoPulse(view.errors)
 useEffect(() => bridge.on("projected", setPoints), [bridge])
 useEffect(() => { const node=layer.current!; const observer=new ResizeObserver(()=>setSize({width:node.clientWidth,height:node.clientHeight}));observer.observe(node);return()=>observer.disconnect() },[])
 const {width,height}=size
 const compact = width < 700, landscape=height<520, tight=height<360, pad = 12, top = tutorial&&compact&&!landscape?300:view.notice.includes(" acquired.")?(landscape?166:212):tight?74:landscape ? 106 : compact ? 145 : 116, bottom = tight?8:landscape ? 20 : compact ? 148 : 164
 const used: Array<{ x: number; y: number; w: number; h: number }> = []
 const ids = [...view.queue].sort((a,b) => Number(b === view.target) - Number(a === view.target))
  return <div className={`target-labels ${tight?"tight":""} ${typo}`} ref={layer} aria-label="Enemy targets">{ids.map(id => {
  const e = view.enemies.find(e => e.id === id), point = points.find(p => p.id === id)
  if (!e || !point || !e.words.length) return null
  const object=dungeonObjects.includes(e.kind),supply=e.kind in dungeonSupplies?dungeonSupplies[e.kind as SupplyKind]:null
  const word = e.words[0]!, active = id === view.target, w = Math.max(88, Math.min(width - pad * 2, word.length * (compact ? 10 : 12) + (object?48:30))), h = (tight?30:34) + (object?0:12)
  let x = Math.max(pad, Math.min(width - w - pad, point.x - w / 2)), y = Math.max(top, Math.min(height - bottom - h, point.y - h - LABEL_GAP))
  const intersects = (a: {x:number;y:number;w:number;h:number}) => x < a.x + a.w + 8 && x + w + 8 > a.x && y < a.y + a.h + 8 && y + h + 8 > a.y
  for (let i=0; i<24 && used.some(intersects); i++) {
   y += h + 10
   if (y > height - bottom - h) { y = top; x = Math.max(pad, Math.min(width - w - pad, x + (i % 2 ? -1 : 1) * (w + 12))) }
  }
  // Never drop a label: if no free slot was found it keeps its own spot (overlap beats a missing word).
  if (used.some(intersects)) { x = Math.max(pad, Math.min(width - w - pad, point.x - w / 2)); y = Math.max(top, Math.min(height - bottom - h, point.y - h - LABEL_GAP)) }
  used.push({x,y,w,h})
  // Lock-free typing: every word that starts with what was typed shows that progress.
  const matching = view.prefix.length > 0 && word.startsWith(view.prefix), prefix = matching ? view.prefix.length : 0
  return <div key={id} className={`enemy-label kind-${e.kind} ${object?"object-label":"foe-label"} ${active ? "locked" : ""} ${view.prefix && !matching ? "dimmed" : ""}`} data-testid="enemy-label" data-enemy-id={id} data-word={word} title={supply?`${supply.name} · ${supply.benefit}`:e.motion==="windup"?`ENEMY · CHARGE ${e.motionTime!.toFixed(1)}s`:e.kind==="mage"?e.attack<1.1?`AIR · CAST ${Math.max(0,e.attack).toFixed(1)}s`:"AIR · MAGE":e.kind==="bat"?"AIR · BAT":e.kind==="bomber"?`ENEMY · FUSE ${Math.max(0,e.attack).toFixed(1)}s`:e.kind==="boss"?"BOSS · MINOTAUR":e.kind==="barrel"?"OBJECT · EXPLODES":e.kind==="chest"?"LOOT · +25G / +50XP":enemyProfiles[e.kind]?profileTag(e):`${active?"LOCKED":"ENEMY"} · ${e.kind.toUpperCase()}`} style={{left:x,top:y,width:w,"--lead-x":`${point.x-x-w/2}px`,"--lead-y":`${Math.max(0,point.y-y-h)}px`} as CSSProperties}>

   {!object && <LifeDrops layers={e.words.length}/>}
   <strong>{object&&<Glyph name={supply?supply.icon:e.kind==="chest"?"gem":"storm"}/>}<span className="typed">{word.slice(0,prefix)}</span><span className={matching ? "current-letter" : ""}>{word[prefix]}</span>{word.slice(prefix+1)}</strong>
   {e.words.length > 1 && <span className="next-words" aria-label="Next armor words">{e.words.slice(1).join(" · ")}</span>}
   {active && <span className="target-leader" aria-hidden="true"/>}
  </div>
 })}</div>
}


function profileTag(e: DungeonState["enemies"][number]) {
 const profile=enemyProfiles[e.kind]!,timed=["archer","imp","shaman","necromancer"].includes(e.kind)&&e.attack<1.1
 return timed?`${profile.tag} · ${e.kind==="shaman"?"WARD":e.kind==="necromancer"?"SUMMON":"SHOT"} ${Math.max(0,e.attack).toFixed(1)}s`:`${profile.tag} · ${profile.name}`
}
