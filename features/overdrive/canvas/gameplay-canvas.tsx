"use client"
import { useEffect, useRef } from "react"
import { Application } from "pixi.js"
import { CombatScene, type SceneState } from "./combat-scene"
import { getLatestPresentationEventId, type OverdrivePresentationEvent } from "../presentation/events"

export type GameplayCanvasProps = SceneState & { events: readonly OverdrivePresentationEvent[] }

export function GameplayCanvas(props: GameplayCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<CombatScene | null>(null)
  const latest = useRef(props)
  latest.current = props
  const lastConsumedEventIdRef = useRef(0)

  useEffect(() => {
    let cancelled = false
    let observer: ResizeObserver | null = null
    let app: Application | null = null

    void (async () => {
      const host = hostRef.current
      if (!host) return
      
      // Before async initialization, capture baseline ID so we don't replay stale events
      lastConsumedEventIdRef.current = getLatestPresentationEventId()
      
      app = new Application()
      await app.init({
        background: 0x0a0e14,
        antialias: true,
        autoDensity: true,
        resolution: Math.min(devicePixelRatio || 1, 2)
      })
      if (cancelled) {
        try { app.destroy(true) } catch (e) {}
        return
      }
      
      host.replaceChildren(app.canvas)
      Object.assign(app.canvas.style, { width: "100%", height: "100%", display: "block" })
      
      const scene = new CombatScene(app, latest.current)
      sceneRef.current = scene
      
      const resize = () => {
        const r = host.getBoundingClientRect()
        // Do not force minimum renderer height larger than its host
        const w = Math.max(1, Math.floor(r.width))
        const h = Math.max(1, Math.floor(r.height))
        if (app && ((app.screen.width !== w) || (app.screen.height !== h))) {
          app.renderer.resize(w, h)
          scene.resize()
        }
      }
      observer = new ResizeObserver(resize)
      observer.observe(host)
      resize()
      
      scene.sync(latest.current)
      
      // Consume events immediately after init
      for (const event of latest.current.events) {
        if (event.id > lastConsumedEventIdRef.current) scene.handle(event)
        if (event.id > lastConsumedEventIdRef.current) lastConsumedEventIdRef.current = event.id
      }
      host.dataset.eventId = String(lastConsumedEventIdRef.current)
    })()
    
    return () => {
      cancelled = true
      observer?.disconnect()
      sceneRef.current?.destroy()
      sceneRef.current = null
      try { app?.destroy(true, { children: true }) } catch (e) {}
    }
  }, [])
  
  useEffect(() => {
    const scene = sceneRef.current
    if (scene) {
      scene.sync(props)
      for (const event of props.events) {
        if (event.id > lastConsumedEventIdRef.current) scene.handle(event)
        if (event.id > lastConsumedEventIdRef.current) lastConsumedEventIdRef.current = event.id
      }
      if (hostRef.current) {
        hostRef.current.dataset.eventId = String(lastConsumedEventIdRef.current)
      }
    }
  }, [props])
  
  return (
    <div 
      ref={hostRef} 
      data-pixi-host 
      data-testid="pixi-gameplay" 
      data-current-word={props.currentWord}
      data-caret-index={String(props.caretIndex)}
      data-score={String(props.score)}
      data-stage={props.stage}
      data-event-id={String(lastConsumedEventIdRef.current)}
      className="absolute inset-0 h-full w-full min-h-0 min-w-0 overflow-hidden bg-bg-0"
    />
  )
}
