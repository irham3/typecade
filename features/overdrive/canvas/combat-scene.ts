import {
	Application,
	Container,
	Graphics,
	Ticker,
	type Texture,
} from "pixi.js"
import type { StageType, ThreatBand } from "@/lib/engine/overdrive"
import { sfx } from "@/features/overdrive/fx/sfx"
import type { OverdrivePresentationEvent } from "../presentation/events"
import type { LoadedRigAssets } from "./assets/combat-assets"
import { CombatDirector } from "./choreography/combat-director"
import {
	createBackground,
	createCommandRail,
	drawCommandRail,
	MOTION,
	SCENE,
	V,
	type BackgroundArt,
	type CommandRailArt,
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
	targetOrdinal: number
	zone: number
	stage: StageType
	activeGlitch: string | null
	reducedMotion: boolean
	screenShake: boolean
}

export type CombatSceneAssets = {
	arena: Texture
	warden: LoadedRigAssets
	enemy: LoadedRigAssets
}

export class CombatScene {
	readonly app: Application
	readonly stage = new Container()
	private readonly overlay = new Container()
	private readonly background: BackgroundArt
	private readonly director: CombatDirector
	private readonly rail: CommandRailArt
	private readonly lowTimeEdge = new Graphics()
	private readonly typoBars = new Graphics()
	private state: SceneState
	private width = 0
	private height = 0
	private elapsedMs = 0
	private wordAgeMs = 0
	private eventIndex = 0
	private wordShakeMs = 0
	private typoBarsMs = 0
	private equationMs = 0
	private stageShakeMs = 0
	private hitstopMs = 0
	private lastCaretIndex = -1
	private lastDirty = false
	private lastOverdriveCharge = -1
	private lastUpcoming: string[] | null = null

	constructor(
		app: Application,
		initial: SceneState,
		assets: CombatSceneAssets,
	) {
		this.app = app
		this.state = initial
		this.background = createBackground(assets.arena)
		this.director = new CombatDirector(initial, assets)
		this.rail = createCommandRail()
		this.stage.addChild(
			this.background.root,
			this.director.root,
			this.overlay,
		)
		this.overlay.addChild(
			this.rail.root,
			this.lowTimeEdge,
			this.typoBars,
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
		this.background.redraw(width, height, this.state.stage)
		this.director.resize(width, height)
		this.rail.root.position.set(
			width * SCENE.wordAnchor.x,
			height * SCENE.wordAnchor.y,
		)
		this.redrawRail()
		this.drawBlackout()
	}

	sync = (next: SceneState) => {
		const wordChanged = next.currentWord !== this.state.currentWord
		this.state = next
		this.director.sync(next)
		if (
			wordChanged
			|| next.caretIndex !== this.lastCaretIndex
			|| next.wordDirty !== this.lastDirty
			|| next.upcomingWords !== this.lastUpcoming
			|| next.overdriveCharge !== this.lastOverdriveCharge
		) {
			this.redrawRail()
			if (wordChanged) this.wordAgeMs = 0
			this.lastCaretIndex = next.caretIndex
			this.lastDirty = next.wordDirty
			this.lastOverdriveCharge = next.overdriveCharge
			this.lastUpcoming = next.upcomingWords
		}
		this.drawBlackout()
	}

	handle(event: OverdrivePresentationEvent) {
		this.director.handle(event)
		if (event.type === "accepted-character") {
			sfx.shot(event.combo)
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
			if (event.stage === "glitch") sfx.boss()
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
		this.director.destroy()
		if (this.stage.parent) this.stage.parent.removeChild(this.stage)
		if (!this.stage.destroyed) this.stage.destroy({ children: true })
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
			this.state.zone,
		)
	}

	private reject() {
		sfx.typo()
		this.wordShakeMs = this.state.reducedMotion ? 0 : MOTION.typoMs
		this.typoBarsMs = MOTION.typoMs
		this.typoBars.clear()
		for (let index = 0; index < 5; index += 1) {
			const x = (
				(
					this.eventIndex * 83
					+ index * 137
				) % Math.max(1, this.width - 96)
			) + 48
			const y = (
				(
					this.eventIndex * 47
					+ index * 79
				) % Math.max(1, this.height - 192)
			) + 96
			const barWidth = 32 + (
				(index * 29 + this.eventIndex * 11) % 96
			)
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
		this.rail.equation.text = event.aegisRecovery
			? `AEGIS RECOVERY · ${this.formatMetric(
				event.effectiveBase,
			)} BASE = +${this.formatMetric(event.scoreGain)}`
			: event.scoreGain > 0
				? `${this.formatMetric(
					event.effectiveBase,
				)} BASE × ${this.formatMetric(
					event.effectiveMult,
				)} MULT${event.finalMultiplier !== 1
					? ` × ${this.formatMetric(event.finalMultiplier)} FINAL`
					: ""
				} = +${this.formatMetric(event.scoreGain)}`
				: "CORRUPTED × 0 = +0"
		this.rail.equation.style.fill = event.aegisRecovery
			? V.cyan
			: event.scoreGain > 0
				? V.yellow
				: V.red
		this.rail.equation.position.set(
			0,
			-SCENE.rail.height / 2 - 16,
		)
		this.equationMs = MOTION.equationMs
		this.wordAgeMs = 0
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
		if (this.hitstopMs > 0) {
			this.hitstopMs = Math.max(0, this.hitstopMs - delta)
			return
		}
		this.director.update(delta)
		this.updateRailMotion(delta)
		this.updateStageFeedback(delta)
	}

	private updateRailMotion(delta: number) {
		if (
			this.state.activeGlitch === "invisible_ink"
			&& this.wordAgeMs > 1_000
		) {
			const fade = Math.max(
				0.08,
				1 - (this.wordAgeMs - 1_000) / 300,
			)
			for (const child of this.rail.wordLayer.children) {
				child.alpha = child === this.rail.caret ? 1 : fade
			}
		} else {
			for (const child of this.rail.wordLayer.children) child.alpha = 1
		}
		if (this.wordShakeMs > 0) {
			this.wordShakeMs = Math.max(0, this.wordShakeMs - delta)
			const direction = Math.floor(this.wordShakeMs / 20) % 2 === 0
				? 1
				: -1
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
			? 0.08 + (
				10_000 - this.state.timeLeftMs
			) / 10_000 * 0.16
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
