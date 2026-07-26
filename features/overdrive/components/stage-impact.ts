import type { ItemImpact } from "@/lib/engine/overdrive"
import { formatNumber } from "./hud"

function impactWeight(impact: ItemImpact) {
	return impact.score
		+ impact.tokens * 20
		+ Math.abs(impact.timeMs) / 1_000 * 5
		+ impact.protections * 30
		+ impact.triggers
}

export function strongestImpact(impacts: Record<string, ItemImpact>) {
	return Object.entries(impacts)
		.sort(([, first], [, second]) => impactWeight(second) - impactWeight(first))
		.at(0)
}

export function impactSummary(impact: ItemImpact) {
	const parts: string[] = []
	if (impact.score > 0) parts.push(`+${formatNumber(Math.round(impact.score))} score`)
	if (impact.tokens > 0) parts.push(`+${impact.tokens} tokens`)
	if (impact.timeMs !== 0) parts.push(`${impact.timeMs / 1_000}s`)
	if (impact.protections > 0) parts.push(`${impact.protections} saved`)
	if (parts.length === 0) parts.push(`${impact.triggers} proc${impact.triggers === 1 ? "" : "s"}`)
	return parts.join(" · ")
}
