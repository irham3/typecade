"use client"
import { useEffect, useRef } from "react"
import { update, render } from "./particles"

export function ParticleLayer() {
	const ref = useRef<HTMLCanvasElement>(null)
	useEffect(() => {
		const canvas = ref.current
		if (!canvas) return
		const ctx = canvas.getContext("2d")
		if (!ctx) return
		let raf = 0
		let last = performance.now()
		const resize = () => {
			const dpr = window.devicePixelRatio || 1
			canvas.width = window.innerWidth * dpr
			canvas.height = window.innerHeight * dpr
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
		}
		resize()
		window.addEventListener("resize", resize)
		const tick = (now: number) => {
			const dt = Math.min(now - last, 50)
			last = now
			ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
			update(dt)
			render(ctx)
			raf = requestAnimationFrame(tick)
		}
		raf = requestAnimationFrame(tick)
		return () => {
			cancelAnimationFrame(raf)
			window.removeEventListener("resize", resize)
		}
	}, [])
	return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-50" />
}
