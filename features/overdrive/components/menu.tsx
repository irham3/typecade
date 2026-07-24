"use client"
import Link from "next/link"
import { useGame } from "@/features/overdrive/store"
import { PrimaryButton, GhostButton } from "@/components/overdrive/ui"
import { Screen } from "./screen"

export function Menu() {
	const init = useGame((s) => s.init)
	const handlePlay = () => {
		init(String(Date.now()))
		useGame.getState().api?.start()
	}
	return (
		<Screen>
		<main className="flex min-h-dvh flex-col items-center justify-center gap-12">
			<div className="text-center">
				<h1 className="font-pixel text-2xl">TYPECADE</h1>
				<p className="mt-4 text-base text-text-mid">
					Type to attack. Craft your Keycap build. Beat quotas that never stop rising.
				</p>
			</div>
			<div className="flex w-72 flex-col gap-3">
				<PrimaryButton className="h-14" onClick={handlePlay}>Play</PrimaryButton>
				<GhostButton disabled title="Available in a later milestone">Daily Seed</GhostButton>
				<Link href="/" className="flex h-11 items-center justify-center rounded-lg border border-line px-6 text-sm font-bold uppercase tracking-[0.08em] text-text-hi hover:bg-bg-2">Practice</Link>
				<span className="mt-2 text-center text-sm text-text-dim cursor-default" title="Available in a later milestone">
					Leaderboard
				</span>
			</div>
		</main>
		</Screen>
	)
}
