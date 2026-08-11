"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useShallow } from "zustand/react/shallow"
import { ItemGlyph } from "@/components/overdrive/icons"
import {
	RARITY_BADGE,
	RARITY_BORDER,
} from "@/components/overdrive/ui"
import { INTEREST_CAP, INTEREST_PER_5_TOKENS } from "@/lib/engine/overdrive/constants"
import { FIRMWARE, KEYCAPS, MACROS } from "@/lib/engine/overdrive/items"
import type { ItemRarity } from "@/lib/engine/overdrive/items/registry"
import { getStageQuota, nextStagePosition } from "@/lib/engine/overdrive/progression"
import { STAGE_COPY } from "../presentation/stage-copy"
import { useGame } from "../store"
import { formatNumber } from "./hud"
import { Screen } from "./screen"
import { impactSummary, strongestImpact } from "./stage-impact"

const TRIGGER_LABELS: Record<string, string> = {
	wasd: "W, A, S, OR D",
	vowel_magnet: "EACH VOWEL",
	longshot: "8+ LETTER WORD",
	sprinter: "FIRST 10 SECONDS",
	second_wind: "AFTER A TYPO",
	copper_key: "EVERY 25 CLEAN WORDS",
	home_row: "HOME-ROW WORD",
	punctuator: "PUNCTUATION",
	combo_battery: "FIRST TYPO EACH STAGE",
	overclock: "15-WORD STREAK",
	double_tap: "DOUBLE LETTER",
	snowball: "PERFECT CLEAR",
	interest_bank: "TOKEN RESERVE",
	glass_keycap: "ALWAYS · RISK",
	vampire: "TYPO · TIME COST",
	escape: "MANUAL · GLITCH",
	time_freeze: "MANUAL · TIME",
	quota_slash: "MANUAL · QUOTA",
	insurance: "MANUAL · DEFENSE",
	extra_slot: "RUN UPGRADE",
	discount: "SHOP ECONOMY",
	extended_timer: "STAGE TIMER",
	better_odds: "SHOP ODDS",
	macro_pocket: "RUN UPGRADE",
}

type OfferCardProps = {
	id: string | null
	type: "keycap" | "macro" | "firmware"
	shortcut: "1" | "2" | "3" | "4"
	tokens: number
	price: number | null
	capacityFull: boolean
	onBuy: () => void
}

function OfferCard({
	id,
	type,
	shortcut,
	tokens,
	price,
	capacityFull,
	onBuy,
}: OfferCardProps) {
	if (!id) {
		return (
			<article className="flex min-h-0 items-center justify-center rounded-lg border border-dashed border-line bg-bg-1 text-xs font-bold uppercase tracking-[0.08em] text-text-dim">
				{shortcut} · SOLD
			</article>
		)
	}

	const definition = type === "keycap" ? KEYCAPS[id] : type === "macro" ? MACROS[id] : FIRMWARE[id]
	const displayPrice = price ?? definition.basePrice
	const affordable = tokens >= displayPrice
	const available = affordable && !capacityFull
	const rarity = definition.rarity as ItemRarity

	return (
		<article
			className={`grid min-h-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border-2 bg-bg-1 p-3 md:flex md:items-stretch md:p-4 ${RARITY_BORDER[rarity]}`}
		>
			<div className="flex h-10 w-10 shrink-0 items-center justify-center text-text-hi md:h-12 md:w-12">
				<ItemGlyph id={id} type={type} className="h-9 w-9 md:h-12 md:w-12" />
			</div>
			<div className="min-w-0 flex-1">
				<h3 className="truncate text-sm font-bold text-text-hi md:text-base">{definition.name}</h3>
				<p className="mt-1 truncate text-xs font-bold uppercase tracking-[0.08em] text-acc-cyan">
					{TRIGGER_LABELS[id] ?? "BUILD TRIGGER"}
				</p>
				<p className="mt-1 line-clamp-2 text-xs leading-5 text-text-mid md:mt-2 md:text-sm">
					{definition.description}
				</p>
			</div>
			<div className="flex h-full shrink-0 flex-col items-end justify-between gap-2 md:h-auto md:flex-row md:items-center">
				<span className={`rounded-full px-2 py-1 text-xs font-bold uppercase ${RARITY_BADGE[rarity]}`}>
					{rarity}
				</span>
				<button
					type="button"
					onClick={onBuy}
					disabled={!available}
					aria-keyshortcuts={shortcut}
					aria-label={`Buy ${definition.name} for ${displayPrice} tokens`}
					className={`flex min-h-11 min-w-20 items-center justify-between gap-2 rounded-lg border px-3 text-xs font-bold uppercase tracking-[0.08em] ${
						available
							? "border-line bg-bg-2 text-text-hi hover:border-acc-yellow"
							: "cursor-not-allowed border-line text-text-dim opacity-40"
					}`}
				>
					<span>{capacityFull ? "FULL" : affordable ? `${shortcut} BUY` : "NEED"}</span>
					<span className={affordable ? "text-acc-yellow" : "text-acc-red"}>
						{capacityFull ? "" : affordable ? displayPrice : displayPrice - tokens}
					</span>
				</button>
			</div>
		</article>
	)
}

