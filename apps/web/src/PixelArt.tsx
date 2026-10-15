import type { CSSProperties } from "react"
const palette = ["#c57850", "#bdb465", "#72a4a1", "#d49452", "#e18c6b", "#87aaa3", "#db6447", "#66848f", "#739a8b", "#41676d"]
export function FishArtwork({ assetKey, alt = "" }: { assetKey: string; alt?: string }) {
 const keys = ["fish_pebble_goby", "fish_kelp_darter", "fish_sunny_guppy", "fish_shellback_puffer", "fish_tide_skipper", "fish_coral_fry", "fish_glass_eel", "fish_moonfin_snapper", "fish_reef_shark", "fish_crown_leviathan"]
 const index = Math.max(0, keys.indexOf(assetKey))
 return <svg className="fish-art" viewBox="0 0 120 72" role={alt ? "img" : undefined} aria-label={alt || undefined} aria-hidden={!alt} style={{ "--fish-color": palette[index] } as CSSProperties}><path d="M20 33 8 19 8 52 25 43 38 57 72 58 100 43 110 33 92 22 63 15 34 21Z" fill="var(--fish-color)" stroke="#233a3b" strokeWidth="3"/><path d="m44 19 9-14 16 12M41 51l13 15 15-9" fill="var(--fish-color)" stroke="#233a3b" strokeWidth="3"/><path d="m34 40 32 12 32-13-24 19-35-3Z" fill="#edbd89"/><path d="m46 24 22-4 25 9-21-3Z" fill="#f4d1a0"/><path d="m81 30-4 16M48 33l8 9-16 4" fill="none" stroke="#82583e" strokeWidth="3"/><path d="M92 28h7v7h-7z" fill="#21393a"/><path d="M93 28h3v3h-3z" fill="#fff0cc"/></svg>
}
const glyphs: Record<string, string> = {
 fish: "M3 10 1 5v14l6-5 5 4 9-3 3-5-6-5-9 1z M18 8h2v2h-2z", collection: "M4 3h16v18H4z M8 7h8v2H8z M8 12h8v2H8z M8 17h5v2H8z",
 tasks: "M3 19V5h5v5h8V5h5v14h-5v-5H8v5z", shop: "M2 8h20v5h-2v9H4v-9H2z M4 2h16v4H4z", settings: "M9 1h6v4h4v4h4v6h-4v4h-4v4H9v-4H5v-4H1V9h4V5h4z M9 9v6h6V9z",
 combo: "M13 1 3 14h7l-1 9 12-14h-8z", accuracy: "M9 1h6v3h5v5h3v6h-3v5h-5v3H9v-3H4v-5H1V9h3V4h5z M9 9v6h6V9z",
 timer: "M9 1h6v3h4v4h3v11h-3v3H5v-3H2V8h3V4h4z M11 6v8h7v-3h-4V6z", coin: "M7 2h10v3h4v14h-4v3H7v-3H3V5h4z M10 6v12h4V6z", gem: "M5 3h14l4 6-11 13L1 9z M7 7l5 10 5-10z", anchor: "M10 1h4v3h3v6h-3v9h4v-4h5v4l-5 4H6l-5-4v-4h5v4h4v-9H7V4h3z",
}
export function PixelIcon({ file, className = "" }: { file: string; className?: string }) {
 const key = Object.keys(glyphs).find(key => file.includes(key)) ?? "fish"
 return <svg className={`pixel-icon ${className}`} viewBox="0 0 24 24" aria-hidden="true" shapeRendering="crispEdges"><path d={glyphs[key]} fill="currentColor" fillRule="evenodd"/></svg>
}
export function LogoMark({ large = false }: { large?: boolean }) {
 return <div className={large ? "mainmenu-logo" : "logo-mark-image"} aria-label="Typecade"><strong>TYPECADE<span>OCEAN</span></strong>{large ? <small>CAST A LINE. FIND YOUR RHYTHM.</small> : null}</div>
}
