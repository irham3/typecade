import {
	Container,
	Graphics,
	Sprite,
} from "pixi.js"
import type { StageType } from "@/lib/engine/overdrive"
import type { OverdrivePresentationEvent } from "../../presentation/events"
import type { EncounterBeat } from "../choreography/expedition-selectors"
import { V } from "../visual-assets"
import type { LoadedEnvironmentAssets } from "./environment-assets"
import type {
	EnvironmentLayerRole,
	NormalizedEnvironmentPoint,
} from "./environment-definition"

export type EnvironmentState = {
	stage: StageType
	reducedMotion: boolean
	focusPaused: boolean
	targetOrdinal: number
	overdriveCharge: number
}

// Parallax ratios from design.md. These are presentation ratios, not gameplay.
const PARALLAX: Record<EnvironmentLayerRole, number> = {
	far: 0.12,
	machinery: 0.28,
	midground: 0.48,
	deck: 0.72,
	foreground: 1,
	atmosphere: 0.18,
}

// Maximum cable sway per layer in pixels.
const CABLE_MAX_PX = 3
const CABLE_MAX_COMPACT_PX = 1

// Spark particle constants.
const SPARK_POOL_SIZE = 8
const SPARK_LIFETIME_MIN_MS = 180
const SPARK_LIFETIME_MAX_MS = 320

type SparkParticle = {
	node: Graphics
	lifeMs: number
	totalMs: number
	x: number
	y: number
	active: boolean
}

type GateState = "closed" | "warning" | "opening" | "open" | "closing"

type Gate = {
	node: Graphics
	state: GateState
	elapsedMs: number
	point: NormalizedEnvironmentPoint
}

type CableOverlay = {
	node: Graphics
	point: NormalizedEnvironmentPoint
}

// Derive a stable index into a list without Math.random.
function indexedPoint<T>(
	values: readonly T[],
	index: number,
): T | null {
	if (values.length === 0) return null
	return values[Math.abs(index) % values.length] ?? null
}

function sparkLifetime(eventId: number, slotIndex: number): number {
	const range = SPARK_LIFETIME_MAX_MS - SPARK_LIFETIME_MIN_MS
	return SPARK_LIFETIME_MIN_MS + (Math.abs(eventId * 17 + slotIndex * 31) % range)
}

type EnvironmentLayout = {
	stageTop: number
	horizonY: number
	deckY: number
	foregroundY: number
	scale: number
}

function computeLayout(
	assets: LoadedEnvironmentAssets,
	width: number,
	height: number,
): EnvironmentLayout {
	const m = assets.textures.machinery
	const mg = assets.textures.midground
	const dk = assets.textures.deck
	const fg = assets.textures.foreground

	const structuralWidth = Math.max(
		m?.width ?? 1,
		mg?.width ?? 1,
		dk?.width ?? 1,
		fg?.width ?? 1,
	)
	const scale = Math.max(
		width / structuralWidth,
		height / 768,
	)

	return {
		stageTop: height * 0.04,
		horizonY: height * 0.38,
		deckY: height * 0.55,
		foregroundY: height * 0.7,
		scale,
	}
}

export class EnvironmentDirector {
	readonly worldBack = new Container()
	readonly worldFront = new Container()
	readonly blackout = new Graphics()

	private readonly assets: LoadedEnvironmentAssets
	private readonly layerSprites: Partial<Record<EnvironmentLayerRole, Sprite>> = {}
	private readonly sparks: SparkParticle[] = []
	private readonly sparksLayer = new Container()
	private readonly cablesLayer = new Graphics()
	private readonly gatesLayer = new Container()
	private readonly gates: Gate[] = []
	private readonly cableOverlays: CableOverlay[] = []
	private readonly atmosphereOverlay = new Graphics()

