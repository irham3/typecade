import { afterEach, describe, expect, it, vi } from "vitest"
import { OceanAudio } from "./OceanAudio"

class TestAudio {
	static all: TestAudio[] = []
	paused = true; ended = false; volume = 1; currentTime = 0; loop = false; preload = ""
	play = vi.fn(async () => { this.paused = false })
	pause = vi.fn(() => { this.paused = true })
	removeAttribute = vi.fn(); load = vi.fn()
	constructor(public src: string) { TestAudio.all.push(this) }
}
afterEach(() => { vi.unstubAllGlobals(); TestAudio.all = [] })

describe("ocean audio lifecycle", () => {
	it("unlocks on a gesture, applies category volume, pauses and resumes loops", async () => {
		vi.stubGlobal("Audio", TestAudio)
		const audio = new OceanAudio()
		audio.play("sfx_splash_a", "gameplay"); audio.setActive(true)
		expect(TestAudio.all).toHaveLength(0)
		audio.unlock(); expect(TestAudio.all).toHaveLength(2)
		audio.setBoss(true); expect(TestAudio.all).toHaveLength(3)
		audio.setBoss(true); audio.play("invalid/path", "typing")
		expect(TestAudio.all).toHaveLength(3)
		audio.play("sfx_splash_a", "gameplay")
		audio.setVolumes({ music: .3, environment: .2, gameplay: .1, typing: 0 })
		expect(TestAudio.all[3].volume).toBe(.1); expect(TestAudio.all[2].volume).toBeCloseTo(.174)
		audio.setActive(false); expect(TestAudio.all.every(voice => voice.paused)).toBe(true)
		audio.play("sfx_splash_a", "gameplay"); audio.setActive(true); audio.setBoss(false)
		expect(TestAudio.all[2].paused).toBe(true)
		audio.play("sfx_typo_thud_a", "typing", 5)
		expect(TestAudio.all[3].src).toContain("sfx_typo_thud_a"); expect(TestAudio.all[3].volume).toBe(0)
		audio.dispose(); audio.dispose()
		expect(TestAudio.all.every(voice => voice.removeAttribute.mock.calls.length > 0 && voice.load.mock.calls.length > 0)).toBe(true)
	})
	it("bounds overlapping effects to eight voices and absorbs autoplay rejection", async () => {
		vi.stubGlobal("Audio", TestAudio)
		const audio = new OceanAudio(); audio.unlock(); audio.setActive(true)
		for (let i = 0; i < 20; i++) audio.play("sfx_correct_tick_a", "typing", 3)
		expect(TestAudio.all).toHaveLength(10)
		TestAudio.all[4].ended = true; TestAudio.all[4].play.mockRejectedValueOnce(new Error("autoplay"))
		audio.play("sfx_splash_a", "gameplay")
		TestAudio.all[0].paused = true; TestAudio.all[0].play.mockRejectedValueOnce(new Error("autoplay"))
		audio.setActive(true); await Promise.resolve(); audio.dispose()
	})
})
