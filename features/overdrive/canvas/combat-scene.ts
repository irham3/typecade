import { Application, Container, Graphics, Text, Ticker } from "pixi.js"
import type { StageType } from "@/lib/engine/overdrive"
import { sfx } from "@/features/overdrive/fx/sfx"
import type { OverdrivePresentationEvent } from "../presentation/events"
import {
	createBackground,
	createKeystone,
	createTarget,
	drawActiveWord,
	stageAccent,
	V,
	type TargetArt,
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
	zone: number
	stage: StageType
	activeGlitch: string | null
	reducedMotion: boolean
	screenShake: boolean
}

type Bolt = {
	node: Graphics
	targetX: number
	velocity: number
	life: number
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

export class CombatScene {
	readonly app: Application
	readonly stage = new Container()
	private readonly world = new Container()
	private readonly effects = new Container()
	private readonly overlay = new Container()
	private readonly background = createBackground()
	private readonly keystone = createKeystone()
	private readonly previewLayer = new Container()
	private readonly lowTimeEdge = new Graphics()
	private readonly typoBars = new Graphics()
	private target: TargetArt
	private state: SceneState
	private bolts: Bolt[] = []
	private fragments: Fragment[] = []
	private popups: Popup[] = []
	private width = 0
	private height = 0
	private wordAgeMs = 0
	private eventIndex = 0
	private wordShakeMs = 0
	private typoBarsMs = 0
	private hitFlashMs = 0

	constructor(app: Application, initial: SceneState) {
		this.app = app
		this.state = initial
		this.target = createTarget(initial.stage)
		this.stage.addChild(this.background.root, this.world, this.effects, this.overlay)
		this.world.addChild(this.keystone.root, this.target.root, this.previewLayer)
		this.overlay.addChild(this.lowTimeEdge, this.typoBars)
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
		this.background.redraw(width, height, this.state.stage === "glitch")

		const compact = width < 640
		this.keystone.root.scale.set(compact ? 0.55 : 1)
		this.keystone.root.position.set(compact ? 88 : width * 0.14, height * 0.5)
		this.target.root.scale.set(compact ? 0.72 : 1)
		this.target.root.position.set(compact ? width * 0.61 : width * 0.58, height * 0.47)
		this.positionPreviews()
		this.drawBlackout()
	}

	sync = (next: SceneState) => {
		const wordChanged = next.currentWord !== this.state.currentWord
		const stageChanged = next.stage !== this.state.stage
		this.state = next

		if (stageChanged) this.replaceTarget(next.stage)
		if (
			wordChanged
			|| stageChanged
			|| next.caretIndex !== this.lastCaretIndex
			|| next.wordDirty !== this.lastDirty
		) {
			drawActiveWord(this.target, next.currentWord, next.caretIndex, next.wordDirty)
			if (wordChanged) this.wordAgeMs = 0
			this.lastCaretIndex = next.caretIndex
			this.lastDirty = next.wordDirty
		}

		const remaining = Math.max(0, next.currentWord.length - next.caretIndex)
		const ratio = next.currentWord.length === 0 ? 0 : remaining / next.currentWord.length
		this.target.progress
			.clear()
			.roundRect(-64, 0, 128, 8, 4)
			.fill({ color: V.panel2 })
			.roundRect(-64, 0, 128 * ratio, 8, 4)
			.fill({ color: next.wordDirty ? V.red : V.green })

		const integrity = Math.max(0, Math.min(1, next.accuracy / 100))
		const integrityColor = integrity >= 0.97 ? V.green : integrity >= 0.9 ? V.yellow : V.red
		this.keystone.integrity
			.clear()
			.roundRect(-48, 0, 96, 8, 4)
			.fill({ color: V.panel2 })
			.roundRect(-48, 0, 96 * integrity, 8, 4)
			.fill({ color: integrityColor })

		if (wordChanged || stageChanged || next.upcomingWords !== this.lastUpcoming) {
			this.drawPreviews()
			this.lastUpcoming = next.upcomingWords
		}
		this.drawBlackout()
	}

	private lastCaretIndex = -1
	private lastDirty = false
	private lastUpcoming: string[] | null = null

	handle(event: OverdrivePresentationEvent) {
		if (event.type === "accepted-character") {
			this.fire(event.combo)
			return
		}
		if (event.type === "rejected-character") {
			this.reject()
			return
		}
		if (event.type === "word-completed") {
			this.completeWord(event.scoreGain, event.combo)
			return
		}
		if (event.type === "mult-increased") {
			sfx.mult(event.mult)
			return
		}
		if (event.type === "stage-entered") {
			this.replaceTarget(event.stage)
			if (event.stage === "glitch") sfx.boss()
			return
		}
		if (event.type === "stage-cleared") {
			sfx.stageClear()
			return
		}
		if (event.type === "run-over") sfx.runOver()
	}

	destroy = () => {
		this.app.ticker.remove(this.tick)
		if (this.stage.parent) this.stage.parent.removeChild(this.stage)
		if (!this.stage.destroyed) this.stage.destroy({ children: true })
	}

	private replaceTarget(stage: StageType) {
		this.world.removeChild(this.target.root)
		this.target.root.destroy({ children: true })
		this.target = createTarget(stage)
		this.world.addChildAt(this.target.root, 1)
		this.lastCaretIndex = -1
		this.lastDirty = !this.state.wordDirty
		this.background.redraw(this.width, this.height, stage === "glitch")
		this.width = 0
		this.resize()
		drawActiveWord(this.target, this.state.currentWord, this.state.caretIndex, this.state.wordDirty)
	}

	private positionPreviews() {
		this.previewLayer.position.set(
			this.width < 640 ? this.width * 0.61 : this.width * 0.58,
			this.height * 0.47 + (this.width < 640 ? 56 : 72),
		)
	}

	private drawPreviews() {
		for (const child of this.previewLayer.removeChildren()) child.destroy()
		this.state.upcomingWords.slice(0, 4).forEach((word, index) => {
			const row = new Container()
			const marker = new Graphics()
				.moveTo(-12, 6)
				.lineTo(-4, 10)
				.lineTo(-12, 14)
				.closePath()
				.fill({ color: stageAccent(this.state.stage), alpha: 0.45 })
			const label = new Text({
				text: word,
				style: {
					fill: V.dim,
					fontFamily: "JetBrains Mono",
					fontSize: this.width < 640 ? 18 : 28,
				},
			})
			label.anchor.set(0.5, 0)
			row.y = index * (this.width < 640 ? 28 : 36)
			row.addChild(marker, label)
			this.previewLayer.addChild(row)
		})
		this.positionPreviews()
	}

	private fire(combo: number) {
		sfx.shot(combo)
		const node = new Graphics()
			.rect(-28, -1, 28, 2)
			.fill({ color: V.cyan, alpha: 0.3 })
			.moveTo(0, -4)
			.lineTo(9, 0)
			.lineTo(0, 4)
			.closePath()
			.fill({ color: V.text })
		node.position.set(
			this.keystone.root.x + (this.width < 640 ? 44 : 72),
			this.keystone.root.y,
		)
		this.effects.addChild(node)
		this.bolts.push({
			node,
			targetX: this.target.root.x - 48,
			velocity: 1_400,
			life: 500,
		})
	}

	private reject() {
		sfx.typo()
		this.wordShakeMs = this.state.reducedMotion ? 0 : 120
		this.typoBarsMs = 120
		this.typoBars.clear()
		for (let index = 0; index < 5; index += 1) {
			const x = ((this.eventIndex * 83 + index * 137) % Math.max(1, this.width - 96)) + 48
			const y = ((this.eventIndex * 47 + index * 79) % Math.max(1, this.height - 192)) + 96
			const barWidth = 32 + ((index * 29 + this.eventIndex * 11) % 96)
			this.typoBars.rect(x, y, barWidth, 2).fill({ color: V.red, alpha: 0.35 })
		}
		this.eventIndex += 1
	}

	private completeWord(scoreGain: number, combo: number) {
		sfx.word(combo)
		const x = this.target.root.x
		const y = this.target.root.y - 88
		this.burst(x, y, stageAccent(this.state.stage), this.state.reducedMotion ? 0 : 10)

		const popup = new Text({
			text: `+${scoreGain}`,
			style: {
				fill: V.violet,
				fontFamily: "JetBrains Mono",
				fontSize: 20,
				fontWeight: "700",
			},
		})
		popup.anchor.set(0.5)
		popup.position.set(this.target.root.x, this.target.root.y - 40)
		this.effects.addChild(popup)
		this.popups.push({ node: popup, life: 300, maxLife: 300 })
		this.wordAgeMs = 0
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
			const angle = ((index * 2.399963 + this.eventIndex * 0.41) % (Math.PI * 2))
			const speed = 140 + ((index * 47 + this.eventIndex * 31) % 220)
			const life = 300
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
		const compact = this.width < 640
		const caretX = this.target.root.x
			+ this.target.wordLayer.x
			+ this.target.caret.x
			+ (compact ? 0 : 0)
		const caretY = this.target.root.y
		blackout
			.rect(0, 0, this.width, this.height)
			.fill({ color: V.bg, alpha: 0.94 })
			.circle(caretX, caretY, compact ? 96 : 144)
			.cut()
	}

	private tick = (ticker: Ticker) => {
		const delta = Math.min(ticker.deltaMS, 50)
		this.resize()
		this.wordAgeMs += delta

		if (this.state.activeGlitch === "invisible_ink" && this.wordAgeMs > 1_000) {
			const fade = Math.max(0.08, 1 - (this.wordAgeMs - 1_000) / 300)
			for (const child of this.target.wordLayer.children) {
				child.alpha = child === this.target.caret ? 1 : fade
			}
		} else {
			for (const child of this.target.wordLayer.children) child.alpha = 1
		}

		if (this.wordShakeMs > 0) {
			this.wordShakeMs -= delta
			const direction = Math.floor(this.wordShakeMs / 20) % 2 === 0 ? 1 : -1
			this.target.wordLayer.x = direction * 4
		} else {
			this.target.wordLayer.x = 0
		}

		if (this.typoBarsMs > 0) {
			this.typoBarsMs -= delta
			this.typoBars.alpha = Math.max(0, this.typoBarsMs / 120)
		} else {
			this.typoBars.clear()
		}

		this.hitFlashMs = Math.max(0, this.hitFlashMs - delta)
		this.target.hitLayer.alpha = this.hitFlashMs / 80

		for (let index = this.bolts.length - 1; index >= 0; index -= 1) {
			const bolt = this.bolts[index]
			bolt.life -= delta
			bolt.node.x += bolt.velocity * delta / 1_000
			if (bolt.node.x >= bolt.targetX || bolt.life <= 0) {
				sfx.hit()
				this.hitFlashMs = 80
				bolt.node.destroy()
				this.bolts.splice(index, 1)
			}
		}

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

		const lowTime = this.state.timeLeftMs <= 10_000
		const lowTimeAlpha = lowTime
			? 0.08 + (10_000 - this.state.timeLeftMs) / 10_000 * 0.16
			: 0
		this.lowTimeEdge
			.clear()
			.rect(0, 0, this.width, this.height)
			.stroke({ color: V.red, width: 8, alpha: lowTimeAlpha })
	}
}
