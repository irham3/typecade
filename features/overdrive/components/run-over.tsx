"use client"
import { useGame } from "../store"
import { PrimaryButton, GhostButton } from "@/components/overdrive/ui"
import { formatNumber } from "./hud"

export function RunOver() {
	const state = useGame()

	return (
		<main className="mx-auto flex min-h-dvh max-w-120 flex-col items-center justify-center gap-6">
			<h2 className={`font-pixel text-2xl ${state.win ? "text-acc-green" : "text-acc-red"}`}>
				{state.win ? "FIRMWARE CLEAR" : "SYSTEM FAILURE"}
			</h2>

			<div className="text-[64px] font-bold text-acc-yellow tabular-nums leading-none my-4">
				{formatNumber(state.score)}
			</div>

			<div className="w-full rounded-lg border border-line bg-bg-1 p-6 text-base">
				<div className="flex justify-between mb-2">
					<span className="text-text-mid">Zone Reached</span>
					<span className="font-bold">Zone {state.zone}</span>
				</div>
				<div className="flex justify-between mb-2">
					<span className="text-text-mid">Accuracy</span>
					<span>{state.accuracy}%</span>
				</div>
			</div>

			<div className="flex w-full flex-col gap-3 mt-4">
				<PrimaryButton onClick={() => state.api?.restart()}>
					PLAY AGAIN
				</PrimaryButton>

				<GhostButton onClick={() => window.location.href = "/overdrive"}>
					MAIN MENU
				</GhostButton>
			</div>
		</main>
	)
}
