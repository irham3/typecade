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
	queued: 0.08,
	retiring: 0.05,
	reinforcing: 0.04,
} as const

export type FormationRole = "active" | "queued" | "retiring" | "reinforcing"

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
	layoutX: number
	layoutScale: number
	isHit: boolean
	hitMs: number
}

const POOL_SIZE = 8

// A pseudo-RNG for predictable formations based on score/zone.
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
				role: "queued",
				variant: "cache-hound",
				root: container,
				rig,
				shadow,
				reflection,
				integrity,
				label,
				accent: 0xffffff,
				layoutX: 0,
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
		this.updateLayout()
	}

	sync(state: FormationState) {
		const targetChanged = state.targetOrdinal !== this.state.targetOrdinal
		
		if (state.stage !== this.state.stage || state.zone !== this.state.zone) {
			this.generateSchedule(state.stage, state.zone)
		}
		
		this.state = state
		
		if (targetChanged) {
			this.promoteTarget(state.targetOrdinal)
		}
		
		this.ensureVisibleFormation()
	}

	handle(event: OverdrivePresentationEvent) {
		if (this.state.focusPaused) return
		
		if (event.type !== "word-completed") return
		
		const target = this.activeTargets.get(event.targetOrdinal)
		if (!target) return
		
		target.isHit = true
		target.hitMs = 0
		target.role = "retiring"
		target.integrity.visible = false
		target.label.visible = false
		target.rig.play("defeat", { force: true })
	}

	update(deltaMs: number) {
		if (this.state.focusPaused) return
		
		const delta = Math.max(0, Math.min(deltaMs, 50))
		for (const slot of this.slots) {
			if (!slot.root.visible) continue
			
			slot.rig.update(delta)
			
			// Move retiring targets out
			if (slot.role === "retiring") {
				slot.layoutX += delta * 0.8
				// Recycle if off screen
				if (slot.layoutX > this.width + 300) {
					this.recycleSlot(slot)
				}
			}
			
			// Move reinforcing targets in
			if (slot.role === "reinforcing") {
				const targetX = this.getRoleX("queued")
				if (slot.layoutX > targetX) {
					slot.layoutX = Math.max(targetX, slot.layoutX - delta * 0.6)
				} else {
					slot.role = "queued"
				}
			}
			
			// Move queued targets up
			if (slot.role === "queued") {
				const activeSlot = this.slots.find(s => s.role === "active")
				const targetX = this.getRoleX("queued")
				
				// Move closer to active if there is none
				if (!activeSlot && slot.layoutX > this.getRoleX("active")) {
					slot.layoutX = Math.max(this.getRoleX("active"), slot.layoutX - delta * 0.4)
				} else if (slot.layoutX > targetX) {
					slot.layoutX = Math.max(targetX, slot.layoutX - delta * 0.3)
				}
			}
			
			// Move active targets up
			if (slot.role === "active") {
				const targetX = this.getRoleX("active")
				if (slot.layoutX > targetX) {
					slot.layoutX = Math.max(targetX, slot.layoutX - delta * 0.4)
				}
			}
		}
		
		this.updateLayout()
	}

	private ensureVisibleFormation() {
		const ordinal = this.state.targetOrdinal
		this.ensureTarget(ordinal, "active")
		this.ensureTarget(ordinal + 1, "queued")
		this.ensureTarget(ordinal + 2, "reinforcing")
	}
	
	private promoteTarget(ordinal: number) {
		const target = this.activeTargets.get(ordinal)
		if (target && target.role !== "retiring") {
			target.role = "active"
		}
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
		slot.isHit = false
		slot.accent = stageAccent(this.state.stage)
		slot.label.text = targetClassName(this.state.stage)
		slot.label.style.fill = slot.accent
		
		slot.integrity.visible = true
		slot.label.visible = true
		slot.rig.setVariant(variantId)
		slot.rig.play("locomotion", { force: true })
		slot.rig.setTint(0xffffff)
		slot.rig.setAlpha(1)
		
		slot.layoutX = role === "active" ? this.getRoleX("active") : this.width + 200
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

	private getRoleX(role: FormationRole): number {
		const compact = this.width < SCENE.compactWidth
		const anchor = compact ? SCENE.targetAnchor.compact.x : SCENE.targetAnchor.desktop.x
		const staging = compact ? SCENE.targetStaging.compact : SCENE.targetStaging.desktop
		
		if (role === "active") return this.width * anchor
		if (role === "queued") return this.width * (anchor + staging.upcomingOffsetX)
		if (role === "reinforcing") return this.width * (anchor + staging.distantOffsetX)
		return this.width * 1.1
	}

	private getTargetScale(slot: FormationTarget): number {
		const compact = this.width < SCENE.compactWidth
		const heightToken = compact ? SCENE.targetHeight.compact : SCENE.targetHeight.desktop
		const staging = compact ? SCENE.targetStaging.compact : SCENE.targetStaging.desktop

		const targetPixels = Math.min(
			this.height * heightToken.ratio,
			heightToken.max,
		)
		const visualHeight = Math.max(1, slot.rig.getVisualSize().height)
		const roleMultiplier = slot.role === "active" ? 1 :
			slot.role === "queued" ? staging.upcomingScale :
			slot.role === "reinforcing" ? staging.distantScale :
			0.82
			
		return (targetPixels / visualHeight) * roleMultiplier
	}

	private updateLayout() {
		const { deckY } = this.layout
		
		for (const slot of this.slots) {
			if (!slot.root.visible) continue
			
			const targetScale = this.getTargetScale(slot)
			slot.root.position.set(slot.layoutX, deckY)
			slot.root.scale.set(targetScale)
			slot.layoutScale = targetScale
			
			const visualHeight = slot.rig.getVisualSize().height
			slot.integrity.position.set(0, -visualHeight * 0.52)
			slot.label.position.set(0, -visualHeight * 0.52 - 24 / targetScale)
			
			this.updateShadow(slot)
		}
		
		// Sort by Y/role so active is in front
		this.slots.sort((a, b) => {
			if (!a.root.visible) return 1
			if (!b.root.visible) return -1
			const orderA = a.role === "active" ? 10 : a.role === "queued" ? 5 : 0
			const orderB = b.role === "active" ? 10 : b.role === "queued" ? 5 : 0
			return orderA - orderB
		})
		
		for (let i = 0; i < this.slots.length; i++) {
			this.root.setChildIndex(this.slots[i].root, i)
		}
	}

	private updateShadow(slot: FormationTarget) {
		const alpha = SHADOW_ALPHA[slot.role as keyof typeof SHADOW_ALPHA] ?? SHADOW_ALPHA.retiring
		const compact = this.width < SCENE.compactWidth
		const staging = compact ? SCENE.targetStaging.compact : SCENE.targetStaging.desktop
		
		let fade = 1
		if (slot.role === "queued") fade = staging.upcomingAlpha
		if (slot.role === "reinforcing") fade = staging.distantAlpha

		slot.shadow.clear()
		slot.reflection.clear()
		
		if (this.state.reducedMotion) return
		
		slot.shadow
			.ellipse(0, 0, 80, 24)
			.fill({ color: V.bg, alpha: alpha * fade })
			
		slot.reflection
			.ellipse(0, 30, 60, 40)
			.fill({
				color: V.cyan,
				alpha: this.state.reducedMotion ? alpha * 0.3 * fade : alpha * 0.5 * fade,
			})
	}

	destroy() {
		this.root.destroy({ children: true })
	}
	
	public getActiveTargets() {
		return this.activeTargets
	}
}
