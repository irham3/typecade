import { Container, Graphics, Text } from "pixi.js"
import {
	type FormationVariantId,
	type StageType,
	createFormationSchedule,
} from "@/lib/engine/overdrive"
import type { OverdrivePresentationEvent } from "../../presentation/events"
import type { LoadedRigAssets } from "../assets/combat-assets"
import { RigInstance } from "../rig/rig-instance"
import { selectFormationVariant } from "../choreography/expedition-selectors"
import { V, stageAccent, targetClassName, SCENE } from "../visual-assets"
import type { EnvironmentLayout } from "./formation-layout"

const SHADOW_ALPHA = {
	active: 0.15,
	upcoming: 0.08,
	distant: 0.04,
	retiring: 0.05,
} as const

export type FormationRole = "active" | "upcoming" | "distant" | "retiring"

export type FormationTarget = {
	id: string
	ordinal: number
	role: FormationRole
	variant: FormationVariantId
	root: Container
	rig: RigInstance
	shadow: Graphics
	reflection: Graphics
	integrity: Graphics
	label: Text
	accent: number
	lane: "high" | "mid" | "low"
	lifeMs: number
	roleLifeMs: number
	
	targetX: number
	targetY: number
	targetScale: number
	targetAlpha: number
	
	layoutX: number
	layoutY: number
	layoutScale: number
	
	isHit: boolean
	hitMs: number
}

const POOL_SIZE = 8

function createDeterministicRng(seed: number) {
	let state = seed % 2147483647
	if (state <= 0) state += 2147483646
	function next() {
		state = (state * 16807) % 2147483647
		return (state - 1) / 2147483646
	}
	return {
		next,
		pick: <T>(values: readonly T[]): T => {
			if (values.length === 0) throw new Error("Empty array")
			const index = Math.floor(next() * values.length)
			return values[index] as T
		},
	}
}

function createLabel(text: string, color: number) {
	const label = new Text({
		text,
		style: {
			fill: color,
			fontFamily: "JetBrains Mono",
			fontSize: 14,
			fontWeight: "700",
			letterSpacing: 1,
		},
	})
	label.anchor.set(0.5)
	return label
}

export type FormationState = {
	targetOrdinal: number
	stage: StageType
	zone: number
	focusPaused: boolean
	reducedMotion: boolean
}

function cubicOut(t: number) {
	return 1 - Math.pow(1 - t, 3)
}

function laneForOrdinal(ordinal: number): "high" | "mid" | "low" {
	const lanes = ["mid", "high", "low"] as const
	return lanes[Math.abs(ordinal) % lanes.length]
}

export class FormationDirector {
	readonly root = new Container()
	private readonly slots: FormationTarget[] = []
	private readonly activeTargets = new Map<number, FormationTarget>()
	
	private schedule: FormationVariantId[] = []
	private state: FormationState
	private readonly enemyAssets: LoadedRigAssets
	
	private width = 0
	private height = 0
	private layout: EnvironmentLayout = { deckY: 0, scale: 1, width: 0, height: 0 }

	constructor(
		initial: FormationState,
		enemyAssets: LoadedRigAssets,
	) {
		this.state = initial
		this.enemyAssets = enemyAssets
		this.buildPool()
		this.generateSchedule(initial.stage, initial.zone)
		this.ensureVisibleFormation()
	}

	private buildPool() {
		for (let i = 0; i < POOL_SIZE; i++) {
			const container = new Container()
			const shadow = new Graphics()
			const reflection = new Graphics()
			const integrity = new Graphics()
			const label = createLabel("UNKNOWN", 0xffffff)
			const rig = new RigInstance(this.enemyAssets.definition, this.enemyAssets.textures)
			
			container.addChild(shadow, reflection, rig.root, integrity, label)
			container.visible = false
			this.root.addChild(container)
			
			this.slots.push({
				id: `target-${i}`,
				ordinal: -1,
				role: "upcoming",
				variant: "cache-hound",
				root: container,
				rig,
				shadow,
				reflection,
				integrity,
				label,
				accent: 0xffffff,
				lane: "mid",
				lifeMs: 0,
				roleLifeMs: 0,
				targetX: 0,
				targetY: 0,
				targetScale: 1,
				targetAlpha: 1,
				layoutX: 0,
				layoutY: 0,
				layoutScale: 1,
				isHit: false,
				hitMs: 0,
			})
		}
	}

