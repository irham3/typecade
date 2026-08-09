import { create } from "zustand"
import { persist } from "zustand/middleware"

type OverdriveSettings = {
	reducedMotion: boolean | null
	screenShake: boolean
	soundMuted: boolean
	soundVolume: number
	setReducedMotion: (val: boolean | null) => void
	setScreenShake: (val: boolean) => void
	setSoundMuted: (val: boolean) => void
	setSoundVolume: (val: number) => void
}

export const useSettings = create<OverdriveSettings>()(
	persist(
		(set) => ({
			reducedMotion: null,
			screenShake: true,
			soundMuted: false,
			soundVolume: 1,
			setReducedMotion: (val) => set({ reducedMotion: val }),
			setScreenShake: (val) => set({ screenShake: val }),
			setSoundMuted: (val) => {
				set({ soundMuted: val })
				import("@/features/overdrive/fx/sfx").then(m => m.sfx.setMuted(val))
			},
			setSoundVolume: (val) => {
				set({ soundVolume: val })
				import("@/features/overdrive/fx/sfx").then(m => m.sfx.setVolume(val))
			},
		}),
		{ name: "typecade-overdrive-settings", version: 1 }
	)
)
