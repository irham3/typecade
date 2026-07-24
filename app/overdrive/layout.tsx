import type { Metadata } from "next"
import { fontJbm, fontPs2 } from "@/app/fonts"

export const metadata: Metadata = {
  title: "Typecade: Overdrive | Roguelike Typing Arcade",
  description: "Type to attack, build Keycap synergies, beat rising quotas, and survive an endless roguelike typing run.",
}

export default function OverdriveLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-overdrive-root
      className={`${fontJbm.variable} ${fontPs2.variable} h-dvh w-screen min-w-0 max-w-none overflow-hidden bg-bg-0 font-game text-text-hi antialiased`}
    >
      {children}
    </div>
  )
}
