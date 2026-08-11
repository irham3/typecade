import {
	Container,
	Graphics,
} from "pixi.js"
import type { StageType } from "@/lib/engine/overdrive"
import type { CombatAction } from "@/lib/engine/overdrive"
import {
	EFFECTS,
	MOTION,
	SCENE,
	V,
	stageAccent,
} from "../visual-assets"

type Point = {
	x: number
	y: number
}

type EffectKind = "bolt" | "contact" | "fragment" | "shield" | "column" | "orbit" | "railgun" | "bomb" | "drain"

type LiveEffect = {
	node: Graphics
	kind: EffectKind
	lifeMs: number
	durationMs: number
	start?: Point
	end?: Point
	velocity?: Point
	spin?: number
	origin?: Point
	radius?: number
}

export class CombatEffects {
	readonly root = new Container()
	private readonly pool: Graphics[] = []
	private readonly live: LiveEffect[] = []
	private serial = 0
	private width = 0
	private height = 0

	resize(width: number, height: number) {
		this.width = width
		this.height = height
	}

	spawnContact(position: Point, tone: number, finisher = false) {
		const radius = finisher
			? EFFECTS.finisherRadius
			: EFFECTS.contactRadius
		const stroke = finisher
			? EFFECTS.finisherStroke
			: EFFECTS.contactStroke
		const node = this.acquire()
			.circle(0, 0, radius)
			.stroke({ color: tone, width: stroke, alpha: 0.82 })
			.circle(0, 0, radius * 0.42)
			.stroke({ color: V.text, width: EFFECTS.contactStroke, alpha: 0.48 })
		node.position.copyFrom(position)
		this.activate({
			node,
			kind: "contact",
			lifeMs: MOTION.hitMs,
			durationMs: MOTION.hitMs,
		})
	}

	spawnSmear(from: Point, to: Point, tone: number) {
		const node = this.acquire()
			.rect(
				-EFFECTS.fragmentWidth * 3,
				-EFFECTS.smearWidth / 2,
				EFFECTS.fragmentWidth * 3,
				EFFECTS.smearWidth,
			)
			.fill({ color: tone, alpha: 0.58 })
			.moveTo(0, -EFFECTS.smearWidth)
			.lineTo(EFFECTS.fragmentWidth * 2, 0)
			.lineTo(0, EFFECTS.smearWidth)
			.closePath()
			.fill({ color: V.text, alpha: 0.9 })
		node.position.copyFrom(from)
		node.rotation = Math.atan2(to.y - from.y, to.x - from.x)
		this.activate({
			node,
			kind: "bolt",
			lifeMs: EFFECTS.letterBoltMs,
			durationMs: EFFECTS.letterBoltMs,
			start: { ...from },
			end: { ...to },
		})
	}

	spawnDefeat(position: Point, stage: StageType) {
		const tone = stageAccent(stage)
		for (let index = 0; index < EFFECTS.defeatFragments; index += 1) {
			const node = this.acquire()
				.moveTo(-EFFECTS.fragmentWidth / 2, -EFFECTS.fragmentHeight / 2)
				.lineTo(EFFECTS.fragmentWidth / 2, 0)
				.lineTo(-EFFECTS.fragmentWidth / 2, EFFECTS.fragmentHeight / 2)
				.closePath()
				.fill({
					color: index % 5 === 0 ? V.text : tone,
					alpha: 0.92,
				})
			node.position.copyFrom(position)
			const angle = (
				index * 2.399963
				+ this.serial * 0.41
			) % (Math.PI * 2)
			const speed = 140 + ((index * 47 + this.serial * 31) % 220)
			this.activate({
				node,
				kind: "fragment",
				lifeMs: MOTION.defeatMs,
				durationMs: MOTION.defeatMs,
				velocity: {
					x: Math.cos(angle) * speed,
					y: Math.sin(angle) * speed,
				},
				spin: index % 2 === 0 ? 5 : -5,
			})
		}
		this.serial += 1
	}