	private state: EnvironmentState
	private width = 0
	private height = 0
	private compact = false
	private elapsedMs = 0
	private sparkCounter = 0
	private cameraX = 0
	private cameraZoom = 1
	private layout: EnvironmentLayout = {
		stageTop: 0,
		horizonY: 0,
		deckY: 0,
		foregroundY: 0,
		scale: 1,
	}
	private beat: EncounterBeat = "ingress"
	public get currentBeat() { return this.beat }

	constructor(
		assets: LoadedEnvironmentAssets,
		initialState: EnvironmentState,
	) {
		this.assets = assets
		this.state = initialState

		this.buildLayers()
		this.buildSparks()
		this.buildCables()
		this.buildGates()
		this.buildAtmosphere()
	}

	private buildLayers() {
		const backRoles: EnvironmentLayerRole[] = [
			"far",
			"machinery",
			"midground",
			"deck",
		]
		const frontRoles: EnvironmentLayerRole[] = ["foreground", "atmosphere"]

		for (const role of backRoles) {
			const texture = this.assets.textures[role]
			if (!texture) continue
			const sprite = new Sprite(texture)
			sprite.anchor.set(0, 1)
			this.layerSprites[role] = sprite
			this.worldBack.addChild(sprite)
		}

		this.worldBack.addChild(this.sparksLayer)
		this.worldBack.addChild(this.cablesLayer)
		this.worldBack.addChild(this.gatesLayer)

		for (const role of frontRoles) {
			const texture = this.assets.textures[role]
			if (!texture) continue
			const sprite = new Sprite(texture)
			sprite.anchor.set(0, 1)
			this.layerSprites[role] = sprite
			this.worldFront.addChild(sprite)
		}

		this.worldFront.addChild(this.atmosphereOverlay)
		this.worldFront.addChild(this.blackout)
	}

	private buildSparks() {
		for (let index = 0; index < SPARK_POOL_SIZE; index++) {
			const node = new Graphics()
			node.visible = false
			this.sparks.push({
				node,
				lifeMs: 0,
				totalMs: 0,
				x: 0,
				y: 0,
				active: false,
			})
			this.sparksLayer.addChild(node)
		}
	}

	private buildCables() {
		for (const point of this.assets.definition.points.cables) {
			this.cableOverlays.push({ node: this.cablesLayer, point })
		}
	}

	private buildGates() {
		for (const point of this.assets.definition.points.gates) {
			const node = new Graphics()
			this.gates.push({
				node,
				state: "closed",
				elapsedMs: 0,
				point,
			})
			this.gatesLayer.addChild(node)
		}
	}

	private buildAtmosphere() {
		// Atmosphere overlay is drawn during resize.
	}

	resize(width: number, height: number) {
		this.width = width
		this.height = height
		this.compact = width < 640
		this.layout = computeLayout(this.assets, width, height)
		this.positionLayers()
		this.redrawAtmosphere()
	}

	private positionLayers() {
		const { layout, width, height } = this

		// Far layer — pinned to top, centered
		const farSprite = this.layerSprites.far
		if (farSprite) {
			farSprite.scale.set(layout.scale)
			farSprite.position.set(0, layout.horizonY)
		}

		// Machinery — above horizon
		const machinerySprite = this.layerSprites.machinery
		if (machinerySprite) {
			machinerySprite.scale.set(layout.scale)
			machinerySprite.position.set(0, layout.horizonY)
		}

		// Midground — around horizon
		const midgroundSprite = this.layerSprites.midground
		if (midgroundSprite) {
			midgroundSprite.scale.set(layout.scale)
			midgroundSprite.position.set(0, layout.horizonY + height * 0.08)
		}

		// Deck — stable combat footing
		const deckSprite = this.layerSprites.deck
		if (deckSprite) {
			deckSprite.scale.set(layout.scale)
			deckSprite.position.set(0, layout.deckY)
		}

		// Foreground — below actor feet but above deck
		const foregroundSprite = this.layerSprites.foreground
		if (foregroundSprite) {
			foregroundSprite.scale.set(layout.scale)
			foregroundSprite.position.set(0, layout.foregroundY + height * 0.12)
			// Reduce alpha on compact if it harms readability
			foregroundSprite.alpha = this.compact ? 0.72 : 1
		}

		// Atmosphere — across visible world
		const atmosphereSprite = this.layerSprites.atmosphere
		if (atmosphereSprite) {
			atmosphereSprite.scale.set(layout.scale * 1.5)
			atmosphereSprite.position.set(0, height * 0.8)
			atmosphereSprite.alpha = 0.42
		}

		// Reposition gates
		for (const gate of this.gates) {
			this.positionGateNode(gate)
		}
	}

