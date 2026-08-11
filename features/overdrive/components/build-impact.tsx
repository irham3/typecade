"use client"

import type { ScoreResolution } from "@/lib/engine/overdrive"
import { formatNumber } from "./hud"

export function buildImpactLabel(resolution: ScoreResolution | undefined, itemId: string) {
	const impact = resolution?.itemImpacts.find((entry) => entry.itemId === itemId)
	if (!impact) return `${itemId} · NO DIRECT SCORE IMPACT`
	return `${itemId} · +${formatNumber(impact.scoreDelta)} ${impact.kind.toUpperCase()} IMPACT`
}

export function BuildImpact({ resolution }: { resolution?: ScoreResolution }) {
	if (!resolution || resolution.itemImpacts.length === 0) return null
	return (
		<div className="mt-1 wrap-break-word text-acc-cyan" aria-label="Build impact">
			{resolution.itemImpacts.map((impact) => (
				<span className="mr-3 inline-block" key={impact.itemId}>
					{buildImpactLabel(resolution, impact.itemId)}
				</span>
			))}
		</div>
	)
}
