import {
	Container,
	Graphics,
	Text,
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
	compactWidth: 720,

	wardenAnchor: {
		desktop: { x: 0.235, y: 0.62 },
		compact: { x: 0.25, y: 0.59 },
	},

	targetAnchor: {
		desktop: { x: 0.705, y: 0.60 },
		compact: { x: 0.69, y: 0.575 },
	},

	targetLanes: {
		desktop: {
			high: 0.565,
			mid: 0.60,
			low: 0.635,
		},
		compact: {
			high: 0.545,
			mid: 0.575,
			low: 0.605,
		},
	},

	targetStaging: {
		desktop: {
			upcomingOffsetX: 0.135,
			distantOffsetX: 0.235,
			upcomingScale: 0.55,
			distantScale: 0.34,
			upcomingAlpha: 0.34,
			distantAlpha: 0.16,
		},
		compact: {
			upcomingOffsetX: 0.16,
			distantOffsetX: 0.27,
			upcomingScale: 0.46,
			distantScale: 0.28,
			upcomingAlpha: 0.25,
			distantAlpha: 0.10,
		},
	},

	wordAnchor: {
		x: 0.5,
		y: 0.765,
	},

	wardenHeight: {
		desktop: {
			ratio: 0.295,
			max: 276,
		},
		compact: {
			ratio: 0.205,
			max: 160,
		},
	},

	targetHeight: {
		desktop: {
			ratio: 0.255,
			max: 238,
		},
		compact: {
			ratio: 0.175,
			max: 140,
		},
	},

	targetEntry: {
		desktop: 72,
		compact: 44,
	},

	foregroundHeight: {
		desktop: 0.115,
		compact: 0.09,
	},

	attackPath: {
		desktop: {
			startX: 0.32,
			endX: 0.655,
			y: 0.525,
		},
		compact: {
			startX: 0.30,
			endX: 0.635,
			y: 0.515,
		},
	},

	wardenTravel: {
		midField: 0.05,
		contact: 0.14,
	},

	signalNode: {
		desktopRadius: 7,
		compactRadius: 5,
		fontSize: 11,
		minGap: 7,
	},

	rescueCalloutY: 0.35,

	overdriveColumn: {
		y: 0.14,
		height: 0.68,
	},

	aegisShield: {
		anchorX: 0.08,
		frontX: 0.05,
		backX: -0.02,
		topY: 0.30,
		upperY: 0.40,
		centerY: 0.50,
		lowerY: 0.66,
		bottomY: 0.72,
	},

	rail: {
		desktopMaxWidth: 620,
		desktopGutter: 96,
		compactGutter: 24,
		height: 108,
		radius: 8,
		activeFont: {
			desktop: 42,
			compact: 30,
		},
		caretWidth: 3,
		previewFont: 14,
	},

	integrityWidth: 112,
	integrityHeight: 7,
	integrityRadius: 3.5,
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
	attackAdvancePx: 4,
	attackRotation: 0,
	attackPathRatio: 0.32,
	attackArcRatio: 0.025,
	hitMs: 90,
	hitRecoilPx: 8,
	hitRotation: 0,
	defeatMs: 300,
	defeatScale: 0.82,
	entryMs: 180,
	entryScale: 0.92,
	equationMs: 700,
	typoMs: 120,
	stageShakeMs: 100,
	hitstopMs: 50,
	overdriveMs: 320,
	overdriveShakeMs: 120,
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

export type CommandRailArt = {
	root: Container
	panel: Graphics
	wordLayer: Container
	caret: Graphics
	status: Text
	previews: Text
	equation: Text
	charge: Graphics
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



export function createCommandRail(): CommandRailArt {
	const root = new Container()
	const panel = new Graphics()
	const wordLayer = new Container()
	const caret = new Graphics()
	const status = new Text({
		text: "",
		style: {
			fill: V.mid,
			fontFamily: "JetBrains Mono",
			fontSize: 14,
			fontWeight: "700",
			letterSpacing: 1,
		},
	})
	const previews = new Text({
		text: "",
		style: {
			fill: V.dim,
			fontFamily: "JetBrains Mono",
			fontSize: SCENE.rail.previewFont,
		},
	})
	const equation = new Text({
		text: "",
		style: {
			fill: V.yellow,
			fontFamily: "JetBrains Mono",
			fontSize: 14,
			fontWeight: "700",
		},
	})
	const charge = new Graphics()

	status.anchor.set(0.5)
	previews.anchor.set(0.5)
	equation.anchor.set(0.5)
	root.addChild(panel, charge, wordLayer, status, previews, equation)
	return { root, panel, wordLayer, caret, status, previews, equation, charge }
}

export function drawCommandRail(
	rail: CommandRailArt,
	word: string,
	caretIndex: number,
	dirty: boolean,
	upcomingWords: readonly string[],
	overdriveCharge: number,
	aegisRecoveryAvailable: boolean,
	inputPrompt: string,
	width: number,
	compact: boolean,
	zone: number,
) {
	const railWidth = compact
		? Math.max(0, width - SCENE.rail.compactGutter)
		: Math.min(
			SCENE.rail.desktopMaxWidth,
			Math.max(0, width - SCENE.rail.desktopGutter),
		)
	rail.panel
		.clear()
		.roundRect(
			-railWidth / 2,
			-SCENE.rail.height / 2,
			railWidth,
			SCENE.rail.height,
			SCENE.rail.radius,
		)
		.fill({ color: V.bg, alpha: 0.88 })
		.stroke({
			color: dirty ? V.red : V.line,
			width: 1,
			alpha: dirty ? 0.72 : 0.92,
		})
	const chargeRatio = Math.max(0, Math.min(1, overdriveCharge / 100))
	rail.charge
		.clear()
		.roundRect(
			-railWidth / 2 + 8,
			SCENE.rail.height / 2 - 7,
			Math.max(0, railWidth - 16),
			3,
			1.5,
		)
		.fill({ color: V.panel2 })
		.roundRect(
			-railWidth / 2 + 8,
			SCENE.rail.height / 2 - 7,
			Math.max(0, railWidth - 16) * chargeRatio,
			3,
			1.5,
		)
		.fill({ color: chargeRatio >= 1 ? V.yellow : V.cyan })

	for (const child of rail.wordLayer.removeChildren()) child.destroy()
	const fontSize = compact
		? SCENE.rail.activeFont.compact
		: SCENE.rail.activeFont.desktop
	const characters: Text[] = []
	let totalWidth = 0
	for (const character of word) {
		const text = new Text({
			text: character,
			style: {
				fill: V.green,
				fontFamily: "JetBrains Mono",
				fontSize,
				fontWeight: "700",
			},
		})
		characters.push(text)
		totalWidth += text.width
	}

	let cursor = -totalWidth / 2
	let caretX = cursor
	for (const [index, text] of characters.entries()) {
		text.x = cursor
		text.y = -fontSize / 2 - 20
		text.style.fill = dirty
			? V.red
			: index < caretIndex
				? V.text
				: V.green
		rail.wordLayer.addChild(text)
		if (index === caretIndex) caretX = cursor
		cursor += text.width
	}
	if (caretIndex >= characters.length) caretX = cursor

	rail.caret = new Graphics()
		.rect(
			caretX,
			-fontSize / 2 - 18,
			SCENE.rail.caretWidth,
			fontSize,
		)
		.fill({ color: dirty ? V.red : V.green })
	rail.wordLayer.addChild(rail.caret)
	if (dirty) {
		rail.wordLayer.addChild(
			new Graphics()
				.rect(-totalWidth / 2, fontSize / 2 - 14, totalWidth, 2)
				.fill({ color: V.red }),
		)
	}

	rail.status.text = dirty
		? aegisRecoveryAvailable
			? "AEGIS RECOVERY — BASE ONLY"
			: "CORRUPTED — 0 SCORE"
		: caretIndex >= word.length
			? overdriveCharge >= 100
				? zone <= 2
					? "SPACE — OVERDRIVE"
					: "SPACE: EXECUTE · ENTER: OVERDRIVE"
				: "SPACE — EXECUTE"
			: inputPrompt
	rail.status.style.fill = dirty
		? aegisRecoveryAvailable ? V.cyan : V.red
		: overdriveCharge >= 100
			? V.yellow
			: caretIndex >= word.length
				? V.green
				: V.mid
	rail.status.position.set(0, 16)
	rail.previews.text = upcomingWords.slice(0, 2).join("   /   ")
	rail.previews.position.set(0, 44)
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
