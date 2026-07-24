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
				original(...args)
				sync()
			}
		})
		
		set({ ...api.snapshot(), api })
	},
}))
