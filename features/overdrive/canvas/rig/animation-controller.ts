import { sampleTrack } from "./interpolate"
import type {
	AnimationClip,
	AnimationClipName,
	AnimationFrameState,
	RigDefinition,
	RigTransform,
} from "./rig-definition"

export type ClipPlayResult =
  | { status: "started"; clip: AnimationClipName }
  | { status: "blended"; clip: AnimationClipName }
  | { status: "blocked"; activeClip: AnimationClipName }
  | { status: "missing"; clip: AnimationClipName }
function isRecovery(clip: AnimationClip, localTimeMs: number) {
	return localTimeMs >= (clip.recoveryStartMs ?? clip.durationMs)
}

export class AnimationController {
	private activeClip: AnimationClip
	private localTimeMs = 0
	private contactEmitted = false
	private blendFrom: Readonly<Record<string, RigTransform>> | null = null
	private blendRemainingMs = 0
	private blendDurationMs = 0
	private readonly baseTransforms: Readonly<Record<string, RigTransform>>

	constructor(private readonly definition: RigDefinition) {
		const defaultClip = definition.clips[definition.defaultClip]
		if (!defaultClip) {
			throw new Error(`Rig ${definition.id} is missing default clip ${definition.defaultClip}`)
		}
		this.activeClip = defaultClip
		this.baseTransforms = Object.fromEntries(
			definition.parts.map((part) => [part.id, { ...part.defaultTransform }]),
		)
	}

	play(
		name: AnimationClipName,
		options: {
			force?: boolean
			blendMs?: number
		} = {},
	): ClipPlayResult {
		const requested = this.definition.clips[name]
		if (!requested) return { status: "missing", clip: name }

		const accepts = options.force
			|| this.activeClip.loop
			|| requested.priority > this.activeClip.priority
			|| isRecovery(this.activeClip, this.localTimeMs)

		if (!accepts) {
			return { status: "blocked", activeClip: this.activeClip.name }
		}

		const blendMs = Math.max(0, options.blendMs ?? 0)
		if (blendMs > 0) {
			this.blendFrom = this.sampleFrame(this.activeClip, this.localTimeMs, false, false).transforms
			this.blendRemainingMs = blendMs
			this.blendDurationMs = blendMs
		} else {
			this.blendFrom = null
			this.blendRemainingMs = 0
			this.blendDurationMs = 0
		}
		this.activeClip = requested
		this.localTimeMs = 0
		this.contactEmitted = false
		return { status: "started", clip: requested.name }
	}

	update(deltaMs: number): AnimationFrameState {
		const elapsed = Math.max(0, deltaMs)
		const clip = this.activeClip
		const previousTime = this.localTimeMs
		const rawTime = previousTime + elapsed
		let contactEdge = false
		let completed = false

		if (clip.loop) {
			const duration = Math.max(1, clip.durationMs)
			if (clip.contactMs !== undefined && elapsed > 0) {
				const nextContact = clip.contactMs > previousTime
					? clip.contactMs
					: clip.contactMs + duration
				contactEdge = rawTime >= nextContact
			}
			this.localTimeMs = rawTime % duration
		} else {
			this.localTimeMs = Math.min(rawTime, clip.durationMs)
			if (
				clip.contactMs !== undefined
				&& !this.contactEmitted
				&& previousTime < clip.contactMs
				&& this.localTimeMs >= clip.contactMs
			) {
				contactEdge = true
				this.contactEmitted = true
			}
			completed = rawTime >= clip.durationMs
		}



		let frame = this.sampleFrame(clip, this.localTimeMs, contactEdge, completed)
		if (this.blendFrom && this.blendRemainingMs > 0) {
			const progress = Math.min(1, 1 - this.blendRemainingMs / this.blendDurationMs)
			const transforms: Record<string, RigTransform> = {}
			for (const [partId, target] of Object.entries(frame.transforms)) {
				const source = this.blendFrom[partId] ?? target
				transforms[partId] = {
					x: source.x + (target.x - source.x) * progress,
					y: source.y + (target.y - source.y) * progress,
					rotation: source.rotation + (target.rotation - source.rotation) * progress,
					scaleX: source.scaleX + (target.scaleX - source.scaleX) * progress,
					scaleY: source.scaleY + (target.scaleY - source.scaleY) * progress,
					alpha: source.alpha + (target.alpha - source.alpha) * progress,
				}
			}
			frame = { ...frame, transforms }
			this.blendRemainingMs = Math.max(0, this.blendRemainingMs - elapsed)
			if (this.blendRemainingMs === 0) {
				this.blendFrom = null
				this.blendDurationMs = 0
			}
		}
		if (completed) this.resetToDefault()
		return frame
	}

	clear() {
		this.resetToDefault()
	}

	private sampleFrame(
		clip: AnimationClip,
		localTimeMs: number,
		contactEdge: boolean,
		completed: boolean,
	): AnimationFrameState {
		const transforms: Record<string, RigTransform> = {}
		for (const [partId, base] of Object.entries(this.baseTransforms)) {
			transforms[partId] = { ...base }
		}
		for (const track of clip.tracks) {
			const base = this.baseTransforms[track.partId]
			if (!base) continue
			transforms[track.partId] = sampleTrack(track.keyframes, localTimeMs, base)
		}
		return {
			clip: clip.name,
			localTimeMs,
			transforms,
			contactEdge,
			completed,
		}
	}

	private resetToDefault() {
		const defaultClip = this.definition.clips[this.definition.defaultClip]
		if (!defaultClip) return
		this.activeClip = defaultClip
		this.localTimeMs = 0
		this.contactEmitted = false
		this.blendFrom = null
		this.blendRemainingMs = 0
		this.blendDurationMs = 0
	}
}
