import { Assets } from "pixi.js"
import type { Spritesheet, Texture } from "pixi.js"
import {
	loadEnvironmentAssets,
	type LoadedEnvironmentAssets,
} from "../environment/environment-assets"
import type { StageType } from "@/lib/engine/overdrive"
import type {
	AnimationClip,
	AnimationClipName,
	RigDefinition,
	RigKeyframe,
} from "../rig/rig-definition"
import {
	COMBAT_RIG_MANIFESTS,
	RIG_PART_IDS,
	RIG_REQUIRED_CLIPS,
	type CombatRigId,
} from "../rig/rig-manifests"

type AtlasFrame = {
	frame: {
		x: number
		y: number
		w: number
		h: number
	}
}

type RigAtlasData = {
	frames: Record<string, AtlasFrame>
	meta: {
		image: string
		size: {
			w: number
			h: number
		}
		rig: {
			id: CombatRigId
			parts: Record<string, {
				pivot: {
					x: number
					y: number
				}
			}>
			clips: AnimationClipName[]
		}
	}
}

export type LoadedRigAssets = {
	definition: RigDefinition
	textures: Record<string, Texture>
	fallback: boolean
}

const stageEnemy: Record<StageType, CombatRigId> = {
	warmup: "packet",
	rush: "needle",
	glitch: "null",
}

const rigCache = new Map<CombatRigId, Promise<LoadedRigAssets>>()
const fallbackCache = new Map<CombatRigId, Promise<LoadedRigAssets>>()

function isFiniteNumber(value: unknown): value is number {
	return typeof value === "number" && Number.isFinite(value)
}

function validateAtlas(data: unknown, rigId: CombatRigId): RigAtlasData {
	if (!data || typeof data !== "object") throw new Error(`Invalid ${rigId} atlas`)
	const atlas = data as Partial<RigAtlasData>
	if (!atlas.frames || !atlas.meta?.rig || !atlas.meta.size) {
		throw new Error(`Incomplete ${rigId} atlas`)
	}
	if (
		!atlas.meta.rig.parts
		|| !Array.isArray(atlas.meta.rig.clips)
	) {
		throw new Error(`Incomplete ${rigId} rig metadata`)
	}
	if (atlas.meta.rig.id !== rigId) throw new Error(`Atlas ID mismatch for ${rigId}`)
	if (!isFiniteNumber(atlas.meta.size.w) || !isFiniteNumber(atlas.meta.size.h)) {
		throw new Error(`Invalid ${rigId} atlas dimensions`)
	}

	for (const partId of RIG_PART_IDS[rigId]) {
		const frameId = `${rigId}/${partId}`
		const frame = atlas.frames[frameId]?.frame
		const pivot = atlas.meta.rig.parts?.[partId]?.pivot
		if (!frame || !pivot) throw new Error(`Atlas ${rigId} is missing ${partId}`)
		if (
			![frame.x, frame.y, frame.w, frame.h, pivot.x, pivot.y]
				.every(isFiniteNumber)
		) {
			throw new Error(`Atlas ${rigId} has invalid geometry for ${partId}`)
		}
		if (
			frame.x < 0
			|| frame.y < 0
			|| frame.w <= 0
			|| frame.h <= 0
			|| frame.x + frame.w > atlas.meta.size.w
			|| frame.y + frame.h > atlas.meta.size.h
		) {
			throw new Error(`Atlas ${rigId} frame is outside bounds for ${partId}`)
		}
		if (pivot.x < 0 || pivot.y < 0 || pivot.x > frame.w || pivot.y > frame.h) {
			throw new Error(`Atlas ${rigId} has invalid pivot for ${partId}`)
		}
	}

	for (const clipName of RIG_REQUIRED_CLIPS[rigId]) {
		if (!atlas.meta.rig.clips.includes(clipName)) {
			throw new Error(`Atlas ${rigId} is missing clip ${clipName}`)
		}
	}

	return atlas as RigAtlasData
}

async function loadRig(rigId: CombatRigId): Promise<LoadedRigAssets> {
	const definition = COMBAT_RIG_MANIFESTS[rigId]
	const response = await fetch(definition.atlasUrl)
	if (!response.ok) throw new Error(`Unable to load ${definition.atlasUrl}`)
	const atlas = validateAtlas(await response.json(), rigId)
	const sheet = await Assets.load<Spritesheet>(definition.atlasUrl)
	const textures: Record<string, Texture> = {}
	for (const partId of RIG_PART_IDS[rigId]) {
		const texture = sheet.textures[`${rigId}/${partId}`]
		if (!texture) throw new Error(`Spritesheet ${rigId} is missing ${partId}`)
		textures[partId] = texture
	}
	return {
		definition: {
			...definition,
			parts: definition.parts.map((part) => ({
				...part,
				pivot: { ...atlas.meta.rig.parts[part.id].pivot },
			})),
		},
		textures,
		fallback: false,
	}
}

