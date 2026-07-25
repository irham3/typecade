import { Container, Graphics, Text } from "pixi.js"
import type { StageType } from "@/lib/engine/overdrive"

export const V = {
	bg: 0x0a0e14,
	panel: 0x111623,
	panel2: 0x1a2030,
	line: 0x232b3d,
	text: 0xe8ecf4,
	mid: 0x9aa3b5,
	dim: 0x788296,
	green: 0x3bf562,
	pink: 0xff4d9d,
	violet: 0x9d6bff,
	yellow: 0xffc93b,
	red: 0xff3b3b,
	cyan: 0x35d6e8,
} as const

export type KeystoneArt = {
	root: Container
	emitter: Graphics
	core: Graphics
	integrity: Graphics
}

export type TargetArt = {
	root: Container
	body: Container
	hitLayer: Graphics
	wordLayer: Container
	caret: Graphics
	progress: Graphics
	accent: number
}

export function stageAccent(stage: StageType) {
	if (stage === "rush") return V.pink
	if (stage === "glitch") return V.red
	return V.green
}

export function createKeystone(): KeystoneArt {
	const root = new Container()
	const bracket = new Graphics()
		.moveTo(-54, -54)
		.lineTo(-20, -54)
		.lineTo(-20, -42)
		.lineTo(-40, -42)
		.lineTo(-40, 42)
		.lineTo(-20, 42)
		.lineTo(-20, 54)
		.lineTo(-54, 54)
		.closePath()
		.fill({ color: V.panel2 })
		.stroke({ color: V.cyan, width: 2 })
		.moveTo(54, -54)
		.lineTo(20, -54)
		.lineTo(20, -42)
		.lineTo(40, -42)
		.lineTo(40, 42)
		.lineTo(20, 42)
		.lineTo(20, 54)
		.lineTo(54, 54)
		.closePath()
		.fill({ color: V.panel2 })
		.stroke({ color: V.cyan, width: 2 })

	const matrix = new Graphics()
	for (let row = 0; row < 4; row += 1) {
		for (let column = 0; column < 3; column += 1) {
			const active = row === 1 && column === 1
			matrix
				.roundRect(-15 + column * 11, -21 + row * 11, 8, 8, 1)
				.fill({ color: active ? V.cyan : V.line })
		}
	}

	const core = new Graphics()
		.moveTo(0, -18)
		.lineTo(16, 0)
		.lineTo(0, 18)
		.lineTo(-16, 0)
		.closePath()
		.fill({ color: V.cyan, alpha: 0.14 })
		.stroke({ color: V.cyan, width: 2 })
		.rect(-3, -3, 6, 6)
		.fill({ color: V.text })

	const emitter = new Graphics()
		.moveTo(48, -8)
		.lineTo(72, 0)
		.lineTo(48, 8)
		.closePath()
		.fill({ color: V.cyan })

	const integrity = new Graphics()
	integrity.y = 72
	root.addChild(bracket, matrix, core, emitter, integrity)
	return { root, emitter, core, integrity }
}

function packetShard(accent: number) {
	return new Graphics()
		.moveTo(0, -42)
		.lineTo(34, -10)
		.lineTo(16, 0)
		.lineTo(34, 12)
		.lineTo(0, 42)
		.lineTo(-12, 16)
		.lineTo(-34, 8)
		.lineTo(-16, -2)
		.lineTo(-34, -14)
		.closePath()
		.fill({ color: V.panel2 })
		.stroke({ color: accent, width: 2 })
		.moveTo(0, -30)
		.lineTo(0, 30)
		.moveTo(-20, -10)
		.lineTo(18, 12)
		.stroke({ color: accent, width: 2, alpha: 0.45 })
}

function needleSignal(accent: number) {
	return new Graphics()
		.moveTo(-58, -9)
		.lineTo(20, -9)
		.lineTo(52, 0)
		.lineTo(20, 9)
		.lineTo(-58, 9)
		.lineTo(-38, 0)
		.closePath()
		.fill({ color: V.panel2 })
		.stroke({ color: accent, width: 2 })
		.moveTo(-30, -24)
		.lineTo(4, -24)
		.lineTo(18, -13)
		.moveTo(-30, 24)
		.lineTo(4, 24)
		.lineTo(18, 13)
		.stroke({ color: accent, width: 2, alpha: 0.5 })
		.rect(-48, -3, 48, 6)
		.fill({ color: accent, alpha: 0.3 })
}

