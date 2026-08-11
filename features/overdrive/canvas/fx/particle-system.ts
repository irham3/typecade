import * as PIXI from "pixi.js"

export interface ParticleDef {
	x: number
	y: number
	vx: number
	vy: number
	life: number
	maxLife: number
	scale: number
	alpha: number
	color: number
	gravity?: number
	friction?: number
	rotationSpeed?: number
}

export class ParticleSystem extends PIXI.Container {
	private particles: { sprite: PIXI.Sprite; def: ParticleDef }[] = []
	private pool: PIXI.Sprite[] = []
	private baseTexture: PIXI.Texture

	constructor() {
		super()
		// Create a simple white circle texture for particles
		const gfx = new PIXI.Graphics()
		gfx.beginFill(0xffffff)
		gfx.drawCircle(0, 0, 4)
		gfx.endFill()
		this.baseTexture = PIXI.RenderTexture.create({ width: 8, height: 8 })
		// Note: We'll render this in an init step or assume it's created externally, 
		// but for a lightweight system we can just use a Graphics object as a texture if we have a renderer.
		// A simpler way without renderer:
		const canvas = document.createElement("canvas")
		canvas.width = 8
		canvas.height = 8
		const ctx = canvas.getContext("2d")
		if (ctx) {
			ctx.fillStyle = "#ffffff"
			ctx.beginPath()
			ctx.arc(4, 4, 4, 0, Math.PI * 2)
			ctx.fill()
		}
		this.baseTexture = PIXI.Texture.from(canvas)
	}

	private getSprite(): PIXI.Sprite {
		if (this.pool.length > 0) {
			return this.pool.pop()!
		}
		const sprite = new PIXI.Sprite(this.baseTexture)
		sprite.anchor.set(0.5)
		return sprite
	}

	public emit(def: Partial<ParticleDef> & { x: number; y: number }, count = 1) {
		for (let i = 0; i < count; i++) {
			const sprite = this.getSprite()
			const pDef: ParticleDef = {
				x: def.x,
				y: def.y,
				vx: def.vx ?? (Math.random() * 4 - 2),
				vy: def.vy ?? (Math.random() * 4 - 2),
				life: def.life ?? 1,
				maxLife: def.life ?? 1,
				scale: def.scale ?? 1,
				alpha: def.alpha ?? 1,
				color: def.color ?? 0xffffff,
				gravity: def.gravity ?? 0,
				friction: def.friction ?? 1,
				rotationSpeed: def.rotationSpeed ?? 0,
			}
			
			sprite.x = pDef.x
			sprite.y = pDef.y
			sprite.scale.set(pDef.scale)
			sprite.alpha = pDef.alpha
			sprite.tint = pDef.color
			
			this.particles.push({ sprite, def: pDef })
			this.addChild(sprite)
		}
	}

	public emitExplosion(x: number, y: number, color: number) {
		this.emit({ x, y, color, life: 0.4, scale: 1.5, friction: 0.9 }, 15)
		for (let i = 0; i < 15; i++) {
			const angle = Math.random() * Math.PI * 2
			const speed = Math.random() * 5 + 2
			this.emit({
				x, y,
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed,
				life: Math.random() * 0.3 + 0.2,
				color,
				scale: Math.random() * 0.5 + 0.5,
				friction: 0.92,
			})
		}
	}

	public emitMuzzleFlash(x: number, y: number) {
		this.emit({
			x, y,
			vx: Math.random() * 2,
			vy: Math.random() * 2 - 1,
			life: 0.1,
			scale: 2,
			color: 0x00e5ff,
		}, 3)
	}

	public tick(deltaMs: number) {
		const dt = deltaMs / 1000
		for (let i = this.particles.length - 1; i >= 0; i--) {
			const p = this.particles[i]!
			p.def.life -= dt
			
			if (p.def.life <= 0) {
				this.removeChild(p.sprite)
				this.pool.push(p.sprite)
				this.particles.splice(i, 1)
				continue
			}

			p.def.vx *= p.def.friction ?? 1
			p.def.vy *= p.def.friction ?? 1
			p.def.vy += (p.def.gravity ?? 0) * dt

			p.def.x += p.def.vx
			p.def.y += p.def.vy

			p.sprite.x = p.def.x
			p.sprite.y = p.def.y
			p.sprite.rotation += (p.def.rotationSpeed ?? 0) * dt

			// Fade out over life
			const progress = p.def.life / p.def.maxLife
			p.sprite.alpha = p.def.alpha * progress
			p.sprite.scale.set(p.def.scale * (0.5 + progress * 0.5))
		}
	}
}
