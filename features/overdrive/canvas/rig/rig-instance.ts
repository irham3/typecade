import {
	Container,
	Sprite,
	Texture,
} from "pixi.js"
import { AnimationController } from "./animation-controller"
import type {
	AnimationClipName,
	AnimationFrameState,
	RigDefinition,
	RigTransform,
} from "./rig-definition"

type RigPartInstance = {
	container: Container
	sprite: Sprite
}

function applyTransform(container: Container, transform: RigTransform) {
	container.position.set(transform.x, transform.y)
	container.rotation = transform.rotation
	container.scale.set(transform.scaleX, transform.scaleY)
	container.alpha = transform.alpha
}

export class RigInstance {
	readonly root = new Container()
	readonly controller: AnimationController
	private readonly parts = new Map<string, RigPartInstance>()

	constructor(
		readonly definition: RigDefinition,
		textures: Record<string, Texture>,
	) {
		this.controller = new AnimationController(definition)
		this.root.sortableChildren = true

		for (const part of definition.parts) {
			const texture = textures[part.texture]
			if (!texture) {
				throw new Error(`Rig ${definition.id} is missing texture ${part.texture}`)
			}
			const container = new Container()
			const sprite = new Sprite(texture)
			container.label = `${definition.id}:${part.id}`
			container.pivot.set(part.pivot.x, part.pivot.y)
			container.zIndex = part.zIndex
			container.sortableChildren = true
			container.addChild(sprite)
			applyTransform(container, part.defaultTransform)
			this.parts.set(part.id, { container, sprite })
		}

		for (const part of definition.parts) {
			const instance = this.parts.get(part.id)
			if (!instance) continue
			if (!part.parentId) {
				this.root.addChild(instance.container)
				continue
			}
			const parent = this.parts.get(part.parentId)
			if (!parent) {
				throw new Error(`Rig ${definition.id} is missing parent ${part.parentId}`)
			}
			parent.container.addChild(instance.container)
		}

		this.applyFrame(this.controller.update(0))
	}

	play(
		name: AnimationClipName,
		options?: {
			force?: boolean
			queueContact?: boolean
		},
	) {
		return this.controller.play(name, options)
	}

	update(deltaMs: number) {
		const frame = this.controller.update(deltaMs)
		this.applyFrame(frame)
		return frame
	}

	setTint(color: number) {
		for (const part of this.parts.values()) part.sprite.tint = color
	}

	setAlpha(alpha: number) {
		this.root.alpha = alpha
	}

	destroy() {
		this.parts.clear()
		this.root.destroy({ children: true })
	}

	private applyFrame(frame: AnimationFrameState) {
		for (const [partId, transform] of Object.entries(frame.transforms)) {
			const part = this.parts.get(partId)
			if (part) applyTransform(part.container, transform)
		}
	}
}
