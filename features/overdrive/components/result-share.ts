import type { RunSnapshot } from "@/lib/engine/overdrive"

export type ResultSharePayload = {
	title: string
	text: string
	seed: string
	challengeUrl: string
}

function encodeSeed(seed: string): string {
	return btoa(unescape(encodeURIComponent(seed)))
		.replaceAll("+", "-")
		.replaceAll("/", "_")
		.replaceAll("=", "")
}

export function createResultSharePayload(
	snapshot: Pick<RunSnapshot, "seed" | "runScore" | "zone" | "keycaps" | "macros" | "firmware" | "highestMult">,
): ResultSharePayload {
	const buildSize = snapshot.keycaps.length + snapshot.macros.length + snapshot.firmware.length
	const build = [...snapshot.keycaps, ...snapshot.macros, ...snapshot.firmware].join(".") || "empty"
	const challengeUrl = `/overdrive?challenge=${encodeSeed(snapshot.seed)}&build=${encodeURIComponent(build)}`
	return {
		title: "Typecade: Overdrive",
		text: `TYPECADE: OVERDRIVE — ${snapshot.runScore.toLocaleString("en-US")} points, Zone ${snapshot.zone}, x${snapshot.highestMult} Mult, ${buildSize} build items. Seed: ${snapshot.seed}. Challenge: ${challengeUrl}`,
		seed: snapshot.seed,
		challengeUrl,
	}
}