function nullCrown(accent: number) {
	return new Graphics()
		.moveTo(-52, 28)
		.lineTo(-44, -24)
		.lineTo(-20, -8)
		.lineTo(0, -46)
		.lineTo(20, -8)
		.lineTo(44, -24)
		.lineTo(52, 28)
		.lineTo(22, 40)
		.lineTo(-22, 40)
		.closePath()
		.fill({ color: V.panel2 })
		.stroke({ color: accent, width: 3 })
		.moveTo(-30, 20)
		.lineTo(-10, 8)
		.lineTo(0, 24)
		.lineTo(12, 8)
		.lineTo(32, 20)
		.stroke({ color: V.violet, width: 2 })
		.rect(-8, 25, 16, 6)
		.fill({ color: accent })
}

export function createTarget(stage: StageType): TargetArt {
	const root = new Container()
	const body = new Container()
	const accent = stageAccent(stage)
	const silhouette = stage === "warmup"
		? packetShard(accent)
		: stage === "rush"
			? needleSignal(accent)
			: nullCrown(accent)
	const hitLayer = new Graphics().circle(0, 0, 60).fill({ color: V.text })
	hitLayer.alpha = 0
	body.y = -88
	body.addChild(silhouette, hitLayer)

	const wordLayer = new Container()
	const caret = new Graphics()
	const progress = new Graphics()
	progress.y = -36
	wordLayer.addChild(caret)
	root.addChild(body, progress, wordLayer)
	return { root, body, hitLayer, wordLayer, caret, progress, accent }
}

export function drawActiveWord(
	target: TargetArt,
	word: string,
	caretIndex: number,
	dirty: boolean,
) {
	for (const child of target.wordLayer.removeChildren()) child.destroy()
	target.caret = new Graphics()

	const characters: Text[] = []
	let totalWidth = 0
	for (const character of word) {
		const text = new Text({
			text: character,
			style: {
				fill: V.green,
				fontFamily: "JetBrains Mono",
				fontSize: 48,
				fontWeight: "700",
			},
		})
		characters.push(text)
		totalWidth += text.width
	}

	let cursor = -totalWidth / 2
	let caretX = cursor
	characters.forEach((text, index) => {
		text.x = cursor
		text.y = -24
		text.style.fill = dirty
			? V.red
			: index < caretIndex
				? V.text
				: V.green
		target.wordLayer.addChild(text)
		if (index === caretIndex) caretX = cursor
		cursor += text.width
	})
	if (caretIndex >= characters.length) caretX = cursor

	target.caret
		.rect(caretX, -22, 3, 48)
		.fill({ color: dirty ? V.red : V.green })
	target.wordLayer.addChild(target.caret)

	if (dirty) {
		target.wordLayer
			.addChild(
				new Graphics()
					.rect(-totalWidth / 2, 30, totalWidth, 2)
					.fill({ color: V.red }),
			)
	}
}

export function createBackground() {
	const root = new Container()
	const guides = new Graphics()
	const glitchScan = new Graphics()
	const blackout = new Graphics()
	root.addChild(guides, glitchScan, blackout)

	return {
		root,
		guides,
		glitchScan,
		blackout,
		redraw(width: number, height: number, glitch: boolean) {
			guides
				.clear()
				.moveTo(24, height / 2)
				.lineTo(width - 24, height / 2)
				.stroke({ color: V.line, width: 1, alpha: 0.75 })
				.moveTo(width / 2, 96)
				.lineTo(width / 2, height - 96)
				.stroke({ color: V.line, width: 1, alpha: 0.35 })
				.rect(24, 96, Math.max(0, width - 48), Math.max(0, height - 192))
				.stroke({ color: V.line, width: 1, alpha: 0.45 })

			glitchScan.clear()
			if (glitch) {
				for (let y = 100; y < height - 96; y += 12) {
					glitchScan.rect(24, y, Math.max(0, width - 48), 1).fill({
						color: V.red,
						alpha: 0.035,
					})
				}
			}
		},
	}
}