	private generateSchedule(stage: StageType, zone: number) {
		const seed = (stage.length * 13) + (zone * 97) + 12345
		this.schedule = createFormationSchedule(
			stage,
			zone,
			createDeterministicRng(seed),
			24,
		)
	}

	resize(width: number, height: number, layout: EnvironmentLayout) {
		this.width = width
		this.height = height
		this.layout = layout
		this.updateLayoutTargets()
		this.snapLayout()
	}

	sync(state: FormationState) {
		const targetChanged = state.targetOrdinal !== this.state.targetOrdinal
		
		if (state.stage !== this.state.stage || state.zone !== this.state.zone) {
			this.generateSchedule(state.stage, state.zone)
		}
		
		this.state = state
		
		if (targetChanged) {
			this.ensureVisibleFormation()
		}
		
		this.updateLayoutTargets()
	}

	handle(event: OverdrivePresentationEvent) {
		if (this.state.focusPaused) return
		
		if (event.type !== "word-completed") return
		
		const target = this.activeTargets.get(event.targetOrdinal)
		if (!target) return
		
		target.isHit = true
		target.hitMs = 0
		target.role = "retiring"
		target.roleLifeMs = 0
		target.integrity.visible = false
		target.label.visible = false
		target.rig.play("defeat", { force: true })
		this.updateLayoutTargets()
	}

	update(deltaMs: number) {
		if (this.state.focusPaused) return
		
		const delta = Math.max(0, Math.min(deltaMs, 50))
		for (const slot of this.slots) {
			if (!slot.root.visible) continue
			
			slot.lifeMs += delta
			slot.roleLifeMs += delta
			slot.rig.update(delta)
			
			if (slot.role === "retiring") {
				if (slot.isHit) {
					slot.hitMs += delta
					const defeatDuration = 300 // SCENE or MOTION.defeatMs + 80
					if (slot.hitMs > defeatDuration + 80) {
						this.recycleSlot(slot)
						continue
					}
					slot.targetX += delta * 0.4 // Move max 160-220 px right
				}
			}
			
			const transitionMs = slot.role === "upcoming" ? 260 : slot.role === "active" ? 220 : 300
			const t = Math.min(1, slot.roleLifeMs / transitionMs)
			const ease = this.state.reducedMotion ? 1 : cubicOut(t)
			
			if (this.state.reducedMotion) {
				slot.layoutX = slot.targetX
				slot.layoutY = slot.targetY
				slot.layoutScale = slot.targetScale
				slot.root.alpha = slot.targetAlpha
			} else {
				// We lerp effectively with a smooth factor
				const smooth = 0.2
				slot.layoutX += (slot.targetX - slot.layoutX) * smooth
				slot.layoutY += (slot.targetY - slot.layoutY) * smooth
				slot.layoutScale += (slot.targetScale - slot.layoutScale) * smooth
				slot.root.alpha += (slot.targetAlpha - slot.root.alpha) * smooth
			}
			
			this.applyLayout(slot)
		}
		
		this.sortSlots()
	}

