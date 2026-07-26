import { Container } from "pixi.js"
import type { OverdrivePresentationEvent } from "../../presentation/events"

export type CameraState = {
	reducedMotion: boolean
	screenShake: boolean
	focusPaused: boolean
	overdriveCharge: number
}

export type CameraImpulse =
	| "character"
	| "execution"
	| "overdrive"
	| "enemy-pressure"
	| "stage-clear"

type CameraPose = {
	x: number
	y: number
	zoom: number
}

type CameraShake = {
	lifeMs: number
	durationMs: number
	amplitudeX: number
	amplitudeY: number
	frequency: number
	seed: number
}

type CameraTransition = {
	fromX: number
	fromY: number
	fromZoom: number
	toX: number
	toY: number
	toZoom: number
	elapsedMs: number
	durationMs: number
}

export type CameraFrame = {
	x: number
	y: number
	zoom: number
	shakeX: number
	shakeY: number
}

// Deterministic shake — no Math.random().
function deterministicShake(
	elapsedMs: number,
	frequency: number,
	seed: number,
): { x: number; y: number } {
	const phase = elapsedMs * 0.001 * frequency
	return {
		x: Math.sin(phase * 13.37 + seed * 0.71),
		y: Math.cos(phase * 17.11 + seed * 1.13),
	}
}

const IMPULSE_SHAKE: Record<CameraImpulse, { amplitudeX: number; amplitudeY: number; durationMs: number; frequency: number }> = {
	"character": { amplitudeX: 1, amplitudeY: 0.5, durationMs: 80, frequency: 12 },
	"execution": { amplitudeX: 2, amplitudeY: 1, durationMs: 150, frequency: 10 },
	"overdrive": { amplitudeX: 3, amplitudeY: 2, durationMs: 280, frequency: 8 },
	"enemy-pressure": { amplitudeX: 1.5, amplitudeY: 1, durationMs: 120, frequency: 11 },
	"stage-clear": { amplitudeX: 0, amplitudeY: 0, durationMs: 0, frequency: 0 },
}

const IMPULSE_ZOOM: Record<CameraImpulse, { deltaZoom: number; holdMs: number; settleMs: number }> = {
	"character": { deltaZoom: 0, holdMs: 0, settleMs: 0 },
	"execution": { deltaZoom: 0.008, holdMs: 50, settleMs: 180 },
	"overdrive": { deltaZoom: 0.03, holdMs: 80, settleMs: 280 },
	"enemy-pressure": { deltaZoom: 0, holdMs: 0, settleMs: 0 },
	"stage-clear": { deltaZoom: -0.005, holdMs: 300, settleMs: 400 },
}

// How strong each impulse must be to override an active shake.
const IMPULSE_PRIORITY: Record<CameraImpulse, number> = {
	"character": 0,
	"enemy-pressure": 1,
	"execution": 2,
	"stage-clear": 2,
	"overdrive": 3,
}

export class CameraDirector {
	private readonly root: Container
	private state: CameraState
	private width = 0
	private height = 0

	// Composed pose channels
	private basePose: CameraPose = { x: 0, y: 0, zoom: 1 }
	private combatPose: CameraPose = { x: 0, y: 0, zoom: 1 }
	private transition: CameraTransition | null = null
	private shake: CameraShake | null = null
	private shakeElapsedMs = 0
	private shakeImportance = -1

	// Zoom hold/settle
	private zoomDelta = 0
	private zoomHoldMs = 0
	private zoomSettleMs = 0
	private zoomSettleDuration = 0

	constructor(root: Container, initial: CameraState) {
		this.root = root
		this.state = initial
	}

	resize(width: number, height: number) {
		this.width = width
		this.height = height
		this.apply()
	}

	sync(state: CameraState) {
		const waspaused = this.state.focusPaused
		this.state = state
		if (!waspaused && state.focusPaused) {
			// Freeze camera travel on Focus Pause start.
			this.shake = null
			this.shakeImportance = -1
		}
	}

	handle(event: OverdrivePresentationEvent) {
		if (this.state.focusPaused) return
		if (event.type === "word-completed" && event.overdriveReleased) {
			this.addImpulse("overdrive")
		} else if (event.type === "word-completed") {
			this.addImpulse("execution")
		} else if (event.type === "accepted-character") {
			this.addImpulse("character")
		} else if (event.type === "stage-cleared") {
			this.addImpulse("stage-clear")
		}
	}

	setFocus(x: number, y: number, zoom = 1) {
		if (this.state.focusPaused) return
		const duration = 600
		this.transition = {
			fromX: this.combatPose.x,
			fromY: this.combatPose.y,
			fromZoom: this.combatPose.zoom,
			toX: x,
			toY: y,
			toZoom: zoom,
			elapsedMs: 0,
			durationMs: duration,
		}
	}

