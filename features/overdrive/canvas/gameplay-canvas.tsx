"use client"
import { useEffect, useRef } from "react"
import { Application } from "pixi.js"
import { CombatScene, type SceneState } from "./combat-scene"
import { loadCombatRigAssets } from "./assets/combat-assets"
import { V } from "./visual-assets"
import { getLatestPresentationEventId, type OverdrivePresentationEvent } from "../presentation/events"

export type GameplayCanvasProps = SceneState & {
  events: readonly OverdrivePresentationEvent[]
  onReady?: () => void
  onInitializationError?: (error: Error) => void
}

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value))
}

function consumePendingEvents(
  scene: CombatScene,
  events: readonly OverdrivePresentationEvent[],
  lastConsumedRef: React.MutableRefObject<number>,
  hostRef: React.RefObject<HTMLDivElement | null>
): void {
  for (const event of events) {
    if (event.id > lastConsumedRef.current) {
      scene.handle(event)
      lastConsumedRef.current = event.id
    }
  }
  if (hostRef.current) {
    hostRef.current.dataset.eventId = String(lastConsumedRef.current)
  }
}

function waitForUsableSize(
  host: HTMLElement,
  isCancelled: () => boolean,
  register: (observer: ResizeObserver | null) => void,
): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    if (isCancelled()) return resolve(null)

    const r = host.getBoundingClientRect()
    if (r.width >= 2 && r.height >= 2) {
      return resolve({ width: Math.floor(r.width), height: Math.floor(r.height) })
    }

    const observer = new ResizeObserver((entries) => {
      if (isCancelled()) {
        observer.disconnect()
        register(null)
        resolve(null)
        return
      }
      const rect = entries[0].contentRect
      if (rect.width >= 2 && rect.height >= 2) {
        observer.disconnect()
        register(null)
        resolve({ width: Math.floor(rect.width), height: Math.floor(rect.height) })
      }
    })

    register(observer)
    observer.observe(host)
  })
}

export function GameplayCanvas(props: GameplayCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<CombatScene | null>(null)
  const lastConsumedEventIdRef = useRef(0)

  const latestRef = useRef(props)
  useEffect(() => {
    latestRef.current = props
  }, [props])

  useEffect(() => {
    let cancelled = false
    let sizeObserver: ResizeObserver | null = null
    let resizeListenerObserver: ResizeObserver | null = null
    let app: Application | null = null

    void (async () => {
      try {
        const host = hostRef.current
        if (!host) return

        lastConsumedEventIdRef.current = getLatestPresentationEventId()

        const size = await waitForUsableSize(
          host,
          () => cancelled,
          (obs) => { sizeObserver = obs }
        )

        if (cancelled || !size) return

        const appInstance = new Application()
        await appInstance.init({
          width: size.width,
          height: size.height,
          background: V.bg,
          antialias: true,
          autoDensity: true,
          resolution: Math.min(window.devicePixelRatio || 1, 2),
          preference: "webgl",
        })

        if (cancelled) {
          appInstance.destroy(true)
          return
        }

        app = appInstance
        host.replaceChildren(app.canvas)
        Object.assign(app.canvas.style, { width: "100%", height: "100%", display: "block" })

        const assets = await loadCombatRigAssets(latestRef.current.stage)
        if (cancelled) {
          appInstance.destroy(true)
          return
        }
        host.dataset.wardenRig = assets.warden.definition.id
        host.dataset.enemyRig = assets.enemy.definition.id
        host.dataset.rigFallback = String(
          assets.warden.fallback || assets.enemy.fallback,
        )
        host.dataset.environmentId = assets.environment.definition.id
        host.dataset.environmentFallback = String(assets.environment.fallback)

        const scene = new CombatScene(app, host, latestRef.current, assets)
        sceneRef.current = scene

        scene.sync(latestRef.current)
        consumePendingEvents(scene, latestRef.current.events, lastConsumedEventIdRef, hostRef)
        latestRef.current.onReady?.()

        const resize = () => {
          const rect = host.getBoundingClientRect()
          const nw = Math.max(1, Math.floor(rect.width))
          const nh = Math.max(1, Math.floor(rect.height))
          if (app && ((app.screen.width !== nw) || (app.screen.height !== nh))) {
            app.renderer.resize(nw, nh)
            scene.resize()
          }
        }
        resizeListenerObserver = new ResizeObserver(resize)
        resizeListenerObserver.observe(host)
      } catch (err) {
        if (!cancelled && latestRef.current.onInitializationError) {
          latestRef.current.onInitializationError(toError(err))
        }
      }
    })()

    return () => {
      cancelled = true
      if (sizeObserver) {
        sizeObserver.disconnect()
        sizeObserver = null
      }
      if (resizeListenerObserver) {
        resizeListenerObserver.disconnect()
        resizeListenerObserver = null
      }
      if (sceneRef.current) {
        sceneRef.current.destroy()
        sceneRef.current = null
      }
      if (app) {
        app.destroy(true)
        app = null
      }
    }
  }, [])

  useEffect(() => {
    const scene = sceneRef.current
    if (scene) {
      scene.sync(props)
    }
  }, [props])

  useEffect(() => {
    if (sceneRef.current) {
      consumePendingEvents(sceneRef.current, props.events, lastConsumedEventIdRef, hostRef)
    }
  }, [props.events])

  return (
    <div
      ref={hostRef}
      data-pixi-host
      data-testid="pixi-gameplay"
      data-current-word={props.currentWord}
      data-caret-index={String(props.caretIndex)}
      data-score={String(props.score)}
      data-quota={String(props.quota)}
      data-time-left-ms={String(Math.round(props.timeLeftMs))}
      data-overdrive-charge={String(props.overdriveCharge)}
      data-target-ordinal={String(props.targetOrdinal)}
      data-aegis-active={String(props.aegisActive)}
      data-aegis-rescues={String(props.aegisRescues)}
      data-focus-paused={String(props.focusPaused)}
      data-zone={String(props.zone)}
      data-stage={props.stage}
      data-event-id="0"
      className="absolute inset-0 h-full w-full min-h-0 min-w-0 overflow-hidden bg-bg-0"
    />
  )
}
