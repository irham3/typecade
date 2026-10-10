type Category = "music" | "environment" | "gameplay" | "typing"
type Volumes = Record<Category, number>
interface Voice { audio: HTMLAudioElement; category: Category; gain: number }

/** Bounded native audio voices; autoplay rejection is expected until a user gesture. */
export class OceanAudio {
	private voices: Voice[] = []
	private loops = new Map<string, Voice>()
	private unlocked = false
	private active = false
	private boss = false
	private volumes: Volumes = { music: .45, environment: .55, gameplay: .72, typing: .38 }

	unlock(): void { this.unlocked = true; this.syncLoops() }
	setActive(active: boolean): void { this.active = active; this.syncLoops() }
	setBoss(boss: boolean): void { this.boss = boss; this.syncLoops() }
	setVolumes(volumes: Volumes): void {
		this.volumes = { ...volumes }
		for (const voice of [...this.voices, ...this.loops.values()]) this.volume(voice)
	}

	play(key: string, category: Category, gain = 1): void {
		if (!this.unlocked || !this.active || !/^sfx_[a-z_]+$/.test(key)) return
		const voice = this.voices.find(item => item.audio.paused || item.audio.ended)
			?? (this.voices.length < 8 ? this.makeVoice(key, category, gain) : this.voices[0])
		if (!this.voices.includes(voice)) this.voices.push(voice)
		voice.audio.pause()
		voice.audio.src = `/assets/ocean/audio/${key}.mp3`
		voice.audio.currentTime = 0
		voice.category = category
		voice.gain = gain
		this.volume(voice)
		void voice.audio.play().catch(() => {})
	}

	private makeVoice(key: string, category: Category, gain: number): Voice {
		const audio = new Audio(`/assets/ocean/audio/${key}.mp3`)
		audio.preload = "none"
		return { audio, category, gain }
	}

	private volume(voice: Voice): void { voice.audio.volume = Math.min(1, Math.max(0, this.volumes[voice.category] * voice.gain)) }

	private syncLoops(): void {
		for (const [key, category, gain, enabled] of [
			["sfx_ambient_ocean_loop", "environment", 1, true],
			["sfx_music_expedition_loop", "music", 1, true],
			["sfx_music_boss_layer", "music", .58, this.boss],
		] as const) {
			if (!this.unlocked || !this.active || !enabled) { this.loops.get(key)?.audio.pause(); continue }
			let voice = this.loops.get(key)
			if (!voice) {
				voice = this.makeVoice(key, category, gain)
				voice.audio.loop = true
				this.loops.set(key, voice)
			}
			this.volume(voice)
			if (voice.audio.paused) void voice.audio.play().catch(() => {})
		}
		if (!this.active) this.voices.forEach(voice => voice.audio.pause())
	}

	dispose(): void {
		for (const { audio } of [...this.voices, ...this.loops.values()]) {
			audio.pause()
			audio.removeAttribute("src")
			audio.load()
		}
		this.voices = []
		this.loops.clear()
	}
}
