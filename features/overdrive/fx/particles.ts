// Visual FX only. Math.random() is allowed here (seeded RNG is for game logic only).
export type Particle = {
	x: number; y: number; vx: number; vy: number
	life: number; maxLife: number; size: number; color: string; gravity: number
}

const MAX_PARTICLES = 200 // hard budget per docs/design.md; never raise it
const pool: Particle[] = []

let enabled = true
export function setFxEnabled(v: boolean) { enabled = v; if (!v) pool.length = 0 }
export function fxEnabled() { return enabled }

export type BurstOpts = {
	count?: number; color: string; speed?: number; spread?: number
	size?: number; life?: number; gravity?: number; angle?: number
}

export function burst(x: number, y: number, opts: BurstOpts) {
	if (!enabled) return
	const {
		count = 12, color, speed = 260, spread = Math.PI * 2,
		size = 3, life = 450, gravity = 900, angle = -Math.PI / 2,
	} = opts
	for (let i = 0; i < count; i++) {
		if (pool.length >= MAX_PARTICLES) pool.shift()
		const a = angle + (Math.random() - 0.5) * spread
		const v = speed * (0.4 + Math.random() * 0.6)
		pool.push({
			x, y,
			vx: Math.cos(a) * v, vy: Math.sin(a) * v,
			life, maxLife: life,
			size: size * (0.5 + Math.random()),
			color, gravity,
		})
	}
}

export function update(dt: number) {
	for (let i = pool.length - 1; i >= 0; i--) {
		const p = pool[i]
		p.life -= dt
		if (p.life <= 0) { pool.splice(i, 1); continue }
		const s = dt / 1000
		p.vy += p.gravity * s
		p.x += p.vx * s
		p.y += p.vy * s
	}
}

export function render(ctx: CanvasRenderingContext2D) {
	for (const p of pool) {
		ctx.globalAlpha = p.life / p.maxLife
		ctx.fillStyle = p.color
		ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size)
	}
	ctx.globalAlpha = 1
}

export function activeCount() { return pool.length }