	private positionGateNode(gate: Gate) {
		const { width, height } = this
		gate.node.position.set(
			gate.point.x * width,
			gate.point.y * height,
		)
	}

	private redrawAtmosphere() {
		const { width, height } = this
		this.atmosphereOverlay
			.clear()
			.rect(0, 0, width, height)
			.fill({ color: V.bg, alpha: 0.06 })
	}

	sync(state: EnvironmentState) {
		const previousFocus = this.state.focusPaused
		this.state = state
		if (!previousFocus && state.focusPaused) {
			// Freeze environment event bursts on focus pause start.
		}
	}

	setCameraTravel(x: number, zoom: number) {
		this.cameraX = x
		this.cameraZoom = zoom
	}

	handleBeat(beat: EncounterBeat) {
		if (this.beat === beat) return
		this.beat = beat
		if (beat === "relay-breach") {
			this.openGate(0)
		} else if (beat === "extraction") {
			this.openGate(1)
		}
	}

	handle(event: OverdrivePresentationEvent) {
		if (this.state.focusPaused) return
		if (event.type === "word-completed") {
			this.triggerSpark(event.id)
		}
		if (event.type === "accepted-character" && event.combo >= 4) {
			this.triggerSpark(event.id)
		}
	}

	private triggerSpark(eventId: number) {
		const sparkPoints = this.assets.definition.points.sparks
		if (sparkPoints.length === 0) return

		const slot = this.sparks.find((s) => !s.active)
		if (!slot) return

		const point = indexedPoint(sparkPoints, this.sparkCounter)
		if (!point) return
		this.sparkCounter += 1

		const lifeMs = sparkLifetime(eventId, this.sparkCounter)
		slot.x = point.x * this.width
		slot.y = point.y * this.height
		slot.lifeMs = lifeMs
		slot.totalMs = lifeMs
		slot.active = true
		slot.node.visible = true
		this.redrawSpark(slot)
	}

	private redrawSpark(spark: SparkParticle) {
		spark.node
			.clear()
			.circle(0, 0, 2)
			.fill({ color: V.cyan, alpha: 0.9 })
		spark.node.position.set(spark.x, spark.y)
	}

	private openGate(index: number) {
		const gate = this.gates[index]
		if (!gate || gate.state !== "closed") return
		gate.state = "warning"
		gate.elapsedMs = 0
	}

	update(deltaMs: number) {
		if (this.state.focusPaused) return
		const delta = Math.max(0, Math.min(deltaMs, 50))
		this.elapsedMs += delta
		this.updateParallax()
		this.updateSparks(delta)
		this.updateCables()
		this.updateGates(delta)
	}

	private updateParallax() {
		if (this.state.reducedMotion) {
			// No continuous parallax in reduced motion.
			return
		}
		const cx = this.cameraX

		for (const [role, sprite] of Object.entries(this.layerSprites) as [EnvironmentLayerRole, Sprite | undefined][]) {
			if (!sprite) continue
			const ratio = PARALLAX[role] ?? 1
			const baseX = sprite.position.x
			// Apply parallax offset relative to camera travel.
			sprite.position.x = -cx * ratio + (baseX - sprite.position.x + baseX)
		}

		// Slow far-layer drift
		if (this.layerSprites.far && !this.state.reducedMotion) {
			const phase = this.elapsedMs / 12_000
			const drift = Math.sin(phase) * 4
			const driftY = Math.cos(phase * 0.7) * 1.5
			const far = this.layerSprites.far
			const baseX = -(this.cameraX * PARALLAX.far)
			far.position.x = baseX + drift
			far.position.y = this.layout.horizonY + driftY
		}
	}

