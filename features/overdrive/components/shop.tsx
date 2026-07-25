"use client"

import { useShallow } from "zustand/react/shallow"
import { ItemGlyph } from "@/components/overdrive/icons"
import {
	GhostButton,
	PrimaryButton,
	RARITY_BORDER,
	RarityBadge,
} from "@/components/overdrive/ui"
import { INTEREST_CAP, INTEREST_PER_5_TOKENS } from "@/lib/engine/overdrive/constants"
import { KEYCAPS, MACROS } from "@/lib/engine/overdrive/items"
import type { ItemRarity } from "@/lib/engine/overdrive/items/registry"
import { useGame } from "../store"
import { formatNumber } from "./hud"
import { Screen } from "./screen"
import { STAGE_COPY } from "../presentation/stage-copy"

function OfferCard({
	id,
	type,
	tokens,
	capacityFull,
	onBuy,
}: {
	id: string | null
	type: "keycap" | "macro"
	tokens: number
	capacityFull: boolean
	onBuy: () => void
}) {
	if (!id) {
		return (
			<div className="flex min-h-64 items-center justify-center rounded-lg border border-dashed border-line bg-bg-1 text-sm font-bold uppercase tracking-[0.08em] text-text-dim">
				SOLD
			</div>
		)
	}
	const definition = type === "keycap" ? KEYCAPS[id] : MACROS[id]
	const affordable = tokens >= definition.basePrice
	const available = affordable && !capacityFull
	const rarity = definition.rarity as ItemRarity

	return (
		<article className={`flex min-h-64 flex-col rounded-lg border-2 bg-bg-1 p-4 ${RARITY_BORDER[rarity]}`}>
			<div className="flex items-start justify-between gap-3">
				<div className="flex h-12 w-12 items-center justify-center text-4xl text-text-hi">
					<ItemGlyph id={id} type={type} className="h-12 w-12" />
				</div>
				<RarityBadge rarity={rarity} />
			</div>
			<h3 className="mt-4 text-base font-bold text-text-hi">{definition.name}</h3>
			<p className="mt-2 flex-1 text-sm leading-6 text-text-mid">{definition.description}</p>
			<button
				onClick={onBuy}
				disabled={!available}
				className={`mt-4 flex min-h-11 items-center justify-between rounded-lg border px-3 text-sm font-bold uppercase tracking-[0.08em] ${
					available
						? "border-line bg-bg-2 text-text-hi hover:border-acc-yellow"
						: "cursor-not-allowed border-line text-text-dim opacity-40"
				}`}
				aria-label={`Buy ${definition.name} for ${definition.basePrice} tokens`}
			>
				<span>{capacityFull ? "SLOTS FULL" : affordable ? "BUY" : `NEED ${definition.basePrice - tokens}`}</span>
				<span className={affordable ? "text-acc-yellow" : "text-acc-red"}>{definition.basePrice}</span>
			</button>
		</article>
	)
}

