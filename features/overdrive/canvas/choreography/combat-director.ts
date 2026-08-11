import {
	Container,
	Graphics,
	Text,
} from "pixi.js"
import type {
	CombatAction,
	CombatVerb,
	ItemContribution,
	StageType,
} from "@/lib/engine/overdrive"
import { sfx } from "@/features/overdrive/fx/sfx"
import type { OverdrivePresentationEvent } from "../../presentation/events"
import type { PresentationEventEnvelope, PresentationScheduler } from "../../presentation/scheduler-types"
import { createPresentationScheduler } from "../../presentation/scheduler"
import type { LoadedRigAssets } from "../assets/combat-assets"
import { CombatEffects } from "../effects/combat-effects"
import {
	ITEM_PRESENTATION,
	ItemPresentation,
} from "../effects/item-presentation"
import { RigInstance } from "../rig/rig-instance"
import type { AnimationClipName } from "../rig/rig-definition"
import { ContactLedger } from "./contact-ledger"
import {
	EFFECTS,
	MOTION,
	SCENE,
	V,
	drawTargetIntegrity,
	stageAccent,
	targetClassName,
} from "../visual-assets"
import type { SceneState } from "../combat-scene"
import { targetLane } from "./target-lanes"
import { reactionForVerb } from "../rig/rig-reaction"
import { selectStagedTarget } from "./target-selection-visual"

type TargetRole = "active" | "upcoming" | "distant" | "retiring" | "available"

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

type EnemySlot = {
	root: Container
	rig: RigInstance
	shadow: Graphics
	integrity: Graphics
	label: Text
	accent: number
	ordinal: number
	role: TargetRole
	baseScale: number
	hitMs: number
	retireMs: number
	transition: Transition | null
}

