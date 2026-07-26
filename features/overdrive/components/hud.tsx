"use client"

import { useShallow } from "zustand/react/shallow"
import {
	PauseIcon,
	SoundOffIcon,
	SoundOnIcon,
	TypecadeMark,
	ItemGlyph,
} from "@/components/overdrive/icons"
import {
	ItemTooltipContent,
	KeycapSlot,
	QuotaBar,
} from "@/components/overdrive/ui"
import { GLITCHES, KEYCAPS, MACROS } from "@/lib/engine/overdrive/items"
import { usePresentationEvents } from "../presentation/use-presentation-events"
import { STAGE_COPY } from "../presentation/stage-copy"
import { useSettings } from "../settings/store"
import { useGame } from "../store"

export function formatTime(milliseconds: number) {
	const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1_000))
	const minutes = Math.floor(totalSeconds / 60)
	const seconds = totalSeconds % 60
	return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

export function formatNumber(value: number) {
	return value.toLocaleString("en-US", { maximumFractionDigits: 1 })
}

const stageColor = {
	warmup: "text-acc-green",
	rush: "text-acc-pink",
	glitch: "text-acc-red",
} as const

function Metric({
	label,
	value,
	color = "text-text-hi",
	align = "left",
}: {
	label: string
	value: string
	color?: string
	align?: "left" | "right"
}) {
	return (
		<div className={align === "right" ? "text-right" : ""}>
			<div className="text-sm font-bold uppercase tracking-[0.08em] text-text-mid">{label}</div>
			<div className={`mt-1 text-2xl font-bold tabular-nums ${color}`}>{value}</div>
		</div>
	)
}