function BuildSlot({
	id,
	type,
	index,
	arriving,
	onSell,
}: {
	id: string | undefined
	type: "keycap" | "macro"
	index: number
	arriving: boolean
	onSell: () => void
}) {
	if (!id) {
		return (
			<div
				className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-dashed border-line text-xs text-text-dim"
				aria-label={`Empty ${type} slot ${index + 1}`}
			>
				{index + 1}
			</div>
		)
	}

	const definition = type === "keycap" ? KEYCAPS[id] : MACROS[id]
	const rarity = definition.rarity as ItemRarity
	const sellValue = Math.floor(definition.basePrice / 2)

	return (
		<button
			type="button"
			onClick={onSell}
			className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 bg-bg-1 text-text-hi hover:bg-bg-2 ${RARITY_BORDER[rarity]} ${
				arriving ? "overdrive-build-arrival" : ""
			}`}
			aria-label={`Sell ${definition.name} for ${sellValue} tokens`}
			title={`${definition.name} · Sell ${sellValue}`}
		>
			<ItemGlyph id={id} type={type} className="h-7 w-7" />
			<span className="absolute right-1 top-1 text-xs font-bold text-acc-yellow">{sellValue}</span>
		</button>
	)
}

export function Shop() {
	const state = useGame(useShallow((snapshot) => ({
		zone: snapshot.zone,
		stage: snapshot.stage,
		score: snapshot.score,
		accuracy: snapshot.accuracy,
		tokens: snapshot.tokens,
		tokenBreakdown: snapshot.tokenBreakdown,
		stageItemImpact: snapshot.stageItemImpact,
		keycaps: snapshot.keycaps,
		macros: snapshot.macros,
		firmware: snapshot.firmware,
		shopKeycaps: snapshot.shopKeycaps,
		shopMacro: snapshot.shopMacro,
		shopFirmware: snapshot.shopFirmware,
		maxKeycaps: snapshot.maxKeycaps,
		maxMacros: snapshot.maxMacros,
		rerollCost: snapshot.rerollCost,
		api: snapshot.api,
	})))
	const [lastPurchase, setLastPurchase] = useState<string | null>(null)
	const interestCap = state.keycaps.includes("interest_bank") ? 10 : INTEREST_CAP
	const interest = Math.min(
		Math.floor(state.tokens / 5) * INTEREST_PER_5_TOKENS,
		interestCap,
	)
	const nextPosition = nextStagePosition(state.zone, state.stage)
	const nextQuota = getStageQuota(nextPosition.zone, nextPosition.stage)
	const topImpact = useMemo(
		() => strongestImpact(state.stageItemImpact),
		[state.stageItemImpact],
	)

	const priceFor = useCallback((basePrice: number) => (
		state.firmware.includes("discount") ? Math.ceil(basePrice * 0.75) : basePrice
	), [state.firmware])

	const buy = useCallback((type: "keycap" | "macro" | "firmware", index: number) => {
		const id = type === "keycap" ? state.shopKeycaps[index] : type === "macro" ? state.shopMacro : state.shopFirmware
		if (!id || !state.api) return
		const definition = type === "keycap" ? KEYCAPS[id] : type === "macro" ? MACROS[id] : FIRMWARE[id]
		const capacityFull = type === "keycap"
			? state.keycaps.length >= state.maxKeycaps
			: type === "macro"
				? state.macros.length >= state.maxMacros
				: false
		if (capacityFull || state.tokens < priceFor(definition.basePrice)) return
		state.api.buyItem(type, index)
		setLastPurchase(id)
	}, [
		state.api,
		state.keycaps.length,
		state.macros.length,
		state.maxKeycaps,
		state.maxMacros,
		state.shopFirmware,
		state.shopKeycaps,
		state.shopMacro,
		state.tokens,
		priceFor,
	])

	useEffect(() => {
		if (!lastPurchase) return
		const timer = window.setTimeout(() => setLastPurchase(null), 600)
		return () => window.clearTimeout(timer)
	}, [lastPurchase])

	useEffect(() => {
		const handleShortcut = (event: KeyboardEvent) => {
			if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return
			if (event.key === "1") {
				event.preventDefault()
				buy("keycap", 0)
			} else if (event.key === "2") {
				event.preventDefault()
				buy("keycap", 1)
			} else if (event.key === "3") {
				event.preventDefault()
				buy("macro", 0)
			} else if (event.key === "4") {
				event.preventDefault()
				buy("firmware", 0)
			} else if (event.key.toLowerCase() === "r") {
				event.preventDefault()
				state.api?.rerollShop()
			} else if (event.key === "Enter") {
				const target = event.target
				if (target instanceof HTMLElement && target.closest("button, a, [role='button']")) return
				event.preventDefault()
				state.api?.leaveShop()
			}
		}
		window.addEventListener("keydown", handleShortcut)
		return () => window.removeEventListener("keydown", handleShortcut)
	}, [buy, state.api])

	const itemId = topImpact?.[0]
	const impact = topImpact?.[1]
	const impactDefinition = itemId ? KEYCAPS[itemId] : undefined

	return (
		<Screen>
			<main className="grid h-full min-h-0 grid-rows-[auto_auto_minmax(0,1fr)_auto_auto] gap-3 bg-bg-0 p-3 text-text-hi sm:gap-4 sm:p-6">
				<header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 border-b border-line pb-3">
					<div className="min-w-0">
						<h1 className="font-pixel text-xl sm:text-2xl">SHOP</h1>
						<p className="mt-2 truncate text-xs font-bold uppercase tracking-[0.08em] text-text-mid sm:text-sm">
							NEXT · Z{nextPosition.zone} {STAGE_COPY[nextPosition.stage].label} · QUOTA{" "}
							<span className="text-acc-yellow">{formatNumber(nextQuota)}</span>
						</p>
					</div>
					<div className="shrink-0 text-right">
						<div className="text-2xl font-bold tabular-nums text-acc-yellow sm:text-3xl">{formatNumber(state.tokens)}</div>
						<div className="text-xs uppercase tracking-[0.08em] text-text-mid">TOKENS · +{interest} INTEREST</div>
					</div>
				</header>

				<section
					className="mx-auto grid w-full max-w-5xl grid-cols-4 gap-2 border-l-2 border-acc-green bg-bg-1 px-3 py-2"
					aria-label="Previous stage result"
				>
					<div>
						<span className="block text-xs uppercase text-text-mid">Score</span>
						<strong className="block truncate text-sm tabular-nums text-acc-yellow">{formatNumber(state.score)}</strong>
					</div>
					<div>
						<span className="block text-xs uppercase text-text-mid">Earned</span>
						<strong className="block text-sm tabular-nums text-acc-yellow">+{state.tokenBreakdown?.totalEarned ?? 0}</strong>
					</div>
					<div>
						<span className="block text-xs uppercase text-text-mid">Accuracy</span>
						<strong className="block text-sm tabular-nums text-acc-green">{state.accuracy}%</strong>
					</div>
					<div className="min-w-0">
						<span className="block truncate text-xs uppercase text-text-mid">
							{impactDefinition?.name ?? "Build impact"}
						</span>
						<strong className="block truncate text-xs text-acc-cyan">
							{impact ? impactSummary(impact) : "No trigger"}
						</strong>
					</div>
				</section>

				<section className="mx-auto flex min-h-0 w-full max-w-5xl flex-col" aria-labelledby="offers-heading">
					<div className="mb-2 flex items-center justify-between">
						<h2 id="offers-heading" className="text-xs font-bold uppercase tracking-[0.08em] text-text-mid">
							OFFERS · 1 2 3 TO BUY
						</h2>
						<button
							type="button"
							onClick={() => state.api?.rerollShop()}
							disabled={state.tokens < state.rerollCost}
							aria-keyshortcuts="R"
							className="min-h-11 rounded-lg border border-line px-3 text-xs font-bold uppercase tracking-[0.08em] text-text-hi hover:bg-bg-2 disabled:cursor-not-allowed disabled:text-text-dim disabled:opacity-40"
						>
							R · REROLL {state.rerollCost}
						</button>
					</div>
					<div className="grid min-h-0 flex-1 grid-rows-4 gap-2 md:grid-cols-4 md:grid-rows-1 md:gap-4">
						<OfferCard
							id={state.shopKeycaps[0] || null}
							type="keycap"
							shortcut="1"
							tokens={state.tokens}
							price={state.shopKeycaps[0] ? priceFor(KEYCAPS[state.shopKeycaps[0]].basePrice) : null}
							capacityFull={state.keycaps.length >= state.maxKeycaps}
							onBuy={() => buy("keycap", 0)}
						/>
						<OfferCard
							id={state.shopKeycaps[1] || null}
							type="keycap"
							shortcut="2"
							tokens={state.tokens}
							price={state.shopKeycaps[1] ? priceFor(KEYCAPS[state.shopKeycaps[1]].basePrice) : null}
							capacityFull={state.keycaps.length >= state.maxKeycaps}
							onBuy={() => buy("keycap", 1)}
						/>
						<OfferCard
							id={state.shopMacro}
							type="macro"
							shortcut="3"
							tokens={state.tokens}
							price={state.shopMacro ? priceFor(MACROS[state.shopMacro].basePrice) : null}
							capacityFull={state.macros.length >= state.maxMacros}
							onBuy={() => buy("macro", 0)}
						/>
						<OfferCard
							id={state.shopFirmware}
							type="firmware"
							shortcut="4"
							tokens={state.tokens}
							price={state.shopFirmware ? priceFor(FIRMWARE[state.shopFirmware].basePrice) : null}
							capacityFull={false}
							onBuy={() => buy("firmware", 0)}
						/>
					</div>
				</section>

				<section className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 border-t border-line pt-3" aria-label="Active build">
					<div className="hidden text-xs font-bold uppercase tracking-[0.08em] text-text-mid sm:block">
						BUILD
						<span className="mt-1 block font-normal tracking-normal text-text-dim">Select a slot to sell</span>
					</div>
					<div className="flex min-w-0 gap-1">
						{Array.from({ length: state.maxKeycaps }, (_, index) => (
							<BuildSlot
								key={`keycap-build-${index}`}
								id={state.keycaps[index]}
								type="keycap"
								index={index}
								arriving={state.keycaps[index] === lastPurchase}
								onSell={() => state.api?.sellKeycap(index)}
							/>
						))}
						<div className="mx-1 h-11 w-px bg-line" aria-hidden="true" />
						{Array.from({ length: state.maxMacros }, (_, index) => (
							<BuildSlot
								key={`macro-build-${index}`}
								id={state.macros[index]}
								type="macro"
								index={index}
								arriving={state.macros[index] === lastPurchase}
								onSell={() => state.api?.sellMacro(index)}
							/>
						))}
					</div>
				</section>

				<footer className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
					<span className="hidden text-xs font-bold uppercase tracking-[0.08em] text-text-mid md:block">
						TAB · NAVIGATE
					</span>
					<button
						type="button"
						onClick={() => state.api?.leaveShop()}
						aria-keyshortcuts="Enter"
						className="overdrive-primary h-12 w-full md:w-auto"
					>
						ENTER · NEXT: {STAGE_COPY[nextPosition.stage].label} · QUOTA {formatNumber(nextQuota)}
					</button>
				</footer>
			</main>
		</Screen>
	)
}
