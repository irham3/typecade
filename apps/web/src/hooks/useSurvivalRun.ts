import { useCallback, useEffect, useRef, useState } from "react"
import type { DungeonEvents, DungeonLanguage, DungeonState } from "@typecade/contracts"
import { SurvivalRun, restoreDungeonRun } from "@typecade/game-rules"
import { GameEventBridge } from "../bridge/game-event-bridge"
import { rememberRun } from "../run-history"
import { readStorage, writeStorage } from "../storage"

export const dungeonSaveKey = "typecade:dungeon:run:v1"
const bestKey = "typecade:dungeon:best:v1"
export const dungeonSnapshot = (s: DungeonState): DungeonState => ({ ...s, player: { ...s.player }, procs:{...s.procs},supplies:{...s.supplies},sentry:s.sentry?{...s.sentry}:null, enemies: s.enemies.map(e => ({ ...e, words: [...e.words] })), recentWords:[...s.recentWords], queue: [...s.queue], offers: [...s.offers], skills: { cleave: { ...s.skills.cleave }, storm: { ...s.skills.storm }, heal: { ...s.skills.heal } }, relics: { ...s.relics } })

export function useSurvivalRun(enabled: boolean) {
 const [initial] = useState(() => restoreDungeonRun(readStorage("localStorage", dungeonSaveKey)) ?? new SurvivalRun(`run-${Date.now()}`))
 const run = useRef(initial)
 const [bridge] = useState(() => new GameEventBridge<DungeonEvents>(new Set(["frame", "screen", "settings"])))
 const [view, setView] = useState(() => dungeonSnapshot(initial.state))
 const [best, setBest] = useState(() => { const n = Number(readStorage("localStorage", bestKey)); return Number.isFinite(n) && n > 0 ? n : 0 })
 const savedAt = useRef(0)
 const publish = useCallback(() => { bridge.emit("frame", run.current.state); setView(dungeonSnapshot(run.current.state)) }, [bridge])
 const save = useCallback(() => {
  const s = run.current.state
  writeStorage("localStorage", dungeonSaveKey, run.current.serialize())
  rememberRun(s)
  const stored = Number(readStorage("localStorage", bestKey)) || 0
  if (s.time > stored) { writeStorage("localStorage", bestKey, String(Math.floor(s.time))); setBest(Math.floor(s.time)) }
 }, [])
 const input = useCallback((key: string) => { run.current.input(key); publish(); if (["paused", "draft", "dead"].includes(run.current.state.phase)) save() }, [publish, save])
 const pause = useCallback(() => { run.current.pause(); publish(); save() }, [publish, save])
 const resume = useCallback(() => { run.current.resume(); publish() }, [publish])
 const fresh = useCallback((language: DungeonLanguage) => { rememberRun(run.current.state,true); run.current = new SurvivalRun(`run-${Date.now()}`, language); publish(); save() }, [publish, save])
 const start = useCallback(() => { run.current.start(); publish() }, [publish])
 const checkpoint = useCallback(()=>run.current.serialize(),[])
 const restore = useCallback((raw:string)=>{const next=restoreDungeonRun(raw);if(!next)return false;run.current=next;publish();save();return true},[publish,save])
 useEffect(() => {
  if (!enabled) return
  let last = performance.now(), lag = 0, publishedAt = 0, previousPhase = run.current.state.phase
  const timer = window.setInterval(() => {
   const now = performance.now(), delta = Math.min(.1, (now - last) / 1000); last = now
   if (document.hidden || !["arena", "skills", "overdrive"].includes(run.current.state.phase)) { lag = 0; return }
   lag += delta
   while (lag >= 1 / 30) { run.current.advance(1 / 30); lag -= 1 / 30 }
   bridge.emit("frame", run.current.state)
   if (now - publishedAt >= 100 || previousPhase !== run.current.state.phase) { setView(dungeonSnapshot(run.current.state)); publishedAt = now }
   previousPhase = run.current.state.phase
   if (now - savedAt.current > 5000 || ["draft", "dead"].includes(run.current.state.phase)) { save(); savedAt.current = now }
  }, 1000 / 30)
  const suspend = () => { if (document.hidden) pause() }
  const blur = () => pause()
  const resize = () => { run.current.setLabelLimit(window.innerWidth < 700 ? 4 : 6); publish() }
  document.addEventListener("visibilitychange", suspend); window.addEventListener("blur", blur); window.addEventListener("resize", resize); window.addEventListener("pagehide", pause)
  resize()
  return () => { clearInterval(timer); document.removeEventListener("visibilitychange", suspend); window.removeEventListener("blur", blur); window.removeEventListener("resize", resize); window.removeEventListener("pagehide", pause); run.current.pause(); save() }
 }, [enabled, bridge, pause, publish, save])
 return { view, best, bridge, input, fresh, start, pause, resume, save, checkpoint, restore }
}
