import { useEffect, useRef, type ReactNode } from "react"
import { Glyph } from "../Glyph"
import { EmberField, OrnateCorners } from "./Ornament"

/** Visual mood of a dialog; drives accent colour, crest icon and backdrop. */
export type DialogTone = "default" | "pause" | "defeat" | "draft" | "relic" | "info"

const crest: Record<DialogTone, Parameters<typeof Glyph>[0]["name"]> = {
  default: "emblem", pause: "clock", defeat: "skull", draft: "gem", relic: "crown", info: "book",
}

interface DungeonDialogProps {
  title: string
  children: ReactNode
  onCancel: () => void
  className?: string
  tone?: DialogTone
}

/**
 * Modal shell for every in-game dialog: native <dialog> for focus trapping and Escape,
 * with a gilded frame, crest medallion and tone-specific styling.
 */
export function DungeonDialog({ title, children, onCancel, className = "", tone = "default" }: DungeonDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const headingId = title.toLowerCase().replace(/[^a-z0-9]/g, "-")
  useEffect(() => {
    const dialog = ref.current!
    dialog.showModal()
    dialog.querySelector<HTMLElement>("input:not([disabled]),.primary-action")?.focus({ preventScroll: true })
  }, [])
  return (
    <dialog ref={ref} className={`dungeon-dialog pixel-panel ornate-dialog tone-${tone} ${className}`} aria-labelledby={headingId} onCancel={event => { event.preventDefault(); onCancel() }}>
      <OrnateCorners />
      <EmberField count={10} />
      <div className="dialog-crest" aria-hidden="true"><Glyph name={crest[tone]} /></div>
      <header>
        <h2 id={headingId}>{title}</h2>
        <button className="dialog-close" aria-label="Close dialog" onClick={onCancel}>×</button>
      </header>
      {children}
    </dialog>
  )
}