	private updateSparks(delta: number) {
		if (this.state.reducedMotion) {
			// Static flash only — reduced to a brief alpha flash.
			for (const spark of this.sparks) {
				if (!spark.active) continue
				spark.lifeMs -= delta
				if (spark.lifeMs <= 0) {
					spark.active = false
					spark.node.visible = false
					spark.node.clear()
				} else {
					const progress = spark.lifeMs / spark.totalMs
					spark.node.alpha = progress > 0.8 ? 0.4 : 0
				}
			}
			return
		}

		for (const spark of this.sparks) {
			if (!spark.active) continue
			spark.lifeMs -= delta
			if (spark.lifeMs <= 0) {
				spark.active = false
				spark.node.visible = false
				spark.node.clear()
				continue
			}
			const progress = spark.lifeMs / spark.totalMs
			const alpha = progress < 0.2
				? progress / 0.2
				: progress > 0.7
					? (progress - 0.7) / 0.3
					: 1
			spark.node.alpha = alpha * 0.9
		}
	}

	private updateCables() {
		if (this.state.reducedMotion) {
			this.cablesLayer.clear()
			return
		}

		const maxPx = this.compact ? CABLE_MAX_COMPACT_PX : CABLE_MAX_PX
		const phase = this.elapsedMs / 3_000
		const overdriveAmplitude = this.state.overdriveCharge >= 100 ? 1.5 : 1

		this.cablesLayer.clear()
		const { width, height } = this
		for (const [index, overlay] of this.cableOverlays.entries()) {
			const point = overlay.point
			const ax = point.x * width
			const ay = point.y * height
			const sway = Math.sin(phase + index * 1.3) * maxPx * overdriveAmplitude
			const bx = ax
			const by = ay + 32
			const cx = ax + sway
			const cy = ay + 16

			this.cablesLayer
				.moveTo(ax, ay)
				.quadraticCurveTo(cx, cy, bx, by)
				.stroke({ color: V.mid, width: 1, alpha: 0.22 })
		}
	}

	private updateGates(delta: number) {
		for (const gate of this.gates) {
			if (gate.state === "closed" || gate.state === "open") continue
			gate.elapsedMs += delta
			this.drawGate(gate)

			if (gate.state === "warning" && gate.elapsedMs >= 400) {
				gate.state = "opening"
				gate.elapsedMs = 0
			} else if (gate.state === "opening" && gate.elapsedMs >= 300) {
				gate.state = "open"
				gate.elapsedMs = 0
			} else if (gate.state === "closing" && gate.elapsedMs >= 200) {
				gate.state = "closed"
				gate.node.clear()
				gate.elapsedMs = 0
			}
		}
	}

	private drawGate(gate: Gate) {
		const progress = gate.state === "warning"
			? gate.elapsedMs / 400
			: gate.state === "opening"
				? gate.elapsedMs / 300
				: gate.state === "closing"
					? 1 - gate.elapsedMs / 200
					: 1

		const alpha = gate.state === "warning"
			? Math.sin(progress * Math.PI * 4) * 0.3
			: gate.state === "opening"
				? progress * 0.45
				: 0.45

		gate.node
			.clear()
			.rect(-12, -24, 24, 48)
			.fill({ color: V.cyan, alpha: Math.max(0, alpha) })
	}

	destroy() {
		this.worldBack.destroy({ children: true })
		this.worldFront.destroy({ children: true })
	}
}
