"use client"

import { useEffect } from "react"
import type { RunSnapshot } from "@/lib/engine/overdrive"
import { createPersistedRunWriter } from "./persisted-run-writer"
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
		const writer = createPersistedRunWriter({
			serialize: () => useGame.getState().api?.exportState() ?? null,
			save: (serialized) => window.localStorage.setItem(OVERDRIVE_SAVE_KEY, serialized),
			schedule: (callback, delayMs) => window.setTimeout(callback, delayMs),
			cancel: (handle) => window.clearTimeout(handle as number),
		})
		const updateResumeState = () => {
			useGame.getState().setResumeAvailable(hasResumableSave())
		}
		updateResumeState()

		const unsubscribe = useGame.subscribe((state, previous) => {
			if (!state.api || state.screen === "menu") return
			if (state.screen === "runOver") {
				writer.flush()
				window.localStorage.removeItem(OVERDRIVE_SAVE_KEY)
				if (state.resumeAvailable) state.setResumeAvailable(false)
				return
			}
			const semanticChange = state.screen !== previous.screen
				|| state.score !== previous.score
				|| state.caretIndex !== previous.caretIndex
				|| state.tokens !== previous.tokens
				|| state.paused !== previous.paused
			const timerChange = state.timeLeftMs !== previous.timeLeftMs
			if (!semanticChange && !timerChange) return
			if (semanticChange) writer.flush()
			else writer.schedule()
		})
		const flushOnPageLifecycle = () => writer.flush()
		window.addEventListener("visibilitychange", flushOnPageLifecycle)
		window.addEventListener("pagehide", flushOnPageLifecycle)

		return () => {
			unsubscribe()
			window.removeEventListener("visibilitychange", flushOnPageLifecycle)
			window.removeEventListener("pagehide", flushOnPageLifecycle)
			writer.dispose()
		}
	}, [])
}