export function Shop() {
	const state = useGame(useShallow((snapshot) => ({
		stage: snapshot.stage,
		tokens: snapshot.tokens,
		keycaps: snapshot.keycaps,
		macros: snapshot.macros,
		shopKeycaps: snapshot.shopKeycaps,
		shopMacro: snapshot.shopMacro,
		rerollCost: snapshot.rerollCost,
		api: snapshot.api,
	})))
	const interestCap = state.keycaps.includes("interest_bank") ? 10 : INTEREST_CAP
	const interest = Math.min(
		Math.floor(state.tokens / 5) * INTEREST_PER_5_TOKENS,
		interestCap,
	)
	const nextStage = state.stage === "warmup"
		? STAGE_COPY.rush.label
		: state.stage === "rush"
			? STAGE_COPY.glitch.label
			: "NEXT ZONE"

	return (
		<Screen>
			<main className="flex h-full min-h-0 flex-col bg-bg-0 p-4 text-text-hi sm:p-6">
				<header className="mx-auto flex w-full max-w-5xl items-end justify-between border-b border-line pb-6">
					<div>
						<p className="text-sm font-bold uppercase tracking-[0.08em] text-acc-cyan">REWIRE YOUR BUILD</p>
						<h1 className="mt-3 font-pixel text-2xl">SHOP</h1>
					</div>
					<div className="text-right">
						<div className="text-3xl font-bold tabular-nums text-acc-yellow">{formatNumber(state.tokens)}</div>
						<div className="text-sm uppercase tracking-[0.08em] text-text-mid">TOKENS · +{interest} NEXT CLEAR</div>
					</div>
				</header>

				<div className="mx-auto min-h-0 w-full max-w-5xl flex-1 overflow-y-auto py-6">
					<section aria-labelledby="offers-heading">
						<div className="mb-4 flex items-center justify-between">
							<h2 id="offers-heading" className="text-sm font-bold uppercase tracking-[0.08em] text-text-mid">SIGNAL OFFERS</h2>
							<GhostButton
								onClick={() => state.api?.rerollShop()}
								disabled={state.tokens < state.rerollCost}
							>
								REROLL · {state.rerollCost}
							</GhostButton>
						</div>
						<div className="grid gap-4 md:grid-cols-3">
							{state.shopKeycaps.map((id, index) => (
								<OfferCard
									key={`keycap-offer-${index}`}
									id={id || null}
									type="keycap"
									tokens={state.tokens}
									capacityFull={state.keycaps.length >= 5}
									onBuy={() => state.api?.buyItem("keycap", index)}
								/>
							))}
							<OfferCard
								id={state.shopMacro}
								type="macro"
								tokens={state.tokens}
								capacityFull={state.macros.length >= 2}
								onBuy={() => state.api?.buyItem("macro", 0)}
							/>
						</div>
					</section>

					<section className="mt-6 border-t border-line pt-6" aria-labelledby="build-heading">
						<div className="mb-4 flex items-center justify-between">
							<h2 id="build-heading" className="text-sm font-bold uppercase tracking-[0.08em] text-text-mid">ACTIVE BUILD</h2>
							<span className="text-sm text-text-dim">Sell value is 50% of base price.</span>
						</div>
						<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
							{state.keycaps.map((id, index) => {
								const definition = KEYCAPS[id]
								return (
									<div key={`${id}-${index}`} className="overdrive-panel flex items-center gap-3 p-3">
										<ItemGlyph id={id} type="keycap" className="h-8 w-8 shrink-0 text-text-hi" />
										<div className="min-w-0 flex-1">
											<strong className="block truncate text-sm">{definition.name}</strong>
											<span className="text-sm uppercase text-text-mid">{definition.rarity}</span>
										</div>
										<button
											className="min-h-11 rounded-lg border border-line px-3 text-sm font-bold text-text-mid hover:bg-bg-2 hover:text-acc-yellow"
											onClick={() => state.api?.sellKeycap(index)}
											aria-label={`Sell ${definition.name} for ${Math.floor(definition.basePrice / 2)} tokens`}
										>
											SELL {Math.floor(definition.basePrice / 2)}
										</button>
									</div>
								)
							})}
							{state.macros.map((id, index) => {
								const definition = MACROS[id]
								return (
									<div key={`${id}-${index}`} className="overdrive-panel flex items-center gap-3 border-acc-cyan p-3">
										<ItemGlyph id={id} type="macro" className="h-8 w-8 shrink-0 text-text-hi" />
										<div className="min-w-0 flex-1">
											<strong className="block truncate text-sm">{definition.name}</strong>
											<span className="text-sm uppercase text-acc-cyan">MACRO</span>
										</div>
										<button
											className="min-h-11 rounded-lg border border-line px-3 text-sm font-bold text-text-mid hover:bg-bg-2 hover:text-acc-yellow"
											onClick={() => state.api?.sellMacro(index)}
											aria-label={`Sell ${definition.name} for ${Math.floor(definition.basePrice / 2)} tokens`}
										>
											SELL {Math.floor(definition.basePrice / 2)}
										</button>
									</div>
								)
							})}
							{state.keycaps.length === 0 && state.macros.length === 0 && (
								<p className="text-sm leading-6 text-text-dim">Your build is empty. Pick a trigger you can reliably activate.</p>
							)}
						</div>
					</section>
				</div>

				<footer className="mx-auto flex w-full max-w-5xl justify-end border-t border-line pt-4">
					<PrimaryButton onClick={() => state.api?.leaveShop()} className="h-14 w-full sm:w-auto">
						ENTER {nextStage}
					</PrimaryButton>
				</footer>
			</main>
		</Screen>
	)
}
