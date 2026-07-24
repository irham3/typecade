"use client"
import { useGame } from "../store"
import { PrimaryButton, GhostButton, KeycapSlot } from "@/components/overdrive/ui"
import { formatNumber } from "./hud"
import { Screen } from "./screen"
import { KEYCAPS, MACROS } from "@/lib/engine/overdrive/items"

export function Shop() {
	const state = useGame()
	const api = state.api

	return (
		<Screen>
		<main className="mx-auto flex min-h-dvh max-w-4xl flex-col py-12 px-6">
			<header className="flex items-center justify-between border-b border-line pb-6">
				<h2 className="font-pixel text-2xl">SHOP</h2>
				<div className="flex flex-col items-end gap-1">
					<div className="flex items-center gap-4 text-xl">
						<span className="text-text-mid">Tokens:</span>
						<span className="font-bold text-acc-yellow tabular-nums">{formatNumber(state.tokens)}</span>
					</div>
					<div className="text-xs text-text-mid">Interest next clear: +{Math.min(Math.floor(state.tokens / 5), 5)}</div>
				</div>
			</header>

			<div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-12">
				{/* INVENTORY */}
				<section>
					<h3 className="mb-4 font-bold uppercase tracking-widest text-text-hi">Your Inventory</h3>
					
					<div className="mb-6">
						<h4 className="mb-2 text-sm text-text-mid">Keycaps ({state.keycaps.length}/5)</h4>
						<div className="flex flex-wrap gap-3">
							{state.keycaps.map((id, i) => {
								const def = KEYCAPS[id]
								return (
									<div key={`inv-k-${i}`} className="group relative">
										<KeycapSlot rarity={def.rarity}>
											<span title={def.name}>{def.name[0]}</span>
										</KeycapSlot>
										{/* Tooltip & Sell button */}
										<div className="absolute top-full left-0 mt-2 hidden w-48 flex-col gap-2 rounded border border-line bg-bg-1 p-3 shadow-lg group-hover:flex z-10">
											<strong className="text-sm">{def.name}</strong>
											<p className="text-xs text-text-mid">{def.description}</p>
											<button 
												className="mt-1 rounded bg-bg-2 px-2 py-1 text-xs hover:bg-bg-2"
												onClick={() => api?.sellItem("keycap", i)}
											>
												Sell (+{Math.floor(def.basePrice / 2)})
											</button>
										</div>
									</div>
								)
							})}
							{Array.from({ length: 5 - state.keycaps.length }).map((_, i) => (
								<KeycapSlot key={`empty-k-${i}`} rarity="common" className="opacity-20" />
							))}
						</div>
					</div>

					<div>
						<h4 className="mb-2 text-sm text-text-mid">Macros ({state.macros.length}/2)</h4>
						<div className="flex flex-wrap gap-3">
							{state.macros.map((id, i) => {
								const def = MACROS[id]
								return (
									<div key={`inv-m-${i}`} className="group relative">
										<KeycapSlot rarity={def.rarity} className="rounded-sm">
											<span title={def.name}>{def.name.substring(0, 3)}</span>
										</KeycapSlot>
										{/* Tooltip & Sell button */}
										<div className="absolute top-full left-0 mt-2 hidden w-48 flex-col gap-2 rounded border border-line bg-bg-1 p-3 shadow-lg group-hover:flex z-10">
											<strong className="text-sm">{def.name}</strong>
											<p className="text-xs text-text-mid">{def.description}</p>
											<button 
												className="mt-1 rounded bg-bg-2 px-2 py-1 text-xs hover:bg-bg-2"
												onClick={() => api?.sellItem("macro", i)}
											>
												Sell (+{Math.floor(def.basePrice / 2)})
											</button>
										</div>
									</div>
								)
							})}
							{Array.from({ length: 2 - state.macros.length }).map((_, i) => (
								<KeycapSlot key={`empty-m-${i}`} rarity="macro" className="rounded-sm opacity-20" />
							))}
						</div>
					</div>
				</section>

				{/* SHOP ITEMS */}
				<section>
					<div className="mb-4 flex items-center justify-between">
						<h3 className="font-bold uppercase tracking-widest text-text-hi">For Sale</h3>
						<GhostButton 
							onClick={() => api?.rerollShop()}
							disabled={state.tokens < state.rerollCost}
							className="h-8 text-xs px-3"
						>
							Reroll ({state.rerollCost})
						</GhostButton>
					</div>

					<div className="flex flex-col gap-4">
						{state.shopKeycaps.map((id, i) => {
							if (!id) return null // bought
							const def = KEYCAPS[id]
							const canBuy = state.tokens >= def.basePrice && state.keycaps.length < 5
							return (
								<div key={`shop-k-${i}`} className="flex items-center justify-between rounded-lg border border-line bg-bg-1 p-4">
									<div className="flex items-center gap-4">
										<KeycapSlot rarity={def.rarity}>{def.name[0]}</KeycapSlot>
										<div>
											<strong className="block text-sm">{def.name}</strong>
											<span className="text-xs text-text-mid">{def.description}</span>
										</div>
									</div>
									<button 
										disabled={!canBuy}
										onClick={() => api?.buyItem("keycap", i)}
										className="rounded bg-bg-2 px-4 py-2 text-sm font-bold text-acc-yellow hover:bg-bg-2 disabled:opacity-30"
									>
										{def.basePrice} TOKENS
									</button>
								</div>
							)
						})}

						{state.shopMacro && (() => {
							const id = state.shopMacro
							const def = MACROS[id]
							const canBuy = state.tokens >= def.basePrice && state.macros.length < 2
							return (
								<div className="flex items-center justify-between rounded-lg border border-line bg-bg-1 p-4 mt-4">
									<div className="flex items-center gap-4">
										<KeycapSlot rarity={def.rarity} className="rounded-sm">{def.name.substring(0,3)}</KeycapSlot>
										<div>
											<strong className="block text-sm text-acc-blue">MACRO: {def.name}</strong>
											<span className="text-xs text-text-mid">{def.description}</span>
										</div>
									</div>
									<button 
										disabled={!canBuy}
										onClick={() => api?.buyItem("macro", 0)}
										className="rounded bg-bg-2 px-4 py-2 text-sm font-bold text-acc-yellow hover:bg-bg-2 disabled:opacity-30"
									>
										{def.basePrice} TOKENS
									</button>
								</div>
							)
						})()}
					</div>
				</section>
			</div>

			<footer className="mt-auto flex justify-end pt-8 border-t border-line">
				<PrimaryButton onClick={() => api?.leaveShop()} className="px-12">
					NEXT STAGE
				</PrimaryButton>
			</footer>
		</main>
		</Screen>
	)
}
