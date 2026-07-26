import {
	Container,
	Graphics,
	Text,
} from "pixi.js"
import type {
	ItemContribution,
	StageType,
} from "@/lib/engine/overdrive"
import { sfx } from "@/features/overdrive/fx/sfx"
import type { OverdrivePresentationEvent } from "../../presentation/events"
import type { LoadedRigAssets } from "../assets/combat-assets"
import { CombatEffects } from "../effects/combat-effects"
import {
	ITEM_PRESENTATION,
	ItemPresentation,
} from "../effects/item-presentation"
import { RigInstance } from "../rig/rig-instance"
import {
	EFFECTS,
	MOTION,
	SCENE,
	V,
	drawTargetIntegrity,
} from "../visual-assets"
import type { SceneState } from "../combat-scene"
import { FormationDirector, type FormationState, type FormationTarget } from "../formation/formation-director"
import { computeFormationLayout } from "../formation/formation-layout"

type Transition = {
	elapsedMs: number
	durationMs: number
	fromX: number
	fromY: number
	toX: number
	toY: number
	fromAlpha: number
	toAlpha: number
}

type WardenVisual = {
	root: Container
	rig: RigInstance
	shadow: Graphics
	integrity: Graphics
	label: Text
	baseScale: number
}

type PendingContact = {
	position: {
		x: number
		y: number
	}
	target: FormationTarget
	tone: number
	finisher: boolean
}

type Travel = {
	elapsedMs: number
	durationMs: number
	fromX: number
	toX: number
	arcHeight: number
}

type ScorePopup = {
	node: Text
	lifeMs: number
}

type QueuedItemEffect = {
	itemId: string
	kind: ItemContribution["kind"]
}

const WHITE_TINT = 0xffffff

const ITEM_EFFECT_PRIORITY: Record<ItemContribution["kind"], number> = {
	protection: 0,
	time: 1,
	quota: 1,
	mult: 2,
	base: 3,
	score: 4,
	token: 5,
}

