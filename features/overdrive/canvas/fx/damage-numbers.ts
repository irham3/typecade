import * as PIXI from "pixi.js"

interface DamageNumberDef {
	text: PIXI.Text
	life: number
	maxLife: number
	x: number
	y: number
	vx: number
	vy: number
}

export class DamageNumbersSystem extends PIXI.Container {
	private pool: PIXI.Text[] = []
	private active: DamageNumberDef[] = []

	private getText(): PIXI.Text {
		if (this.pool.length > 0) {
			return this.pool.pop()!
		}
		const text = new PIXI.Text({
			text: "",
			style: new PIXI.TextStyle({
				fontFamily: "monospace",
				fontSize: 24,
				fill: 0xffffff,
				fontWeight: "bold",
				dropShadow: {
					alpha: 0.8,
					blur: 2,
					color: 0x000000,
					distance: 2,
				},
			})
		})
		text.anchor.set(0.5)
		return text
	}

	public spawn(x: number, y: number, amount: number, color = 0xffffff) {
		const text = this.getText()
		text.text = amount.toString()
		text.style.fill = color
		
		const def: DamageNumberDef = {
			text,
			life: 0.6,
			maxLife: 0.6,
			x,
			y,
			vx: (Math.random() * 2) - 1,
			vy: -2 - Math.random() * 2,
		}

		text.x = def.x
		text.y = def.y
		text.alpha = 1
		text.scale.set(1)

		this.active.push(def)
		this.addChild(text)
	}

	public tick(deltaMs: number) {
		const dt = deltaMs / 1000
		for (let i = this.active.length - 1; i >= 0; i--) {
			const def = this.active[i]!
			def.life -= dt
			
			if (def.life <= 0) {
				this.removeChild(def.text)
				this.pool.push(def.text)
				this.active.splice(i, 1)
				continue
			}

			def.vy += 5 * dt // gravity
			def.x += def.vx
			def.y += def.vy

			def.text.x = def.x
			def.text.y = def.y

			const progress = def.life / def.maxLife
			def.text.alpha = progress
			// slight pop at start, then scale down
			if (progress > 0.8) {
				def.text.scale.set(1 + (1 - progress) * 2) // scale up to 1.4
			} else {
				def.text.scale.set(1 + (progress - 0.8)) // scale down
			}
		}
	}
}
