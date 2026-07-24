"use client"
import { useEffect, useRef } from "react"
import { Application } from "pixi.js"
import type { StageType } from "@/lib/engine/overdrive"
import { CombatScene, type SceneState } from "./combat-scene"

export type GameplayCanvasProps=SceneState

export function GameplayCanvas(props:GameplayCanvasProps){
  const hostRef=useRef<HTMLDivElement>(null),sceneRef=useRef<CombatScene|null>(null),latest=useRef(props);latest.current=props
  useEffect(()=>{let cancelled=false,observer:ResizeObserver|null=null,app:Application|null=null
    void(async()=>{const host=hostRef.current;if(!host)return;app=new Application();await app.init({background:0x0a0e14,antialias:true,autoDensity:true,resolution:Math.min(devicePixelRatio||1,2)});if(cancelled){try{app.destroy(true)}catch(e){}return}host.replaceChildren(app.canvas);Object.assign(app.canvas.style,{width:"100%",height:"100%",display:"block"});const scene=new CombatScene(app,latest.current);sceneRef.current=scene;const resize=()=>{const r=host.getBoundingClientRect(),w=Math.max(320,Math.floor(r.width)),h=Math.max(320,Math.floor(r.height));if(app&&((app.screen.width!==w)||(app.screen.height!==h))){app.renderer.resize(w,h);scene.resize()}};observer=new ResizeObserver(resize);observer.observe(host);resize();scene.sync(latest.current)})()
    return()=>{cancelled=true;observer?.disconnect();sceneRef.current?.destroy();sceneRef.current=null;try{app?.destroy(true,{children:true})}catch(e){}}
  },[])
  useEffect(()=>sceneRef.current?.sync(props),[props])
  return <div ref={hostRef} data-pixi-host data-testid="pixi-gameplay" data-current-word={props.currentWord} className="absolute inset-0 h-full w-full min-h-0 min-w-0 overflow-hidden bg-bg-0"/>
}
