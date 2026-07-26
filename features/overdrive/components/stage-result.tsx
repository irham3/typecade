"use client"

import { useShallow } from "zustand/react/shallow"
import { ItemGlyph } from "@/components/overdrive/icons"
import { PrimaryButton } from "@/components/overdrive/ui"
import { KEYCAPS } from "@/lib/engine/overdrive/items"
import type { ItemImpact } from "@/lib/engine/overdrive"
import { useGame } from "../store"
import { formatNumber, formatTime } from "./hud"
import { Screen } from "./screen"
import { STAGE_COPY } from "../presentation/stage-copy"

function impactWeight(impact: ItemImpact) {
	return impact.score
		+ impact.tokens * 20
		+ Math.abs(impact.timeMs) / 1_000 * 5
		+ impact.protections * 30
		+ impact.triggers
}

function impactSummary(impact: ItemImpact) {
	const parts: string[] = []
	if (impact.score > 0) parts.push(`+${formatNumber(Math.round(impact.score))} score`)
	if (impact.tokens > 0) parts.push(`+${impact.tokens} tokens`)
	if (impact.timeMs !== 0) parts.push(`${impact.timeMs / 1_000}s`)
	if (impact.protections > 0) parts.push(`${impact.protections} saved`)
	if (parts.length === 0) parts.push(`${impact.triggers} proc${impact.triggers === 1 ? "" : "s"}`)
	return parts.join(" · ")
}

function Stat({ label, value, tone = "text-text-hi" }: { label: string; value: string; tone?: string }) {
	return (
		<div className="flex items-center justify-between gap-4 border-b border-line py-3 last:border-0">
			<span className="text-sm font-bold uppercase tracking-[0.08em] text-text-mid">{label}</span>
			<strong className={`text-base tabular-nums ${tone}`}>{value}</strong>
		</div>
	)
}

