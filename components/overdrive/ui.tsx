import type { ButtonHTMLAttributes, ReactNode, HTMLAttributes } from "react"

export type Rarity = "common" | "uncommon" | "rare" | "legendary" | "macro"

// Static class maps because Tailwind cannot see dynamic strings like `border-rarity-${rarity}`.
export const RARITY_BORDER: Record<Rarity, string> = {
	common: "border-rarity-common",
	uncommon: "border-rarity-uncommon",
	rare: "border-rarity-rare",
	legendary: "border-rarity-legendary",
	macro: "border-rarity-macro",
}

export const RARITY_BADGE: Record<Rarity, string> = {
	common: "text-rarity-common bg-rarity-common/12",
	uncommon: "text-rarity-uncommon bg-rarity-uncommon/12",
	rare: "text-rarity-rare bg-rarity-rare/12",
	legendary: "text-rarity-legendary bg-rarity-legendary/12",
	macro: "text-rarity-macro bg-rarity-macro/12",
}

export function PrimaryButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
	return (
		<button
			{...props}
			className={`h-11 rounded-lg bg-acc-green px-6 text-sm font-bold uppercase tracking-[0.08em] text-bg-0 hover:brightness-110 disabled:opacity-40 ${props.className ?? ""}`}
		/>
	)
}

export function GhostButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
	return (
		<button
			{...props}
			className={`h-11 rounded-lg border border-line px-6 text-sm font-bold uppercase tracking-[0.08em] text-text-hi hover:bg-bg-2 ${props.className ?? ""}`}
		/>
	)
}

export function HudLabel({ children }: { children: ReactNode }) {
	return <div className="text-sm font-bold uppercase tracking-[0.08em] text-text-mid">{children}</div>
}

export function QuotaBar({ current, target }: { current: number; target: number }) {
	const pct = target <= 0 ? 0 : Math.min(current / target, 1)
	return (
		<div className="h-3 overflow-hidden rounded-md bg-bg-2">
			<div
				className="h-full origin-left rounded-md bg-acc-green transition-transform duration-200 ease-out"
				style={{ transform: `scaleX(${pct})` }}
			/>
		</div>
	)
}

export type KeycapSlotProps = HTMLAttributes<HTMLDivElement> & {
	rarity?: Rarity
}

export function KeycapSlot({ rarity = "common", children, className = "", ...rest }: KeycapSlotProps) {
	// Simple color mapping based on rarity
	const colors = {
		common: "border-line text-text-hi",
		uncommon: "border-acc-green text-acc-green",
		rare: "border-acc-violet text-acc-violet",
		legendary: "border-acc-yellow text-acc-yellow",
		macro: "border-acc-cyan text-acc-cyan",
	}
	const color = colors[rarity]

	return (
		<div {...rest} className={`flex h-12 w-12 items-center justify-center rounded-lg border-2 bg-bg-1 font-pixel text-xl transition-all ${color} ${className}`}>
			{children}
		</div>
	)
}

export function RarityBadge({ rarity }: { rarity: Rarity }) {
	return (
		<span className={`rounded-full px-2 py-0.5 text-xs font-bold uppercase ${RARITY_BADGE[rarity]}`}>{rarity}</span>
	)
}
