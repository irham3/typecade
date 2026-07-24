"use client"
import { useGame } from "../store"
import { KEYCAP_ICONS } from "@/components/overdrive/icons"
import { HudLabel, QuotaBar, KeycapSlot } from "@/components/overdrive/ui"
import { WordStream } from "./word-stream"
import { KEYCAPS, MACROS, GLITCHES } from "@/lib/engine/overdrive/items"

export function formatTime(ms: number) {
	const totalSeconds = Math.ceil(ms / 1000)
	const minutes = Math.floor(totalSeconds / 60)
	const seconds = totalSeconds % 60
	return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export function formatNumber(num: number) {
	return num.toLocaleString('en-US')
}

export function Hud() {
	const state = useGame()

	return (
		<main id="game-root" className="grid min-h-dvh grid-rows-[64px_32px_1fr_96px_32px] gap-y-2 px-6">
			{/* Row 1: top bar h-64px */}
			<header className="flex items-center justify-between">
				<div className="flex flex-col">
					<span className="font-pixel text-base">TYPECADE</span>
					{state.activeGlitch && (
						<span className="text-xs font-bold text-acc-red animate-pulse">
							WARNING: {GLITCHES[state.activeGlitch]?.name.toUpperCase()}
						</span>
					)}
				</div>
				<span className="text-sm font-bold uppercase tracking-[0.08em] text-acc-cyan">
					Zone {state.zone} - {state.stage}
				</span>
				<span className="text-2xl font-bold tabular-nums">{formatTime(state.timeLeftMs)}</span>
				<span className="text-2xl font-bold tabular-nums text-acc-yellow">{formatNumber(state.tokens)}</span>
			</header>

			{/* Row 2: quota bar h-32px */}
			<div className="flex items-center gap-3">
				<HudLabel>Quota</HudLabel>
				<div className="flex-1"><QuotaBar current={state.score} target={state.quota} /></div>
				<span className="text-sm tabular-nums text-text-mid">
					{formatNumber(state.score)} / {formatNumber(state.quota)}
				</span>
			</div>

			{/* Row 3: combo/mult left, word stream center, base/score right */}
			<section className="grid grid-cols-[160px_1fr_160px] items-center">
				<div className="flex flex-col gap-6">
					<div><HudLabel>Combo</HudLabel><div className="text-2xl font-bold text-acc-pink tabular-nums">{state.combo}</div></div>
					<div><HudLabel>Mult</HudLabel><div id="mult-value" className="text-2xl font-bold text-acc-violet tabular-nums">x{state.mult}</div></div>
				</div>
				
				<div className={`transition-opacity duration-1000 ${state.activeGlitch === 'invisible_ink' && state.caretIndex > 0 ? 'opacity-0' : 'opacity-100'}`}>
					<WordStream 
						currentWord={state.currentWord} 
						upcomingWords={state.upcomingWords}
						caretIndex={state.caretIndex}
						wordDirty={state.wordDirty}
					/>
				</div>
				
				<div className="flex flex-col items-end gap-6 text-right">
					<div><HudLabel>Base</HudLabel><div className="text-2xl font-bold tabular-nums">--</div></div>
					<div><HudLabel>Score</HudLabel><div className="text-2xl font-bold text-acc-yellow tabular-nums">{formatNumber(state.score)}</div></div>
				</div>
			</section>

			{/* Row 4: keycap row h-96px */}
			<div className="flex items-center justify-center gap-6">
				{/* Keycaps */}
				<div className="flex gap-3">
					{state.keycaps.map((id, i) => {
						const def = KEYCAPS[id]
						const Icon = KEYCAP_ICONS[id as keyof typeof KEYCAP_ICONS]
						return (
							<div key={`k-${i}`} className="group relative">
								<KeycapSlot rarity={def.rarity}>
									{Icon ? <Icon className={`text-2xl text-rarity-${def.rarity}`} /> : <span>{def.name[0]}</span>}
								</KeycapSlot>
								<div className="absolute bottom-full left-1/2 mb-2 hidden w-48 -translate-x-1/2 flex-col gap-1 rounded bg-bg-2 p-2 shadow-lg group-hover:flex z-20 text-center border border-line">
									<strong className="text-xs">{def.name}</strong>
									<span className="text-[10px] text-text-mid leading-tight">{def.description}</span>
								</div>
							</div>
						)
					})}
					{Array.from({ length: 5 - state.keycaps.length }).map((_, i) => (
						<KeycapSlot key={`e-${i}`} rarity="common" className="opacity-10 border-dashed" />
					))}
				</div>

				{/* Macros */}
				{state.macros.length > 0 && (
					<div className="flex gap-3 pl-6 border-l border-line">
						{state.macros.map((id, i) => {
							const def = MACROS[id]
							const Icon = KEYCAP_ICONS[id as keyof typeof KEYCAP_ICONS]
							return (
								<div key={`m-${i}`} className="group relative">
									<button 
										onClick={() => state.api?.triggerMacro(i)}
										className="transition-transform active:scale-95"
									>
										<KeycapSlot rarity={def.rarity} className="rounded-sm cursor-pointer hover:border-acc-blue hover:text-acc-blue">
											{Icon ? <Icon className={`text-2xl text-rarity-${def.rarity}`} /> : <span>{def.name.substring(0,3)}</span>}
										</KeycapSlot>
									</button>
									<div className="absolute bottom-full left-1/2 mb-2 hidden w-48 -translate-x-1/2 flex-col gap-1 rounded bg-bg-2 p-2 shadow-lg group-hover:flex z-20 text-center border border-line">
										<strong className="text-xs text-acc-blue">Use: {def.name}</strong>
										<span className="text-[10px] text-text-mid leading-tight">{def.description}</span>
									</div>
								</div>
							)
						})}
					</div>
				)}
			</div>

			{/* Row 5: footer h-32px */}
			<footer className="flex items-center justify-between text-sm text-text-mid">
				<span>{state.accuracy}% accuracy</span>
				<span>-- wpm</span>
			</footer>
		</main>
	)
}
