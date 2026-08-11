import { Howl, Howler } from "howler"

let unlocked = false

// Placeholders for sound files
// You should place these files in the `public/sounds/` directory.
const sounds = {
	type: new Howl({ src: ["/sounds/type.wav"], preload: true, volume: 0.5 }),
	typo: new Howl({ src: ["/sounds/typo.wav"], preload: true, volume: 0.6 }),
	kill: new Howl({ src: ["/sounds/kill.wav"], preload: true, volume: 0.7 }),
	hurt: new Howl({ src: ["/sounds/hurt.wav"], preload: true, volume: 0.8 }),
	boss: new Howl({ src: ["/sounds/boss.wav"], preload: true, volume: 0.9 }),
}

export const audioEngine = {
	unlock() {
		if (unlocked) return
		unlocked = true
		// Howler automatically handles AudioContext unlocking on user interaction,
		// but we can explicitly resume here if needed.
		if (Howler.ctx && Howler.ctx.state === "suspended") {
			Howler.ctx.resume()
		}
	},

	playType(streak: number) {
		const id = sounds.type.play()
		// Pitch shift +5% per streak step (max +50%)
		// In Howler, `rate` handles pitch shifting (and speed).
		// rate 1.0 is normal, 1.05 is +5% pitch.
		const maxShift = 0.5
		const shift = Math.min(streak * 0.05, maxShift)
		sounds.type.rate(1.0 + shift, id)
	},

	playTypo() {
		sounds.typo.play()
	},

	playKill() {
		sounds.kill.play()
	},

	playHurt() {
		sounds.hurt.play()
	},

	playBossSpawn() {
		sounds.boss.play()
	},

	setVolume(v: number) {
		Howler.volume(Math.max(0, Math.min(1, v)))
	},

	setMuted(v: boolean) {
		Howler.mute(v)
	},
}