function metric(value: number) {
	return Number.isInteger(value)
		? value.toLocaleString("en-US")
		: value.toLocaleString("en-US", { maximumFractionDigits: 1 })
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

function createWarden(assets: LoadedRigAssets): WardenVisual {
	const root = new Container()
	const rig = new RigInstance(assets.definition, assets.textures)
	const shadow = new Graphics()
		.ellipse(0, 16, 96, 18)
		.fill({ color: V.bg, alpha: 0.62 })
	const integrity = new Graphics()
	const label = createLabel("KEYSTONE WARDEN", V.cyan)
	root.addChild(shadow, rig.root, integrity, label)
	return {
		root,
		rig,
		shadow,
		integrity,
		label,
		baseScale: 1,
	}
}

export class CombatDirector {
	readonly root = new Container()
	readonly signalNodes = new Container()
	private readonly actors = new Container()
	private readonly effects = new CombatEffects()
	private readonly itemPresentation = new ItemPresentation()
	private readonly pressureLine = new Graphics()
	private readonly rescueCallout = new Text({
		text: "",
		style: {
			fill: V.cyan,
			fontFamily: "JetBrains Mono",
			fontSize: 24,
			fontWeight: "700",
		},
	})
	private readonly warden: WardenVisual
	private readonly stage: StageType
	private readonly formation: FormationDirector
	private readonly pendingContacts: PendingContact[] = []
	private readonly popups: ScorePopup[] = []
	private readonly queuedItemEffects: QueuedItemEffect[] = []
	private state: SceneState
	private width = 0
	private height = 0
	private overdriveMs = 0
	private returnDelayMs = 0
	private pressureBeat = 0
	private pressureMs = 0
	private pressureStrikeStarted = false
	private aegisMs = 0
	private lastWord = ""
	private lastCaretIndex = -1
	private lastDirty = false
	private timeMs = 0
	private lastInputMs = 0
	
	public lastVerb = ""
	public activeVariant = ""
	public get visibleCount() {
		return this.formation.getActiveTargets().size + 1 // Warden + enemies
	}
	public get liveEffectsCount() {
		return this.effects.liveCount
	}

	constructor(
		initial: SceneState,
		assets: {
			warden: LoadedRigAssets
			enemy: LoadedRigAssets
		},
	) {
		this.state = initial
		this.stage = initial.stage
		this.warden = createWarden(assets.warden)
		
		const formationState: FormationState = {
			targetOrdinal: initial.targetOrdinal,
			stage: initial.stage,
			zone: initial.zone,
			focusPaused: initial.focusPaused,
			reducedMotion: initial.reducedMotion,
		}
		this.formation = new FormationDirector(formationState, assets.enemy)
		
		this.rescueCallout.anchor.set(0.5)
		this.root.addChild(
			this.actors,
			this.signalNodes,
			this.effects.root,
			this.itemPresentation.root,
			this.pressureLine,
			this.rescueCallout,
		)
		this.actors.addChild(this.warden.root, this.formation.root)

		this.warden.rig.play(
			initial.focusPaused || initial.overdriveCharge >= 100
				? "ready"
				: "idle",
			{ force: true },
		)
	}

	resize(width: number, height: number) {
		this.width = width
		this.height = height
		this.effects.resize(width, height)
		const compact = width < SCENE.compactWidth
		const wardenAnchor = compact
			? SCENE.wardenAnchor.compact
			: SCENE.wardenAnchor.desktop
		const wardenHeight = compact
			? SCENE.wardenHeight.compact
			: SCENE.wardenHeight.desktop
		const wardenPixels = Math.min(
			height * wardenHeight.ratio,
			wardenHeight.max,
		)

		this.warden.baseScale = wardenPixels / this.warden.rig.getVisualSize().height
		this.warden.rig.root.scale.set(this.warden.baseScale)
		this.warden.root.position.set(
			width * wardenAnchor.x,
			height * wardenAnchor.y,
		)
		this.warden.label.position.set(0, -wardenPixels / 2 - 24)
		this.warden.integrity.position.set(0, -wardenPixels / 2)
		this.warden.shadow.y = wardenPixels * 0.42

		const layout = computeFormationLayout(width, height)
		this.formation.resize(width, height, layout)

		this.redrawSignalNodes()
		this.redrawIntegrity()
		this.rescueCallout.position.set(width / 2, height * SCENE.rescueCalloutY)
	}

	sync(state: SceneState) {
		const focusStarted = !this.state.focusPaused && state.focusPaused
		this.state = state

		this.formation.sync({
			targetOrdinal: state.targetOrdinal,
			stage: state.stage,
			zone: state.zone,
			focusPaused: state.focusPaused,
			reducedMotion: state.reducedMotion,
		})

		if (focusStarted) {
			this.pressureMs = 0
			this.pressureLine.clear()
			this.warden.rig.play("ready", { force: true })
		}
		if (
			state.currentWord !== this.lastWord
			|| state.caretIndex !== this.lastCaretIndex
			|| state.wordDirty !== this.lastDirty
		) {
			this.redrawSignalNodes()
			this.redrawIntegrity()
			this.lastWord = state.currentWord
			this.lastCaretIndex = state.caretIndex
			this.lastDirty = state.wordDirty
		}
		this.redrawWardenIntegrity()
	}

	handle(event: OverdrivePresentationEvent) {
		this.formation.handle(event)

		if (event.type === "accepted-character") {
			this.acceptCharacter(event)
			return
		}
		if (event.type === "rejected-character") {
			this.warden.rig.play("hurt", { force: true })
			return
		}
		if (event.type === "word-completed") {
			this.completeWord(event)
			return
		}
		if (event.type === "overdrive-ready") {
			this.warden.rig.play("ready", { force: true })
			return
		}
		if (event.type === "overdrive-intent") {
			this.warden.rig.play("ready", { force: true })
			return
		}
		if (event.type === "aegis-rescue") {
			this.startAegis(event.timeAddedMs)
			return
		}
		if (event.type === "item-triggered") {
			this.queuedItemEffects.push({
				itemId: event.itemId,
				kind: event.contribution.kind,
			})
			return
		}
		if (event.type === "macro-used") {
			const preset = ITEM_PRESENTATION[
				event.itemId as keyof typeof ITEM_PRESENTATION
			]
			if (preset) {
				this.queuedItemEffects.push({
					itemId: event.itemId,
					kind: preset.tone,
				})
			}
		}
	}

	update(deltaMs: number) {
		const delta = Math.max(0, Math.min(deltaMs, 50))
		this.timeMs += delta
		const wardenFrame = this.warden.rig.update(delta)
		
		this.formation.update(delta)

		if (wardenFrame.contactEdge) this.resolveNextContact()
		this.updateHits(delta)
		this.updatePressure(delta)
		this.updateAegis(delta)
		this.updatePopups(delta)
		this.flushItemEffects()
		this.effects.update(delta)
		this.itemPresentation.update(delta)
	}

	destroy() {
		for (const popup of this.popups) popup.node.destroy()
		this.popups.length = 0
		this.itemPresentation.destroy()
		this.warden.rig.destroy()
		this.formation.destroy()
		this.effects.destroy()
		this.root.destroy({ children: true })
	}

	private acceptCharacter(
		event: Extract<OverdrivePresentationEvent, { type: "accepted-character" }>,
	) {
		const target = this.slotForOrdinal(event.targetOrdinal)
		if (!target) return
		const position = this.signalNodePosition(event.index, event.word.length)
		const muzzle = this.warden.rig.getPartGlobalPosition(
			"cannon_barrel",
			1,
			0.5,
		)
		
		this.lastVerb = event.verb
		if (event.variantId) this.activeVariant = event.variantId
		
		if (event.verb === "cannon-burst") {
			this.effects.emitCannonBurst(muzzle, position, event.combo)
		} else if (event.verb === "rail-step") {
			this.effects.emitRailStep(position, 1, event.combo)
		} else if (event.verb === "tether-pull") {
			this.effects.emitTether(muzzle, position, event.combo)
		} else if (event.verb === "breach-slide") {
			this.effects.emitBreachSlide(position, 1, event.combo)
		} else if (event.verb === "recoil-vault") {
			this.effects.emitRecoilVault(muzzle, position, event.combo)
		} else if (event.verb === "crossfire-pivot") {
			this.effects.emitCrossfirePivot(muzzle, position, event.combo)
		}
		
		this.pendingContacts.push({
			position,
			target,
			tone: target.accent,
			finisher: false,
		})
		if (this.pendingContacts.length > 2) this.pendingContacts.shift()
		const delta = this.timeMs - this.lastInputMs
		this.lastInputMs = this.timeMs
		this.warden.rig.play(event.verb, { force: delta <= 140, queueContact: true })
		this.returnDelayMs = 0
	}

	private completeWord(
		event: Extract<OverdrivePresentationEvent, { type: "word-completed" }>,
	) {
		const target = this.slotForOrdinal(event.targetOrdinal)
		if (!target) return
		const existingContact = [...this.pendingContacts]
			.reverse()
			.find((contact) => contact.target === target)
		if (event.autoExecuted && existingContact) {
			existingContact.finisher = true
		} else {
			for (let index = this.pendingContacts.length - 1; index >= 0; index -= 1) {
				if (this.pendingContacts[index].target === target) {
					this.pendingContacts.splice(index, 1)
				}
			}
			this.lastInputMs = this.timeMs
			this.warden.rig.play(event.verb, { force: true })
			const targetPosition = this.targetCorePosition(target)
			const muzzle = this.warden.rig.getPartGlobalPosition(
				"cannon_barrel",
				1,
				0.5,
			)
			
			this.lastVerb = event.verb
			if (event.variantId) this.activeVariant = event.variantId
			
			if (event.verb === "execution") {
				this.effects.emitExecution(targetPosition, this.state.stage, true, event.combo)
			} else if (event.verb === "overdrive-breach") {
				this.effects.emitCannonBurst(muzzle, targetPosition, event.combo)
				// Overdrive Breach specific effects can be added here later
			} else if (event.overdriveReleased) {
				this.effects.emitCannonBurst(muzzle, targetPosition, event.combo)
			} else {
				this.effects.emitCannonBurst(muzzle, targetPosition, event.combo)
			}
			
			this.pendingContacts.push({
				position: targetPosition,
				target,
				tone: event.overdriveReleased ? V.green : target.accent,
				finisher: true,
			})
		}

		if (event.overdriveReleased) {
			this.overdriveMs = MOTION.overdriveMs
			const from = this.warden.rig.getPartGlobalPosition("torso")
			const to = this.targetCorePosition(target)
			this.effects.spawnOverdriveColumn(from, to)
		}

		this.spawnScorePopup(target, event.scoreGain)
		this.returnDelayMs = event.overdriveReleased
			? MOTION.overdriveMs
			: MOTION.attackMs
	}

	private slotForOrdinal(ordinal: number) {
		return this.formation.getActiveTargets().get(ordinal)
	}

	private updateHits(deltaMs: number) {
		for (const slot of this.formation.getActiveTargets().values()) {
			if (slot.isHit || slot.hitMs > 0) {
				slot.hitMs = Math.max(0, slot.hitMs - deltaMs)
				slot.rig.setTint(V.text)
			} else {
				slot.rig.setTint(WHITE_TINT)
			}
		}
	}

	private updatePressure(deltaMs: number) {
		if (
			this.state.stageDurationMs > 0
			&& !this.state.focusPaused
			&& this.aegisMs === 0
		) {
			const elapsed = Math.max(
				0,
				this.state.stageDurationMs - Math.min(
					this.state.stageDurationMs,
					this.state.timeLeftMs,
				),
			)
			const beat = Math.floor(
				elapsed / MOTION.pressureIntervalMs[this.state.stage],
			)
			if (beat > this.pressureBeat && beat > 0 && this.pressureMs === 0) {
				this.pressureBeat = beat
				this.startPressure()
			}
		}
		if (this.pressureMs === 0) return
		this.pressureMs = Math.max(0, this.pressureMs - deltaMs)
		const elapsed = MOTION.enemyAttackMs - this.pressureMs
		if (
			!this.pressureStrikeStarted
			&& elapsed >= MOTION.enemyAnticipationMs
		) {
			this.pressureStrikeStarted = true
			const active = this.slotForOrdinal(this.state.targetOrdinal)
			active?.rig.play("attack", { force: true })
			this.warden.rig.play("block", { force: true })
			if (active) {
				this.effects.spawnSmear(
					this.targetCorePosition(active),
					this.warden.rig.getPartGlobalPosition("torso"),
					V.red,
				)
			}
		}
		if (this.pressureMs === 0) {
			this.pressureLine.clear()
			this.slotForOrdinal(this.state.targetOrdinal)?.rig.play("locomotion", { force: true })
			this.warden.rig.play(
				this.state.overdriveCharge >= 100 ? "ready" : "idle",
				{ force: true },
			)
		}
	}

	private startPressure() {
		const active = this.slotForOrdinal(this.state.targetOrdinal)
		if (!active) return
		this.pressureMs = MOTION.enemyAttackMs
		this.pressureStrikeStarted = false
		active.rig.play("anticipation", { force: true })
		const from = this.targetCorePosition(active)
		const to = this.warden.rig.getPartGlobalPosition("torso")
		this.pressureLine
			.clear()
			.moveTo(from.x, from.y)
			.lineTo(to.x, to.y)
			.stroke({
				color: V.red,
				width: EFFECTS.contactStroke,
				alpha: 0.28,
			})
	}

	private startAegis(timeAddedMs: number) {
		this.aegisMs = MOTION.aegisRescueMs
		this.pressureMs = 0
		this.pressureLine.clear()
		this.warden.rig.play("block", { force: true })
		this.slotForOrdinal(this.state.targetOrdinal)?.rig.play("special", { force: true })
		const anchor = this.warden.rig.getPartGlobalPosition("near_forearm")
		this.effects.spawnShield({
			x: anchor.x + this.width * SCENE.aegisShield.anchorX,
			y: this.height * SCENE.aegisShield.centerY,
		})
		this.rescueCallout.text = `AEGIS DEFLECT · +${Math.round(
			timeAddedMs / 1_000,
		)}S`
		this.rescueCallout.alpha = 1
	}

	private updateAegis(deltaMs: number) {
		if (this.aegisMs === 0) return
		this.aegisMs = Math.max(0, this.aegisMs - deltaMs)
		this.rescueCallout.alpha = Math.min(1, this.aegisMs / 150)
		if (this.aegisMs === 0) {
			this.rescueCallout.text = ""
			this.slotForOrdinal(this.state.targetOrdinal)?.rig.play("locomotion", { force: true })
			this.warden.rig.play("ready", { force: true })
		}
	}

	private resolveNextContact() {
		const contact = this.pendingContacts.shift()
		if (!contact) return
		sfx.hit()
		
		const corePosition = this.targetCorePosition(contact.target)
		const impactPosition = contact.finisher ? corePosition : {
			x: contact.position.x * 0.4 + corePosition.x * 0.6,
			y: contact.position.y * 0.4 + corePosition.y * 0.6,
		}
		
		this.effects.spawnContact(
			impactPosition,
			contact.tone,
			contact.finisher,
		)
		contact.target.hitMs = MOTION.hitMs
		contact.target.rig.play("hit")
	}


	private redrawSignalNodes() {
		for (const child of this.signalNodes.removeChildren()) {
			child.destroy({ children: true })
		}
		const compact = this.width < SCENE.compactWidth
		const radius = compact
			? SCENE.signalNode.compactRadius
			: SCENE.signalNode.desktopRadius
		for (const [index, character] of [...this.state.currentWord].entries()) {
			const entered = index < this.state.caretIndex
			const position = this.signalNodePosition(
				index,
				this.state.currentWord.length,
			)
			const node = new Container()
			const frame = new Graphics()
				.moveTo(0, -radius)
				.lineTo(radius, 0)
				.lineTo(0, radius)
				.lineTo(-radius, 0)
				.closePath()
				.fill({
					color: entered
						? V.panel2
						: this.state.wordDirty
							? V.red
							: V.cyan,
					alpha: entered ? 0.35 : 0.72,
				})
				.stroke({
					color: entered ? V.line : V.text,
					width: 1,
					alpha: entered ? 0.4 : 0.72,
				})
			const glyph = new Text({
				text: character.toUpperCase(),
				style: {
					fill: entered ? V.dim : V.text,
					fontFamily: "JetBrains Mono",
					fontSize: SCENE.signalNode.fontSize,
					fontWeight: "700",
				},
			})
			glyph.anchor.set(0.5)
			node.position.copyFrom(position)
			node.addChild(frame, glyph)
			this.signalNodes.addChild(node)
		}
	}

	private redrawIntegrity() {
		const active = this.slotForOrdinal(this.state.targetOrdinal)
		if (!active) return
		drawTargetIntegrity(
			active,
			this.state.currentWord.length,
			this.state.caretIndex,
			this.state.wordDirty,
		)
	}

	private redrawWardenIntegrity() {
		const integrity = Math.max(
			0,
			Math.min(1, this.state.accuracy / 100),
		)
		const color = integrity >= 0.97
			? V.green
			: integrity >= 0.9
				? V.yellow
				: V.red
		this.warden.integrity
			.clear()
			.roundRect(
				-SCENE.integrityWidth / 2,
				0,
				SCENE.integrityWidth,
				SCENE.integrityHeight,
				SCENE.integrityRadius,
			)
			.fill({ color: V.panel2, alpha: 0.85 })
			.roundRect(
				-SCENE.integrityWidth / 2,
				0,
				SCENE.integrityWidth * integrity,
				SCENE.integrityHeight,
				SCENE.integrityRadius,
			)
			.fill({ color })
	}

	private signalNodePosition(index: number, wordLength: number) {
		const compact = this.width < SCENE.compactWidth
		const path = compact
			? SCENE.attackPath.compact
			: SCENE.attackPath.desktop
		const count = Math.max(1, wordLength)
		const ratio = count === 1 ? 1 : index / (count - 1)
		return {
			x: this.width * (
				path.startX + (path.endX - path.startX) * ratio
			),
			y: this.height * path.y + (
				index % 2 === 0
					? -SCENE.signalNode.minGap
					: SCENE.signalNode.minGap
			),
		}
	}

	private targetCorePosition(slot: FormationTarget) {
		return slot.rig.getPartGlobalPosition(
			this.stage === "warmup"
				? "core_torso"
				: this.stage === "rush"
					? "chest_core"
					: "void_core",
		)
	}



	private spawnScorePopup(slot: FormationTarget, scoreGain: number) {
		while (this.popups.length >= EFFECTS.scorePopupCap) {
			const oldest = this.popups.shift()
			oldest?.node.destroy()
		}
		const node = new Text({
			text: scoreGain > 0 ? `+${metric(scoreGain)}` : "0",
			style: {
				fill: scoreGain > 0 ? V.violet : V.red,
				fontFamily: "JetBrains Mono",
				fontSize: 20,
				fontWeight: "700",
			},
		})
		node.anchor.set(0.5)
		node.position.copyFrom(this.targetCorePosition(slot))
		this.effects.root.addChild(node)
		this.popups.push({
			node,
			lifeMs: MOTION.defeatMs,
		})
	}

	private updatePopups(deltaMs: number) {
		for (let index = this.popups.length - 1; index >= 0; index -= 1) {
			const popup = this.popups[index]
			popup.lifeMs = Math.max(0, popup.lifeMs - deltaMs)
			const progress = 1 - popup.lifeMs / MOTION.defeatMs
			popup.node.x += EFFECTS.scorePopupTravel
				* deltaMs / MOTION.defeatMs
			popup.node.y -= EFFECTS.scorePopupTravel
				* deltaMs / MOTION.defeatMs
			popup.node.alpha = 1 - progress
			if (popup.lifeMs === 0) {
				popup.node.destroy()
				this.popups.splice(index, 1)
			}
		}
	}

	private flushItemEffects() {
		if (this.queuedItemEffects.length === 0) return
		this.queuedItemEffects.sort(
			(left, right) => (
				ITEM_EFFECT_PRIORITY[left.kind]
				- ITEM_EFFECT_PRIORITY[right.kind]
			),
		)
		for (const effect of this.queuedItemEffects) {
			const preset = ITEM_PRESENTATION[
				effect.itemId as keyof typeof ITEM_PRESENTATION
			]
			if (!preset) continue
			const position = this.itemEffectPosition(preset.hudTarget)
			this.itemPresentation.play(
				effect.itemId,
				position,
				this.state.reducedMotion,
			)
			sfx.item(effect.itemId, effect.kind)
		}
		this.queuedItemEffects.length = 0
	}

	private itemEffectPosition(
		target: (
			typeof ITEM_PRESENTATION
		)[keyof typeof ITEM_PRESENTATION]["hudTarget"],
	) {
		if (
			target === "mult"
			|| target === "time"
			|| target === "rail"
		) {
			const warden = this.warden.rig.getPartGlobalPosition("torso")
			return {
				x: warden.x,
				y: warden.y - SCENE.integrityWidth / 2,
			}
		}
		const active = this.slotForOrdinal(this.state.targetOrdinal)
		if (active) {
			const position = this.targetCorePosition(active)
			return {
				x: position.x,
				y: position.y - SCENE.integrityWidth / 2,
			}
		}
		return {
			x: this.width * SCENE.wordAnchor.x,
			y: this.height * SCENE.rescueCalloutY,
		}
	}
}
