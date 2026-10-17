import type { ReactNode } from "react"

/** Gilded corner flourish (scroll + gem). Rotated per corner by CSS; never forms a cross. */
export function CornerFlourish({ corner }: { corner: "tl" | "tr" | "bl" | "br" }) {
  return (
    <svg className={`corner-flourish corner-${corner}`} viewBox="0 0 40 40" aria-hidden="true">
      <path d="M2 38V14C2 7 7 2 14 2h24" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M8 38V18c0-6 4-10 10-10h20" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".55" />
      <path d="M14 14l5-5 5 5-5 5z" className="flourish-gem" />
    </svg>
  )
}

/** Four corner flourishes for any positioned container. */
export function OrnateCorners() {
  return <>{(["tl", "tr", "bl", "br"] as const).map(corner => <CornerFlourish key={corner} corner={corner} />)}</>
}

/** Horizontal rule with a central diamond and flanking studs. */
export function GemDivider({ label }: { label?: ReactNode }) {
  return (
    <div className="gem-divider" role="presentation">
      <i /><b />{label && <span>{label}</span>}<b /><i />
    </div>
  )
}

/** Rising ember particles for title and modal backdrops. Pure CSS; hidden under Reduced Effects. */
export function EmberField({ count = 18 }: { count?: number }) {
  return (
    <div className="ember-field" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => <i key={index} style={{ ["--i" as string]: index }} />)}
    </div>
  )
}
