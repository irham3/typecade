"use client"
import { useEffect, useState } from "react"
import { useGame } from "@/features/overdrive/store"
import { useGameInput } from "@/features/overdrive/use-game-input"
import { Menu } from "@/features/overdrive/components/menu"
import { Hud } from "@/features/overdrive/components/hud"
import { StageResult } from "@/features/overdrive/components/stage-result"
import { Shop } from "@/features/overdrive/components/shop"
import { RunOver } from "@/features/overdrive/components/run-over"

export default function OverdrivePage() {
	const state = useGame()
	const [paused, setPaused] = useState(false)

	// Game Loop (RAF)
	useEffect(() => {
		if (state.screen !== "stage" || paused) return
		
		let last = performance.now()
		let raf = 0
		
		const tick = (now: number) => {
			state.api?.advance(now - last)
			last = now
			raf = requestAnimationFrame(tick)
		}
		
		raf = requestAnimationFrame(tick)
		return () => cancelAnimationFrame(raf)
	}, [state.screen, state.api, paused])

	// Input handling
	useGameInput(
		(c) => state.api?.feedChar(c),
		() => state.api?.backspace(),
		state.screen === "stage" && !paused
	)

	// Pause handling
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && state.screen === "stage") {
				setPaused(p => !p)
			}
		}
		window.addEventListener("keydown", handleKeyDown)
		return () => window.removeEventListener("keydown", handleKeyDown)
	}, [state.screen])

	return (
		<div className="relative h-dvh w-full min-w-0 max-w-none overflow-hidden">
			{state.screen === "menu" && <Menu />}
			{state.screen === "stage" && <Hud />}
			{state.screen === "stageResult" && <StageResult />}
			{state.screen === "shop" && <Shop />}
			{state.screen === "runOver" && <RunOver />}
			
			{/* Pause Overlay */}
			{paused && state.screen === "stage" && (
				<div className="absolute inset-0 z-50 flex items-center justify-center bg-bg-0/80 backdrop-blur-sm">
					<div className="flex flex-col gap-4 w-64 p-6 bg-bg-1 border border-line rounded-lg">
						<h3 className="font-pixel text-center text-lg mb-4 text-text-hi">PAUSED</h3>
						<button 
							className="h-11 rounded-lg bg-acc-green px-6 text-sm font-bold uppercase tracking-[0.08em] text-bg-0 hover:brightness-110"
							onClick={() => setPaused(false)}
						>
							RESUME
						</button>
						<button 
							className="h-11 rounded-lg border border-line px-6 text-sm font-bold uppercase tracking-[0.08em] text-text-hi hover:bg-bg-2"
							onClick={() => window.location.reload()}
						>
							QUIT TO MENU
						</button>
					</div>
				</div>
			)}
		</div>
	)
}
