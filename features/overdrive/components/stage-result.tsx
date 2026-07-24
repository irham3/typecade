"use client"
import { useGame } from "../store"
import { PrimaryButton, GhostButton } from "@/components/overdrive/ui"
import { formatNumber } from "./hud"

export function StageResult() {
	const state = useGame()

	const isClear = state.score >= state.quota

	return (
		<main className="mx-auto flex min-h-dvh max-w-120 flex-col items-center justify-center gap-6">
			<h2 className={`font-pixel text-2xl ${isClear ? "text-acc-green" : "text-acc-red"}`}>
				{isClear ? "STAGE CLEAR" : "QUOTA FAILED"}
			</h2>

			<div className="w-full rounded-lg border border-line bg-bg-1 p-6 text-base">
				<div className="flex justify-between border-b border-line pb-2 mb-2">
					<span className="text-text-mid">Score</span>
					<span className={`font-bold ${isClear ? "text-acc-green" : "text-acc-red"}`}>
						{formatNumber(state.score)} / {formatNumber(state.quota)}
					</span>
				</div>
				<div className="flex justify-between mb-2">
					<span className="text-text-mid">Accuracy</span>
					<span>{state.accuracy}%</span>
				</div>
				<div className="flex justify-between mb-2">
					<span className="text-text-mid">Time Left</span>
					<span>{Math.ceil(state.timeLeftMs / 1000)}s</span>
				</div>
				{isClear && (
					<div className="flex justify-between mt-4 border-t border-line pt-2">
						<span className="text-text-mid">Tokens Earned</span>
						<span className="font-bold text-acc-yellow tabular-nums">+{state.tokens} (Total)</span>
					</div>
				)}
			</div>

			<div className="flex w-full flex-col gap-3 mt-4">
				<PrimaryButton onClick={() => state.api?.continueToNextStage()}>
					CONTINUE
				</PrimaryButton>

				{/* 
				Wait, if it's failed, maybe it should say RUN OVER or they shouldn't even be here. 
				In run.ts, if failed, screen="runOver". So StageResult is ONLY for clears! 
				Ah, run.ts: `else { state.screen = "runOver" }`
				So isClear is always true here. 
				*/}
			</div>
		</main>
	)
}
