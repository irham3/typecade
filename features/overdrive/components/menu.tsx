"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useShallow } from "zustand/react/shallow"
import { GhostButton, PrimaryButton } from "@/components/overdrive/ui"
import { PlayIcon, TypecadeMark } from "@/components/overdrive/icons"
import { useGame } from "@/features/overdrive/store"
import type { WordPoolLanguage } from "@/lib/engine/overdrive"
import { Screen } from "./screen"

function timeUntilUtcReset(now = Date.now()) {
	const date = new Date(now)
	const reset = Date.UTC(
		date.getUTCFullYear(),
		date.getUTCMonth(),
		date.getUTCDate() + 1,
	)
	const seconds = Math.max(0, Math.floor((reset - now) / 1000))
	const hours = Math.floor(seconds / 3600)
	const minutes = Math.floor((seconds % 3600) / 60)
	const remainder = seconds % 60
	return [hours, minutes, remainder].map((part) => String(part).padStart(2, "0")).join(":")
}

export function Menu() {
	const {
		startNormalRun,
		startDailyRun,
		resumeRun,
		resumeAvailable,
		selectedLanguage,
		setLanguage,
	} = useGame(useShallow((state) => ({
		startNormalRun: state.startNormalRun,
		startDailyRun: state.startDailyRun,
		resumeRun: state.resumeRun,
		resumeAvailable: state.resumeAvailable,
		selectedLanguage: state.selectedLanguage,
		setLanguage: state.setLanguage,
	})))
	const [resetIn, setResetIn] = useState("--:--:--")

	useEffect(() => {
		const immediate = window.setTimeout(() => setResetIn(timeUntilUtcReset()), 0)
		const timer = window.setInterval(() => setResetIn(timeUntilUtcReset()), 1_000)
		return () => {
			window.clearTimeout(immediate)
			window.clearInterval(timer)
		}
	}, [])

	const chooseLanguage = (language: WordPoolLanguage) => setLanguage(language)

	return (
		<Screen>
			<main className="relative flex min-h-dvh items-start justify-center overflow-y-auto bg-bg-0 px-6 text-text-hi lg:items-center">
				<div className="grid w-full max-w-5xl items-center gap-12 py-12 lg:grid-cols-[1fr_360px]">
					<section aria-labelledby="overdrive-title">
						<div className="flex items-center gap-4 text-acc-green">
							<TypecadeMark className="h-16 w-16" />
							<div className="h-px flex-1 bg-line" />
							<span className="text-sm font-bold uppercase tracking-[0.08em] text-text-mid">SYSTEM 08</span>
						</div>

						<div className="mt-12">
							<p className="text-sm font-bold uppercase tracking-[0.08em] text-acc-cyan">
								Typing roguelike
							</p>
							<h1 id="overdrive-title" className="mt-4 font-pixel text-4xl leading-tight text-text-hi sm:text-5xl">
								TYPECADE
							</h1>
							<p className="mt-3 font-pixel text-xl text-acc-green">OVERDRIVE</p>
							<p className="mt-6 max-w-xl text-base leading-6 text-text-mid">
								Type to attack. Craft your Keycap build. Beat quotas that never stop rising.
								Survive as long as you can.
							</p>
						</div>

						<div className="mt-12 grid max-w-xl grid-cols-3 border-y border-line py-4">
							<div>
								<strong className="block text-2xl text-acc-yellow">08</strong>
								<span className="text-sm uppercase tracking-[0.08em] text-text-mid">Zones</span>
							</div>
							<div className="border-x border-line px-4">
								<strong className="block text-2xl text-acc-violet">15</strong>
								<span className="text-sm uppercase tracking-[0.08em] text-text-mid">Keycaps</span>
							</div>
							<div className="pl-4">
								<strong className="block text-2xl text-acc-red">05</strong>
								<span className="text-sm uppercase tracking-[0.08em] text-text-mid">Glitches</span>
							</div>
						</div>
					</section>

					<section className="overdrive-panel p-6" aria-label="Run controls">
						<div className="mb-6 flex items-center justify-between">
							<span className="text-sm font-bold uppercase tracking-[0.08em] text-text-mid">Word pool</span>
							<div className="flex rounded-lg border border-line p-1">
								{(["EN", "ID"] as const).map((language) => (
									<button
										key={language}
										onClick={() => chooseLanguage(language)}
										aria-pressed={selectedLanguage === language}
										className={`min-h-11 min-w-12 rounded-lg px-3 text-sm font-bold ${
											selectedLanguage === language
												? "bg-bg-2 text-acc-cyan"
												: "text-text-mid hover:text-text-hi"
										}`}
									>
										{language}
									</button>
								))}
							</div>
						</div>

						<div className="flex flex-col gap-3">
							{resumeAvailable && (
								<GhostButton onClick={resumeRun} className="h-14 border-acc-cyan">
									<span className="flex w-full items-center justify-between gap-3">
										<span>RESUME RUN</span>
										<span className="text-acc-cyan">ACTIVE</span>
									</span>
								</GhostButton>
							)}
							<PrimaryButton onClick={startNormalRun} className="h-14">
								<span className="flex w-full items-center justify-between gap-3">
									<span>PLAY</span>
									<PlayIcon className="h-5 w-5" />
								</span>
							</PrimaryButton>
							<GhostButton onClick={startDailyRun} className="h-14 justify-between">
								<span className="flex w-full items-center justify-between gap-3">
									<span>DAILY SEED</span>
									<span className="text-sm font-normal text-text-mid">{resetIn}</span>
								</span>
							</GhostButton>
							<Link href="/" className="overdrive-ghost h-14">
								PRACTICE
							</Link>
							<Link href="/board" className="mt-1 text-center text-sm font-bold uppercase tracking-[0.08em] text-text-mid hover:text-text-hi">
								LEADERBOARD
							</Link>
						</div>

						<p className="mt-6 border-t border-line pt-4 text-sm leading-6 text-text-dim">
							Build Mult every 10 clean words. One typo dirties the word and breaks the chain.
						</p>
					</section>
				</div>
			</main>
		</Screen>
	)
}
