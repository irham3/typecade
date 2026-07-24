import { create } from "zustand"
import { createRun, type RunSnapshot } from "@/lib/engine/overdrive"
import words from "@/data/words-en.json"

type GameStore = RunSnapshot & { init(seed: string): void; api?: ReturnType<typeof createRun> }

export const useGame = create<GameStore>((set, get) => ({
	...({} as RunSnapshot), screen: "menu",
	init(seed: string) {
		const api = createRun({ seed, words })
		const sync = () => set({ ...api.snapshot(), api })
		;(["word_complete", "typo", "mult_change", "quota_progress", "stage_clear", "stage_fail", "run_over"] as const)
			.forEach((e) => api.events.on(e, sync))
			
		const methodsToPatch = ['start', 'skipWarmup', 'feedChar', 'backspace', 'advance', 'continueToNextStage', 'restart'] as const;
		methodsToPatch.forEach(method => {
			const original = api[method] as Function;
			(api as any)[method] = (...args: any[]) => {
				const before = api.snapshot()
				original(...args)
				const after = api.snapshot()
				
				// feedChar events (accepted/rejected/word-complete/mult-change/stage-entered from typing) 
				// are handled synchronously in useGameInput to preserve gesture unlocking.
				// Here we handle non-typing transitions (like timer finishing, continuing).
				if (method !== 'feedChar') {
					if (after.stage !== before.stage) {
						import('./presentation/events').then(({ emitPresentationEvent }) => {
							emitPresentationEvent({ type: "stage-entered", stage: after.stage })
						})
					}
				}
				
				if (before.screen === "stage" && after.screen === "stageResult") {
					import('./presentation/events').then(({ emitPresentationEvent }) => {
						emitPresentationEvent({ type: "stage-cleared" })
					})
				} else if (before.screen === "stage" && after.screen === "runOver") {
					import('./presentation/events').then(({ emitPresentationEvent }) => {
						emitPresentationEvent({ type: "run-over" })
					})
				}

				sync()
			}
		})
		
		set({ ...api.snapshot(), api })
	},
}))
