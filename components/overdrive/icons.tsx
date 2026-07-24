import type { SVGProps } from "react"

function Svg(props: SVGProps<SVGSVGElement>) {
	return <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" aria-hidden {...props} />
}

// WASD: four key squares in the classic layout
export function IconWasd(props: SVGProps<SVGSVGElement>) {
	return (
		<Svg {...props}>
			<rect x="9" y="2" width="6" height="6" rx="1" />
			<rect x="2" y="10" width="6" height="6" rx="1" />
			<rect x="9" y="10" width="6" height="6" rx="1" />
			<rect x="16" y="10" width="6" height="6" rx="1" />
		</Svg>
	)
}

// Vowel Magnet: horseshoe magnet
export function IconVowelMagnet(props: SVGProps<SVGSVGElement>) {
	return (
		<Svg {...props}>
			<path d="M6 3h4v8a2 2 0 0 0 4 0V3h4v8a6 6 0 0 1-12 0V3z" />
		</Svg>
	)
}

// Sprinter: lightning bolt
export function IconSprinter(props: SVGProps<SVGSVGElement>) {
	return (
		<Svg {...props}>
			<path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />
		</Svg>
	)
}

// Combo Battery: battery block with terminal
export function IconComboBattery(props: SVGProps<SVGSVGElement>) {
	return (
		<Svg {...props}>
			<path d="M4 7h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" />
			<rect x="21" y="10" width="2" height="4" rx="0.5" />
		</Svg>
	)
}

// Overclock: gauge with needle
export function IconOverclock(props: SVGProps<SVGSVGElement>) {
	return (
		<Svg {...props}>
			<path d="M12 4a9 9 0 0 0-7.6 13.8l1.7-1A7 7 0 1 1 19 13c0 1.4-.4 2.6-1.1 3.7l1.7 1A9 9 0 0 0 12 4z" />
			<path d="M10.9 13.9a1.5 1.5 0 0 0 2.5-1.1c0-.2 0-.4-.1-.6L17 7l-5.6 4.5a1.5 1.5 0 0 0-.5 2.4z" />
		</Svg>
	)
}

export const KEYCAP_ICONS = {
	wasd: IconWasd,
	vowelMagnet: IconVowelMagnet,
	sprinter: IconSprinter,
	comboBattery: IconComboBattery,
	overclock: IconOverclock,
} as const
