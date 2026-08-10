import {
	Container,
	Graphics,
} from "pixi.js"
import type { ItemContribution } from "@/lib/engine/overdrive"
import { V } from "../visual-assets"

export type ItemPresentationPreset = {
	shape:
		| "cross-cut"
		| "magnet-arc"
		| "sightline"
		| "afterimage"
		| "reconnect"
		| "token-eject"
		| "key-floor"
		| "punctuation-burst"
		| "battery-shield"
		| "gear-pulse"
		| "double-contact"
		| "core-segment"
		| "vault"
		| "glass"
		| "time-strand"
		| "glitch-tear"
		| "time-ring"
		| "quota-cut"
		| "insurance-shield"
	tone: ItemContribution["kind"]
	hudTarget: "base" | "mult" | "score" | "time" | "token" | "quota" | "rail"
}

type MvpItemId =
	| "wasd"
	| "vowel_magnet"
	| "longshot"
	| "sprinter"
	| "second_wind"
	| "copper_key"
	| "home_row"
	| "punctuator"
	| "combo_battery"
	| "overclock"
	| "double_tap"
	| "snowball"
	| "interest_bank"
	| "glass_keycap"
	| "vampire"
	| "escape"
	| "time_freeze"
	| "quota_slash"
	| "insurance"

export const ITEM_PRESENTATION: Record<MvpItemId, ItemPresentationPreset> = {
	wasd: { shape: "cross-cut", tone: "base", hudTarget: "base" },
	vowel_magnet: { shape: "magnet-arc", tone: "base", hudTarget: "base" },
	longshot: { shape: "sightline", tone: "base", hudTarget: "base" },
	sprinter: { shape: "afterimage", tone: "mult", hudTarget: "mult" },
	second_wind: { shape: "reconnect", tone: "score", hudTarget: "score" },
	copper_key: { shape: "token-eject", tone: "token", hudTarget: "token" },
	home_row: { shape: "key-floor", tone: "base", hudTarget: "base" },
	punctuator: { shape: "punctuation-burst", tone: "base", hudTarget: "rail" },
	combo_battery: { shape: "battery-shield", tone: "protection", hudTarget: "mult" },
	overclock: { shape: "gear-pulse", tone: "mult", hudTarget: "mult" },
	double_tap: { shape: "double-contact", tone: "mult", hudTarget: "mult" },
	snowball: { shape: "core-segment", tone: "mult", hudTarget: "mult" },
	interest_bank: { shape: "vault", tone: "token", hudTarget: "token" },
	glass_keycap: { shape: "glass", tone: "mult", hudTarget: "mult" },
	vampire: { shape: "time-strand", tone: "time", hudTarget: "time" },
	escape: { shape: "glitch-tear", tone: "protection", hudTarget: "rail" },
	time_freeze: { shape: "time-ring", tone: "time", hudTarget: "time" },
	quota_slash: { shape: "quota-cut", tone: "quota", hudTarget: "quota" },
	insurance: { shape: "insurance-shield", tone: "protection", hudTarget: "rail" },
}

type Point = {
	x: number
	y: number
}

type LiveItemEffect = {
	node: Graphics
	preset: ItemPresentationPreset
	lifeMs: number
	durationMs: number
	origin: Point
	reducedMotion: boolean
}

const EFFECT_MS = 450
const FOOTPRINT = 48
const HALF = FOOTPRINT / 2
const STROKE = 2

function toneColor(tone: ItemContribution["kind"]) {
	if (tone === "mult") return V.violet
	if (tone === "score" || tone === "token") return V.yellow
	if (tone === "time" || tone === "protection") return V.cyan
	if (tone === "quota") return V.green
	return V.text
}

