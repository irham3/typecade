"use client"
import { useEffect } from "react"
import { sfx } from "@/features/overdrive/fx/sfx"

export function useGameInput(onChar: (c: string) => void, onBackspace: () => void, enabled: boolean) {
	useEffect(() => {
		if (!enabled) return
		const handler = (e: KeyboardEvent) => {
			if (e.ctrlKey || e.metaKey || e.altKey) return
			if (e.key === "Backspace") { e.preventDefault(); onBackspace(); return }
			if (e.key.length === 1) { 
				console.log("GAME INPUT:", e.key)
				e.preventDefault(); sfx.key(); onChar(e.key) 
			}
		}
		window.addEventListener("keydown", handler)
		return () => window.removeEventListener("keydown", handler)
	}, [onChar, onBackspace, enabled])
}