	private ensureVisibleFormation() {
		const current = this.state.targetOrdinal
		
		// Update roles
		for (const slot of this.activeTargets.values()) {
			if (slot.role === "retiring") continue
			
			const oldRole = slot.role
			if (slot.ordinal === current) slot.role = "active"
			else if (slot.ordinal === current + 1) slot.role = "upcoming"
			else if (slot.ordinal === current + 2) slot.role = "distant"
			else if (slot.ordinal < current) {
				slot.role = "retiring"
				if (!slot.isHit) {
					slot.isHit = true
					slot.hitMs = 0
					slot.integrity.visible = false
					slot.label.visible = false
					slot.rig.play("defeat", { force: true })
				}
			}
			
			if (slot.role !== oldRole) {
				slot.roleLifeMs = 0
				if (slot.role === "active") {
					slot.lane = "mid"
					slot.integrity.visible = true
					slot.label.visible = true
				} else if (slot.role === "upcoming" || slot.role === "distant") {
					slot.lane = laneForOrdinal(slot.ordinal)
					slot.integrity.visible = false
					slot.label.visible = false
				}
			}
		}

		this.ensureTarget(current, "active")
		this.ensureTarget(current + 1, "upcoming")
		this.ensureTarget(current + 2, "distant")
	}

	private ensureTarget(ordinal: number, role: FormationRole) {
		if (!this.activeTargets.has(ordinal)) {
			this.spawnTarget(ordinal, role)
		}
	}

	private spawnTarget(ordinal: number, role: FormationRole) {
		const slot = this.slots.find(s => !s.root.visible)
		if (!slot) return // Pool exhausted
		
		const variantId = selectFormationVariant(this.schedule, ordinal)
		if (!variantId) return
		
		slot.ordinal = ordinal
		slot.role = role
		slot.variant = variantId
		slot.lane = role === "active" ? "mid" : laneForOrdinal(ordinal)
		slot.isHit = false
		slot.hitMs = 0
		slot.lifeMs = 0
		slot.roleLifeMs = 0
		slot.accent = stageAccent(this.state.stage)
		slot.label.text = targetClassName(this.state.stage).toUpperCase()
		slot.label.style.fill = slot.accent
		
		slot.integrity.visible = role === "active"
		slot.label.visible = role === "active"
		slot.rig.setVariant(variantId)
		slot.rig.play("locomotion", { force: true })
		slot.rig.setTint(0xffffff)
		slot.rig.setAlpha(1)
		
		this.updateLayoutTargetsForSlot(slot)
		
		slot.layoutX = this.width + 300
		slot.layoutY = slot.targetY
		slot.layoutScale = slot.targetScale
		slot.root.alpha = 0
		
		slot.root.visible = true
		
		this.activeTargets.set(ordinal, slot)
	}

	private recycleSlot(slot: FormationTarget) {
		slot.root.visible = false
		this.activeTargets.delete(slot.ordinal)
		slot.ordinal = -1
		slot.integrity.visible = false
		slot.label.visible = false
		slot.rig.setTint(0xffffff)
		slot.rig.setAlpha(1)
		slot.rig.root.position.set(0, 0)
	}

	private updateLayoutTargets() {
		for (const slot of this.slots) {
			if (!slot.root.visible) continue
			this.updateLayoutTargetsForSlot(slot)
		}
	}

	private updateLayoutTargetsForSlot(slot: FormationTarget) {
		if (slot.role === "retiring") return // X moves in update, Y/Scale locked
		
		const compact = this.width < SCENE.compactWidth
		const anchor = compact ? SCENE.targetAnchor.compact.x : SCENE.targetAnchor.desktop.x
		const staging = compact ? SCENE.targetStaging.compact : SCENE.targetStaging.desktop
		const lanes = compact ? SCENE.targetLanes.compact : SCENE.targetLanes.desktop
		const heightToken = compact ? SCENE.targetHeight.compact : SCENE.targetHeight.desktop
		
		// X
		if (slot.role === "active") slot.targetX = this.width * anchor
		else if (slot.role === "upcoming") slot.targetX = this.width * (anchor + staging.upcomingOffsetX)
		else if (slot.role === "distant") slot.targetX = this.width * (anchor + staging.distantOffsetX)
		
		// Y
		slot.targetY = this.height * lanes[slot.lane]
		
		// Scale
		const targetPixels = Math.min(this.height * heightToken.ratio, heightToken.max)
		const visualHeight = Math.max(1, slot.rig.getVisualSize().height)
		const baseScale = targetPixels / visualHeight
		
		let roleMultiplier = 1
		if (slot.role === "upcoming") roleMultiplier = staging.upcomingScale
		else if (slot.role === "distant") roleMultiplier = staging.distantScale
		
		slot.targetScale = baseScale * roleMultiplier
		
		// Alpha
		if (slot.role === "active") slot.targetAlpha = 1
		else if (slot.role === "upcoming") slot.targetAlpha = staging.upcomingAlpha
		else if (slot.role === "distant") slot.targetAlpha = staging.distantAlpha
	}