	spawnShield(position: Point) {
		const shieldWidth = this.width * (
			SCENE.aegisShield.frontX - SCENE.aegisShield.backX
		)
		const shieldHeight = this.height * (
			SCENE.aegisShield.bottomY - SCENE.aegisShield.topY
		)
		const node = this.acquire()
			.moveTo(0, -shieldHeight / 2)
			.lineTo(shieldWidth, -shieldHeight * 0.24)
			.lineTo(shieldWidth, shieldHeight * 0.38)
			.lineTo(0, shieldHeight / 2)
			.lineTo(-shieldWidth * 0.4, 0)
			.closePath()
			.fill({ color: V.cyan, alpha: MOTION.aegisShieldStartAlpha })
			.stroke({ color: V.text, width: EFFECTS.contactStroke, alpha: 0.72 })
		node.position.copyFrom(position)
		this.activate({
			node,
			kind: "shield",
			lifeMs: MOTION.aegisRescueMs,
			durationMs: MOTION.aegisRescueMs,
		})
	}

	spawnOverdriveColumn(from: Point, to: Point) {
		const node = this.acquire()
			.rect(
				-EFFECTS.smearWidth,
				this.height * SCENE.overdriveColumn.y,
				EFFECTS.smearWidth * 2,
				this.height * SCENE.overdriveColumn.height,
			)
			.fill({ color: V.green, alpha: MOTION.overdriveColumnMaxAlpha })
		node.x = to.x
		node.y = 0
		node.rotation = Math.atan2(to.y - from.y, to.x - from.x) * 0.02
		this.activate({
			node,
			kind: "column",
			lifeMs: MOTION.overdriveMs,
			durationMs: MOTION.overdriveMs,
		})
	}

	spawnCombatAction(action: CombatAction, from: Point, to: Point, tone: number) {
		if (action.kind === "slash" || action.kind === "dash") {
			this.spawnSmear(from, to, tone)
			if (action.kind === "dash") this.spawnContact(to, tone, action.overdrive)
			return
		}
		if (action.kind === "blade") {
			const node = this.acquire()
				.arc(0, 0, 22, -0.9, 0.9)
				.stroke({ color: tone, width: 4, alpha: 0.92 })
				.moveTo(0, -22)
				.lineTo(10, -32)
				.lineTo(18, -18)
				.stroke({ color: V.text, width: 2, alpha: 0.82 })
			node.position.copyFrom(to)
			this.activate({ node, kind: "orbit", lifeMs: 420, durationMs: 420, origin: { ...to }, radius: action.power > 1 ? 34 : 24 })
			return
		}
		if (action.kind === "railgun") {
			const node = this.acquire()
				.rect(0, -3, Math.max(40, Math.hypot(to.x - from.x, to.y - from.y)), 6)
				.fill({ color: tone, alpha: 0.9 })
				.rect(0, -1, Math.max(40, Math.hypot(to.x - from.x, to.y - from.y)), 2)
				.fill({ color: V.text, alpha: 0.9 })
			node.position.copyFrom(from)
			node.rotation = Math.atan2(to.y - from.y, to.x - from.x)
			this.activate({ node, kind: "railgun", lifeMs: 180, durationMs: 180 })
			return
		}
		if (action.kind === "echo") {
			this.spawnContact(to, tone, action.overdrive)
			this.spawnContact({ x: to.x + 18, y: to.y - 12 }, V.violet, action.overdrive)
			return
		}
		if (action.kind === "shield") {
			this.spawnShield(from)
			return
		}
		if (action.kind === "bomb") {
			const node = this.acquire()
				.circle(0, 0, action.overdrive ? 42 : 28)
				.stroke({ color: tone, width: 4, alpha: 0.92 })
				.moveTo(-34, 0).lineTo(34, 0)
				.moveTo(0, -34).lineTo(0, 34)
				.stroke({ color: V.text, width: 2, alpha: 0.72 })
			node.position.copyFrom(to)
			this.activate({ node, kind: "bomb", lifeMs: 300, durationMs: 300 })
			return
		}
		if (action.kind === "drain") {
			const node = this.acquire()
				.moveTo(0, 0).lineTo(to.x - from.x, to.y - from.y)
				.stroke({ color: V.red, width: action.overdrive ? 6 : 3, alpha: 0.82 })
			node.position.copyFrom(from)
			this.activate({ node, kind: "drain", lifeMs: 360, durationMs: 360, start: { ...from }, end: { ...to } })
			return
		}
		if (action.kind === "overdrive-burst") {
			this.spawnOverdriveColumn(from, to)
			this.spawnContact(to, V.green, true)
		}
	}

