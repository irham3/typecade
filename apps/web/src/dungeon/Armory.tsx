import { useEffect, useMemo, useState } from "react"
import type { HeroLoadout, HeroSlot } from "@typecade/contracts"
import { cosmeticById, cosmetics, heroDetails, heroKits, heroSlots, type CosmeticItem } from "@typecade/content"
import { lookFor } from "@typecade/game-rules"
import { heroProfileStore, useHeroProfile } from "../profile/heroProfileStore"
import { CoinIcon } from "./ui/CoinIcon"

const rarityLabel: Record<CosmeticItem["rarity"], string> = { starter: "Starter", common: "Common", rare: "Rare", epic: "Epic", legendary: "Legendary" }
const coins = (value: number) => value.toLocaleString("en-US")

interface ArmoryProps {
  /** Shows a loadout on the 3D hero (try-on). */
  onPreview: (loadout: HeroLoadout) => void
  onClose: () => void
}

/**
 * Hero customization and shop. Selecting any item tries it on; owned items can be equipped,
 * locked ones bought with coins earned from runs. Leaving restores the equipped look.
 */
export function Armory({ onPreview, onClose }: ArmoryProps) {
  const profile = useHeroProfile()
  const [slot, setSlot] = useState<HeroSlot>("head")
  const [selected, setSelected] = useState<string>(profile.loadout.head)
  const [message, setMessage] = useState("")
  const items = useMemo(() => cosmetics.filter(entry => entry.slot === slot), [slot])
  const item = cosmeticById(selected)!
  const owned = profile.owned.includes(selected)
  const equipped = profile.loadout[item.slot] === selected

  // Try-on: show the selected item over the equipped look; restore on leave.
  // Heroes preview in their own saved look (or signature kit); other slots try on over the equipped look.
  useEffect(() => { onPreview(item.slot === "hero" ? { ...lookFor(profile, selected), hero: selected } : { ...profile.loadout, [item.slot]: selected }) }, [onPreview, profile, item.slot, selected])
  useEffect(() => () => onPreview(heroProfileStore.getSnapshot().loadout), [onPreview])

  const chooseSlot = (next: HeroSlot) => { setSlot(next); setSelected(profile.loadout[next]); setMessage("") }
  const buy = () => {
    const result = heroProfileStore.buy(selected)
    if (result.ok) { heroProfileStore.equip(selected); setMessage(`${item.name} bought and equipped.`) }
    else setMessage(result.reason === "coins" ? `You need ${coins(item.price - profile.coins)} more coins.` : "Already owned.")
  }
  const equip = () => { heroProfileStore.equip(selected); setMessage(`${item.name} equipped.`) }

  return (
    <section className="armory" aria-label="Armory">
      <header className="armory-head">
        <h2>Armory</h2>
        <p className="armory-wallet" aria-label={`${coins(profile.coins)} coins`}><CoinIcon />{coins(profile.coins)}</p>
        <button className="armory-close" onClick={onClose}>Back</button>
      </header>
      <nav className="armory-slots text-tabs" aria-label="Equipment slot">
        {heroSlots.map(entry => <button key={entry.id} className={entry.id === slot ? "active" : ""} aria-pressed={entry.id === slot} onClick={() => chooseSlot(entry.id)}>{entry.label}</button>)}
      </nav>
      <ul className="armory-items">
        {items.map(entry => {
          const isOwned = profile.owned.includes(entry.id), isEquipped = profile.loadout[entry.slot] === entry.id
          return (
            <li key={entry.id}>
              <button className={`armory-item rarity-${entry.rarity} ${entry.id === selected ? "selected" : ""}`} onClick={() => { setSelected(entry.id); setMessage("") }} aria-pressed={entry.id === selected}>
                <span className="armory-item-name">{entry.name}{heroDetails[entry.id] && <small className={`hero-tag gender-${heroDetails[entry.id]!.gender}`}>{heroDetails[entry.id]!.gender === "female" ? "♀" : "♂"} {heroDetails[entry.id]!.race}</small>}</span>
                <span className="armory-item-state">{isEquipped ? "Equipped" : isOwned ? "Owned" : <><CoinIcon />{coins(entry.price)}</>}</span>
              </button>
            </li>
          )
        })}
      </ul>
      <footer className="armory-detail">
        <div>
          <strong>{item.name}</strong>
          <span className={`armory-rarity rarity-${item.rarity}`}>{rarityLabel[item.rarity]}</span>
          <p>{item.note}</p>
          {item.slot === "hero" && !owned && <p className="armory-kit">Comes with {Object.values(heroKits[item.id] ?? {}).map(id => cosmeticById(id)?.name).filter(Boolean).join(", ")}.</p>}
        </div>
        {equipped ? <button disabled>Equipped</button>
          : owned ? <button className="primary-action" onClick={equip}>Equip</button>
          : <button className="primary-action" onClick={buy} disabled={profile.coins < item.price}>{profile.coins < item.price ? `Need ${coins(item.price - profile.coins)}` : `Buy · ${coins(item.price)}`}</button>}
        <p className="armory-message" role="status">{message}</p>
      </footer>
    </section>
  )
}
