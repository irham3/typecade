"use client"

import { useEffect, useRef, useState } from "react"
import { useShallow } from "zustand/react/shallow"
import { ItemGlyph, TypecadeMark } from "@/components/overdrive/icons"
import { GhostButton, PrimaryButton, RARITY_BORDER } from "@/components/overdrive/ui"
import { KEYCAPS, MACROS } from "@/lib/engine/overdrive/items"
import { useGame } from "../store"
import { formatNumber } from "./hud"
import { Screen } from "./screen"

function ResultStat({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center justify-between border-b border-line py-3 last:border-0">
			<span className="text-sm uppercase tracking-[0.08em] text-text-mid">{label}</span>
			<strong className="text-base tabular-nums text-text-hi">{value}</strong>
		</div>
	)
}

export function RunOver() {
	const state = useGame(useShallow((snapshot) => ({
		win: snapshot.win,
		finalScore: snapshot.finalScore,
		runScore: snapshot.runScore,
		standardScore: snapshot.standardScore,
		endlessScore: snapshot.endlessScore,
		endless: snapshot.endless,
		zone: snapshot.zone,
		maxCombo: snapshot.maxCombo,
		runAccuracy: snapshot.runAccuracy,
		averageWpm: snapshot.averageWpm,
		totalTokensEarned: snapshot.totalTokensEarned,
		seed: snapshot.seed,
		mode: snapshot.mode,
		language: snapshot.language,
		keycaps: snapshot.keycaps,
		macros: snapshot.macros,
		startNormalRun: snapshot.startNormalRun,
		quitToMenu: snapshot.quitToMenu,
	})))
	const [shareStatus, setShareStatus] = useState<"idle" | "shared" | "error">("idle")
	const [bestStatus, setBestStatus] = useState<"new" | number | null>(null)
	const shareCardRef = useRef<HTMLDivElement>(null)
	const finalScore = state.finalScore ?? state.runScore
	const seedLabel = state.mode === "daily" ? `SEED ${state.seed.slice(0, 10)}` : "FREE RUN"
	const shareBuild = [
		...state.keycaps.map((id) => ({ id, type: "keycap" as const })),
		...state.macros.map((id) => ({ id, type: "macro" as const })),
	].slice(0, 5)

	useEffect(() => {
		const key = `typecade_overdrive_best_${state.mode}_${state.language.toLowerCase()}`
		const previous = Number(window.localStorage.getItem(key) ?? 0)
		const status = finalScore > previous
			? "new"
			: Math.max(1, previous - finalScore + 1)
		if (finalScore > previous) {
			window.localStorage.setItem(key, String(finalScore))
		}
		const timeout = window.setTimeout(() => setBestStatus(status), 0)
		return () => window.clearTimeout(timeout)
	}, [finalScore, state.language, state.mode])

	const share = async () => {
		const text = `TYPECADE: OVERDRIVE — ${formatNumber(finalScore)} points, Zone ${state.zone}, ${state.runAccuracy}% accuracy. Seed: ${state.seed}`
		try {
			if (!shareCardRef.current) throw new Error("Share card is unavailable")
			const { toPng } = await import("html-to-image")
			const dataUrl = await toPng(shareCardRef.current, {
				width: 1_200,
				height: 630,
				pixelRatio: 1,
				cacheBust: true,
			})
			const blob = await (await fetch(dataUrl)).blob()
			const file = new File(
				[blob],
				`typecade-overdrive-${formatNumber(finalScore).replaceAll(",", "")}.png`,
				{ type: "image/png" },
			)

			if (navigator.share && navigator.canShare?.({ files: [file] })) {
				await navigator.share({
					title: "Typecade: Overdrive",
					text,
					files: [file],
				})
			} else {
				const link = document.createElement("a")
				link.download = file.name
				link.href = dataUrl
				link.click()
				await navigator.clipboard.writeText(text).catch(() => undefined)
			}
			setShareStatus("shared")
		} catch {
			setShareStatus("error")
		}
		window.setTimeout(() => setShareStatus("idle"), 2_000)
	}

	return (
		<Screen>
			<div
				ref={shareCardRef}
				aria-hidden="true"
				className="pointer-events-none fixed left-0 top-0 -z-10 h-[630px] w-[1200px] bg-bg-0 p-8 text-text-hi"
			>
				<div className="flex h-full flex-col border border-line p-8">
					<header className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<TypecadeMark className="h-12 w-12 text-acc-green" />
							<span className="font-pixel text-[32px]">TYPECADE</span>
						</div>
						<span className="text-base uppercase tracking-[0.08em] text-text-mid">
							{seedLabel}
						</span>
					</header>

					<div className="flex flex-1 flex-col items-center justify-center">
						<strong className="text-[96px] font-bold leading-none tabular-nums text-acc-yellow">
							{formatNumber(finalScore)}
						</strong>
						<span className="mt-4 font-pixel text-2xl">
							ZONE {state.zone} REACHED
						</span>
					</div>

					<div className="flex justify-center gap-4">
						{Array.from({ length: 5 }, (_, index) => {
							const item = shareBuild[index]
							if (!item) {
								return (
									<div
										key={`empty-${index}`}
										className="h-16 w-16 rounded-lg border-2 border-dashed border-line bg-bg-1"
									/>
								)
							}
							const definition = item.type === "keycap"
								? KEYCAPS[item.id]
								: MACROS[item.id]
							const rarityBorder = item.type === "keycap"
								? RARITY_BORDER[definition.rarity]
								: "border-rarity-macro"
							return (
								<div
									key={`${item.id}-${index}`}
									className={`flex h-16 w-16 items-center justify-center rounded-lg border-2 bg-bg-1 text-text-hi ${rarityBorder}`}
								>
									<ItemGlyph id={item.id} type={item.type} className="h-10 w-10" />
								</div>
							)
						})}
					</div>

					<footer className="mt-8 text-center text-xl font-bold text-acc-green">
						typecade.com/overdrive
					</footer>
				</div>
			</div>

			<main className="h-full overflow-y-auto bg-bg-0 px-6 text-text-hi">
				<div className="mx-auto w-full max-w-lg py-12 text-center">
					<p className={`font-pixel text-2xl ${state.win ? "text-acc-green" : "text-acc-red"}`}>
						{state.win ? "RUN COMPLETE" : "RUN OVER"}
					</p>
					<div className="mt-6 text-6xl font-bold tabular-nums text-acc-yellow">
						{formatNumber(finalScore)}
					</div>
					<p className="mt-2 text-sm font-bold uppercase tracking-[0.08em] text-text-mid">
						FINAL SCORE
					</p>
					{bestStatus !== null && (
						<p className={`mt-3 text-sm font-bold uppercase tracking-[0.08em] ${bestStatus === "new" ? "text-acc-green" : "text-acc-cyan"}`}>
							{bestStatus === "new"
								? "NEW PERSONAL BEST"
								: `${formatNumber(bestStatus)} TO BEAT YOUR BEST`}
						</p>
					)}

					{state.endless && (
						<div className="mt-6 grid grid-cols-2 gap-3">
							<div className="overdrive-panel p-3">
								<span className="block text-sm uppercase text-text-mid">Standard</span>
								<strong className="mt-1 block text-xl text-text-hi">{formatNumber(state.standardScore)}</strong>
							</div>
							<div className="overdrive-panel p-3">
								<span className="block text-sm uppercase text-text-mid">Endless</span>
								<strong className="mt-1 block text-xl text-acc-yellow">{formatNumber(state.endlessScore)}</strong>
							</div>
						</div>
					)}

					<section className="overdrive-panel mt-6 p-6 text-left" aria-label="Run statistics">
						<ResultStat label="Zone reached" value={String(state.zone)} />
						<ResultStat label="Max combo" value={String(state.maxCombo)} />
						<ResultStat label="Accuracy" value={`${state.runAccuracy}%`} />
						<ResultStat label="Average WPM" value={String(state.averageWpm)} />
						<div className="flex items-center justify-between pt-4">
							<span className="text-sm font-bold uppercase tracking-[0.08em] text-text-mid">Tokens earned</span>
							<strong className="text-xl tabular-nums text-acc-yellow">+{formatNumber(state.totalTokensEarned)}</strong>
						</div>
					</section>

					<section className="mt-6" aria-labelledby="final-build-title">
						<h2 id="final-build-title" className="text-sm font-bold uppercase tracking-[0.08em] text-text-mid">
							FINAL BUILD
						</h2>
						<div className="mt-3 flex min-h-12 flex-wrap justify-center gap-2">
							{state.keycaps.map((id, index) => {
								const definition = KEYCAPS[id]
								return (
									<div
										key={`${id}-${index}`}
										className={`flex h-12 w-12 items-center justify-center rounded-lg border-2 bg-bg-1 text-2xl text-text-hi ${RARITY_BORDER[definition.rarity]}`}
										title={definition.name}
									>
										<ItemGlyph id={id} type="keycap" className="h-7 w-7" />
									</div>
								)
							})}
							{state.macros.map((id, index) => {
								const definition = MACROS[id]
								return (
									<div
										key={`${id}-${index}`}
										className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-rarity-macro bg-bg-1 text-2xl text-text-hi"
										title={definition.name}
									>
										<ItemGlyph id={id} type="macro" className="h-7 w-7" />
									</div>
								)
							})}
							{state.keycaps.length === 0 && state.macros.length === 0 && (
								<span className="self-center text-sm text-text-dim">No items equipped</span>
							)}
						</div>
					</section>

					<div className="mt-8 flex flex-col gap-3">
						<PrimaryButton onClick={state.startNormalRun} className="h-14">
							NEW RUN
						</PrimaryButton>
						<GhostButton onClick={share}>
							{shareStatus === "shared" ? "SHARE CARD READY" : shareStatus === "error" ? "SHARE FAILED" : "SHARE SCORE"}
						</GhostButton>
						<GhostButton onClick={state.quitToMenu} className="border-transparent text-text-mid">
							MAIN MENU
						</GhostButton>
					</div>
				</div>
			</main>
		</Screen>
	)
}
