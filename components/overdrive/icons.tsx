import { createElement, type ComponentType, type SVGProps } from "react"

type IconProps = SVGProps<SVGSVGElement>

function Glyph({ children, ...props }: IconProps) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="currentColor"
			width="1em"
			height="1em"
			aria-hidden="true"
			{...props}
		>
			{children}
		</svg>
	)
}

function StrokeIcon({ children, ...props }: IconProps) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			width="1em"
			height="1em"
			aria-hidden="true"
			{...props}
		>
			{children}
		</svg>
	)
}

export function TypecadeMark(props: IconProps) {
	return (
		<Glyph {...props}>
			<path d="M3 4h18v4H3zM3 10h7v10H3zm11 0h7v10h-7zM10 10h4v4h-4z" />
			<path d="M7 7h10v2H7zm2 9h6v4H9z" opacity=".45" />
		</Glyph>
	)
}

export function SoundOnIcon(props: IconProps) {
	return (
		<StrokeIcon {...props}>
			<path d="M4 10v4h4l5 4V6l-5 4H4Z" />
			<path d="M17 9a4 4 0 0 1 0 6M20 6a8 8 0 0 1 0 12" />
		</StrokeIcon>
	)
}

export function SoundOffIcon(props: IconProps) {
	return (
		<StrokeIcon {...props}>
			<path d="M4 10v4h4l5 4V6l-5 4H4Z" />
			<path d="m17 10 5 5m0-5-5 5" />
		</StrokeIcon>
	)
}

export function PauseIcon(props: IconProps) {
	return (
		<StrokeIcon {...props}>
			<path d="M8 5v14M16 5v14" />
		</StrokeIcon>
	)
}

export function PlayIcon(props: IconProps) {
	return (
		<Glyph {...props}>
			<path d="m7 4 13 8-13 8V4Z" />
		</Glyph>
	)
}

export function IconWasd(props: IconProps) {
	return (
		<Glyph {...props}>
			<path d="M9 2h6v6H9V2ZM2 10h6v6H2v-6Zm7 0h6v6H9v-6Zm7 0h6v6h-6v-6ZM4 18h16v4H4v-4Z" />
		</Glyph>
	)
}

export function IconVowelMagnet(props: IconProps) {
	return (
		<Glyph {...props}>
			<path d="M3 3h6v9a3 3 0 0 0 6 0V3h6v9a9 9 0 0 1-18 0V3Zm3 0h3v3H6V3Zm9 0h3v3h-3V3Z" />
		</Glyph>
	)
}

export function IconLongshot(props: IconProps) {
	return (
		<Glyph {...props}>
			<path d="M3 11h12V7l7 5-7 5v-4H3v-2Zm1-6h10v3H4V5Zm0 11h10v3H4v-3Z" />
		</Glyph>
	)
}

export function IconSprinter(props: IconProps) {
	return (
		<Glyph {...props}>
			<path d="m14 1-4 9h5l-6 13 2-10H6l8-12ZM2 6h7L7.5 9H2V6Zm0 10h6l-.7 3H2v-3Z" />
		</Glyph>
	)
}

export function IconSecondWind(props: IconProps) {
	return (
		<Glyph {...props}>
			<path d="M3 7h10a3 3 0 1 0-3-3H7a6 6 0 1 1 6 6H3V7Zm0 5h15a4 4 0 1 1-4 4h3a1 1 0 1 0 1-1H3v-3Zm0 5h8v3H3v-3Z" />
		</Glyph>
	)
}

export function IconCopperKey(props: IconProps) {
	return (
		<Glyph {...props}>
			<path fillRule="evenodd" d="M9 3a6 6 0 1 0 4.7 9.7L16 15h3v3h3v-5l-5.3-5.3A6 6 0 0 0 9 3Zm0 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
		</Glyph>
	)
}

export function IconHomeRow(props: IconProps) {
	return (
		<Glyph {...props}>
			<path d="M2 7h4v4H2V7Zm5 0h4v4H7V7Zm5 0h4v4h-4V7Zm5 0h5v4h-5V7ZM2 13h5v4H2v-4Zm6 0h8v4H8v-4Zm9 0h5v4h-5v-4ZM5 19h14v3H5v-3Z" />
		</Glyph>
	)
}

export function IconPunctuator(props: IconProps) {
	return (
		<Glyph {...props}>
			<path d="M4 3h6v11H4V3Zm0 14h6v4H4v-4Zm10-14h6v12l-3 6h-3l2-6h-2V3Z" />
		</Glyph>
	)
}

export function IconComboBattery(props: IconProps) {
	return (
		<Glyph {...props}>
			<path d="M3 6h16a2 2 0 0 1 2 2v2h2v4h-2v2a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm2 3v6h4V9H5Zm6 0v6h6V9h-6Z" />
		</Glyph>
	)
}

