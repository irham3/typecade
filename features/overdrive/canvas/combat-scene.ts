import {
	Application,
	Container,
	Graphics,
	Text,
	Ticker,
} from "pixi.js"
import type { StageType, ThreatBand } from "@/lib/engine/overdrive"
import { sfx } from "@/features/overdrive/fx/sfx"
import type { OverdrivePresentationEvent } from "../presentation/events"
import {
	createBackground,
	createCommandRail,
	createTarget,
	createWarden,
	drawCommandRail,
	drawTargetIntegrity,
	MOTION,
	SCENE,
	stageAccent,
	V,
	type BackgroundArt,
	type CombatTextures,
	type CommandRailArt,
	type EnemyPose,
	type TargetArt,
	type WardenPose,
	type WardenArt,
} from "./visual-assets"

export type SceneState = {
	currentWord: string
	upcomingWords: string[]
	caretIndex: number
	wordDirty: boolean
	score: number
	quota: number
	combo: number
	mult: number
	accuracy: number
	timeLeftMs: number
	stageDurationMs: number
	aegisActive: boolean
	aegisRescues: number
	stageRescued: boolean
	focusPaused: boolean
	threatBand: ThreatBand
	overdriveCharge: number
	zone: number
	stage: StageType
	activeGlitch: string | null
	reducedMotion: boolean
	screenShake: boolean
}

type Bolt = {
	node: Graphics
	startX: number
	startY: number
	targetX: number
	targetY: number
	life: number
	maxLife: number
	finisher: boolean
}

type Fragment = {
	node: Graphics
	vx: number
	vy: number
	spin: number
	life: number
	maxLife: number
}

type Popup = {
	node: Text
	life: number
	maxLife: number
}

type PendingResolution = {
	scoreGain: number
	clean: boolean
	resolveOnAnyImpact: boolean
}

const PROJECTILE_MS = 110
const POPUP_MS = 300
const DEFEAT_PHASE_MS = MOTION.defeatMs - MOTION.entryMs

export class CombatScene {
	readonly app: Application
	readonly stage = new Container()
	private readonly world = new Container()
	private readonly effects = new Container()
	private readonly overlay = new Container()
	private readonly signalNodes = new Container()
	private readonly background: BackgroundArt
	private readonly warden: WardenArt
	private readonly rail: CommandRailArt
	private readonly textures: CombatTextures
	private readonly lowTimeEdge = new Graphics()
	private readonly typoBars = new Graphics()
	private readonly targetImpact = new Graphics()
	private readonly attackSmear = new Graphics()
	private readonly overdriveColumn = new Graphics()
	private readonly aegisShield = new Graphics()
	private readonly rescueCallout = new Text({
		text: "",
		style: {
			fill: V.cyan,
			fontFamily: "JetBrains Mono",
			fontSize: 24,
			fontWeight: "700",
		},
	})
	private target: TargetArt
	private state: SceneState
	private bolts: Bolt[] = []
	private fragments: Fragment[] = []
	private popups: Popup[] = []
	private pendingResolution: PendingResolution | null = null
	private width = 0
	private height = 0
	private elapsedMs = 0
	private wordAgeMs = 0
	private eventIndex = 0
	private wordShakeMs = 0
	private typoBarsMs = 0
	private targetHitMs = 0
	private attackMs = 0
	private attackFromX = 0
	private attackToX = 0
	private attackIndex = 0
	private wardenLaneX = 0
	private hurtMs = 0
	private overdriveMs = 0
	private enemyAttackMs = 0
	private aegisRescueMs = 0
	private pressureBeat = 0
	private targetTransitionMs = 0
	private targetTransitionClean = true
	private targetTransitionReset = false
	private initialEntryMs: number = MOTION.entryMs
	private equationMs = 0
	private stageShakeMs = 0
	private hitstopMs = 0
	private wardenBaseScale = 1
	private targetBaseScale = 1
	private lastCaretIndex = -1
	private lastDirty = false
	private lastOverdriveCharge = -1
	private lastUpcoming: string[] | null = null

	constructor(
		app: Application,
		initial: SceneState,
		textures: CombatTextures,
	) {
		this.app = app
		this.state = initial
		this.textures = textures
		this.background = createBackground(textures.arena)
		this.warden = createWarden(textures.warden)
		this.target = createTarget(initial.stage, textures)
		this.rail = createCommandRail()
		this.stage.addChild(
			this.background.root,
			this.world,
			this.effects,
			this.overlay,
		)
		this.world.addChild(this.signalNodes, this.warden.root, this.target.root)
		this.effects.addChild(
			this.attackSmear,
			this.targetImpact,
			this.overdriveColumn,
			this.aegisShield,
		)
		this.rescueCallout.anchor.set(0.5)
		this.overlay.addChild(
			this.rail.root,
			this.lowTimeEdge,
			this.typoBars,
			this.rescueCallout,
		)
		this.app.stage.addChild(this.stage)
		this.resize()
		this.sync(initial)
		this.app.ticker.add(this.tick)
	}

