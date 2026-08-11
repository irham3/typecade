"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { useShallow } from "zustand/react/shallow"
import { GhostButton, PrimaryButton } from "@/components/overdrive/ui"
import { PlayIcon, TypecadeMark } from "@/components/overdrive/icons"
import { useGame } from "@/features/overdrive/store"
import { track } from "@/lib/analytics"
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
	const play = () => {
		track("play_clicked", { mode: "overdrive", language: selectedLanguage, source: "free" })
		startNormalRun()
	}
	const playDaily = () => {
		track("play_clicked", { mode: "overdrive", language: selectedLanguage, source: "daily" })
		startDailyRun()
	}

	return (
		<Screen>
			<main className="relative min-h-dvh overflow-y-auto bg-bg-0 px-4 text-text-hi sm:px-6">
				<div className="pointer-events-none fixed inset-0">
					<Image
						src="/overdrive/art/signal-trench-arena-v2.png"
						alt=""
						fill
						priority
						sizes="100vw"
						className="object-cover object-center opacity-40"
					/>
					<div className="absolute inset-0 bg-bg-0/70" />
				</div>

				<div className="relative mx-auto grid min-h-dvh w-full max-w-6xl items-center gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:py-12">
					<section
						className="relative overflow-hidden rounded-lg border border-line bg-bg-0/80 p-6 sm:p-8"
						aria-labelledby="overdrive-title"
					>
						<div className="relative z-10 flex items-center gap-4 text-acc-green">
							<TypecadeMark className="h-12 w-12 shrink-0" />
							<div className="h-px flex-1 bg-line" />
							<span className="text-sm font-bold uppercase tracking-[0.08em] text-text-mid">SIGNAL SIEGE · 08</span>
						</div>

						<div className="relative z-10 mt-8">
							<p className="text-sm font-bold uppercase tracking-[0.08em] text-acc-cyan">
								Your keyboard is the weapon
							</p>
							<h1 id="overdrive-title" className="mt-4 font-pixel text-4xl leading-tight text-text-hi sm:text-5xl">
								TYPECADE
							</h1>
							<p className="mt-3 font-pixel text-xl text-acc-green">OVERDRIVE</p>
							<p className="mt-5 max-w-xl text-base leading-6 text-text-mid">
								Type to attack. Clean words score. Keycaps change how each word pays.
								Clear the quota to reach the next shop.
							</p>
						</div>

						<div className="relative mt-6 h-56 overflow-hidden border-y border-line sm:h-64">
							<div className="absolute inset-x-0 top-1/2 h-px bg-acc-cyan/30" />
							<Image
								src="/overdrive/art/keystone-warden-v3.png"
								alt="Keystone Warden aiming its typing cannon"
								width={1432}
								height={858}
								priority
								className="absolute -bottom-3 -left-12 h-52 w-auto object-contain sm:h-64"
							/>
							<Image
								src="/overdrive/art/packet-stalker-v3.png"
								alt="Packet Stalker preparing to attack"
								width={1173}
								height={927}
								className="absolute bottom-2 -right-8 h-36 w-auto object-contain sm:h-48"
							/>
							<div className="absolute bottom-4 left-1/2 -translate-x-1/2 border-l-2 border-acc-green bg-bg-0/90 px-3 py-2 text-center text-sm font-bold uppercase tracking-[0.08em] text-text-hi">
								TYPE · FIRE · SURVIVE
							</div>
						</div>

						<div className="relative z-10 mt-6 grid grid-cols-3 border-y border-line py-4">
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

					<section className="overdrive-panel bg-bg-1/95 p-6" aria-label="Run controls">
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
							<PrimaryButton onClick={play} className="h-14">
								<span className="flex w-full items-center justify-between gap-3">
									<span>PLAY</span>
									<PlayIcon className="h-5 w-5" />
								</span>
							</PrimaryButton>
							<GhostButton onClick={playDaily} className="h-14 justify-between">
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
							New to typing? Start with one key at a time. Stop to search and the clock pauses;
							short signals, Space execution, and full words arrive one step at a time.
						</p>
					</section>
				</div>
			</main>
		</Screen>
	)
}
