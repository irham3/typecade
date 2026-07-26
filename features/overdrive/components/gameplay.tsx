"use client"

import { useShallow } from "zustand/react/shallow"
import { useGame } from "../store"
import { Hud } from "./hud"
import { GameplayLayer } from "./gameplay-layer"

function ReadyGate() {
	const state = useGame(useShallow((snapshot) => ({
		stageReady: snapshot.stageReady,
		coachingEnabled: snapshot.coachingEnabled,
		zone: snapshot.zone,
		stage: snapshot.stage,
		aegisActive: snapshot.aegisActive,
	})))
	if (!state.stageReady) return null

	const stageLabel = state.stage === "warmup"
		? "WARM-UP"
		: state.stage === "rush"
			? "RUSH"
			: "GLITCH"

	return (
		<div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-bg-0/50 px-4">
			<div className="overdrive-ready-gate w-full max-w-xl border-y border-acc-cyan bg-bg-0/90 px-6 py-6 text-center">
				<p className="text-sm font-bold uppercase tracking-[0.08em] text-acc-cyan">
					ZONE {state.zone} · {stageLabel}
				</p>
				<h2 className="mt-3 text-2xl font-bold uppercase tracking-[0.08em] text-text-hi">
					{state.coachingEnabled ? "TYPE TO ENGAGE" : "PRESS ANY KEY TO RESUME"}
				</h2>
				<p className="mt-2 text-sm text-text-mid">
					{state.coachingEnabled
						? state.aegisActive
							? state.zone === 1
								? "Find the highlighted key. Take your time: the clock pauses while you search."
								: "Type the short word, then press Space. Corrected errors still earn Base."
							: "Your first key starts combat. Space executes; a full charge releases Overdrive."
						: "Your first printable key resumes the timer and enters the fight."}
				</p>
			</div>
		</div>
	)
}

export function Gameplay() {
	return (
		<main
			data-overdrive-gameplay
			tabIndex={0}
			className="relative h-full min-h-0 w-full min-w-0 overflow-hidden outline-none"
		>
			<GameplayLayer />
			<Hud />
			<ReadyGate />
		</main>
	)
}