	private snapLayout() {
		for (const slot of this.slots) {
			if (!slot.root.visible) continue
			slot.layoutX = slot.targetX
			slot.layoutY = slot.targetY
			slot.layoutScale = slot.targetScale
			slot.root.alpha = slot.targetAlpha
			this.applyLayout(slot)
		}
		this.sortSlots()
	}

	private applyLayout(slot: FormationTarget) {
		slot.root.position.set(slot.layoutX, slot.layoutY)
		slot.root.scale.set(slot.layoutScale)
		
		const visualHeight = slot.rig.getVisualSize().height
		slot.integrity.position.set(0, -visualHeight * 0.52)
		slot.label.position.set(0, -visualHeight * 0.52 - 24 / slot.layoutScale)
		
		// Compensate shadow and reflection to stay on deck
		const deckY = this.layout.deckY
		const dy = deckY - slot.layoutY
		slot.shadow.y = dy / slot.layoutScale
		slot.reflection.y = dy / slot.layoutScale
		
		this.updateShadow(slot)
	}

	private updateShadow(slot: FormationTarget) {
		const alpha = SHADOW_ALPHA[slot.role as keyof typeof SHADOW_ALPHA] ?? SHADOW_ALPHA.retiring
		const compact = this.width < SCENE.compactWidth
		const staging = compact ? SCENE.targetStaging.compact : SCENE.targetStaging.desktop
		
		let fade = 1
		if (slot.role === "upcoming") fade = staging.upcomingAlpha
		if (slot.role === "distant") fade = staging.distantAlpha

		slot.shadow.clear()
		slot.reflection.clear()
		
		if (this.state.reducedMotion) {
			// Shadow stays visible even in reduced motion
			slot.shadow
				.ellipse(0, 0, 80, 24)
				.fill({ color: V.bg, alpha: alpha * fade })
			return
		}
		
		slot.shadow
			.ellipse(0, 0, 80, 24)
			.fill({ color: V.bg, alpha: alpha * fade })
			
		const refAlpha = slot.role === "active" ? 0.07 : slot.role === "upcoming" ? 0.025 : 0.01
		slot.reflection
			.ellipse(0, 30, 60, 40)
			.fill({
				color: slot.accent,
				alpha: refAlpha * fade,
			})
	}

	private sortSlots() {
		// active in front, upcoming behind active, distant behind upcoming, retiring behind active but front of distant
		const renderOrder = [...this.slots].sort((a, b) => {
			if (!a.root.visible) return 1
			if (!b.root.visible) return -1
			
			function orderOf(role: string) {
				if (role === "active") return 40
				if (role === "retiring") return 30
				if (role === "upcoming") return 20
				if (role === "distant") return 10
				return 0
			}
			
			return orderOf(a.role) - orderOf(b.role)
		})
		
		for (let i = 0; i < renderOrder.length; i++) {
			this.root.setChildIndex(renderOrder[i].root, i)
		}
	}

	destroy() {
		this.root.destroy({ children: true })
	}
	
	public getActiveTargets() {
		return this.activeTargets
	}
}