	resize = () => {
		const width = this.app.screen.width
		const height = this.app.screen.height
		if (width === this.width && height === this.height) return
		this.width = width
		this.height = height
		const compact = width < SCENE.compactWidth
		const wardenAnchor = compact
			? SCENE.wardenAnchor.compact
			: SCENE.wardenAnchor.desktop
		const targetAnchor = compact
			? SCENE.targetAnchor.compact
			: SCENE.targetAnchor.desktop
		const wardenHeight = compact
			? SCENE.wardenHeight.compact
			: SCENE.wardenHeight.desktop
		const targetHeight = compact
			? SCENE.targetHeight.compact
			: SCENE.targetHeight.desktop

		this.background.redraw(width, height, this.state.stage)
		this.warden.root.position.set(
			width * wardenAnchor.x,
			height * wardenAnchor.y,
		)
		this.target.root.position.set(
			width * targetAnchor.x,
			height * targetAnchor.y,
		)
		this.rail.root.position.set(
			width * SCENE.wordAnchor.x,
			height * SCENE.wordAnchor.y,
		)
		this.rescueCallout.position.set(width / 2, height * SCENE.rescueCalloutY)

		const wardenPixels = Math.min(
			height * wardenHeight.ratio,
			wardenHeight.max,
		)
		const targetPixels = Math.min(
			height * targetHeight.ratio,
			targetHeight.max,
		)
		this.wardenBaseScale = wardenPixels / this.warden.sprite.texture.height
		this.targetBaseScale = targetPixels / this.target.sprite.texture.height
		this.warden.body.scale.set(this.wardenBaseScale)
		this.target.body.scale.set(this.targetBaseScale)
		this.positionCharacterLabels(wardenPixels, targetPixels)
		this.redrawRail()
		this.redrawSignalNodes()
		this.drawBlackout()
	}

	sync = (next: SceneState) => {
		const wordChanged = next.currentWord !== this.state.currentWord
		const stageChanged = next.stage !== this.state.stage
		const focusPausedChanged = next.focusPaused !== this.state.focusPaused
		this.state = next

		if (stageChanged) {
			this.pressureBeat = 0
			this.replaceTarget(next.stage)
		}
		if (focusPausedChanged && next.focusPaused) {
			this.enemyAttackMs = 0
			this.setWardenPose("ready-high")
			this.setTargetPose("idle-a")
		}
		if (
			wordChanged
			|| stageChanged
			|| next.caretIndex !== this.lastCaretIndex
			|| next.wordDirty !== this.lastDirty
			|| next.upcomingWords !== this.lastUpcoming
			|| next.overdriveCharge !== this.lastOverdriveCharge
		) {
			this.redrawRail()
			this.redrawSignalNodes()
			drawTargetIntegrity(
				this.target,
				next.currentWord.length,
				next.caretIndex,
				next.wordDirty,
			)
			if (wordChanged) {
				this.wordAgeMs = 0
				this.wardenLaneX = 0
			}
			this.lastCaretIndex = next.caretIndex
			this.lastDirty = next.wordDirty
			this.lastOverdriveCharge = next.overdriveCharge
			this.lastUpcoming = next.upcomingWords
		}

		const integrity = Math.max(0, Math.min(1, next.accuracy / 100))
		const integrityColor = integrity >= 0.97
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
			.fill({ color: integrityColor })
		this.drawBlackout()
	}

	handle(event: OverdrivePresentationEvent) {
		if (event.type === "accepted-character") {
			this.fire(false, event.combo, event.index)
			return
		}
		if (event.type === "rejected-character") {
			this.reject()
			return
		}
		if (event.type === "word-completed") {
			this.completeWord(event)
			return
		}
		if (event.type === "mult-increased") {
			sfx.mult(event.mult)
			return
		}
		if (event.type === "stage-entered") {
			if (event.stage !== this.state.stage) this.replaceTarget(event.stage)
			if (event.stage === "glitch") sfx.boss()
			return
		}
		if (event.type === "overdrive-ready") {
			this.setWardenPose("ready-high")
			this.warden.core.scale.set(1.35)
			return
		}
		if (event.type === "aegis-rescue") {
			this.aegisRescueMs = MOTION.aegisRescueMs
			this.enemyAttackMs = 0
			this.rescueCallout.text = `AEGIS DEFLECT · +${Math.round(event.timeAddedMs / 1_000)}S`
			this.rescueCallout.alpha = 1
			this.setWardenPose("block")
			this.setTargetPose("special")
			return
		}
		if (event.type === "stage-cleared") {
			sfx.stageClear()
			this.hitstopMs = this.state.reducedMotion ? 0 : MOTION.hitstopMs
			this.stageShakeMs = this.state.reducedMotion || !this.state.screenShake
				? 0
				: MOTION.stageShakeMs
			return
		}
		if (event.type === "run-over") sfx.runOver()
	}

