import { useEffect, useRef, type ReactNode } from "react"

/** Visual mood of a dialog; drives its accent colour. */
export type DialogTone = "default" | "pause" | "defeat" | "draft" | "relic" | "info"

interface DungeonDialogProps {
  title: string
  children: ReactNode
  onCancel: () => void
  className?: string
  tone?: DialogTone
}

/**
 * Modal shell for every in-game dialog: native <dialog> for focus trapping and Escape,
 * with one shared frame style and a tone-specific accent.
 */
export function DungeonDialog({ title, children, onCancel, className = "", tone = "default" }: DungeonDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const headingId = title.toLowerCase().replace(/[^a-z0-9]/g, "-")
  useEffect(() => {
    const dialog = ref.current!
    dialog.showModal()
    const target = dialog.querySelector<HTMLElement>(".primary-action") ?? dialog.querySelector<HTMLElement>("input:not([disabled])")
    target?.focus({ preventScroll: true })
  }, [])
  return (
    <dialog ref={ref} className={`dungeon-dialog pixel-panel tone-${tone} ${className}`} aria-labelledby={headingId} onCancel={event => { event.preventDefault(); onCancel() }}>
      <header>
        <h2 id={headingId}>{title}</h2>
        <button className="dialog-close" aria-label="Close dialog" onClick={onCancel}>×</button>
      </header>
      <div className="dialog-body">{children}</div>
    </dialog>
  )
}
