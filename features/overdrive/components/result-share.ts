import type { RunSnapshot } from "@/lib/engine/overdrive"

export type ResultSharePayload = {
	title: string
	text: string
	seed: string
}

export function createResultSharePayload(
	snapshot: Pick<RunSnapshot, "seed" | "runScore" | "zone" | "keycaps" | "macros" | "highestMult">,
): ResultSharePayload {
	const buildSize = snapshot.keycaps.length + snapshot.macros.length
	return {
		title: "Typecade: Overdrive",
		text: `TYPECADE: OVERDRIVE — ${snapshot.runScore.toLocaleString("en-US")} points, Zone ${snapshot.zone}, ×${snapshot.highestMult} Mult, ${buildSize} build items. Seed: ${snapshot.seed}`,
		seed: snapshot.seed,
	}
}
