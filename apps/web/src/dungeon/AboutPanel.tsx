import { DungeonDialog } from "./ui/DungeonDialog"

/**
 * Standard "About the game" page: why the game exists, what a session gives you, then how it
 * plays, in that order. Static copy only.
 */
export function AboutPanel({ onClose }: { onClose: () => void }) {
  return (
    <DungeonDialog title="About Typecade" onCancel={onClose} tone="info" className="about-dialog">
      <span className="eyebrow">TYPING ROGUELIKE</span>
      <h3 className="section-label">Why</h3>
      <p>Get faster and more accurate at typing without it feeling like a drill. Every word you finish is an attack, so practice turns into a fight you want to win.</p>
      <h3 className="section-label">What</h3>
      <ul>
        <li>Endless Survival: hold out against the horde in the Ruined Keep. Every run reports your WPM, accuracy and best streak.</li>
        <li>Each run earns Embers for the Skill Tree and coins for heroes and outfits, so you grow stronger between runs.</li>
        <li>Typing Dojo for focused practice, and Multiplayer to race or raid with friends.</li>
      </ul>
      <h3 className="section-label">How</h3>
      <ul>
        <li>Type the word above an enemy. The last letter dashes you in and strikes.</li>
        <li>Backspace erases a letter. Tab slows time so you can type a skill. Esc pauses.</li>
        <li>Level up and type the keyword of an upgrade to pick it. A boss arrives every five minutes.</li>
      </ul>
      <p className="muted">English and Bahasa Indonesia word packs. Credits and asset licences are listed in the project repository.</p>
      <button className="primary-action" onClick={onClose}>Back</button>
    </DungeonDialog>
  )
}
