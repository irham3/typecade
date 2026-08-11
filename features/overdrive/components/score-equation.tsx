"use client"

import type { ScoreResolution } from "@/lib/engine/overdrive"
import { formatNumber } from "./hud"
import { BuildImpact } from "./build-impact"

export function ScoreEquation({ resolution }: { resolution?: ScoreResolution }) {
	if (!resolution) return null

	const equation = resolution.aegisRecovery
		? `${formatNumber(resolution.effectiveBase)} BASE ONLY = +${formatNumber(resolution.total)}`
		: `${formatNumber(resolution.effectiveBase)} BASE x ${formatNumber(resolution.effectiveMult)} MULT x ${formatNumber(resolution.finalMultiplier)} FINAL = +${formatNumber(resolution.total)}`

	return (
		<details className="min-w-0 text-sm" data-testid="score-equation">
			<summary className="cursor-pointer list-none truncate font-bold text-text-hi">
				<span className="text-text-mid">SCORE </span>{equation}
			</summary>
			<div className="mt-2 max-h-24 overflow-y-auto border-l-2 border-acc-violet pl-3 text-xs leading-5 text-text-mid">
				{resolution.trace.map((step) => (
					<div className="flex min-w-0 items-baseline justify-between gap-3" key={step.id}>
						<span className="min-w-0 break-words">{step.label}</span>
						<span className="shrink-0 tabular-nums text-text-hi">{formatNumber(step.after)}</span>
					</div>
				))}
				<BuildImpact resolution={resolution} />
			</div>
		</details>
	)
}