	addImpulse(kind: CameraImpulse) {
		if (this.state.focusPaused) return

		const priority = IMPULSE_PRIORITY[kind]
		const shakeParams = IMPULSE_SHAKE[kind]
		const zoomParams = IMPULSE_ZOOM[kind]

		// Only add shake if screen shake is enabled and reduced motion is off.
		if (
			shakeParams.amplitudeX > 0
			&& !this.state.reducedMotion
			&& this.state.screenShake
			&& priority >= this.shakeImportance
		) {
			this.shake = {
				lifeMs: shakeParams.durationMs,
				durationMs: shakeParams.durationMs,
				amplitudeX: shakeParams.amplitudeX,
				amplitudeY: shakeParams.amplitudeY,
				frequency: shakeParams.frequency,
				seed: priority * 2.718 + kind.length * 0.577,
			}
			this.shakeElapsedMs = 0
			this.shakeImportance = priority

			// Stage-clear cancels any combat shake.
			if (kind === "stage-clear") {
				this.shake = null
				this.shakeImportance = -1
			}
		}

		// Apply zoom delta if applicable.
		if (zoomParams.deltaZoom !== 0 && !this.state.reducedMotion) {
			this.zoomDelta = zoomParams.deltaZoom
			this.zoomHoldMs = zoomParams.holdMs
			this.zoomSettleMs = 0
			this.zoomSettleDuration = zoomParams.settleMs
		}
	}

	update(deltaMs: number) {
		if (this.state.focusPaused) return
		const delta = Math.max(0, Math.min(deltaMs, 50))

		// Update combat transition.
		if (this.transition) {
			this.transition.elapsedMs = Math.min(
				this.transition.durationMs,
				this.transition.elapsedMs + delta,
			)
			const progress = this.transition.elapsedMs / this.transition.durationMs
			const eased = 1 - (1 - progress) ** 3
			this.combatPose = {
				x: this.transition.fromX + (this.transition.toX - this.transition.fromX) * eased,
				y: this.transition.fromY + (this.transition.toY - this.transition.fromY) * eased,
				zoom: this.transition.fromZoom + (this.transition.toZoom - this.transition.fromZoom) * eased,
			}
			if (this.transition.elapsedMs >= this.transition.durationMs) {
				this.transition = null
			}
		}

		// Update shake.
		if (this.shake) {
			this.shakeElapsedMs += delta
			this.shake.lifeMs = Math.max(0, this.shake.lifeMs - delta)
			if (this.shake.lifeMs === 0) {
				this.shake = null
				this.shakeImportance = -1
			}
		}

		// Update zoom hold/settle.
		if (this.zoomDelta !== 0) {
			if (this.zoomHoldMs > 0) {
				this.zoomHoldMs = Math.max(0, this.zoomHoldMs - delta)
			} else if (this.zoomSettleDuration > 0) {
				this.zoomSettleMs = Math.min(
					this.zoomSettleDuration,
					this.zoomSettleMs + delta,
				)
				if (this.zoomSettleMs >= this.zoomSettleDuration) {
					this.zoomDelta = 0
					this.zoomSettleMs = 0
				}
			}
		}

		this.apply()
	}

	private computeFrame(): CameraFrame {
		let zoom = this.basePose.zoom + this.combatPose.zoom - 1

		// Apply zoom delta with settle curve.
		if (this.zoomDelta !== 0 && this.zoomSettleDuration > 0) {
			const settled = this.zoomSettleMs / this.zoomSettleDuration
			zoom += this.zoomDelta * (1 - settled * settled)
		} else if (this.zoomDelta !== 0) {
			zoom += this.zoomDelta
		}

		let shakeX = 0
		let shakeY = 0
		if (this.shake && !this.state.reducedMotion && this.state.screenShake) {
			const remaining = this.shake.lifeMs / this.shake.durationMs
			const envelope = remaining * remaining
			const wave = deterministicShake(this.shakeElapsedMs, this.shake.frequency, this.shake.seed)
			shakeX = wave.x * this.shake.amplitudeX * envelope
			shakeY = wave.y * this.shake.amplitudeY * envelope
		}

		return {
			x: this.basePose.x + this.combatPose.x,
			y: this.basePose.y + this.combatPose.y,
			zoom,
			shakeX,
			shakeY,
		}
	}

	private apply() {
		const frame = this.computeFrame()
		this.root.position.set(
			frame.x + frame.shakeX,
			frame.y + frame.shakeY,
		)
		// Pivot-based zoom anchored at screen center.
		const scale = Math.max(0.5, frame.zoom)
		this.root.scale.set(scale)
		if (scale !== 1 && this.width > 0 && this.height > 0) {
			this.root.position.set(
				this.width * 0.5 * (1 - scale) + frame.x + frame.shakeX,
				this.height * 0.5 * (1 - scale) + frame.y + frame.shakeY,
			)
		}
	}

	destroy() {
		// Nothing to dispose — we don't own the root container.
	}
}
