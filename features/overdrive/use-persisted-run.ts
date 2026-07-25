"use client"

import { useEffect } from "react"
import type { RunSnapshot } from "@/lib/engine/overdrive"
import { OVERDRIVE_SAVE_KEY, useGame } from "./store"

const RESUMABLE_SCREENS: RunSnapshot["screen"][] = [
	"stage",
	"stageResult",
	"shop",
	"standardClear",
]

function hasResumableSave() {
	const saved = window.localStorage.getItem(OVERDRIVE_SAVE_KEY)
	if (!saved) return false
	try {
		const parsed = JSON.parse(saved) as { state?: { screen?: RunSnapshot["screen"] } }
		const resumable = parsed.state?.screen
			? RESUMABLE_SCREENS.includes(parsed.state.screen)
			: false
		if (!resumable) window.localStorage.removeItem(OVERDRIVE_SAVE_KEY)
		return resumable
	} catch {
		window.localStorage.removeItem(OVERDRIVE_SAVE_KEY)
		return false
	}
}

export function usePersistedRun() {
	useEffect(() => {
		const updateResumeState = () => {
			useGame.getState().setResumeAvailable(hasResumableSave())
		}
		updateResumeState()

		const unsubscribe = useGame.subscribe((state, previous) => {
			if (!state.api || state.screen === "menu") return
			if (state.screen === "runOver") {
				window.localStorage.removeItem(OVERDRIVE_SAVE_KEY)
				if (state.resumeAvailable) state.setResumeAvailable(false)
				return
			}
			if (
				state.screen === previous.screen
				&& state.score === previous.score
				&& state.caretIndex === previous.caretIndex
				&& state.tokens === previous.tokens
				&& state.timeLeftMs === previous.timeLeftMs
			) return

			window.localStorage.setItem(OVERDRIVE_SAVE_KEY, state.api.exportState())
		})

		return unsubscribe
	}, [])
}