	destroy = () => {
		this.app.ticker.remove(this.tick)
		if (this.stage.parent) this.stage.parent.removeChild(this.stage)
		if (!this.stage.destroyed) this.stage.destroy({ children: true })
	}

	private positionCharacterLabels(wardenHeight: number, targetHeight: number) {
		this.warden.label.position.set(0, -wardenHeight / 2 - 24)
		this.warden.integrity.position.set(0, -wardenHeight / 2)
		this.target.label.position.set(0, -targetHeight / 2 - 24)
		this.target.integrity.position.set(0, -targetHeight / 2)
	}

	private setWardenPose(pose: WardenPose) {
		if (this.warden.pose === pose) return
		this.warden.pose = pose
		this.warden.sprite.texture = this.warden.poses[pose]
	}

	private setTargetPose(pose: EnemyPose) {
		if (this.target.pose === pose) return
		this.target.pose = pose
		this.target.sprite.texture = this.target.poses[pose]
	}

	private signalNodePosition(index: number) {
		const compact = this.width < SCENE.compactWidth
		const path = compact ? SCENE.attackPath.compact : SCENE.attackPath.desktop
		const count = Math.max(1, this.state.currentWord.length)
		const ratio = count === 1 ? 1 : index / (count - 1)
		return {
			x: this.width * (path.startX + (path.endX - path.startX) * ratio),
			y: this.height * path.y + (index % 2 === 0 ? -SCENE.signalNode.minGap : SCENE.signalNode.minGap),
		}
	}

