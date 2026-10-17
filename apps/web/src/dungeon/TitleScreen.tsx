import type { DungeonLanguage } from "@typecade/contracts"
import { Glyph } from "./Glyph"
import { EmberField, GemDivider, OrnateCorners } from "./ui/Ornament"

export type TitlePanel = "settings" | "account" | "history" | "controls" | "bestiary"

interface TitleScreenProps {
  language: DungeonLanguage
  onLanguage: (language: DungeonLanguage) => void
  onStart: () => void
  onContinue: (() => void) | null
  continueLabel: string
  onDojo: () => void
  onMultiplayer: () => void
  onTutorial: () => void
  onPanel: (panel: TitlePanel) => void
  bestTime: string
  soundOn: boolean
  onToggleSound: () => void
}

/** Flame-in-keyhole crest: the keep's sigil. Built from a hexagon, flame and orbiting gems. */
function KeepCrest() {
  return (
    <div className="keep-crest" aria-hidden="true">
      <span className="crest-halo" />
      <span className="crest-orbit"><i /><i /><i /></span>
      <Glyph name="emblem" />
    </div>
  )
}

function ModeButton({ icon, label, detail, onClick, className = "" }: { icon: Parameters<typeof Glyph>[0]["name"]; label: string; detail: string; onClick: () => void; className?: string }) {
  return (
    <button className={`mode-button ${className}`} onClick={onClick}>
      <span className="mode-icon"><Glyph name={icon} /></span>
      <span className="mode-text">{label}<small>{detail}</small></span>
      <i className="mode-chevron" aria-hidden="true" />
    </button>
  )
}

export function TitleScreen(props: TitleScreenProps) {
  const { language, onLanguage, onStart, onContinue, continueLabel, onDojo, onMultiplayer, onTutorial, onPanel, bestTime, soundOn, onToggleSound } = props
  return (
    <>
      <EmberField count={28} />
      <div className="title-vignette" aria-hidden="true" />
      <header className="title-nav">
        <span />
        <div>
          <button className="quiet" onClick={() => onPanel("account")}>Account</button>
          <button className="icon-button" aria-label="Settings" onClick={() => onPanel("settings")}><Glyph name="gear" /></button>
        </div>
      </header>
      <section className="title-menu">
        <KeepCrest />
        <span className="eyebrow">TYPING ROGUELIKE</span>
        <h1 className="title-logo">TYPECADE<span>THE RUINED KEEP</span></h1>
        <p>Type the word above an enemy to dash in and hit it. Stay alive as long as you can.</p>
        <div className="title-actions">
          <button className="start-button" autoFocus onClick={onStart}>
            <OrnateCorners />
            <span className="start-sigil"><Glyph name="sword" /></span>
            <span>Start run<small>ENDLESS SURVIVAL</small></span>
            <kbd>↵</kbd>
          </button>
          {onContinue && <button className="continue-button" onClick={onContinue}>Continue run <span>{continueLabel}</span></button>}
          <GemDivider label="MORE" />
          <div className="secondary-modes">
            <ModeButton icon="book" label="Typing Dojo" detail="Practice" onClick={onDojo} />
            <ModeButton icon="flag" label="Multiplayer" detail="Play with friends" onClick={onMultiplayer} />
            <ModeButton icon="shield" label="Tutorial" detail="Learn the controls" onClick={onTutorial} className="tutorial-entry" />
            <ModeButton icon="skull" label="Bestiary" detail="Enemy guide" onClick={() => onPanel("bestiary")} />
            <ModeButton icon="history" label="Run history" detail="Past runs" onClick={() => onPanel("history")} />
          </div>
        </div>
      </section>
      <footer className="title-footer">
        <span>BEST TIME <strong>{bestTime}</strong></span>
        <label className="title-language">Words <select aria-label="Word language" value={language} onChange={event => onLanguage(event.target.value as DungeonLanguage)}><option value="id">Bahasa Indonesia</option><option value="en">English</option></select></label>
        <button className="quiet controls-link" onClick={() => onPanel("controls")}>Controls</button>
        <button className="quiet" onClick={onToggleSound}>{soundOn ? "Sound on" : "Sound off"}</button>
      </footer>
    </>
  )
}
