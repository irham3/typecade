"use client"

import { useShallow } from "zustand/react/shallow"
import { GhostButton, PrimaryButton } from "@/components/overdrive/ui"
import { useGame } from "../store"
import { formatNumber } from "./hud"
import { Screen } from "./screen"

export function StandardClear() {
	const state = useGame(useShallow((snapshot) => ({
		api: snapshot.api,
		runScore: snapshot.runScore,
		tokens: snapshot.tokens,
		runAccuracy: snapshot.runAccuracy,
		averageWpm: snapshot.averageWpm,
	})))

	return (
		<Screen>
			<main className="flex min-h-dvh items-center justify-center overflow-y-auto bg-bg-0 p-6 text-text-hi">
				<div className="w-full max-w-2xl text-center">
					<p className="text-sm font-bold uppercase tracking-[0.08em] text-acc-yellow">STANDARD RUN COMPLETE</p>
					<h1 className="mt-4 font-pixel text-3xl leading-tight text-acc-green sm:text-4xl">
						SYSTEM OVERRIDDEN
					</h1>
					<p className="mx-auto mt-6 max-w-xl text-base leading-6 text-text-mid">
						The eight-zone signal is yours. Secure the clear, or carry this exact build into
						Endless where every new zone multiplies the quota by 1.8.
					</p>

					<div className="mt-8 grid gap-3 sm:grid-cols-3">
						<div className="overdrive-panel p-4">
							<span className="block text-sm uppercase text-text-mid">Score</span>
							<strong className="mt-2 block text-2xl text-acc-yellow">{formatNumber(state.runScore)}</strong>
						</div>
						<div className="overdrive-panel p-4">
							<span className="block text-sm uppercase text-text-mid">Accuracy</span>
							<strong className="mt-2 block text-2xl text-acc-green">{state.runAccuracy}%</strong>
						</div>
						<div className="overdrive-panel p-4">
							<span className="block text-sm uppercase text-text-mid">Average WPM</span>
							<strong className="mt-2 block text-2xl text-text-hi">{state.averageWpm}</strong>
						</div>
					</div>

					<div className="mt-8 flex flex-col gap-3 sm:flex-row">
						<GhostButton onClick={() => state.api?.finishStandardRun()} className="h-14 flex-1">
							SECURE SCORE
						</GhostButton>
						<PrimaryButton onClick={() => state.api?.enterEndless()} className="h-14 flex-1">
							ENTER ENDLESS
						</PrimaryButton>
					</div>
				</div>
			</main>
		</Screen>
	)
}
