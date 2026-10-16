import { useCallback, useEffect, useRef, useState } from "react"
import { CombatLesson } from "@typecade/game-rules"
import type { DungeonEvents, DungeonLanguage } from "@typecade/contracts"
import type { GameEventBridge } from "../bridge/game-event-bridge"
import { dungeonSnapshot } from "./useSurvivalRun"

export function useCombatLesson(enabled:boolean,language:DungeonLanguage,bridge:GameEventBridge<DungeonEvents>){
 const [initial]=useState(()=>new CombatLesson(language)),controller=useRef(initial)
 const [snapshot,setSnapshot]=useState(()=>({view:dungeonSnapshot(initial.run.state),complete:initial.complete,lesson:initial.lesson,step:initial.step}))
 const publish=useCallback(()=>{const c=controller.current,s=c.run.state;bridge.emit("frame",s);setSnapshot({view:dungeonSnapshot(s),complete:c.complete,lesson:c.lesson,step:c.step})},[bridge])
 const pause=useCallback(()=>{controller.current.run.pause();publish()},[publish])
 const resume=useCallback(()=>{controller.current.run.resume();publish()},[publish])
 const input=useCallback((key:string)=>{if(key==="Enter"&&controller.current.complete)controller.current.next();else controller.current.input(key);publish()},[publish])
 const next=()=>{controller.current.next();publish()}
 useEffect(()=>{
  if(!enabled)return
  controller.current=new CombatLesson(language);publish()
  let last=performance.now(),published=0
  const timer=window.setInterval(()=>{
   const now=performance.now(),dt=Math.min(.1,(now-last)/1000);last=now
   if(document.hidden||!["arena","skills"].includes(controller.current.run.state.phase))return
   const phase=controller.current.run.state.phase
   controller.current.advance(dt);bridge.emit("frame",controller.current.run.state)
   if(now-published>100||phase!==controller.current.run.state.phase){publish();published=now}
  },1000/30)
  const hidden=()=>{if(document.hidden)pause()}
  document.addEventListener("visibilitychange",hidden);window.addEventListener("blur",pause)
  return()=>{window.clearInterval(timer);document.removeEventListener("visibilitychange",hidden);window.removeEventListener("blur",pause)}
 },[enabled,language,bridge,publish,pause])
 return {...snapshot,input,pause,resume,next}
}