function drawShape(
	node: Graphics,
	preset: ItemPresentationPreset,
) {
	const color = toneColor(preset.tone)
	node.clear()
	if (preset.shape === "cross-cut") {
		node
			.moveTo(-HALF, -HALF)
			.lineTo(HALF, HALF)
			.moveTo(HALF, -HALF)
			.lineTo(-HALF, HALF)
			.stroke({ color, width: STROKE })
		return
	}
	if (preset.shape === "magnet-arc") {
		node
			.arc(0, 0, HALF, Math.PI * 0.15, Math.PI * 0.85)
			.stroke({ color, width: STROKE })
			.circle(-HALF * 0.62, HALF * 0.58, STROKE * 2)
			.circle(HALF * 0.62, HALF * 0.58, STROKE * 2)
			.fill({ color })
		return
	}
	if (preset.shape === "sightline") {
		node
			.circle(0, 0, HALF * 0.62)
			.stroke({ color, width: STROKE })
			.moveTo(-HALF, 0)
			.lineTo(HALF, 0)
			.moveTo(0, -HALF)
			.lineTo(0, HALF)
			.stroke({ color, width: STROKE })
		return
	}
	if (preset.shape === "afterimage") {
		for (let index = 0; index < 3; index += 1) {
			node
				.rect(
					-HALF + index * 8,
					-HALF * 0.62,
					8,
					FOOTPRINT * 0.62,
				)
				.fill({ color, alpha: 0.28 + index * 0.22 })
		}
		return
	}
	if (preset.shape === "reconnect") {
		node
			.moveTo(-HALF, -HALF * 0.34)
			.lineTo(-HALF * 0.2, -HALF * 0.34)
			.lineTo(HALF * 0.2, HALF * 0.34)
			.lineTo(HALF, HALF * 0.34)
			.stroke({ color, width: STROKE })
			.circle(-HALF, -HALF * 0.34, 4)
			.circle(HALF, HALF * 0.34, 4)
			.fill({ color })
		return
	}
	if (preset.shape === "token-eject") {
		node
			.circle(0, 0, HALF * 0.62)
			.stroke({ color, width: STROKE })
			.rect(-STROKE, -HALF * 0.42, STROKE * 2, HALF * 0.84)
			.fill({ color })
		return
	}
	if (preset.shape === "key-floor") {
		for (let index = 0; index < 4; index += 1) {
			node
				.roundRect(
					-HALF + index * 13,
					-HALF * 0.24,
					10,
					12,
					2,
				)
				.stroke({ color, width: STROKE })
		}
		return
	}
	if (preset.shape === "punctuation-burst") {
		node
			.circle(-14, -8, 3)
			.circle(0, 10, 3)
			.circle(14, -6, 3)
			.fill({ color })
			.moveTo(0, -HALF)
			.lineTo(0, -8)
			.stroke({ color, width: STROKE })
		return
	}
	if (
		preset.shape === "battery-shield"
		|| preset.shape === "insurance-shield"
	) {
		node
			.moveTo(0, -HALF)
			.lineTo(HALF * 0.8, -HALF * 0.52)
			.lineTo(HALF * 0.62, HALF * 0.58)
			.lineTo(0, HALF)
			.lineTo(-HALF * 0.62, HALF * 0.58)
			.lineTo(-HALF * 0.8, -HALF * 0.52)
			.closePath()
			.stroke({ color, width: STROKE })
		if (preset.shape === "battery-shield") {
			node
				.rect(-8, -12, 16, 24)
				.stroke({ color, width: STROKE })
				.rect(-3, -16, 6, 4)
				.fill({ color })
		} else {
			node
				.moveTo(-8, 0)
				.lineTo(-2, 7)
				.lineTo(10, -8)
				.stroke({ color, width: STROKE })
		}
		return
	}
	if (preset.shape === "gear-pulse") {
		node.circle(0, 0, HALF * 0.56).stroke({ color, width: STROKE })
		for (let index = 0; index < 8; index += 1) {
			const angle = index * Math.PI / 4
			node
				.moveTo(
					Math.cos(angle) * HALF * 0.64,
					Math.sin(angle) * HALF * 0.64,
				)
				.lineTo(
					Math.cos(angle) * HALF,
					Math.sin(angle) * HALF,
				)
				.stroke({ color, width: STROKE })
		}
		return
	}
	if (preset.shape === "double-contact") {
		node
			.circle(-9, 0, HALF * 0.48)
			.circle(9, 0, HALF * 0.48)
			.stroke({ color, width: STROKE })
		return
	}
	if (preset.shape === "core-segment") {
		for (let index = 0; index < 4; index += 1) {
			const angle = index * Math.PI / 2
			node
				.arc(
					0,
					0,
					HALF * 0.72,
					angle + 0.14,
					angle + Math.PI / 2 - 0.14,
				)
				.stroke({ color, width: STROKE * 2 })
		}
		return
	}
	if (preset.shape === "vault") {
		node
			.roundRect(-HALF * 0.76, -HALF * 0.64, HALF * 1.52, HALF * 1.28, 4)
			.stroke({ color, width: STROKE })
			.circle(0, 0, 7)
			.stroke({ color, width: STROKE })
			.moveTo(0, -7)
			.lineTo(0, 7)
			.stroke({ color, width: STROKE })
		return
	}
	if (preset.shape === "glass") {
		node
			.moveTo(-HALF * 0.72, -HALF)
			.lineTo(HALF * 0.74, -HALF * 0.64)
			.lineTo(HALF * 0.56, HALF)
			.lineTo(-HALF * 0.82, HALF * 0.52)
			.closePath()
			.moveTo(-6, -HALF * 0.84)
			.lineTo(4, -3)
			.lineTo(-3, 8)
			.lineTo(8, HALF * 0.82)
			.stroke({ color, width: STROKE })
		return
	}
	if (preset.shape === "time-strand") {
		node
			.moveTo(-HALF, -HALF * 0.64)
			.bezierCurveTo(-8, -HALF, 8, HALF, HALF, HALF * 0.64)
			.moveTo(-HALF, HALF * 0.64)
			.bezierCurveTo(-8, HALF, 8, -HALF, HALF, -HALF * 0.64)
			.stroke({ color, width: STROKE })
		return
	}
	if (preset.shape === "glitch-tear") {
		node
			.moveTo(-HALF, -14)
			.lineTo(-5, -8)
			.lineTo(-12, 2)
			.lineTo(8, 8)
			.lineTo(2, 18)
			.lineTo(HALF, 14)
			.stroke({ color, width: STROKE * 2 })
		return
	}
	if (preset.shape === "time-ring") {
		node
			.circle(0, 0, HALF * 0.76)
			.stroke({ color, width: STROKE })
			.moveTo(0, 0)
			.lineTo(0, -12)
			.moveTo(0, 0)
			.lineTo(10, 6)
			.stroke({ color, width: STROKE })
		return
	}
	if (preset.shape === "quota-cut") {
		node
			.rect(-HALF, -7, FOOTPRINT, 14)
			.stroke({ color, width: STROKE })
			.moveTo(-6, -HALF)
			.lineTo(6, HALF)
			.stroke({ color: V.text, width: STROKE * 2 })
	}
}

