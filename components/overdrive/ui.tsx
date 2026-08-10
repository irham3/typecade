import type {
	ButtonHTMLAttributes,
	HTMLAttributes,
	ReactNode,
} from "react"

export type Rarity = "common" | "uncommon" | "rare" | "legendary" | "macro"

export const RARITY_BORDER: Record<Rarity, string> = {
	common: "border-rarity-common",
	uncommon: "border-rarity-uncommon",
	rare: "border-rarity-rare",
	legendary: "border-rarity-legendary",
	macro: "border-rarity-macro",
}

export const RARITY_TEXT: Record<Rarity, string> = {
	common: "text-rarity-common",
	uncommon: "text-rarity-uncommon",
	rare: "text-rarity-rare",
	legendary: "text-rarity-legendary",
	macro: "text-rarity-macro",
}

export const RARITY_BADGE: Record<Rarity, string> = {
	common: "bg-rarity-common/10 text-rarity-common",
	uncommon: "bg-rarity-uncommon/10 text-rarity-uncommon",
	rare: "bg-rarity-rare/10 text-rarity-rare",
	legendary: "bg-rarity-legendary/10 text-rarity-legendary",
	macro: "bg-rarity-macro/10 text-rarity-macro",
}

export function PrimaryButton({
	className = "",
	...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
	return <button {...props} className={`overdrive-primary ${className}`} />
}

export function GhostButton({
	className = "",
	...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
	return <button {...props} className={`overdrive-ghost ${className}`} />
}

export function HudLabel({ children }: { children: ReactNode }) {
	return <div className="text-sm font-bold uppercase tracking-[0.08em] text-text-mid">{children}</div>
}

export function QuotaBar({
	current,
	target,
}: {
	current: number
	target: number
}) {
	const ratio = target <= 0 ? 0 : Math.min(current / target, 1)
	return (
		<div className="h-3 overflow-hidden rounded-md bg-bg-2" aria-hidden="true">
			<div
				className="h-full origin-left rounded-md bg-acc-green transition-transform duration-200 ease-out"
				style={{ transform: `scaleX(${ratio})` }}
			/>
		</div>
	)
}

export type KeycapSlotProps = HTMLAttributes<HTMLDivElement> & {
	rarity?: Rarity
	tooltip?: ReactNode
	empty?: boolean
}

export function KeycapSlot({
	rarity = "common",
	children,
	className = "",
	tooltip,
	empty = false,
	"aria-label": ariaLabel,
	...props
}: KeycapSlotProps) {
	return (
		<div
			{...props}
			tabIndex={tooltip ? 0 : undefined}
			aria-label={ariaLabel}
			className={`group relative flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border-2 bg-bg-1 text-3xl text-text-hi focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acc-cyan ${empty ? "border-dashed border-line" : RARITY_BORDER[rarity]} ${className}`}
		>
			{children}
			{tooltip && (
				<div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus:opacity-100">
					{tooltip}
				</div>
			)}
		</div>
	)
}

export function ItemTooltipContent({
	name,
	rarity,
	description,
	price,
}: {
	name: string
	rarity: Rarity
	description: string
	price?: number
}) {
	return (
		<div className="flex w-65 flex-col gap-2 rounded-lg border border-line bg-bg-2 p-3 text-left">
			<div className="flex items-start justify-between gap-3">
				<strong className="text-base text-text-hi">{name}</strong>
				<RarityBadge rarity={rarity} />
			</div>
			<p className="text-sm leading-6 text-text-mid">{description}</p>
			<p className="text-sm font-bold uppercase tracking-[0.08em] text-acc-yellow">
				{price === undefined ? "EQUIPPED" : `${price} TOKENS`}
			</p>
		</div>
	)
}

export function RarityBadge({ rarity }: { rarity: Rarity }) {
	return (
		<span className={`rounded-full px-2 py-1 text-sm font-bold uppercase ${RARITY_BADGE[rarity]}`}>
			{rarity}
		</span>
	)
}