export function IconOverclock(props: IconProps) {
	return (
		<Glyph {...props}>
			<path d="M12 2a10 10 0 0 0-8.7 15h4.1A6 6 0 1 1 17 17h4A10 10 0 0 0 12 2Zm-1 9 7-5-5 7a2 2 0 1 1-2-2ZM4 19h16v3H4v-3Z" />
		</Glyph>
	)
}

export function IconDoubleTap(props: IconProps) {
	return (
		<Glyph {...props}>
			<path d="M3 4h8v8H3V4Zm10 0h8v8h-8V4ZM3 14h8v6H3v-6Zm10 0h8v6h-8v-6ZM6 7h2v2H6V7Zm10 0h2v2h-2V7Z" />
		</Glyph>
	)
}

export function IconSnowball(props: IconProps) {
	return (
		<Glyph {...props}>
			<path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm-1 4h3v4h4v3h-4v5h-3v-5H6v-3h5V6Z" />
		</Glyph>
	)
}

export function IconInterestBank(props: IconProps) {
	return (
		<Glyph {...props}>
			<path d="m12 2 10 5v3H2V7l10-5ZM4 12h3v7H4v-7Zm6 0h4v7h-4v-7Zm7 0h3v7h-3v-7ZM2 20h20v3H2v-3Z" />
		</Glyph>
	)
}

export function IconGlassKeycap(props: IconProps) {
	return (
		<Glyph {...props}>
			<path d="M5 2h14l3 18H2L5 2Zm3 4-2 10h12L16 6H8Zm3 1h3l-2 4 3 1-5 4 2-4-3-1 2-4Z" />
		</Glyph>
	)
}

export function IconVampire(props: IconProps) {
	return (
		<Glyph {...props}>
			<path d="M3 3h6l3 5 3-5h6l-3 18-6-5-6 5L3 3Zm5 4 1 7 3-2 3 2 1-7-4 6-4-6Z" />
		</Glyph>
	)
}

export function IconEscape(props: IconProps) {
	return (
		<Glyph {...props}>
			<path d="M3 3h12v5H8v8h7v5H3V3Zm11 6 8 3-8 3v-2h-4v-2h4V9Z" />
		</Glyph>
	)
}

export function IconTimeFreeze(props: IconProps) {
	return (
		<Glyph {...props}>
			<path d="M10 2h4v3h-4V2Zm2 4a8 8 0 1 0 8 8 8 8 0 0 0-8-8Zm1 3v4l4 2-1 2-6-3V9h3ZM3 4h5v3H3V4Zm13 0h5v3h-5V4Z" />
		</Glyph>
	)
}

export function IconQuotaSlash(props: IconProps) {
	return (
		<Glyph {...props}>
			<path d="M3 5h18v4H3V5Zm0 10h18v4H3v-4ZM17 2h4L7 22H3L17 2Z" />
		</Glyph>
	)
}

export function IconInsurance(props: IconProps) {
	return (
		<Glyph {...props}>
			<path d="m12 2 9 4v6c0 5-3.7 8.6-9 10-5.3-1.4-9-5-9-10V6l9-4Zm-1 5v4H7v3h4v4h3v-4h4v-3h-4V7h-3Z" />
		</Glyph>
	)
}

const KEYCAP_ICONS: Record<string, ComponentType<IconProps>> = {
	wasd: IconWasd,
	vowel_magnet: IconVowelMagnet,
	longshot: IconLongshot,
	sprinter: IconSprinter,
	second_wind: IconSecondWind,
	copper_key: IconCopperKey,
	home_row: IconHomeRow,
	punctuator: IconPunctuator,
	combo_battery: IconComboBattery,
	overclock: IconOverclock,
	double_tap: IconDoubleTap,
	snowball: IconSnowball,
	interest_bank: IconInterestBank,
	glass_keycap: IconGlassKeycap,
	vampire: IconVampire,
}

const MACRO_ICONS: Record<string, ComponentType<IconProps>> = {
	escape: IconEscape,
	time_freeze: IconTimeFreeze,
	quota_slash: IconQuotaSlash,
	insurance: IconInsurance,
}

export function getIconFor(id: string, type: "keycap" | "macro") {
	const icon = type === "keycap" ? KEYCAP_ICONS[id] : MACRO_ICONS[id]
	if (!icon) throw new Error(`Missing Typecade Glyph for ${type} "${id}"`)
	return icon
}

export function ItemGlyph({
	id,
	type,
	...props
}: IconProps & { id: string; type: "keycap" | "macro" }) {
	return createElement(getIconFor(id, type), props)
}
