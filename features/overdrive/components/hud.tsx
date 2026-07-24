"use client"

import { useEffect, useState } from "react"
import { useGame } from "../store"
import { GameplayCanvas } from "../canvas/gameplay-canvas"
import { usePresentationEvents } from "../presentation/use-presentation-events"
import { HudLabel, KeycapSlot, QuotaBar } from "@/components/overdrive/ui"
import { KEYCAPS, GLITCHES } from "@/lib/engine/overdrive/items"
import { KEYCAP_ICONS } from "@/components/overdrive/icons"

export function formatTime(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(total / 60).toString().padStart(2, "0")}:${(total % 60).toString().padStart(2, "0")}`
}

export function formatNumber(value: number) {
  return value.toLocaleString("en-US")
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReduced(media.matches)
    sync()
    media.addEventListener("change", sync)
    return () => media.removeEventListener("change", sync)
  }, [])
  return reduced
}

function Metric({ label, value, tone = "text-text-hi" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-line bg-bg-1/90 p-3">
      <HudLabel>{label}</HudLabel>
      <div className={`mt-1 text-xl font-bold tabular-nums xl:text-2xl ${tone}`}>{value}</div>
    </div>
  )
}

export function Hud() {
  const state = useGame()
  const events = usePresentationEvents()
  const reducedMotion = useReducedMotion()
  const glitchName = state.activeGlitch ? GLITCHES[state.activeGlitch]?.name : null

  return (
    <main
      data-overdrive-game
      className="grid h-dvh w-full min-w-0 grid-rows-[64px_36px_minmax(0,1fr)_80px_24px] gap-y-2 overflow-hidden px-3 py-2 sm:px-4"
    >
      <header className="grid min-w-0 grid-cols-[1fr_auto_1fr] items-center gap-3">
        <span className="truncate font-pixel text-sm sm:text-base">TYPECADE</span>
        <div className="min-w-0 text-center">
          <div className="truncate text-xs font-bold uppercase tracking-[0.08em] text-acc-cyan sm:text-sm">
            Zone {state.zone} · {state.stage}
          </div>
          {glitchName && <div className="truncate text-[10px] font-bold uppercase text-acc-red">{glitchName}</div>}
        </div>
        <div className="flex items-center justify-end gap-3 sm:gap-5">
          <span className="text-lg font-bold tabular-nums sm:text-2xl">{formatTime(state.timeLeftMs)}</span>
          <span className="hidden text-sm font-bold tabular-nums text-acc-yellow sm:inline">{formatNumber(state.tokens)} TOKENS</span>
        </div>
      </header>

      <div className="flex min-w-0 items-center gap-3">
        <HudLabel>Quota</HudLabel>
        <div className="min-w-0 flex-1"><QuotaBar current={state.score} target={state.quota} /></div>
        <span className="shrink-0 text-xs tabular-nums text-text-mid sm:text-sm">
          {formatNumber(state.score)} / {formatNumber(state.quota)}
        </span>
      </div>

      <section className="grid min-h-0 min-w-0 grid-cols-1 gap-3 lg:grid-cols-[152px_minmax(0,1fr)_152px]">
        <aside className="hidden min-h-0 flex-col justify-center gap-3 lg:flex">
          <Metric label="Combo" value={String(state.combo)} tone="text-acc-pink" />
          <Metric label="Mult" value={`x${state.mult}`} tone="text-acc-violet" />
          <Metric label="Integrity" value={`${state.accuracy}%`} tone={state.accuracy >= 97 ? "text-acc-green" : state.accuracy >= 90 ? "text-acc-yellow" : "text-acc-red"} />
        </aside>

        <div className="relative min-h-0 min-w-0 overflow-hidden rounded-xl border border-line bg-bg-0">
          <GameplayCanvas
            currentWord={state.currentWord}
            upcomingWords={state.upcomingWords}
            caretIndex={state.caretIndex}
            wordDirty={state.wordDirty}
            score={state.score}
            quota={state.quota}
            combo={state.combo}
            mult={state.mult}
            accuracy={state.accuracy}
            timeLeftMs={state.timeLeftMs}
            zone={state.zone}
            stage={state.stage}
            reducedMotion={reducedMotion}
            events={events}
          />

          <div className="pointer-events-none absolute left-2 top-2 grid grid-cols-3 gap-2 lg:hidden">
            <div className="rounded-md border border-line bg-bg-1/90 px-2 py-1 text-xs"><span className="text-text-mid">COMBO </span><b className="text-acc-pink">{state.combo}</b></div>
            <div className="rounded-md border border-line bg-bg-1/90 px-2 py-1 text-xs"><span className="text-text-mid">MULT </span><b className="text-acc-violet">x{state.mult}</b></div>
            <div className="rounded-md border border-line bg-bg-1/90 px-2 py-1 text-xs"><span className="text-text-mid">HP </span><b className="text-acc-green">{state.accuracy}%</b></div>
          </div>

          <div className="pointer-events-none absolute bottom-2 right-2 flex gap-2 lg:hidden">
            <div className="rounded-md border border-line bg-bg-1/90 px-2 py-1 text-xs text-text-mid">BASE <b className="text-text-hi">{state.currentWord.length}</b></div>
            <div className="rounded-md border border-line bg-bg-1/90 px-2 py-1 text-xs text-text-mid">SCORE <b className="text-acc-yellow">{formatNumber(state.score)}</b></div>
          </div>
        </div>

        <aside className="hidden min-h-0 flex-col justify-center gap-3 text-right lg:flex">
          <Metric label="Word Base" value={String(state.currentWord.length)} />
          <Metric label="Stage Score" value={formatNumber(state.score)} tone="text-acc-yellow" />
          <Metric label="Tokens" value={formatNumber(state.tokens)} tone="text-acc-yellow" />
        </aside>
      </section>

      <div className="flex min-w-0 items-center justify-start gap-3 overflow-x-auto px-1 sm:justify-center">
        {state.keycaps.map((id) => {
          const def = KEYCAPS[id]
          const Icon = KEYCAP_ICONS[id as keyof typeof KEYCAP_ICONS]
          return (
            <div key={id} className="shrink-0" title={`${def.name}: ${def.description}`}>
              <KeycapSlot rarity={def.rarity}>{Icon ? <Icon className="text-2xl" /> : def.name[0]}</KeycapSlot>
            </div>
          )
        })}
        {Array.from({ length: Math.max(0, 5 - state.keycaps.length) }).map((_, index) => <KeycapSlot key={`empty-${index}`} />)}
      </div>

      <footer className="flex min-w-0 items-center justify-between overflow-hidden text-[10px] text-text-mid sm:text-xs">
        <span className="truncate">Accuracy is base integrity</span>
        <span className="truncate text-right">Type the active enemy word to fire</span>
      </footer>
    </main>
  )
}