export function Hud() {
	const state = useGame(useShallow((snapshot) => ({
		zone: snapshot.zone,
		stage: snapshot.stage,
		timeLeftMs: snapshot.timeLeftMs,
		score: snapshot.score,
		quota: snapshot.quota,
		tokens: snapshot.tokens,
		wpm: snapshot.wpm,
		accuracy: snapshot.accuracy,
		combo: snapshot.combo,
		mult: snapshot.mult,
		currentWord: snapshot.currentWord,
		keycaps: snapshot.keycaps,
		macros: snapshot.macros,
		activeGlitch: snapshot.activeGlitch,
		aegisActive: snapshot.aegisActive,
		aegisRescues: snapshot.aegisRescues,
		stageRescued: snapshot.stageRescued,
		focusPaused: snapshot.focusPaused,
		threatBand: snapshot.threatBand,
		overdriveCharge: snapshot.overdriveCharge,
		armedItemIds: snapshot.armedItemIds,
		setPaused: snapshot.setPaused,
		api: snapshot.api,
	})))
	const { soundMuted, setSoundMuted } = useSettings(useShallow((settings) => ({
		soundMuted: settings.soundMuted,
		setSoundMuted: settings.setSoundMuted,
	})))
	const events = usePresentationEvents()
	const wordBoundaries = events
		.map((event, index) => event.type === "word-completed" ? index : -1)
		.filter((index) => index >= 0)
	const latestBoundary = wordBoundaries.at(-1)
	const previousBoundary = wordBoundaries.at(-2) ?? -1
	const batch = latestBoundary === undefined
		? events.slice(-8)
		: events.slice(previousBoundary + 1, latestBoundary + 1)
	const triggeredItems = new Map(
		batch
			.filter((event) => event.type === "item-triggered")
			.map((event) => [event.itemId, event.id]),
	)
	const latestMacro = [...events].reverse().find(
		(event) => event.type === "macro-used",
	)
	const stageCopy = STAGE_COPY[state.stage]
	const glitch = state.activeGlitch ? GLITCHES[state.activeGlitch] : null
	const quotaRatio = state.quota <= 0 ? 0 : state.score / state.quota
	const scoreRemaining = Math.max(0, state.quota - state.score)
	const comboProgress = state.combo % 10

	return (
		<div className="pointer-events-none absolute inset-0 z-20 flex select-none flex-col p-3 text-text-hi sm:p-6">
			<header className="grid h-16 grid-cols-[1fr_auto_1fr] items-start gap-3">
				<div className="flex min-w-0 items-center gap-2 sm:gap-3">
					<TypecadeMark className="h-8 w-8 shrink-0 text-acc-green" />
					<div className="min-w-0">
						<div className="hidden text-sm font-bold uppercase tracking-[0.08em] text-text-mid sm:block">
							TYPECADE
						</div>
						<div className={`hidden truncate text-sm font-bold uppercase tracking-[0.08em] sm:block ${stageColor[state.stage]}`}>
							Z{state.zone} · {stageCopy.label}
						</div>
						<div className={`hidden text-xs font-bold uppercase tracking-[0.08em] sm:block ${
							state.aegisActive ? "text-acc-cyan" : "text-text-mid"
						}`}>
							{state.aegisActive
								? `AEGIS ACTIVE${state.aegisRescues > 0 ? ` · ${state.aegisRescues} DEFLECT` : ""}`
								: state.threatBand}
						</div>
						<div className="text-xs font-bold uppercase tracking-normal sm:hidden">
							<div className="text-text-hi">Z{state.zone}</div>
							<div className={`whitespace-nowrap ${stageColor[state.stage]}`}>{stageCopy.label}</div>
							<div className={state.aegisActive ? "text-acc-cyan" : "text-text-mid"}>
								{state.aegisActive ? "AEGIS" : state.threatBand}
							</div>
						</div>
					</div>
				</div>

				<div className="text-center">
					<div className={`text-3xl font-bold tabular-nums ${state.focusPaused ? "text-acc-cyan" : ""}`}>
						{formatTime(state.timeLeftMs)}
					</div>
					<div className={`mt-1 text-sm font-bold uppercase tracking-[0.08em] ${
						state.focusPaused ? "text-acc-cyan" : "text-text-mid"
					}`}>
						{state.focusPaused
							? <>
								FOCUS PAUSE
								<span className="hidden sm:inline"> · TYPE WHEN READY</span>
							</>
							: "TIME"}
					</div>
				</div>

				<div className="pointer-events-auto flex items-center justify-end gap-2">
					<div className="mr-1 text-right">
						<div className="text-xl font-bold tabular-nums text-acc-yellow">{formatNumber(state.tokens)}</div>
						<div className="text-sm uppercase tracking-[0.08em] text-text-mid">TOKENS</div>
					</div>
					<button
						className="flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-bg-1 text-text-mid hover:bg-bg-2 hover:text-text-hi"
						onClick={() => setSoundMuted(!soundMuted)}
						aria-label={soundMuted ? "Unmute sound" : "Mute sound"}
					>
						{soundMuted
							? <SoundOffIcon className="h-5 w-5" />
							: <SoundOnIcon className="h-5 w-5" />}
					</button>
					<button
						className="flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-bg-1 text-text-mid hover:bg-bg-2 hover:text-text-hi"
						onClick={() => state.setPaused(true)}
						aria-label="Pause game"
					>
						<PauseIcon className="h-5 w-5" />
					</button>
				</div>
			</header>

			<div className="mt-2">
				<div className="mb-2 flex items-center justify-between gap-4 text-sm font-bold uppercase tracking-[0.08em]">
					<span className="flex items-center gap-3 text-text-mid">
						QUOTA
						{quotaRatio >= 0.9 && scoreRemaining > 0 && (
							<span className="text-acc-green">{formatNumber(scoreRemaining)} TO BREACH</span>
						)}
					</span>
					<span className="tabular-nums">
						<span className="text-acc-yellow">{formatNumber(state.score)}</span>
						<span className="text-text-mid"> / {formatNumber(state.quota)}</span>
					</span>
				</div>
				<QuotaBar current={state.score} target={state.quota} />
			</div>

			{glitch && (
				<div className="mx-auto mt-3 flex max-w-xl items-center gap-3 border-l-2 border-acc-red bg-bg-1 px-3 py-2 text-sm">
					<strong className="uppercase tracking-[0.08em] text-acc-red">{glitch.name}</strong>
					<span className="text-text-mid">{glitch.description}</span>
				</div>
			)}

			<div className="mt-2 grid grid-cols-4 border-y border-line bg-bg-0/80 py-2 text-center sm:hidden">
				<div>
					<div className="text-xs font-bold uppercase text-text-mid">Combo</div>
					<div className="mt-1 font-bold tabular-nums text-acc-pink">{state.combo}</div>
				</div>
				<div className="border-l border-line">
					<div className="text-xs font-bold uppercase text-text-mid">Mult</div>
					<div className="mt-1 font-bold tabular-nums text-acc-violet">×{formatNumber(state.mult)}</div>
				</div>
				<div className="border-l border-line">
					<div className="text-xs font-bold uppercase text-text-mid">Base</div>
					<div className="mt-1 font-bold tabular-nums text-text-hi">{state.currentWord.length}</div>
				</div>
				<div className="border-l border-line">
					<div className="text-xs font-bold uppercase text-text-mid">Score</div>
					<div className="mt-1 font-bold tabular-nums text-acc-yellow">{formatNumber(state.score)}</div>
				</div>
				<div
					className="col-span-4 mx-2 mt-2 flex gap-1"
					aria-label={`${comboProgress} of 10 clean words to the next Mult`}
				>
					{Array.from({ length: 10 }, (_, index) => (
						<span
							key={`mobile-combo-segment-${index}`}
							className={`h-1 flex-1 ${index < comboProgress ? "bg-acc-pink" : "bg-bg-2"}`}
						/>
					))}
				</div>
			</div>

			<div className="flex min-h-0 flex-1 items-center justify-between">
				<div className="hidden border-l-2 border-acc-pink bg-bg-0/80 px-3 py-3 sm:block">
					<Metric label="COMBO" value={String(state.combo)} color="text-acc-pink" />
					<div className="mt-3 flex w-32 gap-1" aria-label={`${comboProgress} of 10 clean words to the next Mult`}>
						{Array.from({ length: 10 }, (_, index) => (
							<span
								key={`combo-segment-${index}`}
								className={`h-1 flex-1 ${index < comboProgress ? "bg-acc-pink" : "bg-bg-2"}`}
							/>
						))}
					</div>
					<div className="mt-2 text-sm font-bold uppercase tracking-[0.08em] text-text-mid">
						{comboProgress} / 10 TO MULT
					</div>
					<div className="mt-6">
					<Metric label="MULT" value={`×${formatNumber(state.mult)}`} color="text-acc-violet" />
					</div>
				</div>
				<div className="hidden flex-col gap-6 border-r-2 border-acc-yellow bg-bg-0/80 px-3 py-3 sm:flex">
					<Metric label="BASE" value={String(state.currentWord.length)} align="right" />
					<Metric label="SCORE" value={formatNumber(state.score)} color="text-acc-yellow" align="right" />
				</div>
			</div>

			<div className="pointer-events-auto flex min-h-0 items-end justify-center gap-2 sm:min-h-24 sm:gap-6">
				<div>
					<div className="mb-2 hidden text-center text-sm font-bold uppercase tracking-[0.08em] text-text-mid sm:block">
						KEYCAP BUILD
					</div>
					<div className="flex gap-1 sm:gap-3">
						{Array.from({ length: 5 }).map((_, index) => {
							const id = state.keycaps[index]
							if (!id) return (
								<KeycapSlot
									key={`keycap-slot-${index}`}
									empty
									className="h-11 w-11 sm:h-16 sm:w-16"
									aria-label={`Empty Keycap slot ${index + 1}`}
								/>
							)
							const definition = KEYCAPS[id]
							const triggerId = triggeredItems.get(id)
							const triggered = triggerId !== undefined
							const armed = state.armedItemIds.includes(id)
							return (
								<KeycapSlot
									key={`keycap-slot-${index}`}
									rarity={definition.rarity}
									className={`h-11 w-11 sm:h-16 sm:w-16 ${armed ? "overdrive-slot-armed" : ""}`}
									data-armed={armed || undefined}
									aria-label={`${definition.name} Keycap`}
									tooltip={
										<ItemTooltipContent
											name={definition.name}
											rarity={definition.rarity}
											description={definition.description}
										/>
									}
								>
									<span
										key={`keycap-proc-${index}-${triggerId ?? 0}`}
										className={`flex items-center justify-center ${
											triggered ? "overdrive-slot-proc" : ""
										}`}
									>
										<ItemGlyph id={id} type="keycap" className="h-7 w-7 sm:h-8 sm:w-8" />
									</span>
								</KeycapSlot>
							)
						})}
					</div>
				</div>

				<div className="border-l border-line pl-2 sm:pl-6">
					<div className="mb-2 hidden text-center text-sm font-bold uppercase tracking-[0.08em] text-text-mid sm:block">
						MACROS
					</div>
					<div className="flex gap-1 sm:gap-3">
						{Array.from({ length: 2 }).map((_, index) => {
							const id = state.macros[index]
							if (!id) return (
								<KeycapSlot
									key={`macro-slot-${index}`}
									empty
									className="h-11 w-11 sm:h-16 sm:w-16"
									aria-label={`Empty Macro slot ${index + 1}`}
								/>
							)
							const definition = MACROS[id]
							const triggered = latestMacro?.type === "macro-used"
								&& latestMacro.itemId === id
							return (
								<button
									key={`macro-slot-${index}`}
									className="relative"
									onClick={() => state.api?.triggerMacro(index)}
									aria-label={`Use ${definition.name}, keyboard shortcut ${index + 1}`}
								>
									<KeycapSlot
										rarity="macro"
										className="h-11 w-11 sm:h-16 sm:w-16"
									>
										<span
											key={`macro-proc-${index}-${triggered ? latestMacro.id : 0}`}
											className={`flex items-center justify-center ${
												triggered ? "overdrive-slot-proc" : ""
											}`}
										>
											<ItemGlyph id={id} type="macro" className="h-7 w-7 sm:h-8 sm:w-8" />
										</span>
									</KeycapSlot>
									<span className="absolute left-1 top-1 text-sm font-bold text-acc-cyan">{index + 1}</span>
								</button>
							)
						})}
					</div>
				</div>
			</div>

			<footer className="mt-3 flex h-8 items-end justify-between text-sm font-bold uppercase tracking-[0.08em] text-text-mid">
				<span>
					<span className={state.accuracy >= 97 ? "text-acc-green" : state.accuracy >= 90 ? "text-acc-yellow" : "text-acc-red"}>
						{state.accuracy}%
					</span>{" "}
					ACCURACY
				</span>
				<span className={state.overdriveCharge >= 100 ? "text-acc-yellow" : "text-acc-cyan"}>
					{state.overdriveCharge >= 100 && state.zone >= 3
						? "ENTER: OVERDRIVE"
						: `OVERDRIVE ${state.overdriveCharge}%`}
				</span>
				<span><span className="text-text-hi">{state.wpm}</span> WPM</span>
			</footer>
		</div>
	)
}
