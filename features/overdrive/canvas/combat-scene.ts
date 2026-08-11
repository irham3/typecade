import {
	Application,
	Container,
	Ticker,
	type Texture,
} from "pixi.js"
import type { StageType, ThreatBand } from "@/lib/engine/overdrive"
import { sfx } from "@/features/overdrive/fx/sfx"
import type { OverdrivePresentationEvent } from "../presentation/events"
import { presentationHealth } from "../presentation/telemetry"
import type { PresentationEventEnvelope } from "../presentation/scheduler-types"
import type { LoadedRigAssets } from "./assets/combat-assets"
import { CombatDirector } from "./choreography/combat-director"
import {
	createBackground,
	SCENE,
	V,
	type BackgroundArt,
} from "./visual-assets"
import { CommandRail } from "./command-rail"
import { SceneFeedback } from "./scene-feedback"

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
	armedItemIds: string[]
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
	private readonly rail: CommandRail
	private readonly feedback: SceneFeedback
	private state: SceneState
	private width = 0
	private height = 0
	private elapsedMs = 0
	private wordAgeMs = 0
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
		this.rail = new CommandRail()
		this.stage.addChild(
			this.background.root,
			this.director.root,
			this.overlay,
		)
		this.overlay.addChild(this.rail.root)
		this.feedback = new SceneFeedback(this.stage, this.overlay)
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
		this.rail.resize(width, height)
		this.feedback.resize(width, height)
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

	handle(envelope: PresentationEventEnvelope<OverdrivePresentationEvent>) {
		const event = envelope.event
		this.director.handle(envelope)
		if (event.type === "accepted-character") {
			sfx.shot(event.combo)
			for (const action of event.actions ?? []) {
				if (action.kind !== "slash") sfx.action(action.kind, action.overdrive)
			}
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
		if (event.type === "run-over") sfx.runOver()
		
		this.feedback.handle(envelope, this.state.reducedMotion, this.state.screenShake)
	}

	destroy = () => {
		this.app.ticker.remove(this.tick)
		this.director.destroy()
		this.rail.destroy()
		this.feedback.destroy()
		if (this.stage.parent) this.stage.parent.removeChild(this.stage)
		if (!this.stage.destroyed) this.stage.destroy({ children: true })
	}

	private redrawRail() {
		this.rail.render({
			word: this.state.currentWord,
			upcomingWords: this.state.upcomingWords,
			caretIndex: this.state.caretIndex,
			dirty: this.state.wordDirty,
			overdriveCharge: this.state.overdriveCharge,
			armedItemIds: this.state.armedItemIds,
			reducedMotion: this.state.reducedMotion,
		})
	}

	private completeWord(
		event: Extract<OverdrivePresentationEvent, { type: "word-completed" }>,
	) {
		sfx.word(event.combo)
		for (const action of event.combatActions ?? []) {
			sfx.action(action.kind, action.overdrive)
		}
		this.wordAgeMs = 0
		this.rail.render({
			word: this.state.currentWord,
			upcomingWords: this.state.upcomingWords,
			caretIndex: this.state.caretIndex,
			dirty: this.state.wordDirty,
			overdriveCharge: this.state.overdriveCharge,
			armedItemIds: this.state.armedItemIds,
			reducedMotion: this.state.reducedMotion,
		})
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
		presentationHealth.recordFrame(ticker.deltaMS)
		this.resize()
		this.elapsedMs += delta
		this.wordAgeMs += delta
		this.background.tick(this.elapsedMs, this.state.reducedMotion)
		
		const { hitstopConsumed } = this.feedback.update(delta, this.state.timeLeftMs, this.state.score, this.state.quota)
		
		if (hitstopConsumed) {
			return
		}
		
		this.director.update(delta)
		this.updateRailMotion(delta)
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
			this.rail.setWordFade(fade, this.state.caretIndex)
		} else {
			this.rail.setWordFade(1, -1)
		}
		
		const wordShakeConsumed = this.feedback.consumeWordShake(delta)
		if (wordShakeConsumed > 0) {
			const direction = Math.floor(wordShakeConsumed / 20) % 2 === 0
				? 1
				: -1
			this.rail.setShake(direction * 4)
		} else {
			this.rail.setShake(0)
		}
	}

}