function cachedRig(rigId: CombatRigId) {
	const cached = rigCache.get(rigId)
	if (cached) return cached
	const pending = loadRig(rigId)
	rigCache.set(rigId, pending)
	pending.catch(() => rigCache.delete(rigId))
	return pending
}

function fallbackKeyframes(name: AnimationClipName, durationMs: number): RigKeyframe[] {
	if (name === "defeat") {
		return [
			{ atMs: 0, x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, alpha: 1 },
			{ atMs: durationMs, x: 48, y: 24, rotation: 0.28, scaleX: 0.82, scaleY: 0.82, alpha: 0 },
		]
	}
	if (name === "hit" || name === "hurt") {
		return [
			{ atMs: 0, x: 0, rotation: 0 },
			{ atMs: durationMs * 0.4, x: 8, rotation: 0.06 },
			{ atMs: durationMs, x: 0, rotation: 0 },
		]
	}
	if (name === "attack" || name.startsWith("chain")) {
		return [
			{ atMs: 0, x: 0, rotation: 0 },
			{ atMs: durationMs * 0.5, x: -24, rotation: -0.05, easing: "cubic-out" },
			{ atMs: durationMs, x: 0, rotation: 0 },
		]
	}
	if (name === "overdrive") {
		return [
			{ atMs: 0, x: 0, rotation: 0 },
			{ atMs: durationMs * 0.58, x: 120, rotation: 0.1, easing: "cubic-out" },
			{ atMs: durationMs, x: 0, rotation: 0 },
		]
	}
	return [
		{ atMs: 0, y: 0 },
		{ atMs: durationMs / 2, y: -2 },
		{ atMs: durationMs, y: 0 },
	]
}

function fallbackDefinition(
	rigId: CombatRigId,
	texture: Texture,
): RigDefinition {
	const source = COMBAT_RIG_MANIFESTS[rigId]
	const clips: Partial<Record<AnimationClipName, AnimationClip>> = {}
	for (const [name, definition] of Object.entries(source.clips)) {
		if (!definition) continue
		const clipName = name as AnimationClipName
		clips[clipName] = {
			...definition,
			tracks: [{
				partId: "fallback",
				keyframes: fallbackKeyframes(clipName, definition.durationMs),
			}],
		}
	}
	return {
		id: `${rigId}-fallback`,
		atlasUrl: "",
		defaultClip: source.defaultClip,
		parts: [{
			id: "fallback",
			texture: "fallback",
			pivot: {
				x: texture.width / 2,
				y: texture.height / 2,
			},
			defaultTransform: {
				x: 0,
				y: 0,
				rotation: 0,
				scaleX: 1,
				scaleY: 1,
				alpha: 1,
			},
			zIndex: 0,
		}],
		clips,
	}
}

async function loadFallback(rigId: CombatRigId): Promise<LoadedRigAssets> {
	const character = rigId === "warden" ? "warden" : rigId
	const pose = rigId === "warden" ? "ready-low" : "idle-a"
	const texture = await Assets.load<Texture>(
		`/overdrive/art/poses/${character}/${pose}.png`,
	)
	return {
		definition: fallbackDefinition(rigId, texture),
		textures: { fallback: texture },
		fallback: true,
	}
}

function cachedFallback(rigId: CombatRigId) {
	const cached = fallbackCache.get(rigId)
	if (cached) return cached
	const pending = loadFallback(rigId)
	fallbackCache.set(rigId, pending)
	return pending
}

async function loadWithFallback(rigId: CombatRigId) {
	try {
		return await cachedRig(rigId)
	} catch (error) {
		if (process.env.NODE_ENV !== "production") {
			console.warn(`Using local ${rigId} combat fallback`, error)
		}
		return cachedFallback(rigId)
	}
}

export async function loadCombatRigAssets(stage: StageType): Promise<{
	warden: LoadedRigAssets
	enemy: LoadedRigAssets
	environment: LoadedEnvironmentAssets
}> {
	const [warden, enemy, environment] = await Promise.all([
		loadWithFallback("warden"),
		loadWithFallback(stageEnemy[stage]),
		loadEnvironmentAssets(),
	])
	return { warden, enemy, environment }
}
