"use client"
import { useEffect } from "react"
import { useGame } from "@/features/overdrive/store"
import { burst } from "./particles"
import { sfx } from "./sfx"
import { token, shake, pulse, hitstop, floatScore } from "./dom-fx"

function confetti() {
	const colors = ["--color-acc-green", "--color-acc-pink", "--color-acc-violet", "--color-acc-yellow", "--color-acc-cyan"]
	for (let i = 0; i < 5; i++) {
		setTimeout(() => {
			burst(Math.random() * window.innerWidth, window.innerHeight * 0.3, {
				count: 30, color: token(colors[i % colors.length]),
				speed: 420, spread: Math.PI / 1.5, life: 900,
			})
		}, i * 120)
	}
}

// Escalation: bigger bursts as mult grows, capped by the particle budget.
function wordBurstCount(mult: number) { return Math.min(8 + mult * 3, 40) }

export function useGameFx() {
	const api = useGame((s) => s.api)
	useEffect(() => {
		if (!api) return
		const at = () => {
			const r = document.getElementById("active-word")?.getBoundingClientRect()
			return r
				? { x: r.left + r.width / 2, y: r.top + r.height / 2 }
				: { x: window.innerWidth / 2, y: window.innerHeight / 2 }
		}
		const offs = [
			api.events.on("word_complete", ({ gained, combo, mult }) => {
				const { x, y } = at()
				burst(x, y, { count: wordBurstCount(mult), color: token("--color-acc-green") })
				floatScore(x, y, `+${gained}`)
				sfx.blip(combo)
			}),
			api.events.on("typo", () => {
				const { x, y } = at()
				burst(x, y, { count: 10, color: token("--color-acc-red"), speed: 160, life: 300 })
				sfx.error()
				shake()
			}),
			api.events.on("mult_change", ({ mult }) => {
				if (mult <= 1) return // reset to 1 is punished by the typo FX already
				const { x, y } = at()
				burst(x, y, { count: 24, color: token("--color-acc-violet"), speed: 380 })
				pulse(document.getElementById("mult-value"))
				sfx.multUp(mult)
				hitstop(60) // one brief freeze frame; never longer
			}),
			api.events.on("stage_clear", () => { sfx.stageClear(); confetti() }),
			api.events.on("run_over", () => sfx.runOver()),
		]
		return () => offs.forEach((off) => off())
	}, [api])
}
