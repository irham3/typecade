import type { CombatActionKind, CombatVerb } from "@/lib/engine/overdrive"

export type EffectDescriptor = {
	id: string
	verb: CombatVerb | CombatActionKind | "item-proc" | "stage-clear" | "run-over"
	durationMs: number
	pool: "contact" | "line" | "fragment" | "popup" | "ambient"
	reducedMotion: "keep" | "omit"
	mergeKey: string
}

const descriptors: Record<EffectDescriptor["verb"], EffectDescriptor> = {
	"signal-lock": { id: "contact-lock", verb: "signal-lock", durationMs: 90, pool: "contact", reducedMotion: "keep", mergeKey: "contact" },
	"arc-dash": { id: "contact-dash", verb: "arc-dash", durationMs: 110, pool: "line", reducedMotion: "keep", mergeKey: "line" },
	"chain-strike": { id: "contact-chain", verb: "chain-strike", durationMs: 110, pool: "line", reducedMotion: "keep", mergeKey: "chain" },
	"execution-ready": { id: "execution-ready", verb: "execution-ready", durationMs: 120, pool: "ambient", reducedMotion: "keep", mergeKey: "ready" },
	misfire: { id: "misfire", verb: "misfire", durationMs: 120, pool: "contact", reducedMotion: "keep", mergeKey: "misfire" },
	slash: { id: "action-slash", verb: "slash", durationMs: 110, pool: "line", reducedMotion: "keep", mergeKey: "slash" },
	dash: { id: "action-dash", verb: "dash", durationMs: 180, pool: "contact", reducedMotion: "keep", mergeKey: "dash" },
	blade: { id: "action-blade", verb: "blade", durationMs: 420, pool: "ambient", reducedMotion: "omit", mergeKey: "blade" },
	railgun: { id: "action-railgun", verb: "railgun", durationMs: 180, pool: "line", reducedMotion: "keep", mergeKey: "railgun" },
	echo: { id: "action-echo", verb: "echo", durationMs: 110, pool: "contact", reducedMotion: "keep", mergeKey: "echo" },
	shield: { id: "action-shield", verb: "shield", durationMs: 600, pool: "ambient", reducedMotion: "keep", mergeKey: "shield" },
	bomb: { id: "action-bomb", verb: "bomb", durationMs: 300, pool: "ambient", reducedMotion: "omit", mergeKey: "bomb" },
	drain: { id: "action-drain", verb: "drain", durationMs: 360, pool: "line", reducedMotion: "keep", mergeKey: "drain" },
	"overdrive-burst": { id: "action-overdrive-burst", verb: "overdrive-burst", durationMs: 320, pool: "ambient", reducedMotion: "keep", mergeKey: "overdrive" },
	"item-proc": { id: "item-proc", verb: "item-proc", durationMs: 150, pool: "ambient", reducedMotion: "omit", mergeKey: "item" },
	"stage-clear": { id: "stage-clear", verb: "stage-clear", durationMs: 900, pool: "ambient", reducedMotion: "keep", mergeKey: "stage-clear" },
	"run-over": { id: "run-over", verb: "run-over", durationMs: 900, pool: "ambient", reducedMotion: "keep", mergeKey: "run-over" },
}

export function effectDescriptorFor(verb: EffectDescriptor["verb"]): EffectDescriptor {
	return descriptors[verb]
}

export const EFFECT_MANIFEST = descriptors
