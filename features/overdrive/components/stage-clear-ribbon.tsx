"use client"

import { useEffect, useMemo } from "react"
import { useShallow } from "zustand/react/shallow"
import { ItemGlyph } from "@/components/overdrive/icons"
import { KEYCAPS } from "@/lib/engine/overdrive/items"
import { useGame } from "../store"
import { formatNumber } from "./hud"
import { impactSummary, strongestImpact } from "./stage-impact"

const RESULT_RIBBON_MS = 900

export function StageClearRibbon() {
	const state = useGame(useShallow((snapshot) => ({
		screen: snapshot.screen,
		score: snapshot.score,
		accuracy: snapshot.accuracy,
		tokenBreakdown: snapshot.tokenBreakdown,
		stageItemImpact: snapshot.stageItemImpact,
		api: snapshot.api,
	})))
	const topImpact = useMemo(
		() => strongestImpact(state.stageItemImpact),
		[state.stageItemImpact],
	)

	useEffect(() => {
		if (state.screen !== "stageResult" || !state.api) return

		let advanced = false
		const advance = () => {
			if (advanced) return
			advanced = true
			state.api?.continueToNextStage()
		}
		const timer = window.setTimeout(advance, RESULT_RIBBON_MS)
		const skip = (event: KeyboardEvent) => {
			if (event.key !== "Enter") return
			event.preventDefault()
			advance()
		}
		window.addEventListener("keydown", skip)
		return () => {
			window.clearTimeout(timer)
			window.removeEventListener("keydown", skip)
		}
	}, [state.api, state.screen])

	if (state.screen !== "stageResult") return null

	const itemId = topImpact?.[0]
	const impact = topImpact?.[1]
	const definition = itemId ? KEYCAPS[itemId] : undefined

	return (
		<section
			className="overdrive-stage-clear absolute inset-x-3 bottom-6 z-40 mx-auto max-w-4xl border-y border-acc-green bg-bg-0/95 px-4 py-3 text-text-hi sm:inset-x-6 sm:px-6"
			role="status"
			aria-live="polite"
			aria-label="Stage cleared"
		>
			<div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
				<div>
					<div className="text-xs font-bold uppercase tracking-[0.08em] text-acc-green">Stage clear</div>
					<strong className="mt-1 block text-xl tabular-nums text-acc-yellow">{formatNumber(state.score)}</strong>
				</div>
				<div>
					<div className="text-xs font-bold uppercase tracking-[0.08em] text-text-mid">Tokens earned</div>
					<strong className="mt-1 block text-xl tabular-nums text-acc-yellow">
						+{formatNumber(state.tokenBreakdown?.totalEarned ?? 0)}
					</strong>
				</div>
				<div>
					<div className="text-xs font-bold uppercase tracking-[0.08em] text-text-mid">Accuracy</div>
					<strong className={`mt-1 block text-xl tabular-nums ${
						state.accuracy >= 97 ? "text-acc-green" : "text-acc-yellow"
					}`}>
						{state.accuracy}%
					</strong>
				</div>
				<div>
					<div className="text-xs font-bold uppercase tracking-[0.08em] text-text-mid">Next</div>
					<strong className="mt-1 block text-sm uppercase tracking-[0.08em] text-acc-cyan">Enter to skip</strong>
				</div>
			</div>

			{definition && impact && (
				<div className="mt-3 flex items-center gap-3 border-t border-line pt-3">
					<ItemGlyph id={definition.id} type="keycap" className="h-5 w-5 shrink-0 text-acc-violet" />
					<strong className="text-sm text-text-hi">{definition.name}</strong>
					<span className="min-w-0 truncate text-sm text-text-mid">{impactSummary(impact)}</span>
				</div>
			)}
		</section>
	)
}
