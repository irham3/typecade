import { sampleTrack } from "./interpolate"
import type {
	AnimationClip,
	AnimationClipName,
	AnimationFrameState,
	RigDefinition,
	RigTransform,
} from "./rig-definition"

const MAX_PENDING_CONTACTS = 2

function isRecovery(clip: AnimationClip, localTimeMs: number) {
	return localTimeMs >= (clip.recoveryStartMs ?? clip.durationMs)
}

export class AnimationController {
	private activeClip: AnimationClip
	private localTimeMs = 0
	private contactEmitted = false
	private pendingContacts = 0
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

	get pendingContactCount() {
		return this.pendingContacts
	}

	play(
		name: AnimationClipName,
		options: {
			force?: boolean
			queueContact?: boolean
		} = {},
	) {
		const requested = this.definition.clips[name]
		if (!requested) return false

		const accepts = options.force
			|| this.activeClip.loop
			|| requested.priority > this.activeClip.priority
			|| isRecovery(this.activeClip, this.localTimeMs)

		if (!accepts) {
			if (options.queueContact) {
				this.pendingContacts = Math.min(
					MAX_PENDING_CONTACTS,
					this.pendingContacts + 1,
				)
			}
			return false
		}

		if (options.force) this.pendingContacts = 0
		this.activeClip = requested
		this.localTimeMs = 0
		this.contactEmitted = false
		return true
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

		if (!contactEdge && elapsed > 0 && this.pendingContacts > 0) {
			contactEdge = true
			this.pendingContacts -= 1
		}

		const frame = this.sampleFrame(clip, this.localTimeMs, contactEdge, completed)
		if (completed) this.resetToDefault()
		return frame
	}

	clear() {
		this.pendingContacts = 0
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
	}
}
