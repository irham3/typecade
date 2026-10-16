import { useEffect, useRef, useState } from "react"
import type { CSSProperties } from "react"
import type { DungeonEvents, DungeonLabel, DungeonState } from "@typecade/contracts"
import type { GameEventBridge } from "../bridge/game-event-bridge"

export function TargetLabels({ view, bridge }: { view: DungeonState; bridge: GameEventBridge<DungeonEvents> }) {
 const [points, setPoints] = useState<DungeonLabel[]>([])
 const [size, setSize] = useState({width:window.innerWidth,height:window.innerHeight})
 const layer = useRef<HTMLDivElement>(null)
 useEffect(() => bridge.on("projected", setPoints), [bridge])
 useEffect(() => { const node=layer.current!; const observer=new ResizeObserver(()=>setSize({width:node.clientWidth,height:node.clientHeight}));observer.observe(node);return()=>observer.disconnect() },[])
 const {width,height}=size
 const compact = width < 700, landscape=height<520, tight=height<360, pad = 12, top = tight?74:landscape ? 84 : compact ? 114 : 100, bottom = tight?8:landscape ? 20 : compact ? 148 : 164
 const used: Array<{ x: number; y: number; w: number; h: number }> = []
 const ids = [...view.queue].sort((a,b) => Number(b === view.target) - Number(a === view.target))
 return <div className={`target-labels ${tight?"tight":""}`} ref={layer} aria-label="Enemy targets">{ids.map(id => {
  const e = view.enemies.find(e => e.id === id), point = points.find(p => p.id === id)
  if (!e || !point || !e.words.length) return null
  const word = e.words[0]!, active = id === view.target, w = Math.max(88, Math.min(width - pad * 2, word.length * (compact ? 10 : 12) + 38)), h = tight?46:58
  let x = Math.max(pad, Math.min(width - w - pad, point.x - w / 2)), y = Math.max(top, Math.min(height - bottom - h, point.y - 44))
  const intersects = (a: {x:number;y:number;w:number;h:number}) => x < a.x + a.w + 8 && x + w + 8 > a.x && y < a.y + a.h + 8 && y + h + 8 > a.y
  for (let i=0; i<24 && used.some(intersects); i++) {
   y += h + 10
   if (y > height - bottom - h) { y = top; x = Math.max(pad, Math.min(width - w - pad, x + (i % 2 ? -1 : 1) * (w + 12))) }
  }
  if (used.some(intersects)) return null
  used.push({x,y,w,h})
  const prefix = active ? view.prefix.length : 0
  return <div key={id} className={`enemy-label kind-${e.kind} ${active ? "locked" : ""}`} data-testid="enemy-label" data-enemy-id={id} data-word={word} style={{left:x,top:y,width:w,"--lead-x":`${point.x-x-w/2}px`,"--lead-y":`${Math.max(0,point.y-y-h)}px`} as CSSProperties}>
   <small>{e.kind === "bomber" ? `FUSE ${Math.max(0,e.attack).toFixed(1)}s` : e.kind === "boss" ? "OBSIDIAN MINOTAUR" : e.kind === "barrel" ? "EXPLOSIVE BARREL" : e.kind === "chest" ? "TREASURE" : active ? "TARGET LOCKED" : e.kind.toUpperCase()}</small>
   <strong>{e.words.length>1 && <em>×{e.words.length} </em>}<span className="typed">{word.slice(0,prefix)}</span><span className={active ? "current-letter" : ""}>{word[prefix]}</span>{word.slice(prefix+1)}</strong>
   <div className="armor-stack">{e.words.map((_,i)=><i key={i} className={i===e.words.length-1 ? "health" : i===0 ? "shield" : "armor"}/>)}</div>
   {active && <span className="target-leader" aria-hidden="true"/>}
  </div>
 })}</div>
}