export class ItemPresentation {
	readonly root = new Container()
	private readonly live = new Map<ItemPresentationPreset["shape"], LiveItemEffect>()

	play(itemId: string, position: Point, reducedMotion: boolean) {
		const preset = ITEM_PRESENTATION[itemId as MvpItemId]
		if (!preset) return false
		const existing = this.live.get(preset.shape)
		if (existing) {
			existing.lifeMs = EFFECT_MS
			existing.origin = { ...position }
			existing.node.position.copyFrom(position)
			existing.reducedMotion = reducedMotion
			return true
		}
		const node = new Graphics()
		drawShape(node, preset)
		node.position.copyFrom(position)
		this.root.addChild(node)
		this.live.set(preset.shape, {
			node,
			preset,
			lifeMs: EFFECT_MS,
			durationMs: EFFECT_MS,
			origin: { ...position },
			reducedMotion,
		})
		return true
	}

	update(deltaMs: number) {
		for (const [shape, effect] of this.live) {
			effect.lifeMs = Math.max(0, effect.lifeMs - deltaMs)
			const progress = 1 - effect.lifeMs / effect.durationMs
			effect.node.alpha = Math.sin(progress * Math.PI)
			this.applyMotion(effect, progress)
			if (effect.lifeMs === 0) {
				effect.node.destroy()
				this.live.delete(shape)
			}
		}
	}

	destroy() {
		for (const effect of this.live.values()) effect.node.destroy()
		this.live.clear()
		this.root.destroy({ children: true })
	}

	private applyMotion(effect: LiveItemEffect, progress: number) {
		if (effect.reducedMotion) {
			effect.node.position.copyFrom(effect.origin)
			effect.node.rotation = 0
			effect.node.scale.set(1)
			return
		}
		const shape = effect.preset.shape
		if (
			shape === "gear-pulse"
			|| shape === "core-segment"
			|| shape === "time-ring"
		) {
			effect.node.rotation = progress * Math.PI * 0.7
		}
		if (
			shape === "afterimage"
			|| shape === "sightline"
			|| shape === "quota-cut"
		) {
			effect.node.x = effect.origin.x + progress * HALF
		}
		if (
			shape === "token-eject"
			|| shape === "punctuation-burst"
		) {
			effect.node.y = effect.origin.y - progress * HALF
		}
		const pulse = 0.82 + Math.sin(progress * Math.PI) * 0.38
		effect.node.scale.set(pulse)
	}
}
