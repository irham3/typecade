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

			// Handle space completion explicitly based on engine behavior.
			// The engine accepts spaces even if word is not complete, but only completes it if caretIndex === length.

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

				before.api.feedChar(e.key)
				const after = useGame.getState()

				sfx.unlock()
				sfx.key()

				if (after.caretIndex > before.caretIndex) {
					emitPresentationEvent({
						type: "accepted-character",
						character: e.key,
						index: before.caretIndex,
						combo: after.combo
					})
				} else if (e.key === " ") {
					// Check if a word was completed by this space
					// Word complete handled by store.ts syncing engine events
				} else if (
					before.caretIndex < before.currentWord.length
					&& after.stageTypos > before.stageTypos
				) {
					// We typed a visible character that wasn't space, and caret didn't advance.
					// This implies a typo occurred (unless we are past the word length).
					emitPresentationEvent({
						type: "rejected-character",
						character: e.key
					})
				}

				if (after.mult > before.mult) {
					emitPresentationEvent({
						type: "mult-increased",
						mult: after.mult
					})
				}
				if (after.stage !== before.stage) {
					emitPresentationEvent({
						type: "stage-entered",
						stage: after.stage
					})
				}
			}
		}
		window.addEventListener("keydown", handler)
		return () => window.removeEventListener("keydown", handler)
	}, [enabled])
}
