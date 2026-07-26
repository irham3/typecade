import type { FormationVariantId } from "@/lib/engine/overdrive"

export type RigTransform = {
	x: number
	y: number
	rotation: number
	scaleX: number
	scaleY: number
	alpha: number
}

export type RigKeyframe = Partial<RigTransform> & {
	atMs: number
	easing?: "linear" | "cubic-out" | "ease-out-back"
}

export type RigTrack = {
	partId: string
	keyframes: readonly RigKeyframe[]
}

export type AnimationClipName =
	| "idle"
	| "ready"
	| "chain-1"
	| "chain-2"
	| "chain-3"
	| "dash"
	| "execute"
	| "block"
	| "hurt"
	| "recover"
	| "overdrive"
	| "cannon-burst"
	| "rail-step"
	| "tether-pull"
	| "breach-slide"
	| "recoil-vault"
	| "crossfire-pivot"
	| "execution"
	| "overdrive-breach"
	| "locomotion"
	| "anticipation"
	| "attack"
	| "hit"
	| "defeat"
	| "special"

export type AnimationClip = {
	name: AnimationClipName
	durationMs: number
	loop: boolean
	priority: number
	contactMs?: number
	recoveryStartMs?: number
	tracks: readonly RigTrack[]
}

export type RigPoint = {
	x: number
	y: number
}

export type RigPartDefinition = {
	id: string
	texture: string
	parentId?: string
	pivot: RigPoint
	defaultTransform: RigTransform
	zIndex: number
}

export type RigVariantDefinition = {
	id: FormationVariantId
	enabledPartIds: readonly string[]
	transformOverrides?: Readonly<Record<string, Partial<RigTransform>>>
	baseScale: number
}

export type RigDefinition = {
	id: string
	atlasUrl: string
	defaultClip: AnimationClipName
	parts: readonly RigPartDefinition[]
	clips: Readonly<Partial<Record<AnimationClipName, AnimationClip>>>
	variants?: readonly RigVariantDefinition[]
}

export type AnimationFrameState = {
	clip: AnimationClipName
	localTimeMs: number
	transforms: Readonly<Record<string, RigTransform>>
	contactEdge: boolean
	completed: boolean
}