type PendingContact = {
	position: {
		x: number
		y: number
	}
	target: EnemySlot
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
const INITIAL_ENEMY_INSTANCES = 6

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

function createEnemy(
	assets: LoadedRigAssets,
	stage: StageType,
): EnemySlot {
	const root = new Container()
	const rig = new RigInstance(assets.definition, assets.textures)
	const shadow = new Graphics()
		.ellipse(0, 12, 88, 16)
		.fill({ color: V.bg, alpha: 0.58 })
	const integrity = new Graphics()
	const accent = stageAccent(stage)
	const label = createLabel(targetClassName(stage), accent)
	root.addChild(shadow, rig.root, integrity, label)
	return {
		root,
		rig,
		shadow,
		integrity,
		label,
		accent,
		ordinal: 0,
		role: "available",
		baseScale: 1,
		hitMs: 0,
		retireMs: 0,
		transition: null,
	}
}

function clipForAction(kind: CombatAction["kind"]): AnimationClipName | null {
	if (kind === "dash") return "dash"
	if (kind === "shield") return "block"
	if (kind === "railgun" || kind === "bomb" || kind === "drain") return "special"
	if (kind === "blade" || kind === "echo") return "attack"
	if (kind === "overdrive-burst") return "overdrive"
	return null
}

export class CombatDirector {
	readonly root = new Container()
	readonly signalNodes = new Container()
	readonly scheduler: PresentationScheduler
	readonly ledger = new ContactLedger({ historyLimit: 120 })
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
	private readonly enemyAssets: LoadedRigAssets
	private readonly stage: StageType
	private readonly staged: EnemySlot[] = []
	private readonly retiring: EnemySlot[] = []
	private readonly available: EnemySlot[] = []
	private readonly pendingContacts: PendingContact[] = []
	private readonly popups: ScorePopup[] = []
	private readonly queuedItemEffects: QueuedItemEffect[] = []
	private state: SceneState
	private width = 0
	private height = 0
	private wardenOffsetX = 0
	private wardenTravel: Travel | null = null
	private overdriveMs = 0
	private returnDelayMs = 0
	private pressureBeat = 0
	private pressureMs = 0
	private pressureStrikeStarted = false
	private aegisMs = 0
	private lastWord = ""
	private lastCaretIndex = -1
	private lastDirty = false

	constructor(
		initial: SceneState,
		assets: {
			warden: LoadedRigAssets
			enemy: LoadedRigAssets
		},
	) {
		this.state = initial
		this.stage = initial.stage
		this.scheduler = createPresentationScheduler({
			runId: "legacy",
			now: () => performance.now(),
		})
		this.enemyAssets = assets.enemy
		this.warden = createWarden(assets.warden)
		this.rescueCallout.anchor.set(0.5)
		this.root.addChild(
			this.actors,
			this.signalNodes,
			this.effects.root,
			this.itemPresentation.root,
			this.pressureLine,
			this.rescueCallout,
		)
		this.actors.addChild(this.warden.root)

		for (let index = 0; index < INITIAL_ENEMY_INSTANCES; index += 1) {
			const slot = createEnemy(assets.enemy, initial.stage)
			this.actors.addChild(slot.root)
			if (index < 3) {
				slot.ordinal = initial.targetOrdinal + index
				slot.role = index === 0
					? "active"
					: index === 1
						? "upcoming"
						: "distant"
				this.staged.push(slot)
			} else {
				slot.root.visible = false
				this.available.push(slot)
			}
		}

		this.warden.rig.play(
			initial.focusPaused || initial.overdriveCharge >= 100
				? "ready"
				: "idle",
			{ force: true },
		)
		for (const slot of this.staged) {
			slot.rig.play("locomotion", { force: true })
		}
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
		const targetHeight = compact
			? SCENE.targetHeight.compact
			: SCENE.targetHeight.desktop
		const wardenPixels = Math.min(
			height * wardenHeight.ratio,
			wardenHeight.max,
		)
		const targetPixels = Math.min(
			height * targetHeight.ratio,
			targetHeight.max,
		)

		this.warden.baseScale = wardenPixels / this.warden.rig.getVisualSize().height
		this.warden.rig.root.scale.set(this.warden.baseScale)
		this.warden.root.position.set(
			width * wardenAnchor.x + this.wardenOffsetX,
			height * wardenAnchor.y,
		)
		this.warden.label.position.set(0, -wardenPixels / 2 - 24)
		this.warden.integrity.position.set(0, -wardenPixels / 2)
		this.warden.shadow.y = wardenPixels * 0.42

		for (const slot of [
			...this.staged,
			...this.retiring,
			...this.available,
		]) {
			slot.baseScale = targetPixels / slot.rig.getVisualSize().height
		}
		this.layoutStaged(false)
		this.redrawSignalNodes()
		this.redrawIntegrity()
		this.rescueCallout.position.set(width / 2, height * SCENE.rescueCalloutY)
	}

	sync(state: SceneState) {
		const focusStarted = !this.state.focusPaused && state.focusPaused
		const targetsChanged = state.currentWord !== this.state.currentWord
			|| state.upcomingWords.slice(0, 2).join("\u0000")
				!== this.state.upcomingWords.slice(0, 2).join("\u0000")
		this.state = state
		if (targetsChanged) this.layoutStaged(false)
		if (focusStarted) {
			this.pressureMs = 0
			this.pressureLine.clear()
			this.warden.rig.play("ready", { force: true })
			this.staged[0]?.rig.play("idle", { force: true })
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

	handle(envelope: PresentationEventEnvelope<OverdrivePresentationEvent>) {
		const event = envelope.event
		if (event.type === "accepted-character") {
			this.scheduler.enqueue(envelope)
			this.ledger.accept({
				sequence: envelope.sequence,
				targetOrdinal: envelope.targetOrdinal,
				characterIndex: event.index,
				acceptedAtMs: envelope.emittedAtMs,
			})
			return
		}
		if (event.type === "target-selected") {
			selectStagedTarget(
				this.staged,
				event.queueIndex,
				event.targetOrdinal,
			)
			this.layoutStaged(true)
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
		const wardenFrame = this.warden.rig.update(delta)
		for (const slot of [
			...this.staged,
			...this.retiring,
		]) {
			slot.rig.update(delta)
		}
		if (wardenFrame.contactEdge) this.resolveNextContact()
		this.updateWardenTravel(delta)
		this.updateTargetTransitions(delta)
		this.updateRetiring(delta)
		this.updateHits(delta)
		this.updatePressure(delta)
		this.updateAegis(delta)
		this.updatePopups(delta)
		this.flushItemEffects()
		this.effects.update(delta)
		this.itemPresentation.update(delta)

		const now = performance.now()
		const beats = this.scheduler.drain(now)
		for (const beat of beats) {
			if (beat.kind === "contact-cue") {
				const target = this.slotForOrdinal(beat.targetOrdinal) ?? this.staged[0]
				if (!target) continue
				const index = beat.payload.index as number
				const verb = beat.payload.verb as CombatVerb
				const stage = beat.payload.stage as StageType
				const combo = Number(beat.payload.combo ?? 0)
				const reaction = reactionForVerb(verb, stage, combo)
				const position = this.signalNodePosition(index, this.state.currentWord.length)
				const muzzle = this.warden.rig.getPartGlobalPosition("cannon_barrel", 1, 0.5)
				const actions = beat.actions ?? []
				if (actions.length === 0) {
					this.effects.spawnSmear(muzzle, position, target.accent)
				} else {
					for (const action of actions) this.renderCombatAction(action, muzzle, position, target)
				}
				const actionClip = [...actions]
					.reverse()
					.map((action) => clipForAction(action.kind))
					.find((clip): clip is AnimationClipName => clip !== null)
				this.warden.rig.play(actionClip ?? reaction.clip, {
					force: reaction.interruptible,
					blendMs: reaction.blendMs,
				})
				this.startCharacterTravel(index, this.state.currentWord.length, target)
				this.returnDelayMs = 0
				this.ledger.markCue(beat.sourceSequence, now)
			} else if (beat.kind === "target-hit") {
				const target = this.slotForOrdinal(beat.targetOrdinal) ?? this.staged[0]
				if (!target) continue
				const index = beat.payload.index as number
				const position = this.signalNodePosition(index, this.state.currentWord.length)
				this.pendingContacts.push({
					position,
					target,
					tone: target.accent,
					finisher: false,
				})
				if (this.pendingContacts.length > 2) this.pendingContacts.shift()
				this.ledger.markHit(beat.sourceSequence, now)
			}
		}
	}

	destroy() {
		for (const popup of this.popups) popup.node.destroy()
		this.popups.length = 0
		this.itemPresentation.destroy()
		this.warden.rig.destroy()
		for (const slot of [
			...this.staged,
			...this.retiring,
			...this.available,
		]) {
			slot.rig.destroy()
		}
		this.effects.destroy()
		this.root.destroy({ children: true })
	}



	private completeWord(
		event: Extract<OverdrivePresentationEvent, { type: "word-completed" }>,
	) {
		const target = this.slotForOrdinal(event.targetOrdinal) ?? this.staged[0]
		if (!target) return
		const from = this.warden.root.position
		const to = target.root.position
		for (const action of event.combatActions ?? []) {
			this.renderCombatAction(action, from, to, target)
		}
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
			const clip = event.overdriveReleased ? "overdrive" : "execute"
			this.warden.rig.play(clip, { force: true })
			const targetPosition = this.targetCorePosition(target)
			const muzzle = this.warden.rig.getPartGlobalPosition(
				"cannon_barrel",
				1,
				0.5,
			)
			this.effects.spawnSmear(
				muzzle,
				targetPosition,
				event.overdriveReleased ? V.green : target.accent,
			)
			this.pendingContacts.push({
				position: targetPosition,
				target,
				tone: event.overdriveReleased ? V.green : target.accent,
				finisher: true,
			})
		}

		if (event.overdriveReleased) {
			this.overdriveMs = MOTION.overdriveMs
			if (!(event.combatActions ?? []).some((action) => action.kind === "overdrive-burst")) {
				const from = this.warden.rig.getPartGlobalPosition("torso")
				const to = this.targetCorePosition(target)
				this.effects.spawnOverdriveColumn(from, to)
			}
		}

		this.retireTarget(target, event.scoreGain > 0)
		this.spawnScorePopup(target, event.scoreGain)
		this.promoteTargets(event.targetOrdinal)
		this.returnDelayMs = event.overdriveReleased
			? MOTION.overdriveMs
			: MOTION.attackMs
	}

	private renderCombatAction(
		action: CombatAction,
		from: { x: number; y: number },
		to: { x: number; y: number },
		target: EnemySlot,
	) {
		if (action.targetScope === "active") {
			this.effects.spawnCombatAction(action, from, to, target.accent)
			return
		}
		const candidates = action.targetScope === "lane"
			? this.staged.filter((candidate) => targetLane(candidate.ordinal) === targetLane(target.ordinal))
			: this.staged
		for (const candidate of candidates.length > 0 ? candidates : [target]) {
			this.effects.spawnCombatAction(action, from, candidate.root.position, candidate.accent)
		}
	}

	private retireTarget(target: EnemySlot, clean: boolean) {
		target.role = "retiring"
		target.retireMs = MOTION.defeatMs
		target.transition = null
		target.label.visible = false
		target.integrity.visible = false
		target.rig.play("defeat", { force: true })
		if (clean) {
			this.effects.spawnDefeat(
				this.targetCorePosition(target),
				this.stage,
			)
		}
	}

	private promoteTargets(resolvedOrdinal: number) {
		this.pressureMs = 0
		this.pressureStrikeStarted = false
		this.pressureLine.clear()
		const activeIndex = this.staged.findIndex(
			(slot) => slot.ordinal === resolvedOrdinal,
		)
		if (activeIndex >= 0) {
			const [resolved] = this.staged.splice(activeIndex, 1)
			this.retiring.push(resolved)
		}
		while (this.staged.length > 2) {
			const overflow = this.staged.pop()
			if (overflow) this.available.push(overflow)
		}
		const slot = this.available.shift()
			?? createEnemy(this.enemyAssets, this.stage)
		if (!slot.root.parent) this.actors.addChild(slot.root)
		slot.ordinal = resolvedOrdinal + 3
		slot.role = "distant"
		slot.retireMs = 0
		slot.hitMs = 0
		slot.transition = null
		slot.root.visible = true
		slot.root.position.set(0, 0)
		slot.root.alpha = 1
		slot.baseScale = this.targetBaseScale(slot)
		slot.rig.setTint(WHITE_TINT)
		slot.rig.play("locomotion", { force: true })
		this.staged.push(slot)
		for (const [index, staged] of this.staged.entries()) {
			staged.role = index === 0
				? "active"
				: index === 1
					? "upcoming"
					: "distant"
		}
		this.layoutStaged(true)
		this.redrawIntegrity()
	}

	private targetBaseScale(slot: EnemySlot) {
		const compact = this.width < SCENE.compactWidth
		const targetHeight = compact
			? SCENE.targetHeight.compact
			: SCENE.targetHeight.desktop
		const targetPixels = Math.min(
			this.height * targetHeight.ratio,
			targetHeight.max,
		)
		return targetPixels / slot.rig.getVisualSize().height
	}

	private startCharacterTravel(
		index: number,
		wordLength: number,
		target: EnemySlot,
	) {
		const gap = target.root.x - (
			this.width * (
				this.width < SCENE.compactWidth
					? SCENE.wardenAnchor.compact.x
					: SCENE.wardenAnchor.desktop.x
			)
		)
		const progress = wordLength <= 1
			? 1
			: Math.max(0, Math.min(1, index / (wordLength - 1)))
		const ratio = SCENE.wardenTravel.midField
			+ (
				SCENE.wardenTravel.contact - SCENE.wardenTravel.midField
			) * progress
		this.wardenTravel = {
			elapsedMs: 0,
			durationMs: MOTION.attackMs,
			fromX: this.wardenOffsetX,
			toX: gap * ratio,
			arcHeight: this.height * MOTION.attackArcRatio,
		}
	}

	private updateWardenTravel(deltaMs: number) {
		if (this.overdriveMs > 0) {
			this.overdriveMs = Math.max(0, this.overdriveMs - deltaMs)
			const progress = 1 - this.overdriveMs / MOTION.overdriveMs
			const target = this.staged[0] ?? this.retiring.at(-1)
			const targetX = target?.root.x ?? this.width * SCENE.targetAnchor.desktop.x
			const anchorX = this.width * (
				this.width < SCENE.compactWidth
					? SCENE.wardenAnchor.compact.x
					: SCENE.wardenAnchor.desktop.x
			)
			const contactX = (targetX - anchorX) * MOTION.overdriveContactRatio
			const returnRatio = 1 - MOTION.overdriveOutwardRatio
			const outward = progress < MOTION.overdriveOutwardRatio
				? progress / MOTION.overdriveOutwardRatio
				: 1 - (
					progress - MOTION.overdriveOutwardRatio
				) / returnRatio
			this.wardenOffsetX = contactX * (
				1 - (1 - Math.max(0, outward)) ** 3
			)
			this.wardenTravel = null
		} else if (this.wardenTravel) {
			this.wardenTravel.elapsedMs = Math.min(
				this.wardenTravel.durationMs,
				this.wardenTravel.elapsedMs + deltaMs,
			)
			const progress = this.wardenTravel.elapsedMs
				/ this.wardenTravel.durationMs
			const eased = 1 - (1 - progress) ** 3
			this.wardenOffsetX = this.wardenTravel.fromX
				+ (
					this.wardenTravel.toX - this.wardenTravel.fromX
				) * eased
			this.warden.rig.root.y = -Math.sin(progress * Math.PI)
				* this.wardenTravel.arcHeight
			if (progress >= 1) {
				this.warden.rig.root.y = 0
				this.wardenTravel = null
			}
		} else if (this.returnDelayMs > 0) {
			this.returnDelayMs = Math.max(0, this.returnDelayMs - deltaMs)
			if (this.returnDelayMs === 0 && this.wardenOffsetX !== 0) {
				this.warden.rig.play("recover", { force: true })
				this.wardenTravel = {
					elapsedMs: 0,
					durationMs: MOTION.entryMs,
					fromX: this.wardenOffsetX,
					toX: 0,
					arcHeight: 0,
				}
			}
		}
		const anchor = this.width < SCENE.compactWidth
			? SCENE.wardenAnchor.compact
			: SCENE.wardenAnchor.desktop
		this.warden.root.position.set(
			this.width * anchor.x + this.wardenOffsetX,
			this.height * anchor.y,
		)
	}

	private updateTargetTransitions(deltaMs: number) {
		for (const slot of this.staged) {
			const transition = slot.transition
			if (!transition) continue
			transition.elapsedMs = Math.min(
				transition.durationMs,
				transition.elapsedMs + deltaMs,
			)
			const progress = transition.elapsedMs / transition.durationMs
			const eased = 1 + 2.70158 * (progress - 1) ** 3
				+ 1.70158 * (progress - 1) ** 2
			slot.root.position.set(
				transition.fromX
					+ (transition.toX - transition.fromX) * eased,
				transition.fromY
					+ (transition.toY - transition.fromY) * eased,
			)
			slot.root.alpha = transition.fromAlpha
				+ (transition.toAlpha - transition.fromAlpha) * progress
			if (progress >= 1) slot.transition = null
		}
	}

	private updateRetiring(deltaMs: number) {
		for (let index = this.retiring.length - 1; index >= 0; index -= 1) {
			const slot = this.retiring[index]
			slot.retireMs = Math.max(0, slot.retireMs - deltaMs)
			slot.root.alpha = slot.retireMs / MOTION.defeatMs
			if (slot.retireMs > 0) continue
			slot.role = "available"
			slot.root.visible = false
			slot.root.alpha = 1
			slot.rig.controller.clear()
			this.retiring.splice(index, 1)
			this.available.push(slot)
		}
	}

	private updateHits(deltaMs: number) {
		for (const slot of [...this.staged, ...this.retiring]) {
			if (slot.hitMs > 0) {
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
			const active = this.staged[0]
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
			this.staged[0]?.rig.play("locomotion", { force: true })
			this.warden.rig.play(
				this.state.overdriveCharge >= 100 ? "ready" : "idle",
				{ force: true },
			)
		}
	}

	private startPressure() {
		const active = this.staged[0]
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
		this.staged[0]?.rig.play("special", { force: true })
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
			this.staged[0]?.rig.play("locomotion", { force: true })
			this.warden.rig.play("ready", { force: true })
		}
	}

	private resolveNextContact() {
		const contact = this.pendingContacts.shift()
		if (!contact) return
		sfx.hit()
		this.effects.spawnContact(
			contact.position,
			contact.tone,
			contact.finisher,
		)
		contact.target.hitMs = MOTION.hitMs
		contact.target.rig.play("hit")
	}

	private layoutStaged(animate: boolean) {
		for (const [index, slot] of this.staged.entries()) {
			const role = index === 0
				? "active"
				: index === 1
					? "upcoming"
					: "distant"
			slot.role = role
			this.layoutSlot(slot, role, animate)
		}
	}

	private layoutSlot(
		slot: EnemySlot,
		role: Exclude<TargetRole, "retiring" | "available">,
		animate: boolean,
	) {
		const compact = this.width < SCENE.compactWidth
		const anchor = compact
			? SCENE.targetAnchor.compact
			: SCENE.targetAnchor.desktop
		const lanes = compact
			? SCENE.targetLanes.compact
			: SCENE.targetLanes.desktop
		const staging = compact
			? SCENE.targetStaging.compact
			: SCENE.targetStaging.desktop
		const roleIndex = role === "active" ? 0 : role === "upcoming" ? 1 : 2
		const x = this.width * (
			anchor.x
			+ (
				roleIndex === 1
					? staging.upcomingOffsetX
					: roleIndex === 2
						? staging.distantOffsetX
						: 0
			)
		)
		const y = this.height * lanes[targetLane(slot.ordinal)]
		const scale = slot.baseScale * (
			role === "active"
				? 1
				: role === "upcoming"
					? staging.upcomingScale
					: staging.distantScale
		)
		const alpha = role === "active"
			? 1
			: role === "upcoming"
				? staging.upcomingAlpha
				: staging.distantAlpha
		const queueWord = role === "active"
			? this.state.currentWord
			: this.state.upcomingWords[role === "upcoming" ? 0 : 1] ?? ""
		const roleLabel = role === "active"
			? "ACTIVE"
			: role === "upcoming"
				? "NEXT"
				: "FAR"
		slot.rig.root.scale.set(scale)
		slot.label.text = queueWord
			? `${roleLabel}  ${queueWord.toUpperCase()}`
			: roleLabel
		slot.label.style.fill = role === "active" ? slot.accent : V.mid
		slot.label.alpha = role === "active" ? 1 : role === "upcoming" ? 0.92 : 0.78
		slot.label.visible = true
		slot.integrity.visible = role === "active"
		slot.shadow.y = (
			this.height * (
				compact
					? SCENE.targetHeight.compact.ratio
					: SCENE.targetHeight.desktop.ratio
			)
		) * 0.4
		const targetPixels = Math.min(
			this.height * (
				compact
					? SCENE.targetHeight.compact.ratio
					: SCENE.targetHeight.desktop.ratio
			),
			compact
				? SCENE.targetHeight.compact.max
				: SCENE.targetHeight.desktop.max,
		)
		slot.label.position.set(0, -targetPixels / 2 - 24)
		slot.integrity.position.set(0, -targetPixels / 2)
		slot.root.visible = true

		if (!animate) {
			slot.root.position.set(x, y)
			slot.root.alpha = alpha
			slot.transition = null
			return
		}
		const entry = compact
			? SCENE.targetEntry.compact
			: SCENE.targetEntry.desktop
		const entering = role === "distant"
			&& slot.root.alpha >= 0.99
			&& slot.root.x === 0
		slot.transition = {
			elapsedMs: 0,
			durationMs: MOTION.entryMs,
			fromX: entering ? x + entry : slot.root.x,
			fromY: entering ? y : slot.root.y,
			toX: x,
			toY: y,
			fromAlpha: entering ? 0 : slot.root.alpha,
			toAlpha: alpha,
		}
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
		const active = this.staged[0]
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

	private targetCorePosition(slot: EnemySlot) {
		return slot.rig.getPartGlobalPosition(
			this.stage === "warmup"
				? "core_torso"
				: this.stage === "rush"
					? "chest_core"
					: "void_core",
		)
	}

	private slotForOrdinal(ordinal: number) {
		return [...this.staged, ...this.retiring]
			.find((slot) => slot.ordinal === ordinal)
	}

	private spawnScorePopup(slot: EnemySlot, scoreGain: number) {
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
		const active = this.staged[0]
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
