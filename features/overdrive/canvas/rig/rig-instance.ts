import {
	Container,
	Sprite,
	Texture,
} from "pixi.js"
import type { FormationVariantId } from "@/lib/engine/overdrive"
import { AnimationController } from "./animation-controller"
import type {
	AnimationClipName,
	AnimationFrameState,
	RigDefinition,
	RigTransform,
	RigVariantDefinition,
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
	private activeVariant: RigVariantDefinition | null = null

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
			sprite.position.set(-part.pivot.x, -part.pivot.y)
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
			preservePendingContacts?: boolean
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

	setVariant(variantId: FormationVariantId) {
		const variant = this.definition.variants?.find(
			(candidate) => candidate.id === variantId,
		)
		if (!variant) return false
		this.activeVariant = variant
		const enabledParts = new Set(variant.enabledPartIds)
		for (const [partId, part] of this.parts) {
			part.container.visible = enabledParts.has(partId)
		}
		this.applyFrame(this.controller.update(0))
		return true
	}

	get variantScale() {
		return this.activeVariant?.baseScale ?? 1
	}

	getVisualSize() {
		const bounds = this.root.getLocalBounds()
		return {
			width: Math.max(1, bounds.width),
			height: Math.max(1, bounds.height),
		}
	}

	getPartGlobalPosition(
		partId: string,
		horizontal = 0.5,
		vertical = 0.5,
	) {
		const part = this.parts.get(partId)
		if (!part) return this.root.getGlobalPosition()
		return part.sprite.toGlobal({
			x: part.sprite.texture.width * horizontal,
			y: part.sprite.texture.height * vertical,
		})
	}

	destroy() {
		this.parts.clear()
		this.root.destroy({ children: true })
	}

	private applyFrame(frame: AnimationFrameState) {
		for (const [partId, transform] of Object.entries(frame.transforms)) {
			const part = this.parts.get(partId)
			if (!part) continue
			const override = this.activeVariant?.transformOverrides?.[partId]
			applyTransform(
				part.container,
				override ? { ...transform, ...override } : transform,
			)
		}
	}
}