export function StageResult() {
	const state = useGame(useShallow((snapshot) => ({
		zone: snapshot.zone,
		stage: snapshot.stage,
		score: snapshot.score,
		quota: snapshot.quota,
		wpm: snapshot.wpm,
		accuracy: snapshot.accuracy,
		timeLeftMs: snapshot.timeLeftMs,
		highestMult: snapshot.highestMult,
		cleanWords: snapshot.cleanWords,
		stageTypos: snapshot.stageTypos,
		tokenBreakdown: snapshot.tokenBreakdown,
		tokens: snapshot.tokens,
		win: snapshot.win,
		stageItemImpact: snapshot.stageItemImpact,
		api: snapshot.api,
	})))
	const stageCopy = STAGE_COPY[state.stage]
	const topImpact = Object.entries(state.stageItemImpact)
		.sort(([, first], [, second]) => impactWeight(second) - impactWeight(first))
		.slice(0, 3)
	const nextRead = state.stageTypos > 0
		? `${state.stageTypos} typo${state.stageTypos === 1 ? "" : "s"} broke scoring words. Prioritize protection or a recovery trigger before adding more speed.`
		: topImpact.length === 0
			? "Your typing carried the clear. Buy a trigger you can activate reliably so the next Quota is not raw-speed only."
			: state.timeLeftMs <= 20_000
				? "The clear was close. Add Base or Mult scaling before the next Quota outgrows this build."
				: "Fast, clean clear. Keep the trigger pattern that worked and spend only when the next offer strengthens it."

	return (
		<Screen>
			<main className="h-full overflow-y-auto bg-bg-0 px-6 text-text-hi">
				<div className="mx-auto w-full max-w-3xl py-12">
					<header className="border-b border-line pb-6">
						<p className="text-sm font-bold uppercase tracking-[0.08em] text-acc-green">QUOTA SECURED</p>
						<h1 className="mt-3 font-pixel text-2xl">
							ZONE {state.zone} · {stageCopy.label}
						</h1>
						<p className="mt-3 text-base text-text-mid">
							{formatTime(state.timeLeftMs)} remained on the clock. Convert the lead into a stronger build.
						</p>
					</header>

					<section className="mt-6 border-l-2 border-acc-cyan bg-bg-1 px-4 py-3" aria-labelledby="next-read-title">
						<h2 id="next-read-title" className="text-sm font-bold uppercase tracking-[0.08em] text-acc-cyan">
							NEXT READ
						</h2>
						<p className="mt-2 text-sm leading-6 text-text-mid">{nextRead}</p>
					</section>

					<div className="mt-6 grid gap-6 md:grid-cols-2">
						<section className="overdrive-panel p-6" aria-labelledby="stage-stats-title">
							<h2 id="stage-stats-title" className="text-sm font-bold uppercase tracking-[0.08em] text-text-mid">
								STAGE READOUT
							</h2>
							<div className="mt-3">
								<Stat label="Score" value={formatNumber(state.score)} tone="text-acc-yellow" />
								<Stat label="Quota" value={formatNumber(state.quota)} />
								<Stat label="WPM" value={String(state.wpm)} />
								<Stat label="Accuracy" value={`${state.accuracy}%`} tone={state.accuracy >= 97 ? "text-acc-green" : "text-acc-yellow"} />
								<Stat label="Highest Mult" value={`×${formatNumber(state.highestMult)}`} tone="text-acc-violet" />
								<Stat label="Clean Words" value={String(state.cleanWords)} />
								<Stat label="Typos" value={String(state.stageTypos)} tone={state.stageTypos === 0 ? "text-acc-green" : "text-acc-red"} />
							</div>
						</section>

						<div className="flex flex-col gap-6">
							<section className="overdrive-panel p-6" aria-labelledby="token-title">
								<div className="flex items-center justify-between">
									<h2 id="token-title" className="text-sm font-bold uppercase tracking-[0.08em] text-text-mid">TOKEN PAYOUT</h2>
									<strong className="text-2xl tabular-nums text-acc-yellow">{formatNumber(state.tokens)}</strong>
								</div>
								<div className="mt-3">
									<Stat label="Stage Clear" value={`+${state.tokenBreakdown?.clearReward ?? 0}`} />
									<Stat label="Time Bonus" value={`+${state.tokenBreakdown?.timeBonus ?? 0}`} />
									<Stat label="Interest" value={`+${state.tokenBreakdown?.interest ?? 0}`} />
									<Stat label="Total Earned" value={`+${state.tokenBreakdown?.totalEarned ?? 0}`} tone="text-acc-yellow" />
								</div>
							</section>

							<section className="overdrive-panel p-6" aria-labelledby="impact-title">
								<h2 id="impact-title" className="text-sm font-bold uppercase tracking-[0.08em] text-text-mid">BUILD IMPACT</h2>
								<div className="mt-4 flex flex-col gap-3">
									{topImpact.length === 0 && (
										<p className="text-sm leading-6 text-text-dim">No Keycap triggered this stage. The shop can change that.</p>
									)}
									{topImpact.map(([id, impact]) => {
										const definition = KEYCAPS[id]
										if (!definition) return null
										return (
											<div key={id} className="flex items-center gap-3">
												<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-line bg-bg-2 text-xl text-text-hi">
													<ItemGlyph id={id} type="keycap" className="h-6 w-6" />
												</div>
												<div className="min-w-0">
													<strong className="block truncate text-sm text-text-hi">{definition.name}</strong>
													<span className="text-sm text-text-mid">{impactSummary(impact)}</span>
												</div>
											</div>
										)
									})}
								</div>
							</section>
						</div>
					</div>

					<PrimaryButton onClick={() => state.api?.continueToNextStage()} className="mt-6 h-14 w-full">
						{state.win ? "REVIEW STANDARD CLEAR" : "ENTER SHOP"}
					</PrimaryButton>
				</div>
			</main>
		</Screen>
	)
}