	private redrawSignalNodes() {
		for (const child of this.signalNodes.removeChildren()) child.destroy({ children: true })
		const compact = this.width < SCENE.compactWidth
		const radius = compact
			? SCENE.signalNode.compactRadius
			: SCENE.signalNode.desktopRadius
		for (const [index, character] of [...this.state.currentWord].entries()) {
			const entered = index < this.state.caretIndex
			const position = this.signalNodePosition(index)
			const node = new Container()
			const frame = new Graphics()
				.moveTo(0, -radius)
				.lineTo(radius, 0)
				.lineTo(0, radius)
				.lineTo(-radius, 0)
				.closePath()
				.fill({
					color: entered ? V.panel2 : this.state.wordDirty ? V.red : V.cyan,
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
			node.position.set(position.x, position.y)
			node.addChild(frame, glyph)
			this.signalNodes.addChild(node)
		}
	}

	private redrawRail() {
		const inputPrompt = this.state.zone === 1
			? this.state.stage === "warmup"
				? "FIND 1 KEY · AUTO-FIRES"
				: this.state.stage === "rush"
					? "TYPE 2 KEYS · AUTO-FIRES"
					: "TYPE 3 LETTERS · AUTO-FIRES"
			: this.state.zone === 2
				? "TYPE THE WORD · SPACE EXECUTES"
				: "TYPE THE SIGNAL"
		drawCommandRail(
			this.rail,
			this.state.currentWord,
			this.state.caretIndex,
			this.state.wordDirty,
			this.state.upcomingWords,
			this.state.overdriveCharge,
			this.state.aegisActive && this.state.zone === 2,
			inputPrompt,
			this.width,
			this.width < SCENE.compactWidth,
		)
	}

	private replaceTarget(stage: StageType) {
		this.world.removeChild(this.target.root)
		this.target.root.destroy({ children: true })
		this.target = createTarget(stage, this.textures)
		this.world.addChild(this.target.root)
		this.state = { ...this.state, stage }
		this.targetTransitionMs = 0
		this.initialEntryMs = MOTION.entryMs
		this.lastCaretIndex = -1
		this.lastDirty = !this.state.wordDirty
		this.lastUpcoming = null
		this.width = 0
		this.resize()
		drawTargetIntegrity(
			this.target,
			this.state.currentWord.length,
			this.state.caretIndex,
			this.state.wordDirty,
		)
	}

	private fire(finisher: boolean, combo: number, index = this.state.caretIndex) {
		sfx.shot(combo)
		this.attackMs = MOTION.attackMs
		this.attackIndex = index
		this.attackFromX = this.warden.body.x
		const pathProgress = Math.min(
			1,
			(index + 1) / Math.max(1, this.state.currentWord.length),
		)
		this.attackToX = finisher
			? this.wardenLaneX
			: (this.target.root.x - this.warden.root.x) * MOTION.attackPathRatio * pathProgress
		if (!finisher) this.wardenLaneX = this.attackToX
		this.setWardenPose("anticipation")
		this.warden.muzzle
			.clear()
			.circle(0, 0, finisher ? 26 : 18)
			.fill({
				color: finisher ? V.green : V.cyan,
				alpha: finisher ? 0.42 : 0.32,
			})
			.circle(0, 0, finisher ? 10 : 6)
			.fill({ color: V.text })

		const start = this.warden.muzzle.getGlobalPosition()
		const nodeTarget = finisher
			? { x: this.target.root.x, y: this.target.root.y }
			: this.signalNodePosition(index)
		const targetX = nodeTarget.x
		const targetY = nodeTarget.y
		this.attackSmear
			.clear()
			.moveTo(start.x, start.y - SCENE.signalNode.minGap)
			.lineTo(targetX, targetY)
			.lineTo(start.x, start.y + SCENE.signalNode.minGap)
			.closePath()
			.fill({
				color: finisher ? V.green : V.cyan,
				alpha: finisher ? 0.16 : 0.08,
			})
		const node = new Graphics()
			.rect(finisher ? -48 : -28, finisher ? -3 : -1, finisher ? 48 : 28, finisher ? 6 : 2)
			.fill({
				color: finisher ? V.green : V.cyan,
				alpha: finisher ? 0.72 : 0.4,
			})
			.moveTo(0, finisher ? -9 : -5)
			.lineTo(finisher ? 18 : 10, 0)
			.lineTo(0, finisher ? 9 : 5)
			.closePath()
			.fill({ color: V.text })
		node.position.copyFrom(start)
		this.effects.addChild(node)
		this.bolts.push({
			node,
			startX: start.x,
			startY: start.y,
			targetX,
			targetY,
			life: PROJECTILE_MS,
			maxLife: PROJECTILE_MS,
			finisher,
		})
	}

	private reject() {
		sfx.typo()
		this.wordShakeMs = this.state.reducedMotion ? 0 : MOTION.typoMs
		this.hurtMs = this.state.reducedMotion ? 0 : MOTION.typoMs
		this.typoBarsMs = MOTION.typoMs
		this.typoBars.clear()
		for (let index = 0; index < 5; index += 1) {
			const x = ((this.eventIndex * 83 + index * 137) % Math.max(1, this.width - 96)) + 48
			const y = ((this.eventIndex * 47 + index * 79) % Math.max(1, this.height - 192)) + 96
			const barWidth = 32 + ((index * 29 + this.eventIndex * 11) % 96)
			this.typoBars
				.rect(x, y, barWidth, 2)
				.fill({ color: V.red, alpha: 0.35 })
		}
		this.eventIndex += 1
	}

	private completeWord(
		event: Extract<OverdrivePresentationEvent, { type: "word-completed" }>,
	) {
		sfx.word(event.combo)
		this.pendingResolution = {
			scoreGain: event.scoreGain,
			clean: event.scoreGain > 0,
			resolveOnAnyImpact: event.autoExecuted,
		}
		if (!event.autoExecuted) {
			this.fire(true, event.combo, Math.max(0, event.word.length - 1))
		}
		this.wardenLaneX = 0
		if (event.overdriveReleased) {
			this.overdriveMs = MOTION.overdriveMs
			this.stageShakeMs = this.state.reducedMotion || !this.state.screenShake
				? 0
				: MOTION.overdriveShakeMs
			this.setWardenPose("overdrive")
		} else if (!event.autoExecuted) {
			this.setWardenPose("recover")
		}
		this.rail.equation.text = event.aegisRecovery
			? `AEGIS RECOVERY · ${this.formatMetric(event.effectiveBase)} BASE = +${this.formatMetric(event.scoreGain)}`
			: event.scoreGain > 0
				? `${this.formatMetric(event.effectiveBase)} BASE × ${this.formatMetric(event.effectiveMult)} MULT${event.finalMultiplier !== 1 ? ` × ${this.formatMetric(event.finalMultiplier)} FINAL` : ""} = +${this.formatMetric(event.scoreGain)}`
				: "CORRUPTED × 0 = +0"
		this.rail.equation.style.fill = event.aegisRecovery
			? V.cyan
			: event.scoreGain > 0 ? V.yellow : V.red
		this.rail.equation.position.set(0, -SCENE.rail.height / 2 - 16)
		this.equationMs = MOTION.equationMs
		this.wordAgeMs = 0
	}

	private resolveTarget(resolution: PendingResolution) {
		const x = this.target.root.x
		const y = this.target.root.y
		this.burst(
			x,
			y,
			resolution.clean ? stageAccent(this.state.stage) : V.red,
			this.state.reducedMotion ? 0 : resolution.clean ? 18 : 8,
		)
		const popup = new Text({
			text: resolution.clean ? `+${this.formatMetric(resolution.scoreGain)}` : "0",
			style: {
				fill: resolution.clean ? V.violet : V.red,
				fontFamily: "JetBrains Mono",
				fontSize: 20,
				fontWeight: "700",
			},
		})
		popup.anchor.set(0.5)
		popup.position.set(x, y - 40)
		this.effects.addChild(popup)
		this.popups.push({ node: popup, life: POPUP_MS, maxLife: POPUP_MS })
		this.setTargetPose("defeat")
		this.targetTransitionMs = MOTION.defeatMs
		this.targetTransitionClean = resolution.clean
		this.targetTransitionReset = false
	}

	private burst(x: number, y: number, color: number, count: number) {
		for (let index = 0; index < count; index += 1) {
			if (this.fragments.length >= 200) {
				const oldest = this.fragments.shift()
				oldest?.node.destroy()
			}
			const node = new Graphics()
				.moveTo(-4, -2)
				.lineTo(5, 0)
				.lineTo(-4, 2)
				.closePath()
				.fill({ color: index % 5 === 0 ? V.text : color })
			node.position.set(x, y)
			this.effects.addChild(node)
			const angle = (index * 2.399963 + this.eventIndex * 0.41) % (Math.PI * 2)
			const speed = 140 + ((index * 47 + this.eventIndex * 31) % 220)
			const life = POPUP_MS
			this.fragments.push({
				node,
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed,
				spin: index % 2 === 0 ? 5 : -5,
				life,
				maxLife: life,
			})
		}
		this.eventIndex += 1
	}

	private drawBlackout() {
		const blackout = this.background.blackout
		blackout.clear()
		if (this.state.activeGlitch !== "blackout") return
		const compact = this.width < SCENE.compactWidth
		const railWidth = compact
			? Math.max(0, this.width - SCENE.rail.compactGutter)
			: Math.min(
				SCENE.rail.desktopMaxWidth,
				Math.max(0, this.width - SCENE.rail.desktopGutter),
			)
		blackout
			.rect(0, 0, this.width, this.height)
			.fill({ color: V.bg, alpha: 0.94 })
			.roundRect(
				this.rail.root.x - railWidth / 2 - 16,
				this.rail.root.y - SCENE.rail.height / 2 - 16,
				railWidth + 32,
				SCENE.rail.height + 32,
				SCENE.rail.radius,
			)
			.cut()
	}

	private tick = (ticker: Ticker) => {
		const delta = Math.min(ticker.deltaMS, 50)
		this.resize()
		this.elapsedMs += delta
		this.wordAgeMs += delta
		this.background.tick(this.elapsedMs, this.state.reducedMotion)
		this.maybeStartPressureAttack()

		if (this.hitstopMs > 0) {
			this.hitstopMs = Math.max(0, this.hitstopMs - delta)
			return
		}

		this.updateAmbientCharacterMotion()
		this.updateRailMotion(delta)
		this.updateCombatMotion(delta)
		this.updateProjectiles(delta)
		this.updateFragments(delta)
		this.updatePopups(delta)
		this.updateStageFeedback(delta)
	}

	private updateAmbientCharacterMotion() {
		const reduced = this.state.reducedMotion
		const wardenFrame = Math.floor(this.elapsedMs / MOTION.wardenLoopMs) % 2
		const targetFrame = Math.floor(this.elapsedMs / MOTION.targetLoopMs) % 2
		const wardenShift = reduced ? 0 : wardenFrame * MOTION.wardenBobPx
		const targetShift = reduced
			? 0
			: targetFrame * (
				this.state.stage === "glitch" ? MOTION.bossBobPx : MOTION.targetBobPx
			)

		if (
			this.attackMs <= 0
			&& this.hurtMs <= 0
			&& this.overdriveMs <= 0
			&& this.enemyAttackMs <= 0
			&& this.aegisRescueMs <= 0
		) {
			this.setWardenPose(
				this.state.focusPaused
				|| this.state.overdriveCharge >= 100
				|| wardenFrame === 1
					? "ready-high"
					: "ready-low",
			)
			this.warden.body.x = this.wardenLaneX
			this.warden.body.y = -wardenShift
			this.warden.body.rotation = 0
		}
		if (
			this.targetHitMs <= 0
			&& this.targetTransitionMs <= 0
			&& this.initialEntryMs <= 0
			&& this.enemyAttackMs <= 0
			&& this.aegisRescueMs <= 0
		) {
			this.setTargetPose(targetFrame === 0 ? "idle-a" : "idle-b")
			this.target.body.x = 0
			this.target.body.y = -targetShift
			this.target.body.rotation = 0
		}
		this.warden.core.alpha = reduced ? 0.84 : wardenFrame === 0 ? 0.72 : 1
		this.warden.core.scale.set(this.state.overdriveCharge >= 100 ? 1.25 : 1)
	}

	private maybeStartPressureAttack() {
		if (
			this.state.stageDurationMs <= 0
			|| this.state.focusPaused
			|| this.aegisRescueMs > 0
			|| this.targetTransitionMs > 0
		) return
		const elapsed = Math.max(
			0,
			this.state.stageDurationMs - Math.min(
				this.state.stageDurationMs,
				this.state.timeLeftMs,
			),
		)
		const beat = Math.floor(elapsed / MOTION.pressureIntervalMs[this.state.stage])
		if (beat <= this.pressureBeat) return
		this.pressureBeat = beat
		if (beat === 0) return
		this.enemyAttackMs = MOTION.enemyAttackMs
		this.setTargetPose("anticipation")
	}

	private updateRailMotion(delta: number) {
		if (
			this.state.activeGlitch === "invisible_ink"
			&& this.wordAgeMs > 1_000
		) {
			const fade = Math.max(0.08, 1 - (this.wordAgeMs - 1_000) / POPUP_MS)
			for (const child of this.rail.wordLayer.children) {
				child.alpha = child === this.rail.caret ? 1 : fade
			}
		} else {
			for (const child of this.rail.wordLayer.children) child.alpha = 1
		}

		if (this.wordShakeMs > 0) {
			this.wordShakeMs = Math.max(0, this.wordShakeMs - delta)
			const direction = Math.floor(this.wordShakeMs / 20) % 2 === 0 ? 1 : -1
			this.rail.wordLayer.x = direction * 4
		} else {
			this.rail.wordLayer.x = 0
		}

		if (this.equationMs > 0) {
			this.equationMs = Math.max(0, this.equationMs - delta)
			this.rail.equation.alpha = Math.min(1, this.equationMs / 150)
		} else {
			this.rail.equation.text = ""
		}
	}

	private updateCombatMotion(delta: number) {
		if (this.overdriveMs > 0) {
			this.overdriveMs = Math.max(0, this.overdriveMs - delta)
			this.attackMs = 0
			const progress = 1 - this.overdriveMs / MOTION.overdriveMs
			const gap = this.target.root.x - this.warden.root.x
			const contactX = gap * MOTION.overdriveContactRatio
			const returnRatio = 1 - MOTION.overdriveOutwardRatio
			const outward = progress < MOTION.overdriveOutwardRatio
				? progress / MOTION.overdriveOutwardRatio
				: 1 - (progress - MOTION.overdriveOutwardRatio) / returnRatio
			const eased = 1 - (1 - Math.max(0, outward)) ** 3
			this.setWardenPose("overdrive")
			this.warden.body.x = contactX * eased
			this.warden.body.y = -Math.sin(progress * Math.PI)
				* this.height
				* MOTION.attackArcRatio
			this.overdriveColumn
				.clear()
				.rect(
					this.target.root.x - SCENE.signalNode.minGap,
					this.height * SCENE.overdriveColumn.y,
					SCENE.signalNode.minGap * 2,
					this.height * SCENE.overdriveColumn.height,
				)
				.fill({
					color: V.green,
					alpha: progress > MOTION.overdriveColumnStartRatio
						&& progress < MOTION.overdriveColumnEndRatio
						? Math.sin(
							(progress - MOTION.overdriveColumnStartRatio)
							/ (MOTION.overdriveColumnEndRatio - MOTION.overdriveColumnStartRatio)
							* Math.PI,
						) * MOTION.overdriveColumnMaxAlpha
						: 0,
				})
			if (this.overdriveMs === 0) {
				this.wardenLaneX = 0
				this.warden.body.position.set(0, 0)
				this.overdriveColumn.clear()
				this.warden.muzzle.clear()
			}
		} else if (this.aegisRescueMs > 0) {
			this.aegisRescueMs = Math.max(0, this.aegisRescueMs - delta)
			const progress = 1 - this.aegisRescueMs / MOTION.aegisRescueMs
			const impact = Math.sin(
				Math.min(1, progress * MOTION.aegisImpactFrequency) * Math.PI,
			)
			this.setWardenPose("block")
			this.setTargetPose(progress < MOTION.aegisPoseRatio ? "special" : "attack")
			this.warden.body.x = this.wardenLaneX - impact * MOTION.hitRecoilPx
			this.target.body.x = -impact * (
				this.width < SCENE.compactWidth
					? SCENE.targetEntry.compact
					: SCENE.targetEntry.desktop
			)
			const shieldX = this.warden.root.x
				+ this.warden.body.x
				+ this.width * SCENE.aegisShield.anchorX
			this.aegisShield
				.clear()
				.moveTo(shieldX, this.height * SCENE.aegisShield.topY)
				.lineTo(
					shieldX + this.width * SCENE.aegisShield.frontX,
					this.height * SCENE.aegisShield.upperY,
				)
				.lineTo(
					shieldX + this.width * SCENE.aegisShield.frontX,
					this.height * SCENE.aegisShield.lowerY,
				)
				.lineTo(shieldX, this.height * SCENE.aegisShield.bottomY)
				.lineTo(
					shieldX + this.width * SCENE.aegisShield.backX,
					this.height * SCENE.aegisShield.centerY,
				)
				.closePath()
				.fill({
					color: V.cyan,
					alpha: Math.max(
						0,
						MOTION.aegisShieldStartAlpha - progress * MOTION.aegisShieldFadeAlpha,
					),
				})
				.stroke({ color: V.text, width: 2, alpha: 0.72 })
			this.rescueCallout.alpha = Math.min(1, this.aegisRescueMs / 150)
			if (this.aegisRescueMs === 0) {
				this.aegisShield.clear()
				this.rescueCallout.text = ""
				this.resetTargetTransform()
			}
		} else if (this.enemyAttackMs > 0) {
			this.enemyAttackMs = Math.max(0, this.enemyAttackMs - delta)
			const progress = 1 - this.enemyAttackMs / MOTION.enemyAttackMs
			const strike = Math.sin(progress * Math.PI)
			this.setTargetPose(progress < MOTION.enemyAttackPoseRatio ? "anticipation" : "attack")
			this.setWardenPose(progress < MOTION.enemyAttackPoseRatio ? "ready-high" : "block")
			this.target.body.x = -strike * (
				this.width < SCENE.compactWidth
					? SCENE.targetEntry.compact
					: SCENE.targetEntry.desktop
			)
			this.warden.body.x = this.wardenLaneX - strike * MOTION.hitRecoilPx
			if (this.enemyAttackMs === 0) {
				this.resetTargetTransform()
				this.warden.body.x = this.wardenLaneX
			}
		} else if (this.attackMs > 0) {
			this.attackMs = Math.max(0, this.attackMs - delta)
			const progress = 1 - this.attackMs / MOTION.attackMs
			const anticipationRatio = MOTION.attackAnticipationMs / MOTION.attackMs
			const travelRatio = (
				MOTION.attackAnticipationMs + MOTION.attackTravelMs
			) / MOTION.attackMs
			if (progress < anticipationRatio) {
				this.setWardenPose("anticipation")
				this.warden.body.x = this.attackFromX
			} else if (progress < travelRatio) {
				const travel = (progress - anticipationRatio) / (travelRatio - anticipationRatio)
				const eased = 1 - (1 - travel) ** 3
				this.setWardenPose(this.attackIndex % 3 === 2 ? "dash" : "strike")
				this.warden.body.x = this.attackFromX
					+ (this.attackToX - this.attackFromX) * eased
				this.warden.body.y = -Math.sin(travel * Math.PI)
					* this.height
					* MOTION.attackArcRatio
			} else {
				this.setWardenPose("recover")
				this.warden.body.x = this.attackToX
				this.warden.body.y = 0
			}
			this.warden.body.rotation = 0
			this.warden.muzzle.alpha = Math.max(0, 1 - progress * 2)
			this.attackSmear.alpha = Math.max(0, 1 - progress * 1.8)
			if (this.attackMs === 0) {
				this.warden.body.x = this.wardenLaneX
				this.warden.body.y = 0
				this.warden.muzzle.clear()
				this.attackSmear.clear()
			}
		}

		if (this.hurtMs > 0) {
			this.hurtMs = Math.max(0, this.hurtMs - delta)
			const progress = this.hurtMs / MOTION.typoMs
			this.setWardenPose("block")
			this.warden.body.x = this.wardenLaneX - MOTION.hitRecoilPx * progress
			this.warden.body.rotation = 0
			this.warden.sprite.tint = V.red
		} else {
			this.warden.sprite.tint = 0xffffff
		}
		if (this.targetHitMs > 0) {
			this.targetHitMs = Math.max(0, this.targetHitMs - delta)
			const progress = this.targetHitMs / MOTION.hitMs
			this.setTargetPose("hit")
			this.target.body.x = MOTION.hitRecoilPx * progress
			this.target.body.rotation = 0
			this.target.hitLayer.alpha = progress
		} else {
			this.target.hitLayer.alpha = 0
		}

		if (this.initialEntryMs > 0) {
			this.initialEntryMs = Math.max(0, this.initialEntryMs - delta)
			const progress = 1 - this.initialEntryMs / MOTION.entryMs
			this.setTargetPose("recover")
			this.applyTargetEntry(progress)
		}

		if (this.targetTransitionMs > 0) {
			this.targetTransitionMs = Math.max(0, this.targetTransitionMs - delta)
			const elapsed = MOTION.defeatMs - this.targetTransitionMs
			if (elapsed < DEFEAT_PHASE_MS) {
				const progress = elapsed / DEFEAT_PHASE_MS
				this.setTargetPose("defeat")
				this.target.body.alpha = Math.max(0, 1 - progress)
				const squash = 1 - (1 - MOTION.defeatScale) * progress
				this.target.body.scale.set(
					this.targetBaseScale * squash,
					this.targetBaseScale * (1 + (1 - squash) * 0.5),
				)
				this.target.body.rotation = 0
			} else {
				if (!this.targetTransitionReset) {
					this.targetTransitionReset = true
					this.target.body.rotation = 0
					this.setTargetPose("recover")
				}
				this.applyTargetEntry(
					Math.min(1, (elapsed - DEFEAT_PHASE_MS) / MOTION.entryMs),
				)
			}
			if (this.targetTransitionMs === 0) this.resetTargetTransform()
		}
	}

	private applyTargetEntry(progress: number) {
		const eased = 1 - (1 - progress) ** 3
		const compact = this.width < SCENE.compactWidth
		const distance = compact
			? SCENE.targetEntry.compact
			: SCENE.targetEntry.desktop
		this.target.body.alpha = eased
		this.target.body.x = distance * (1 - eased)
		this.target.body.y = 0
		this.target.body.rotation = (1 - eased) * -MOTION.targetRotation
		const scale = MOTION.entryScale + (1 - MOTION.entryScale) * eased
		this.target.body.scale.set(this.targetBaseScale * scale)
	}

	private resetTargetTransform() {
		this.target.body.alpha = 1
		this.target.body.position.set(0, 0)
		this.target.body.rotation = 0
		this.target.body.scale.set(this.targetBaseScale)
		this.setTargetPose("idle-a")
	}

	private updateProjectiles(delta: number) {
		for (let index = this.bolts.length - 1; index >= 0; index -= 1) {
			const bolt = this.bolts[index]
			bolt.life = Math.max(0, bolt.life - delta)
			const progress = 1 - bolt.life / bolt.maxLife
			const eased = 1 - (1 - progress) ** 3
			bolt.node.position.set(
				bolt.startX + (bolt.targetX - bolt.startX) * eased,
				bolt.startY + (bolt.targetY - bolt.startY) * eased,
			)
			if (bolt.life === 0) {
				sfx.hit()
				this.targetHitMs = MOTION.hitMs
				this.targetImpact
					.clear()
					.circle(bolt.targetX, bolt.targetY, bolt.finisher ? 52 : 28)
					.stroke({
						color: bolt.finisher ? V.green : V.text,
						width: bolt.finisher ? 4 : 2,
						alpha: 0.72,
					})
				if (
					this.pendingResolution
					&& (bolt.finisher || this.pendingResolution.resolveOnAnyImpact)
				) {
					this.resolveTarget(this.pendingResolution)
					this.pendingResolution = null
				} else if (!this.state.reducedMotion) {
					this.burst(
						bolt.targetX,
						bolt.targetY,
						stageAccent(this.state.stage),
						3,
					)
				}
				bolt.node.destroy()
				this.bolts.splice(index, 1)
			}
		}
		this.targetImpact.alpha = this.targetHitMs / MOTION.hitMs
	}

	private updateFragments(delta: number) {
		for (let index = this.fragments.length - 1; index >= 0; index -= 1) {
			const fragment = this.fragments[index]
			fragment.life -= delta
			fragment.node.x += fragment.vx * delta / 1_000
			fragment.node.y += fragment.vy * delta / 1_000
			fragment.node.rotation += fragment.spin * delta / 1_000
			fragment.node.alpha = Math.max(0, fragment.life / fragment.maxLife)
			if (fragment.life <= 0) {
				fragment.node.destroy()
				this.fragments.splice(index, 1)
			}
		}
	}

	private updatePopups(delta: number) {
		for (let index = this.popups.length - 1; index >= 0; index -= 1) {
			const popup = this.popups[index]
			popup.life -= delta
			const progress = 1 - popup.life / popup.maxLife
			popup.node.x += 24 * delta / popup.maxLife
			popup.node.y -= 24 * delta / popup.maxLife
			popup.node.alpha = Math.max(0, 1 - progress)
			if (popup.life <= 0) {
				popup.node.destroy()
				this.popups.splice(index, 1)
			}
		}
	}

	private updateStageFeedback(delta: number) {
		if (this.typoBarsMs > 0) {
			this.typoBarsMs = Math.max(0, this.typoBarsMs - delta)
			this.typoBars.alpha = this.typoBarsMs / MOTION.typoMs
		} else {
			this.typoBars.clear()
		}

		if (this.stageShakeMs > 0) {
			this.stageShakeMs = Math.max(0, this.stageShakeMs - delta)
			const step = Math.floor(this.stageShakeMs / 20)
			this.stage.position.set(
				step % 2 === 0 ? 6 : -6,
				step % 3 === 0 ? 3 : -3,
			)
		} else {
			this.stage.position.set(0, 0)
		}

		const lowTime = this.state.timeLeftMs <= 10_000
		const lowTimeAlpha = lowTime
			? 0.08 + (10_000 - this.state.timeLeftMs) / 10_000 * 0.16
			: 0
		const quotaRatio = this.state.quota <= 0
			? 0
			: Math.min(1, this.state.score / this.state.quota)
		const overrunAlpha = quotaRatio >= 0.75
			? (quotaRatio - 0.75) / 0.25 * 0.08
			: 0
		this.lowTimeEdge
			.clear()
			.rect(0, 0, this.width, this.height)
			.stroke({
				color: lowTime ? V.red : V.green,
				width: 8,
				alpha: Math.max(lowTimeAlpha, overrunAlpha),
			})
	}

	private formatMetric(value: number) {
		return Number.isInteger(value)
			? value.toLocaleString("en-US")
			: value.toLocaleString("en-US", { maximumFractionDigits: 1 })
	}
}
