"use client"

import { useEffect } from "react"
import { useGame } from "@/features/overdrive/store"
import { sfx } from "@/features/overdrive/fx/sfx"
import { emitPresentationEvent } from "./presentation/events"

export function useGameInput(enabled: boolean) {
	useEffect(() => {
		if (!enabled) return
		const handler = (e: KeyboardEvent) => {
			if (e.ctrlKey || e.metaKey || e.altKey) return

			if (e.key === "Enter") {
				e.preventDefault()
				const state = useGame.getState()
				if (
					state.screen === "stage"
					&& state.zone >= 3
					&& state.caretIndex === state.currentWord.length
					&& state.overdriveCharge >= 100
					&& !state.wordDirty
				) {
					emitPresentationEvent({ type: "overdrive-intent" })
					state.api?.releaseOverdrive()
				}
				return
			}

			if (e.key === "Backspace") {
				e.preventDefault()
				useGame.getState().api?.backspace()
				return
			}

			if (e.key === "1" || e.key === "2") {
				e.preventDefault()
				const state = useGame.getState()
				if (state.screen === "stage" && state.api) {
					state.api.triggerMacro(e.key === "1" ? 0 : 1)
				}
				return
			}

			if (e.key.length === 1) {
				e.preventDefault()

				const before = useGame.getState()
				if (!before.api) return
				if (before.screen !== "stage") return
				if (before.stageReady) before.engageStage()

				before.api.feedChar(e.key)
				const after = useGame.getState()

				sfx.unlock()
				sfx.key()

				if (
					e.key !== " "
					&& before.caretIndex < before.currentWord.length
					&& after.stageTypos > before.stageTypos
				) {
					emitPresentationEvent({
						type: "rejected-character",
						character: e.key,
					})
				}

				if (after.mult > before.mult) {
					emitPresentationEvent({
						type: "mult-increased",
						mult: after.mult,
					})
				}
				if (after.stage !== before.stage) {
					emitPresentationEvent({
						type: "stage-entered",
						stage: after.stage,
					})
				}
			}
		}
		window.addEventListener("keydown", handler)
		return () => window.removeEventListener("keydown", handler)
	}, [enabled])
}
