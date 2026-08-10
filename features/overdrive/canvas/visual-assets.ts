import {
	Container,
	Graphics,
	Sprite,
	Texture,
} from "pixi.js"
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

export const SCENE = {
	compactWidth: 640,
	wardenAnchor: {
		desktop: { x: 0.22, y: 0.52 },
		compact: { x: 0.28, y: 0.55 },
	},
	targetAnchor: {
		desktop: { x: 0.73, y: 0.48 },
		compact: { x: 0.72, y: 0.46 },
	},
	targetLanes: {
		desktop: { high: 0.42, mid: 0.48, low: 0.54 },
		compact: { high: 0.4, mid: 0.46, low: 0.52 },
	},
	targetStaging: {
		desktop: {
			upcomingOffsetX: 0.09,
			distantOffsetX: 0.15,
			upcomingScale: 0.72,
			distantScale: 0.52,
			upcomingAlpha: 0.32,
			distantAlpha: 0.16,
		},
		compact: {
			upcomingOffsetX: 0.08,
			distantOffsetX: 0.14,
			upcomingScale: 0.68,
			distantScale: 0.48,
			upcomingAlpha: 0.28,
			distantAlpha: 0.14,
		},
	},
	wordAnchor: { x: 0.54, y: 0.66 },
	wardenHeight: {
		desktop: { ratio: 0.42, max: 400 },
		compact: { ratio: 0.26, max: 216 },
	},
	targetHeight: {
		desktop: { ratio: 0.38, max: 360 },
		compact: { ratio: 0.25, max: 200 },
	},
	targetEntry: { desktop: 48, compact: 32 },
	foregroundHeight: { desktop: 0.16, compact: 0.14 },
	attackPath: {
		desktop: { startX: 0.28, endX: 0.67, y: 0.45 },
		compact: { startX: 0.22, endX: 0.65, y: 0.46 },
	},
	wardenTravel: {
		midField: 0.32,
		contact: 0.58,
	},
	signalNode: {
		desktopRadius: 8,
		compactRadius: 6,
		fontSize: 12,
		minGap: 8,
	},
	rescueCalloutY: 0.34,
	overdriveColumn: {
		y: 0.14,
		height: 0.68,
	},
	aegisShield: {
		anchorX: 0.08,
		frontX: 0.05,
		backX: -0.02,
		topY: 0.3,
		upperY: 0.4,
		centerY: 0.5,
		lowerY: 0.66,
		bottomY: 0.72,
	},
	rail: {
		desktopMaxWidth: 640,
		desktopGutter: 96,
		compactGutter: 32,
		height: 120,
		radius: 8,
		activeFont: { desktop: 48, compact: 32 },
		caretWidth: 3,
		previewFont: 16,
	},
	integrityWidth: 128,
	integrityHeight: 8,
	integrityRadius: 4,
} as const

export const MOTION = {
	wardenLoopMs: 900,
	wardenBobPx: 2,
	wardenRotation: 0,
	targetLoopMs: 800,
	targetBobPx: 2,
	bossBobPx: 2,
	targetRotation: 0,
	poseCrossfadeMs: 100,
	attackAnticipationMs: 35,
	attackTravelMs: 85,
	attackRecoveryMs: 60,
	attackMs: 180,
	attackAdvancePx: 8,
	attackRotation: 0,
	attackPathRatio: 0.58,
	attackArcRatio: 0.1,
	hitMs: 90,
	hitRecoilPx: 8,
	hitRotation: 0,
	defeatMs: 300,
	defeatScale: 0.82,
	entryMs: 180,
	entryScale: 0.92,
	equationMs: 700,
	typoMs: 120,
	stageShakeMs: 150,
	hitstopMs: 50,
	overdriveMs: 320,
	overdriveShakeMs: 150,
	overdriveContactRatio: 0.78,
	overdriveOutwardRatio: 0.58,
	overdriveColumnStartRatio: 0.28,
	overdriveColumnEndRatio: 0.82,
	overdriveColumnMaxAlpha: 0.32,
	enemyAttackMs: 360,
	enemyAnticipationMs: 240,
	enemyStrikeMs: 120,
	aegisRescueMs: 600,
	aegisPoseRatio: 0.35,
	aegisImpactFrequency: 1.8,
	aegisShieldStartAlpha: 0.18,
	aegisShieldFadeAlpha: 0.12,
	pressureIntervalMs: {
		warmup: 9_000,
		rush: 7_000,
		glitch: 6_000,
	},
	parallaxPx: 8,
	moteCount: 24,
	moteSize: 2,
	moteMaxAlpha: 0.12,
	moteMaxSpeed: 12,
} as const

export const EFFECTS = {
	liveCap: 200,
	letterBoltMs: 110,
	contactRadius: 28,
	contactStroke: 2,
	finisherRadius: 52,
	finisherStroke: 4,
	smearWidth: 8,
	defeatFragments: 18,
	fragmentWidth: 9,
	fragmentHeight: 4,
	scorePopupTravel: 24,
	scorePopupCap: 3,
} as const


type Mote = {
	node: Graphics
	baseX: number
	baseY: number
	speed: number
	phase: number
}

export type BackgroundArt = {
	root: Container
	blackout: Graphics
	redraw: (width: number, height: number, stage: StageType) => void
	tick: (elapsedMs: number, reducedMotion: boolean) => void
}

