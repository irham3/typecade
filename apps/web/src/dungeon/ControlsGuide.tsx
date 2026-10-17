import type { ReactNode } from "react"
import type { DungeonLanguage } from "@typecade/contracts"
import { combatLessonWords, skillRules } from "@typecade/content"

/** Key roles: each colour in the keyboard map corresponds to one legend group. */
type Role = "type" | "symbol" | "case" | "cancel" | "skill" | "pause" | "line" | "next"
const roleOf: Record<string, Role> = { Esc: "pause", Backspace: "cancel", Tab: "skill", Caps: "case", Shift: "case", Space: "line", Enter: "next" }
const rows: string[][] = [
 ["Esc", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "Backspace"],
 ["Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\"],
 ["Caps", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter"],
 ["Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Shift"],
 ["Space"],
]
const symbols = new Set(["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "/"])
const role = (key: string): Role | null => roleOf[key] ?? (/^[A-Z]$/.test(key) ? "type" : symbols.has(key) ? "symbol" : null)

export function KeyCap({ k, role: r, pressed = false, wide = false }: { k: string; role?: Role | null; pressed?: boolean; wide?: boolean }) {
 return <kbd className={`keycap ${r ? `role-${r}` : ""} ${pressed ? "pressed" : ""} ${wide ? "wide" : ""}`}>{k}</kbd>
}

/** A keyboard reference in the spirit of a PC game controls sheet: highlighted keys plus grouped actions. */
export function ControlsGuide({ language }: { language: DungeonLanguage }) {
 const words = combatLessonWords[language], heal = skillRules.heal[language]
 const common: Array<[string, ReactNode]> = [
  ["Type the word above a foe — its last letter dashes and strikes", <span key="az"><KeyCap k="A" role="type" /><span className="through">–</span><KeyCap k="Z" role="type" /></span>],
  ["Capital letters (match the displayed case)", <span key="case"><KeyCap k="Shift" role="case" wide /><KeyCap k="Caps" role="case" wide /></span>],
  ["Cancel a locked target or clear a command", <KeyCap key="bs" k="Backspace" role="cancel" wide />],
  ["Pause and resume safely", <KeyCap key="esc" k="Esc" role="pause" />],
 ]
 const combat: Array<[string, ReactNode]> = [
  ["Skill mode: time slows, then type a skill keyword", <span key="tab"><KeyCap k="Tab" role="skill" wide /><span className="through">+</span><strong className="example">{heal}</strong></span>],
  ["Mage, imp and bomber words contain symbols and digits", <span key="sym"><KeyCap k="_" role="symbol" /><KeyCap k="!" role="symbol" /><KeyCap k="-" role="symbol" /><KeyCap k="0" role="symbol" /><span className="through">–</span><KeyCap k="9" role="symbol" /></span>],
  ["Boss break combo: keep the rhythm, spaces between words guard you", <KeyCap key="sp" k="Space" role="line" wide />],
  ["Next lesson in the tutorial", <KeyCap key="en" k="Enter" role="next" wide />],
 ]
 return <section className="controls-guide" aria-label="Keyboard controls">
  <div className="key-map" aria-hidden="true">{rows.map((row, i) => <div key={i} className={`key-row row-${i}`}>{row.map((k, j) => <KeyCap key={`${k}${j}`} k={k} role={role(k)} wide={k.length > 1} />)}</div>)}</div>
  <div className="control-groups">
   <ControlGroup title="Common actions" items={common} />
   <ControlGroup title="Combat actions" items={combat} />
  </div>
  <p className="controls-example">Example: lock <strong>{words.strike}</strong> by typing <KeyCap k={words.strike[0]!} role="type" />, finish the word to strike. No mouse, WASD or arrows are needed.</p>
 </section>
}
function ControlGroup({ title, items }: { title: string; items: Array<[string, ReactNode]> }) {
 return <div className="control-group"><h3>{title}</h3><ul>{items.map(([label, keys]) => <li key={label}><span>{label}</span><span className="keys">{keys}</span></li>)}</ul></div>
}

/** Animated mini-scene for one tutorial idea. CSS drives the loop; reduced-motion shows the final frame. */
export function LessonVisual({ kind, language }: { kind: "strike" | "cancel" | "skill" | "pause" | "armor" | "treasure" | "barrel" | "heal" | "storm" | "upgrade"; language: DungeonLanguage }) {
 const w = combatLessonWords[language]
 if (kind === "cancel") return <div className="lesson-visual visual-cancel" aria-hidden="true">
  <div className="mini-foe locked"><b>{w.cancel.decoy[0]}</b>{w.cancel.decoy.slice(1)}<i>LOCKED</i></div>
  <KeyCap k="Backspace" role="cancel" wide pressed />
  <div className="mini-foe target"><b>{w.cancel.goal}</b></div>
 </div>
 if (kind === "skill" || kind === "heal" || kind === "storm") {
  const word = skillRules[kind === "storm" ? "storm" : "heal"][language]
  return <div className="lesson-visual visual-skill" aria-hidden="true"><KeyCap k="Tab" role="skill" wide pressed /><span className="through">→</span><div className="mini-command">{word.split("").map((c, i) => <span key={i} style={{ animationDelay: `${.5 + i * .18}s` }}>{c}</span>)}</div></div>
 }
 if (kind === "pause") return <div className="lesson-visual visual-pause" aria-hidden="true"><KeyCap k="Esc" role="pause" pressed /><span className="through">→</span><div className="mini-pause">II PAUSED</div></div>
 const word = kind === "armor" ? w.armor.join(" · ") : kind === "treasure" ? w.treasure : kind === "barrel" ? w.barrel : kind === "upgrade" ? "▣ ▣ ▣" : w.strike
 return <div className="lesson-visual visual-strike" aria-hidden="true">
  <div className="mini-hero" />
  <div className="mini-foe typing">{word.split("").map((c, i) => <span key={i} style={{ animationDelay: `${.3 + i * .22}s` }}>{c}</span>)}</div>
 </div>
}

/** Before-run primer. Shown until the player opts out; reopenable from the ready dialog. */
export function HowToPlay({ language }: { language: DungeonLanguage }) {
 const steps: Array<{ title: string; text: string; visual: Parameters<typeof LessonVisual>[0]["kind"] }> = [
  { title: "1 · Type to strike", text: "Type the word floating above a foe. The final letter dashes your knight to it and strikes.", visual: "strike" },
  { title: "2 · Backspace cancels", text: "Locked the wrong foe? Press Backspace to release the lock, then type a different word.", visual: "cancel" },
  { title: "3 · Tab for skills", text: "Tab slows time. Type a skill keyword to sweep, freeze or heal.", visual: "skill" },
  { title: "4 · Esc to pause", text: "Esc pauses safely. Your typed progress is kept.", visual: "pause" },
 ]
 return <div className="how-to-play">{steps.map(step => <article key={step.title} className="how-step"><LessonVisual kind={step.visual} language={language} /><h3>{step.title}</h3><p>{step.text}</p></article>)}</div>
}
