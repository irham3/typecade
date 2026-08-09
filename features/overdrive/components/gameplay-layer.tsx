"use client"

import { useState } from "react"
import { useShallow } from "zustand/react/shallow"
import { KEYCAPS, MACROS } from "@/lib/engine/overdrive/items"
import { GameplayCanvas } from "../canvas/gameplay-canvas"
import { usePresentationEvents, usePresentationEnvelopes } from "../presentation/use-presentation-events"
import { useSettings } from "../settings/store"
import { useGame } from "../store"

function ProcFeedback() {
	const events = usePresentationEvents()
	const latest = [...events].reverse().find(
		(event) => event.type === "item-triggered" || event.type === "macro-used",
	)
	if (!latest) return null

	const itemName = latest.type === "item-triggered"
		? KEYCAPS[latest.itemId]?.name ?? latest.label
		: MACROS[latest.itemId]?.name ?? latest.itemId

	return (
		<div
			key={latest.id}
			className="overdrive-proc pointer-events-none absolute left-1/2 top-[34%] z-20 -translate-x-1/2 border-l-2 border-acc-violet bg-bg-0 px-3 py-2 text-sm font-bold uppercase tracking-[0.08em] text-text-hi"
			aria-live="polite"
		>
			{latest.type === "item-triggered"
				? `${itemName} · ${latest.contribution.label}`
				: `${itemName} · ${latest.result}`}
		</div>
	)
}

export function GameplayLayer() {
	const [initializationError, setInitializationError] = useState<Error | null>(null)
	const [canvasReady, setCanvasReady] = useState(false)
	const [attempt, setAttempt] = useState(0)
	const state = useGame(useShallow((snapshot) => ({
		currentWord: snapshot.currentWord,
		upcomingWords: snapshot.upcomingWords,
		caretIndex: snapshot.caretIndex,
		wordDirty: snapshot.wordDirty,
		score: snapshot.score,
		quota: snapshot.quota,
		combo: snapshot.combo,
		mult: snapshot.mult,
		accuracy: snapshot.accuracy,
		timeLeftMs: snapshot.timeLeftMs,
		stageDurationMs: snapshot.stageDurationMs,
		aegisActive: snapshot.aegisActive,
		aegisRescues: snapshot.aegisRescues,
		stageRescued: snapshot.stageRescued,
		focusPaused: snapshot.focusPaused,
		threatBand: snapshot.threatBand,
		overdriveCharge: snapshot.overdriveCharge,
		targetOrdinal: snapshot.targetOrdinal,
		zone: snapshot.zone,
		stage: snapshot.stage,
		activeGlitch: snapshot.activeGlitch,
		paused: snapshot.paused,
		quitToMenu: snapshot.quitToMenu,
	})))
	const settings = useSettings()
	const envelopes = usePresentationEnvelopes()

	if (initializationError) {
		return (
			<div className="absolute inset-0 z-50 flex items-center justify-center bg-bg-0 p-6 text-text-hi">
				<div className="overdrive-panel w-full max-w-md p-6">
					<h2 className="font-pixel text-xl text-acc-red">ARENA FAILED TO LOAD</h2>
					<p className="mt-4 text-sm leading-6 text-text-mid">
						The run is paused. Reload the arena or return to the menu.
					</p>
					<div className="mt-6 flex flex-col gap-3 sm:flex-row">
						<button
							className="overdrive-primary flex-1"
							onClick={() => {
								setInitializationError(null)
								setCanvasReady(false)
								setAttempt((value) => value + 1)
							}}
						>
							TRY AGAIN
						</button>
						<button className="overdrive-ghost flex-1" onClick={state.quitToMenu}>
							MAIN MENU
						</button>
					</div>
				</div>
			</div>
		)
	}

	return (
		<>
			{!canvasReady && (
				<div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-bg-0 text-sm font-bold uppercase tracking-[0.08em] text-acc-cyan">
					LOADING ARENA
				</div>
			)}
			<GameplayCanvas
				key={attempt}
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
				stageDurationMs={state.stageDurationMs}
				aegisActive={state.aegisActive}
				aegisRescues={state.aegisRescues}
				stageRescued={state.stageRescued}
				focusPaused={state.focusPaused}
				threatBand={state.threatBand}
				overdriveCharge={state.overdriveCharge}
				targetOrdinal={state.targetOrdinal}
				zone={state.zone}
				stage={state.stage}
				activeGlitch={state.activeGlitch}
				reducedMotion={settings.reducedMotion ?? false}
				screenShake={settings.screenShake}
				events={envelopes}
				onReady={() => setCanvasReady(true)}
				onInitializationError={setInitializationError}
			/>
			<ProcFeedback />
		</>
	)
}
