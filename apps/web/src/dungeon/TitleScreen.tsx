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
        <a href="#" className="wordmark" onClick={event => event.preventDefault()}><Glyph name="emblem" />TYPECADE<span>THE RUINED KEEP</span></a>
        <div>
          <button className="quiet" onClick={() => onPanel("account")}>Account</button>
          <button className="icon-button" aria-label="Settings" onClick={() => onPanel("settings")}><Glyph name="gear" /></button>
        </div>
      </header>
      <section className="title-menu">
        <KeepCrest />
        <span className="eyebrow">DUNGEON TYPING · ENDLESS RUNS</span>
        <h1 className="title-logo" data-text="TYPECADE">TYPECADE<span>THE RUINED KEEP</span></h1>
        <p>Type to strike. Break their armor.<br className="desktop-break" /> Survive the siege. Build your next run.</p>
        <div className="title-actions">
          <button className="start-button" autoFocus onClick={onStart}>
            <OrnateCorners />
            <span className="start-sigil"><Glyph name="sword" /></span>
            <span>Enter the keep<small>ENDLESS SURVIVAL</small></span>
            <kbd>↵</kbd>
          </button>
          {onContinue && <button className="continue-button" onClick={onContinue}>Continue run <span>{continueLabel}</span></button>}
          <GemDivider label="MODES" />
          <div className="secondary-modes">
            <ModeButton icon="book" label="Typing Dojo" detail="PRACTICE" onClick={onDojo} />
            <ModeButton icon="flag" label="Multiplayer" detail="PARTY" onClick={onMultiplayer} />
            <ModeButton icon="shield" label="Combat tutorial" detail="TRY / SKIP" onClick={onTutorial} className="tutorial-entry" />
            <ModeButton icon="skull" label="Bestiary" detail="ALL FOES" onClick={() => onPanel("bestiary")} />
            <ModeButton icon="history" label="Run history" detail="RECORDS" onClick={() => onPanel("history")} className="wide-mode" />
          </div>
        </div>
        <label className="title-language">Word language <select aria-label="Word language" value={language} onChange={event => onLanguage(event.target.value as DungeonLanguage)}><option value="id">Bahasa Indonesia</option><option value="en">English</option></select></label>
        <div className="title-footnote"><kbd>TYPE</kbd> to strike <span>·</span><kbd>BACKSPACE</kbd> to cancel <span>·</span><kbd>TAB</kbd> to cast <span>·</span><button className="quiet controls-link" onClick={() => onPanel("controls")}>All controls</button></div>
      </section>
      <aside className="title-world-note"><OrnateCorners /><span>DEPTH 01</span><strong>The Ashen Courtyard</strong><small>SIEGE / ASH / RUIN</small></aside>
      <footer className="title-footer"><span>LOCAL BEST <strong>{bestTime}</strong></span><span>EN / ID <i /> KEYBOARD FIRST <i /> SOLO + PARTY</span><button className="quiet" onClick={onToggleSound}>{soundOn ? "Sound on" : "Sound off"}</button></footer>
    </>
  )
}