export function stageAccent(stage: StageType) {
	if (stage === "rush") return V.pink
	if (stage === "glitch") return V.red
	return V.green
}

export function targetClassName(stage: StageType) {
	if (stage === "rush") return "NEEDLE WRAITH"
	if (stage === "glitch") return "NULL CROWN"
	return "PACKET STALKER"
}

export function createBackground(texture: Texture): BackgroundArt {
	const root = new Container()
	const image = new Sprite(texture)
	const darkWash = new Graphics()
	const stageWash = new Graphics()
	const motesLayer = new Container()
	const haze = new Graphics()
	const foreground = new Graphics()
	const glitchScan = new Graphics()
	const blackout = new Graphics()
	const motes: Mote[] = []
	let width = 0
	let height = 0

	image.anchor.set(0.5)
	image.alpha = 0.72
	root.addChild(
		image,
		darkWash,
		stageWash,
		motesLayer,
		haze,
		foreground,
		glitchScan,
		blackout,
	)

	for (let index = 0; index < MOTION.moteCount; index += 1) {
		const node = new Graphics()
			.circle(0, 0, MOTION.moteSize)
			.fill({
				color: index % 5 === 0 ? V.green : V.cyan,
				alpha: MOTION.moteMaxAlpha * (0.35 + (index % 4) * 0.2),
			})
		motesLayer.addChild(node)
		motes.push({
			node,
			baseX: ((index * 47 + 23) % 101) / 100,
			baseY: ((index * 71 + 17) % 97) / 100,
			speed: 4 + (index % 5) * 2,
			phase: index * 0.61,
		})
	}

	return {
		root,
		blackout,
		redraw(nextWidth, nextHeight, stage) {
			width = nextWidth
			height = nextHeight
			const coverScale = Math.max(
				width / texture.width,
				height / texture.height,
			) * 1.04
			image.scale.set(coverScale)
			image.position.set(width / 2, height / 2)

			darkWash
				.clear()
				.rect(0, 0, width, height)
				.fill({ color: V.bg, alpha: 0.3 })

			stageWash
				.clear()
				.rect(0, 0, width, height)
				.fill({
					color: stageAccent(stage),
					alpha: stage === "glitch" ? 0.055 : 0.025,
				})

			const compact = width < SCENE.compactWidth
			const coverHeight = height * (
				compact
					? SCENE.foregroundHeight.compact
					: SCENE.foregroundHeight.desktop
			)
			foreground
				.clear()
				.rect(0, height - coverHeight, width, coverHeight)
				.fill({ color: V.bg, alpha: 0.76 })
				.moveTo(0, height - coverHeight)
				.lineTo(width, height - coverHeight)
				.stroke({ color: V.cyan, width: 1, alpha: 0.18 })

			haze
				.clear()
				.ellipse(width * 0.52, height * 0.48, width * 0.4, height * 0.12)
				.fill({ color: V.cyan, alpha: 0.025 })
				.ellipse(width * 0.42, height * 0.62, width * 0.34, height * 0.08)
				.fill({ color: V.green, alpha: 0.018 })

			glitchScan.clear()
			if (stage === "glitch") {
				for (let y = 96; y < height - 96; y += 12) {
					glitchScan
						.rect(24, y, Math.max(0, width - 48), 1)
						.fill({ color: V.red, alpha: 0.035 })
				}
			}

			for (const mote of motes) {
				mote.node.position.set(mote.baseX * width, mote.baseY * height)
			}
		},
		tick(elapsedMs, reducedMotion) {
			if (reducedMotion) {
				image.position.set(width / 2, height / 2)
				haze.position.set(0, 0)
				return
			}
			const phase = elapsedMs / 8_000
			image.position.set(
				width / 2 + Math.sin(phase) * MOTION.parallaxPx,
				height / 2 + Math.cos(phase * 0.73) * MOTION.parallaxPx * 0.5,
			)
			haze.position.set(
				Math.sin(phase * 1.3) * MOTION.parallaxPx,
				Math.cos(phase) * MOTION.parallaxPx * 0.25,
			)
			for (const mote of motes) {
				const travel = (elapsedMs / 1_000) * Math.min(mote.speed, MOTION.moteMaxSpeed)
				mote.node.y = (mote.baseY * height - travel + height) % Math.max(1, height)
				mote.node.x = mote.baseX * width + Math.sin(phase + mote.phase) * MOTION.parallaxPx
			}
		},
	}
}



export function drawTargetIntegrity(
	target: {
		integrity: Graphics
		accent: number
	},
	wordLength: number,
	caretIndex: number,
	dirty: boolean,
) {
	const count = Math.max(1, wordLength)
	const gap = 2
	const segmentWidth = (SCENE.integrityWidth - gap * (count - 1)) / count
	target.integrity.clear()
	for (let index = 0; index < count; index += 1) {
		target.integrity
			.roundRect(
				-SCENE.integrityWidth / 2 + index * (segmentWidth + gap),
				0,
				segmentWidth,
				SCENE.integrityHeight,
				SCENE.integrityRadius,
			)
			.fill({
				color: index < caretIndex
					? V.line
					: dirty
						? V.red
						: target.accent,
				alpha: index < caretIndex ? 0.45 : 0.9,
			})
	}
}