	update(deltaMs: number) {
		for (let index = this.live.length - 1; index >= 0; index -= 1) {
			const effect = this.live[index]
			effect.lifeMs = Math.max(0, effect.lifeMs - deltaMs)
			const progress = 1 - effect.lifeMs / effect.durationMs
			this.updateEffect(effect, progress, deltaMs)
			if (effect.lifeMs === 0) this.release(index)
		}
	}

	clear() {
		while (this.live.length > 0) this.release(this.live.length - 1)
	}

	destroy() {
		this.clear()
		for (const node of this.pool) node.destroy()
		this.pool.length = 0
		this.root.destroy({ children: true })
	}

	private acquire() {
		if (this.live.length >= EFFECTS.liveCap) this.release(0)
		const node = this.pool.pop() ?? new Graphics()
		node.clear()
		node.alpha = 1
		node.rotation = 0
		node.scale.set(1)
		node.position.set(0, 0)
		this.root.addChild(node)
		return node
	}

	private activate(effect: LiveEffect) {
		this.live.push(effect)
	}

	private release(index: number) {
		const [effect] = this.live.splice(index, 1)
		if (!effect) return
		if (effect.node.parent) effect.node.parent.removeChild(effect.node)
		effect.node.clear()
		this.pool.push(effect.node)
	}

	private updateEffect(
		effect: LiveEffect,
		progress: number,
		deltaMs: number,
	) {
		if (effect.kind === "bolt" && effect.start && effect.end) {
			const eased = 1 - (1 - progress) ** 3
			effect.node.position.set(
				effect.start.x + (effect.end.x - effect.start.x) * eased,
				effect.start.y + (effect.end.y - effect.start.y) * eased,
			)
			effect.node.alpha = Math.max(0, 1 - progress * 0.72)
			return
		}
		if (effect.kind === "contact") {
			effect.node.scale.set(0.72 + progress * 0.5)
			effect.node.alpha = 1 - progress
			return
		}
		if (effect.kind === "fragment" && effect.velocity) {
			effect.node.x += effect.velocity.x * deltaMs / 1_000
			effect.node.y += effect.velocity.y * deltaMs / 1_000
			effect.node.rotation += (effect.spin ?? 0) * deltaMs / 1_000
			effect.node.alpha = 1 - progress
			return
		}
		if (effect.kind === "shield") {
			effect.node.alpha = Math.max(0, 1 - progress)
			effect.node.scale.set(1 + Math.sin(progress * Math.PI) * 0.04)
			return
		}
		if (effect.kind === "column") {
			effect.node.alpha = Math.sin(progress * Math.PI)
			return
		}
		if (effect.kind === "orbit" && effect.origin) {
			effect.node.position.set(
				effect.origin.x + Math.cos(progress * Math.PI * 2) * (effect.radius ?? 24),
				effect.origin.y + Math.sin(progress * Math.PI * 2) * (effect.radius ?? 24),
			)
			effect.node.rotation += deltaMs / 180
			effect.node.alpha = 1 - progress * 0.72
			return
		}
		if (effect.kind === "railgun" || effect.kind === "bomb") {
			effect.node.alpha = 1 - progress
			effect.node.scale.set(1 + progress * 0.18)
			return
		}
		if (effect.kind === "drain" && effect.start && effect.end) {
			effect.node.alpha = 1 - progress
		}
	}
}
