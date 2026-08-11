"use client"

import { useEffect, useRef } from "react"
import { AnimatePresence } from "framer-motion"
import { useGame } from "@/features/overdrive/store"
import { useGameInput } from "@/features/overdrive/use-game-input"
import { usePersistedRun } from "@/features/overdrive/use-persisted-run"
import { elapsedFrameMs } from "../frame-clock"
import { isCompetitiveMode } from "../competitive"
import { track } from "@/lib/analytics"
import { Gameplay } from "./gameplay"
import { Menu } from "./menu"
import { RunOver } from "./run-over"
import { Shop } from "./shop"
import { StandardClear } from "./standard-clear"

export function OverdriveApp() {
	const screen = useGame((state) => state.screen)
	const api = useGame((state) => state.api)
	const paused = useGame((state) => state.paused)
	const stageReady = useGame((state) => state.stageReady)
	const setPaused = useGame((state) => state.setPaused)
	const quitToMenu = useGame((state) => state.quitToMenu)
	const startChallengeRun = useGame((state) => state.startChallengeRun)
	const competitive = isCompetitiveMode(process.env.NEXT_PUBLIC_OVERDRIVE_COMPETITIVE)
	const loaded = useRef(false)

	useEffect(() => {
		if (loaded.current) return
		loaded.current = true
		track("game_loaded", { mode: "overdrive" })
	}, [])

	useEffect(() => {
		const searchParams = new URLSearchParams(window.location.search)
		const encodedSeed = searchParams.get("challenge")
		if (!encodedSeed) return
		track("challenge_opened", { mode: "overdrive" })
		try {
			const paddedSeed = encodedSeed.replaceAll("-", "+").replaceAll("_", "/")
				.padEnd(Math.ceil(encodedSeed.length / 4) * 4, "=")
			const seed = decodeURIComponent(escape(atob(paddedSeed)))
			const build = (searchParams.get("build") ?? "")
				.split(".")
				.map((itemId) => itemId.trim())
				.filter(Boolean)
			startChallengeRun(seed, build)
		} catch {
			// Invalid challenge links fall back to the menu.
		}
	}, [startChallengeRun])

	useEffect(() => {
		if (screen !== "stage" || paused || stageReady || !api) return
		let last = performance.now()
		let frame = 0
		const tick = (now: number) => {
			api.advance(elapsedFrameMs(now, last))
			last = now
			frame = requestAnimationFrame(tick)
		}
		frame = requestAnimationFrame(tick)
		return () => cancelAnimationFrame(frame)
	}, [api, paused, screen, stageReady])

	useEffect(() => {
		const pauseWhenHidden = () => {
			if (document.hidden && screen === "stage" && !competitive) setPaused(true)
		}
		document.addEventListener("visibilitychange", pauseWhenHidden)
		return () => document.removeEventListener("visibilitychange", pauseWhenHidden)
	}, [competitive, screen, setPaused])

	useGameInput(screen === "stage" && !paused)
	usePersistedRun()

	useEffect(() => {
		const handlePause = (event: KeyboardEvent) => {
			if (!competitive && event.key === "Escape" && screen === "stage") {
				setPaused(!paused)
			}
		}
		window.addEventListener("keydown", handlePause)
		return () => window.removeEventListener("keydown", handlePause)
	}, [competitive, paused, screen, setPaused])

	return (
		<div className="relative h-dvh w-full min-w-0 overflow-hidden">
			<AnimatePresence mode="wait" initial={false}>
				{screen === "menu" && <Menu key="menu" />}
				{(screen === "stage" || screen === "stageResult") && <Gameplay key="stage" />}
				{screen === "shop" && <Shop key="shop" />}
				{screen === "standardClear" && <StandardClear key="standard-clear" />}
				{screen === "runOver" && <RunOver key="run-over" />}
			</AnimatePresence>

			{paused && screen === "stage" && (
				<div
					className="absolute inset-0 z-50 flex items-center justify-center bg-bg-0/90 p-6"
					role="dialog"
					aria-modal="true"
					aria-labelledby="pause-title"
				>
					<div className="w-full max-w-sm rounded-lg border border-line bg-bg-1 p-6">
						<h2 id="pause-title" className="font-pixel text-2xl text-text-hi">PAUSED</h2>
						<p className="mt-4 text-sm text-text-mid">The stage clock is stopped.</p>
						<div className="mt-6 flex flex-col gap-3">
							<button className="overdrive-primary" onClick={() => setPaused(false)}>
								RESUME
							</button>
							<button className="overdrive-ghost" onClick={quitToMenu}>
								END RUN
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
