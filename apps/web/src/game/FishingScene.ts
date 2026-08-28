import Phaser from "phaser"
import type { FishSpecies } from "@typecade/contracts"
import type { GameEventBridge } from "../bridge/game-event-bridge"

export interface FishingSceneData {
	bridge: GameEventBridge
}

type VolumeCategory = "music" | "environment" | "gameplay" | "typing"
type FishVisualState = "idle" | "swim" | "bite" | "struggle" | "stunned" | "caught" | "escape"

const layers = ["sky", "water", "midground", "encounter", "foreground"] as const
const zones = ["zone1", "zone2", "zone3"] as const
const rareOrBossFish = new Set(["moonfin_snapper", "glass_eel", "reef_shark", "crown_leviathan"])
const bossFish = "crown_leviathan"
const animatedFishAssetKey = "fish_pebble_goby"
const pebbleGobyFrameCounts: Record<FishVisualState, number> = {
	idle: 4,
	swim: 6,
	bite: 4,
	struggle: 6,
	stunned: 4,
	caught: 4,
	escape: 6,
}
const pebbleGobyFrameRates: Record<FishVisualState, number> = {
	idle: 8,
	swim: 10,
	bite: 12,
	struggle: 12,
	stunned: 6,
	caught: 10,
	escape: 14,
}
const audioFiles = [
	"sfx_ambient_ocean_loop",
	"sfx_cast_net_a",
	"sfx_catch_impact_a",
	"sfx_combo_milestone_a",
	"sfx_combo_milestone_b",
	"sfx_correct_tick_a",
	"sfx_correct_tick_b",
	"sfx_escape_snap_a",
	"sfx_line_critical_a",
	"sfx_line_tension_a",
	"sfx_line_tension_b",
	"sfx_music_boss_layer",
	"sfx_music_expedition_loop",
	"sfx_rare_sting_a",
	"sfx_reward_sting_a",
	"sfx_skill_activate_a",
	"sfx_skill_ready_a",
	"sfx_splash_a",
	"sfx_splash_b",
	"sfx_typo_thud_a",
	"sfx_typo_thud_b",
	"sfx_word_complete_a",
	"sfx_word_complete_b",
] as const

export class FishingScene extends Phaser.Scene {
	private bridge?: GameEventBridge
	private cleanup: Array<() => void> = []
	private bgLayers: Phaser.GameObjects.Image[] = []
	private gameplayBackdrop?: Phaser.GameObjects.Image
	private ambientSprites: Phaser.GameObjects.Image[] = []
	private fish?: Phaser.GameObjects.Sprite
	private fishShadow?: Phaser.GameObjects.Image
	private hookGlow?: Phaser.GameObjects.Image
	private lure?: Phaser.GameObjects.Image
	private boat?: Phaser.GameObjects.Image
	private rod?: Phaser.GameObjects.Image
	private line?: Phaser.GameObjects.Graphics
	private sceneTint?: Phaser.GameObjects.Rectangle
	private waterDisplacement?: Phaser.Filters.Displacement
	private waterVignette?: Phaser.Filters.Vignette
	private splashEmitter?: Phaser.GameObjects.Particles.ParticleEmitter
	private bubbleEmitter?: Phaser.GameObjects.Particles.ParticleEmitter
	private sparkEmitter?: Phaser.GameObjects.Particles.ParticleEmitter
	private streakEmitter?: Phaser.GameObjects.Particles.ParticleEmitter
	private currentFish?: FishSpecies
	private currentFishState: FishVisualState = "idle"
	private gamePaused = true
	private reducedMotion = false
	private lineProgress = 0
	private lineTension = 28
	private lineDurability = 100
	private pullTrauma = 0
	private lastTickSfxAt = 0
	private lastCriticalSfxAt = 0
	private hitStopUntil = 0
	private hitStopTimer?: ReturnType<typeof setTimeout>
	private volumes: Record<VolumeCategory, number> = {
		music: 0.45,
		environment: 0.55,
		gameplay: 0.72,
		typing: 0.38,
	}
	private loopsStarted = false
	private musicLoop?: Phaser.Sound.BaseSound
	private ambientLoop?: Phaser.Sound.BaseSound
	private bossLoop?: Phaser.Sound.BaseSound

	constructor(bridge?: GameEventBridge) {
		super("FishingScene")
		this.bridge = bridge
	}

	init(data: Partial<FishingSceneData>): void {
		this.cleanup.forEach((dispose) => dispose())
		this.cleanup = []
		if (data.bridge) {
			this.bridge = data.bridge
		}
		this.currentFish = undefined
		this.currentFishState = "idle"
		this.gamePaused = true
		this.reducedMotion = false
		this.lineProgress = 0
		this.lineTension = 28
		this.lineDurability = 100
		this.pullTrauma = 0
		this.lastTickSfxAt = 0
		this.lastCriticalSfxAt = 0
		this.hitStopUntil = 0
		this.hitStopTimer = undefined
		this.loopsStarted = false
		this.musicLoop = undefined
		this.ambientLoop = undefined
		this.bossLoop = undefined
	}

	preload(): void {
		this.load.on("loaderror", (file: { key?: string; src?: string }) => {
			console.error("[typecade] asset load failed", file.key, file.src)
		})
		this.load.atlas("ocean", "/assets/ocean/atlases/atlas_ocean.png", "/assets/ocean/atlases/atlas_ocean.json")
		for (const state of Object.keys(pebbleGobyFrameCounts) as FishVisualState[]) {
			const frameCount = pebbleGobyFrameCounts[state]
			const key = `pebble_goby_${state}_${frameCount}f`
			this.load.spritesheet(
				key,
				`/assets/ocean/concepts/fish-catalog-v2/animation-sets/pebble-goby/pebble_goby_${state}_${frameCount}f.png`,
				{ frameWidth: 128, frameHeight: 96 },
			)
		}
		for (const zone of zones) {
			for (const layer of layers) {
				this.load.image(`bg_${zone}_${layer}`, `/assets/ocean/backgrounds/bg_shallow_coast_${zone}_${layer}.webp`)
			}
		}
		this.load.image("bg_route_map", "/assets/ocean/backgrounds/bg_shallow_coast_route_map.webp")
		this.load.image("bg_weather_dawn", "/assets/ocean/backgrounds/bg_shallow_coast_weather_dawn.webp")
		for (const audio of audioFiles) {
			this.load.audio(audio, [
				`/assets/ocean/audio/${audio}.mp3`,
				`/assets/ocean/audio/${audio}.ogg`,
			])
		}
	}

	create(): void {
		if (this.textures.exists("bg_gameplay_ai")) {
			this.gameplayBackdrop = this.add.image(0, 0, "bg_gameplay_ai").setOrigin(0, 0).setDepth(-2)
		}
		for (const layer of layers) {
			const image = this.add.image(0, 0, `bg_zone1_${layer}`).setOrigin(0, 0)
			image.setDepth(layer === "foreground" ? 34 : layer === "encounter" ? 8 : 0)
			this.bgLayers.push(image)
		}
		// The AI plate is the hero gameplay composition; generated layers remain
		// available for overlays and a safe fallback if the plate is unavailable.
		this.bgLayers[0]?.setVisible(!this.gameplayBackdrop)
		this.bgLayers[1]?.setVisible(!this.gameplayBackdrop)

		this.sceneTint = this.add.rectangle(0, 0, 10, 10, 0x6ff4ff, 0.08).setOrigin(0, 0).setDepth(9)
		this.sceneTint.setBlendMode(Phaser.BlendModes.ADD)
		this.createWaterPostFx()

		this.createAmbientLife()
		this.line = this.add.graphics().setDepth(27)
		this.boat = this.add.image(118, 746, "ocean", "ui_equipment_boat_default.png").setDepth(23).setOrigin(0.38, 0.82).setScale(1.42)
		this.rod = this.add.image(126, 770, "ocean", "ui_equipment_rod_bamboo.png").setDepth(28).setOrigin(0.12, 0.9)
		this.rod.setScale(2.62).setRotation(-0.82).setVisible(false)
		this.hookGlow = this.add.image(760, 530, "ocean", "vfx_glow_ring_default.png").setDepth(24).setScale(0.45).setAlpha(0.5)
		this.hookGlow.setBlendMode(Phaser.BlendModes.ADD).setVisible(false)
		this.lure = this.add.image(760, 530, "ocean", "ui_equipment_bait_shell.png").setDepth(29).setScale(0.46).setVisible(false)
		this.fishShadow = this.add.image(970, 562, "ocean", "vfx_soft_circle_default.png").setDepth(21).setScale(3.1, 0.68).setAlpha(0.34)
		this.fishShadow.setTint(0x042238).setVisible(false)
		this.fish = this.add.sprite(970, 515, "pebble_goby_idle_4f", 0).setDepth(25).setScale(1.35).setVisible(false)

		this.createEmitters()
		this.subscribeToBridge()
		this.events.once("shutdown", this.shutdownScene, this)
		this.scale.on("resize", this.layout, this)
		this.input.once("pointerdown", () => this.startLoops())
		this.input.keyboard?.once("keydown", () => this.startLoops())
		this.layout()
		this.updateLine()
	}

	override update(time: number, delta: number): void {
		if (this.gamePaused) {
			return
		}
		const width = this.scale.width
		const height = this.scale.height
		const dt = Math.min(48, delta) / 1000
		this.pullTrauma = Math.max(0, this.pullTrauma - dt * 2.4)

		this.bgLayers.forEach((layer, index) => {
			const drift = Math.sin(time / (2300 + index * 730)) * (index + 1) * (index < 2 ? 2.2 : 4.8)
			layer.setPosition(drift - 10, 0)
			layer.setDisplaySize(width + 20, height)
		})
		this.gameplayBackdrop?.setPosition(Math.sin(time / 4200) * -4 - 10, 0).setDisplaySize(width + 20, height)
		this.sceneTint?.setSize(width, height)
		this.animateAmbientLife(time, width, height)
		this.animateWaterPostFx(time)

		if (this.fish && this.currentFish) {
			const fishScale = getFishScale(this.currentFish)
			const behavior = this.currentFish.behavior
			const progressPull = this.lineProgress * (this.currentFish.id === bossFish ? 0.12 : 0.21)
			const tensionPush = Math.max(0, this.lineTension - 54) / 100 * (behavior === "predator" || behavior === "boss" ? 54 : 30)
			const swimSpeed = behavior === "darting" ? 260 : behavior === "boss" ? 620 : 760
			const driftY = Math.sin(time / swimSpeed) * getFishDrift(this.currentFish)
			const driftX = Math.sin(time / (behavior === "predator" ? 390 : 820)) * (behavior === "swarm" ? 34 : 16)
			const snap = Math.sin(time / 42) * this.pullTrauma * 18
			const targetX = width * (0.73 - progressPull) + driftX + tensionPush + snap
			const targetY = height * 0.53 + driftY + Math.sin(time / 118) * this.pullTrauma * 8
			this.fish.setPosition(targetX, targetY)
			this.fish.setScale(fishScale * (1 + this.pullTrauma * 0.08), fishScale * (1 - this.pullTrauma * 0.035))
			this.fish.setRotation(Math.sin(time / 760) * 0.035 + this.pullTrauma * 0.055)
			this.fishShadow?.setPosition(targetX + 6, targetY + this.fish.displayHeight * 0.36)
			this.fishShadow?.setScale(Math.max(1, this.fish.displayWidth / 92), 0.5 + this.lineProgress * 0.22)
			this.fishShadow?.setAlpha(0.18 + this.lineProgress * 0.22)
		}

		if (this.lure) {
			if (this.fish) {
				const fishMouthX = this.fish.x - this.fish.displayWidth * 0.34
				const fishMouthY = this.fish.y + this.fish.displayHeight * 0.04
				this.lure.setPosition(fishMouthX - 18, fishMouthY + Math.sin(time / 260) * 3)
			} else {
				this.lure.setPosition(width * 0.47, height * 0.57 + Math.sin(time / 520) * 5)
			}
			this.hookGlow?.setPosition(this.lure.x, this.lure.y)
			this.hookGlow?.setRotation(time / 900)
			this.hookGlow?.setAlpha(0.22 + Math.sin(time / 330) * 0.12 + this.pullTrauma * 0.26)
		}

		const bend = (this.lineTension - 30) / 100 * 0.22 + this.pullTrauma * 0.08
		this.rod?.setRotation(-0.86 + bend + Math.sin(time / 80) * this.pullTrauma * 0.035)
		this.boat?.setY(height - 54 + Math.sin(time / 720) * 5 + this.pullTrauma * 4)
		this.boat?.setRotation(Math.sin(time / 900) * 0.014 - this.pullTrauma * 0.012)
		this.updateLine(time)
	}

	private createAmbientLife(): void {
		const specs = [
			{ frame: "fish_ambient_school_idle_0.png", x: 260, y: 460, scale: 0.78, alpha: 0.48 },
			{ frame: "fish_ambient_shadow_idle_0.png", x: 1160, y: 610, scale: 1.1, alpha: 0.35 },
			{ frame: "fish_ambient_bubbles_idle_0.png", x: 780, y: 560, scale: 0.58, alpha: 0.42 },
		]
		for (const spec of specs) {
			const sprite = this.add.image(spec.x, spec.y, "ocean", spec.frame).setDepth(17).setScale(spec.scale).setAlpha(spec.alpha)
			this.ambientSprites.push(sprite)
		}
	}

	private createEmitters(): void {
		this.bubbleEmitter = this.add.particles(0, 0, "ocean", {
			frame: "vfx_bubble_default.png",
			emitting: false,
			lifespan: 1250,
			speed: { min: 18, max: 88 },
			scale: { start: 0.26, end: 0.035 },
			alpha: { start: 0.72, end: 0 },
			maxParticles: 120,
		})
		this.splashEmitter = this.add.particles(0, 0, "ocean", {
			frame: "vfx_foam_droplet_default.png",
			emitting: false,
			lifespan: 800,
			speed: { min: 100, max: 300 },
			angle: { min: 200, max: 340 },
			gravityY: 300,
			scale: { start: 0.5, end: 0.05 },
			alpha: { start: 1, end: 0 },
			maxParticles: 150,
		})
		this.sparkEmitter = this.add.particles(0, 0, "ocean", {
			frame: "vfx_sharp_spark_default.png",
			emitting: false,
			lifespan: 650,
			speed: { min: 120, max: 300 },
			scale: { start: 0.35, end: 0.02 },
			tint: 0xf5c240,
			alpha: { start: 1, end: 0 },
			blendMode: Phaser.BlendModes.ADD,
			maxParticles: 100,
		})
		this.streakEmitter = this.add.particles(0, 0, "ocean", {
			frame: "vfx_water_streak_default.png",
			emitting: false,
			lifespan: 500,
			speed: { min: 150, max: 350 },
			angle: { min: 160, max: 210 },
			scale: { start: 0.4, end: 0.05 },
			alpha: { start: 0.85, end: 0 },
			tint: 0x9ae7ff,
			blendMode: Phaser.BlendModes.ADD,
			maxParticles: 80,
		})
	}

	private animateAmbientLife(time: number, width: number, height: number): void {
		this.ambientSprites.forEach((sprite, index) => {
			const baseX = index === 0 ? width * 0.22 : index === 1 ? width * 0.79 : width * 0.48
			const baseY = index === 0 ? height * 0.58 : index === 1 ? height * 0.7 : height * 0.64
			sprite.setPosition(baseX + Math.sin(time / (1300 + index * 330)) * (42 + index * 28), baseY + Math.cos(time / (980 + index * 200)) * (10 + index * 7))
			sprite.setRotation(Math.sin(time / (1000 + index * 240)) * 0.035)
		})
	}

	private createWaterPostFx(): void {
		const displacementTexture = this.textures.createCanvas("water_distortion", 128, 128)
		if (!displacementTexture) {
			return
		}
		this.load.image("bg_gameplay_ai", "/assets/ocean/backgrounds/bg_shallow_coast_gameplay_ai.webp")

		const imageData = displacementTexture.context.createImageData(128, 128)
		for (let y = 0; y < 128; y += 1) {
			for (let x = 0; x < 128; x += 1) {
				const index = (y * 128 + x) * 4
				imageData.data[index] = 128 + Math.round(Math.sin(y * 0.32) * 25)
				imageData.data[index + 1] = 128 + Math.round(Math.cos(x * 0.24) * 20)
				imageData.data[index + 2] = 128
				imageData.data[index + 3] = 255
			}
		}
		displacementTexture.context.putImageData(imageData, 0, 0)
		displacementTexture.refresh()

		try {
			const filters = this.cameras.main.filters.external
			this.waterDisplacement = filters.addDisplacement("water_distortion", 0.0028, 0.005)
			this.waterDisplacement.setPaddingOverride(null)
			this.waterVignette = filters.addVignette(0.5, 0.54, 0.82, 0.18, 0x021b38)
		} catch {
			// Canvas fallback and older renderers keep the procedural water layers.
			this.waterDisplacement = undefined
			this.waterVignette = undefined
		}
	}

	private animateWaterPostFx(time: number): void {
		if (this.waterDisplacement) {
			const strength = this.reducedMotion ? 0 : 1
			this.waterDisplacement.x = strength * (0.0028 + Math.sin(time / 1500) * 0.0008)
			this.waterDisplacement.y = strength * (0.005 + Math.cos(time / 1200) * 0.0012)
		}
		if (this.waterVignette) {
			this.waterVignette.strength = this.reducedMotion ? 0.14 : 0.18 + this.pullTrauma * 0.06
		}
	}

	private subscribeToBridge(): void {
		const bridge = this.bridge
		if (!bridge) {
			return
		}

		this.cleanup.push(
			bridge.on("screen:changed", ({ screen }) => {
				const isGame = screen === "game"
				this.rod?.setVisible(isGame)
				this.lure?.setVisible(isGame)
				this.hookGlow?.setVisible(isGame)
				this.line?.setVisible(isGame)

				if (!isGame) {
					this.fish?.setVisible(false)
					this.fishShadow?.setVisible(false)
					this.currentFish = undefined
				}
			}),
			bridge.on("encounter:started", ({ encounter, fish }) => {
				this.currentFish = fish
				this.lineProgress = encounter.progress
				this.lineTension = encounter.tension
				this.lineDurability = encounter.durability
				this.setZoneBackground(fish.habitat)
				this.fish?.setVisible(true)
				this.fishShadow?.setVisible(true)
				this.playFishAnimation(fish, "bite")
				this.floatText(fish.rarity === "boss" ? "BOSS HOOKED" : `${fish.rarity.toUpperCase()} BITE`, this.scale.width * 0.6, this.scale.height * 0.42, fish.rarity === "common" ? 0x9ae7ff : 0xf5c240)
				this.time.delayedCall(360, () => this.playFishAnimation(fish, "swim"))
				this.bubbleEmitter?.explode(24, this.scale.width * 0.62, this.scale.height * 0.53)
				if (fish.rarity === "rare" || fish.rarity === "boss") {
					this.sparkEmitter?.explode(fish.rarity === "boss" ? 70 : 40, this.scale.width * 0.62, this.scale.height * 0.5)
					if (!this.reducedMotion) {
						this.cameras.main.shake(200, 0.008)
						this.cameras.main.flash(fish.rarity === "boss" ? 300 : 180, 245, 194, 64)
					}
					this.playAudio("sfx_rare_sting_a", "gameplay")
				}
				if (fish.id === bossFish) {
					this.ensureBossLayer()
					this.bossEntrance()
				} else {
					this.fadeBossLayer()
				}
			}),
			bridge.on("fish:hooked", ({ fish }) => {
				this.currentFish = fish
				this.playFishAnimation(fish, "bite")
				this.emitWaterImpact(this.scale.width * 0.58, this.scale.height * 0.55, 30)
				this.playAudio("sfx_splash_a", "gameplay")
				this.hitStop(120)
				if (!this.reducedMotion) {
					this.cameras.main.shake(150, 0.005)
				}
			}),
			bridge.on("character:correct", ({ combo }) => {
				this.pullTrauma = Math.min(1, this.pullTrauma + 0.09 + Math.min(combo, 8) * 0.005)
				this.emitLinePulse(0x9ae7ff)
				const now = this.time.now
				if (now - this.lastTickSfxAt > 48) {
					this.lastTickSfxAt = now
					this.playAudio(now % 2 > 1 ? "sfx_correct_tick_a" : "sfx_correct_tick_b", "typing", 0.38)
				}
			}),
			bridge.on("word:completed", ({ combo, perfect }) => {
				this.pullTrauma = Math.min(1, this.pullTrauma + (perfect ? 0.35 : 0.2))
				this.emitWaterImpact(this.fish?.x ?? this.scale.width * 0.62, this.fish?.y ?? this.scale.height * 0.55, combo >= 5 ? 40 : 20)
				this.popFish(perfect ? 1.3 : 1.15)
				this.floatText(perfect ? "PERFECT REEL" : "REEL", this.scale.width * 0.58, this.scale.height * 0.46, perfect ? 0xf5c240 : 0x9ae7ff)

				if (perfect) {
					this.hitStop(80)
					if (!this.reducedMotion) {
						this.cameras.main.zoomTo(1.04, 60, Phaser.Math.Easing.Quadratic.Out, true)
						this.cameras.main.shake(120, 0.003)
						this.time.delayedCall(60, () => this.cameras.main.zoomTo(1, 150, Phaser.Math.Easing.Quadratic.In))
					}
				}

				if (combo > 0 && combo % 5 === 0) {
					this.sparkEmitter?.explode(45, this.fish?.x ?? this.scale.width * 0.61, (this.fish?.y ?? this.scale.height * 0.5) - 24)
					this.ringBurst(this.fish?.x ?? this.scale.width * 0.61, this.fish?.y ?? this.scale.height * 0.5, 0xf5c240)
					if (!this.reducedMotion) {
						this.cameras.main.shake(150, 0.005)
					}
					this.playAudio("sfx_combo_milestone_a", "gameplay")
				} else {
					this.playAudio("sfx_word_complete_a", "typing")
				}
			}),
			bridge.on("typo:occurred", ({ ignoredBySteelLine }) => {
				if (this.currentFish) {
					this.playFishAnimation(this.currentFish, ignoredBySteelLine ? "stunned" : "struggle")
					this.time.delayedCall(420, () => {
						if (this.currentFish && this.currentFishState !== "caught" && this.currentFishState !== "escape") {
							this.playFishAnimation(this.currentFish, "swim")
						}
					})
				}
				this.pullTrauma = Math.min(1, this.pullTrauma + (ignoredBySteelLine ? 0.16 : 0.38))
				this.emitLinePulse(ignoredBySteelLine ? 0x73e39a : 0xf05a5e)
				this.floatText(ignoredBySteelLine ? "STEEL LINE" : "TENSION SNAP", this.scale.width * 0.5, this.scale.height * 0.42, ignoredBySteelLine ? 0x73e39a : 0xf05a5e)
				if (!ignoredBySteelLine && !this.reducedMotion) {
					this.cameras.main.shake(250, 0.01)
					this.cameras.main.flash(150, 240, 90, 94)
					this.hitStop(140)
				}
				this.playAudio(ignoredBySteelLine ? "sfx_skill_ready_a" : "sfx_typo_thud_a", ignoredBySteelLine ? "gameplay" : "typing")
			}),
			bridge.on("line:changed", ({ tension, durability, progress }) => {
				this.lineTension = tension
				this.lineDurability = durability
				this.lineProgress = progress
				if (tension >= 82 && this.time.now - this.lastCriticalSfxAt > 850) {
					this.lastCriticalSfxAt = this.time.now
					this.emitLinePulse(0xf05a5e)
					this.playAudio("sfx_line_critical_a", "gameplay", 0.7)
				}
			}),
			bridge.on("phase:changed", ({ phase }) => {
				if (!this.reducedMotion) {
					this.cameras.main.flash(300, 245, 194, 64)
					this.cameras.main.shake(350, 0.012)
					this.hitStop(200)
				}
				this.pullTrauma = 1.0
				this.sparkEmitter?.explode(80, this.fish?.x ?? this.scale.width * 0.61, (this.fish?.y ?? this.scale.height * 0.5) - 8)
				this.ringBurst(this.fish?.x ?? this.scale.width * 0.61, this.fish?.y ?? this.scale.height * 0.5, phase === 3 ? 0xf05a5e : 0xf5c240, 2.0)
				this.floatText(`PHASE ${phase}`, this.scale.width * 0.62, this.scale.height * 0.38, phase === 3 ? 0xf05a5e : 0xf5c240)
				this.playAudio(phase === 3 ? "sfx_rare_sting_a" : "sfx_combo_milestone_b", "gameplay")
			}),
			bridge.on("skill:used", ({ skillId, label }) => {
				this.emitSkillVfx(skillId, label)
			}),
			bridge.on("catch:resolved", ({ result }) => {
				if (this.currentFish) {
					this.playFishAnimation(this.currentFish, result.caught ? "caught" : "escape")
				}
				this.pullTrauma = result.caught ? 1 : 0.72
				this.playAudio(result.caught ? "sfx_catch_impact_a" : "sfx_escape_snap_a", "gameplay")
				this.hitStop(250)

				if (result.caught) {
					if (!this.reducedMotion) {
						this.cameras.main.flash(300, 245, 194, 64)
						this.cameras.main.shake(350, 0.012)
					}
					this.emitWaterImpact(this.fish?.x ?? this.scale.width * 0.61, this.fish?.y ?? this.scale.height * 0.54, 80)
					this.sparkEmitter?.explode(60, this.fish?.x ?? this.scale.width * 0.61, (this.fish?.y ?? this.scale.height * 0.48) - 20)
					this.ringBurst(this.fish?.x ?? this.scale.width * 0.61, this.fish?.y ?? this.scale.height * 0.5, 0xf5c240, 2.5)
					this.floatText("CATCH!", this.scale.width * 0.58, this.scale.height * 0.36, 0xf5c240)
					this.playAudio("sfx_reward_sting_a", "gameplay")
				} else {
					this.floatText("ESCAPED", this.scale.width * 0.58, this.scale.height * 0.42, 0xf05a5e)
					if (!this.reducedMotion) {
						this.cameras.main.shake(190, 0.005)
					}
				}
			}),
			bridge.on("level:up", ({ toLevel }) => {
				this.floatText(`LEVEL ${toLevel}`, this.scale.width * 0.5, this.scale.height * 0.34, 0xf5c240)
				this.emitWaterImpact(this.scale.width * 0.5, this.scale.height * 0.5, 90)
				this.sparkEmitter?.explode(100, this.scale.width * 0.5, this.scale.height * 0.42)
				this.ringBurst(this.scale.width * 0.5, this.scale.height * 0.48, 0xf5c240, 2.8)
				this.playAudio("sfx_reward_sting_a", "gameplay", 1.1)
				if (!this.reducedMotion) {
					this.cameras.main.flash(360, 245, 194, 64)
					this.cameras.main.shake(380, 0.014)
					this.hitStop(180)
				}
			}),
			bridge.on("audio:play", ({ key, category }) => this.playAudio(key, category)),
			bridge.on("settings:volumes", (volumes) => {
				this.volumes = { ...volumes }
				this.updateLoopVolumes()
			}),
			bridge.on("game:paused", ({ paused }) => {
				this.gamePaused = paused
				if (paused) {
					this.anims.pauseAll()
					this.tweens.pauseAll()
				} else {
					this.anims.resumeAll()
					this.tweens.resumeAll()
				}
			}),
			bridge.on("settings:effects", ({ reducedMotion }) => {
				this.reducedMotion = reducedMotion
			}),
		)
	}

	private playFishAnimation(fish: FishSpecies, state: FishVisualState): void {
		if (!this.fish) {
			return
		}
		this.currentFishState = state
		if (fish.assetKey === animatedFishAssetKey) {
			const frameCount = pebbleGobyFrameCounts[state]
			const sheetKey = `pebble_goby_${state}_${frameCount}f`
			const key = `${animatedFishAssetKey}_${state}`
			if (!this.anims.exists(key)) {
				this.anims.create({
					key,
					frames: this.anims.generateFrameNumbers(sheetKey, { start: 0, end: frameCount - 1 }),
					frameRate: pebbleGobyFrameRates[state],
					repeat: state === "caught" || state === "escape" ? 0 : -1,
				})
			}
			this.fish.setTexture(sheetKey, 0)
			this.fish.play(key, true)
			return
		}
		const frameCount = rareOrBossFish.has(fish.id) ? 6 : 4
		const key = `${fish.assetKey}_${state}`
		if (!this.anims.exists(key)) {
			this.anims.create({
				key,
				frames: this.anims.generateFrameNames("ocean", {
					prefix: `${fish.assetKey}_${state}_`,
					start: 0,
					end: frameCount - 1,
					suffix: ".png",
				}),
				frameRate: fish.id === bossFish ? 9 : state === "struggle" ? 12 : 8,
				repeat: state === "caught" || state === "escape" ? 0 : -1,
			})
		}
		this.fish.setTexture("ocean", `${fish.assetKey}_${state}_0.png`)
		this.fish.play(key, true)
	}

	private setZoneBackground(habitat: FishSpecies["habitat"]): void {
		const zoneKey = habitat === "zone_3" ? "zone3" : habitat === "zone_2" ? "zone2" : "zone1"
		this.bgLayers.forEach((image, index) => {
			image.setTexture(`bg_${zoneKey}_${layers[index]}`)
		})
		const tint = habitat === "zone_3" ? 0x7b75ff : habitat === "zone_2" ? 0x54e7d1 : 0x6ff4ff
		this.sceneTint?.setFillStyle(tint, habitat === "zone_1" ? 0.06 : 0.1)
	}

	private updateLine(time = this.time.now): void {
		if (!this.line || !this.lure) {
			return
		}
		const width = this.scale.width
		const height = this.scale.height
		const rodTip = { x: width * 0.27, y: height * 0.31 }
		const lure = { x: this.lure.x, y: this.lure.y }
		const mouth = this.fish
			? { x: this.fish.x - this.fish.displayWidth * 0.34, y: this.fish.y + this.fish.displayHeight * 0.04 }
			: lure
		const danger = this.lineTension >= 82 || this.lineDurability < 35
		const lineColor = danger ? 0xf05a5e : this.lineTension > 58 ? 0xf5c240 : 0xe7fbff
		const glowColor = danger ? 0xff7f7f : 0x9ae7ff
		const jitter = this.reducedMotion ? 0 : Math.max(0, this.lineTension - 40) / 100 * 8 + this.pullTrauma * 8

		this.line.clear()
		this.line.lineStyle(7, glowColor, danger ? 0.22 : 0.13)
		this.drawSaggingLine(rodTip, lure, jitter * 0.4, time, 5)
		this.drawSaggingLine(lure, mouth, jitter, time + 90, 5)
		this.line.lineStyle(danger ? 3 : 2, lineColor, 0.96)
		this.drawSaggingLine(rodTip, lure, jitter * 0.34, time, 7)
		this.drawSaggingLine(lure, mouth, jitter, time + 130, 7)
		this.line.lineStyle(1, 0xf5c240, danger ? 0.82 : 0.55)
		this.drawSaggingLine(rodTip, lure, jitter * 0.2 + 1, time + 40, 6)
	}

	private drawSaggingLine(from: { x: number; y: number }, to: { x: number; y: number }, jitter: number, time: number, segments: number): void {
		if (!this.line) {
			return
		}
		let previous = from
		for (let index = 1; index <= segments; index += 1) {
			const amount = index / segments
			const sag = Math.sin(amount * Math.PI) * (14 + this.lineTension * 0.08)
			const wave = Math.sin(time / 42 + amount * Math.PI * 4) * jitter
			const next = {
				x: from.x + (to.x - from.x) * amount + wave,
				y: from.y + (to.y - from.y) * amount + sag,
			}
			this.line.lineBetween(previous.x, previous.y, next.x, next.y)
			previous = next
		}
	}

	private layout(): void {
		const width = this.scale.width
		const height = this.scale.height
		this.gameplayBackdrop?.setDisplaySize(width + 20, height)
		this.bgLayers.forEach((image) => image.setDisplaySize(width + 20, height))
		this.sceneTint?.setSize(width, height)
		this.boat?.setPosition(width * 0.09, height - 54)
		this.rod?.setPosition(width * 0.075, height + 20)
		this.lure?.setPosition(width * 0.5, height * 0.57)
		this.hookGlow?.setPosition(width * 0.5, height * 0.57)
		this.fish?.setPosition(width * 0.68, height * 0.53)
		this.fishShadow?.setPosition(width * 0.68, height * 0.6)
		this.updateLine()
	}

	private startLoops(): void {
		if (this.loopsStarted) {
			return
		}
		this.loopsStarted = true
		this.ambientLoop = this.sound.add("sfx_ambient_ocean_loop", { loop: true, volume: this.volumes.environment })
		this.musicLoop = this.sound.add("sfx_music_expedition_loop", { loop: true, volume: this.volumes.music })
		this.ambientLoop.play()
		this.musicLoop.play()
		if (this.currentFish?.id === bossFish) {
			this.ensureBossLayer()
		}
	}

	private ensureBossLayer(): void {
		if (!this.loopsStarted || this.bossLoop?.isPlaying) {
			return
		}
		this.bossLoop = this.sound.add("sfx_music_boss_layer", { loop: true, volume: 0 })
		this.bossLoop.play()
		this.tweens.add({
			targets: this.bossLoop,
			volume: this.volumes.music * 0.58,
			duration: 850,
			ease: "Quad.Out",
		})
	}

	private fadeBossLayer(): void {
		if (!this.bossLoop?.isPlaying) {
			return
		}
		this.tweens.add({
			targets: this.bossLoop,
			volume: 0,
			duration: 500,
			onComplete: () => this.bossLoop?.stop(),
		})
	}

	private updateLoopVolumes(): void {
		setSoundVolume(this.ambientLoop, this.volumes.environment)
		setSoundVolume(this.musicLoop, this.volumes.music)
		setSoundVolume(this.bossLoop, this.volumes.music * 0.58)
	}

	private playAudio(key: string, category: VolumeCategory, multiplier = 1): void {
		if (!this.cache.audio.exists(key)) {
			return
		}
		this.sound.play(key, {
			volume: this.volumes[category] * multiplier,
			rate: 0.96 + (this.time.now % 7) * 0.012,
		})
	}

	private emitLinePulse(tint: number): void {
		if (!this.lure) {
			return
		}
		this.sparkEmitter?.explode(3, this.lure.x, this.lure.y)
		this.streakEmitter?.explode(2, this.lure.x + 16, this.lure.y)
		this.ringBurst(this.lure.x, this.lure.y, tint, 0.36)
	}

	private emitWaterImpact(x: number, y: number, amount: number): void {
		this.splashEmitter?.explode(amount, x, y)
		this.bubbleEmitter?.explode(Math.ceil(amount * 0.45), x - 12, y + 16)
	}

	private emitSkillVfx(skillId: string, label: string): void {
		const x = this.fish?.x ?? this.scale.width * 0.58
		const y = this.fish?.y ?? this.scale.height * 0.52
		const color = skillId === "calm_current" ? 0x73e39a : skillId === "sonar" ? 0x9ae7ff : skillId === "cast_net" ? 0xf5c240 : 0xf899ff
		this.floatText(label.toUpperCase(), x, y - 80, color)
		this.playAudio(skillId === "cast_net" ? "sfx_cast_net_a" : "sfx_skill_activate_a", "gameplay")

		if (skillId === "cast_net") {
			this.ringBurst(x, y, 0xf5c240, 1.85)
			this.emitWaterImpact(x, y, 34)
			this.sparkEmitter?.explode(26, x, y - 10)
			return
		}

		if (skillId === "calm_current") {
			this.ringBurst(x, y, 0x73e39a, 1.4)
			this.bubbleEmitter?.explode(38, x, y + 8)
			this.cameras.main.setBackgroundColor("#062342")
			this.time.delayedCall(180, () => this.cameras.main.setBackgroundColor("#051326"))
			return
		}

		if (skillId === "sonar") {
			for (let index = 0; index < 3; index += 1) {
				this.time.delayedCall(index * 140, () => this.ringBurst(this.scale.width * 0.55, this.scale.height * 0.52, 0x9ae7ff, 2.2 + index * 0.45))
			}
			this.playAudio("sfx_skill_ready_a", "gameplay")
			return
		}

		if (skillId === "steel_line") {
			this.emitLinePulse(0x9ae7ff)
			this.ringBurst(this.lure?.x ?? x, this.lure?.y ?? y, 0x9ae7ff, 0.85)
			return
		}

		if (skillId === "perfect_bait") {
			this.ringBurst(x, y, 0xf899ff, 1.2)
			this.bubbleEmitter?.explode(18, x, y + 14)
			this.sparkEmitter?.explode(14, x, y - 16)
			return
		}

		if (skillId === "reel_mastery") {
			this.ringBurst(x, y, 0xf5c240, 1.45)
			this.sparkEmitter?.explode(32, x, y - 20)
			if (!this.reducedMotion) {
				this.cameras.main.shake(150, 0.0025)
			}
			return
		}

		this.ringBurst(x, y, color, 1.1)
		this.sparkEmitter?.explode(22, x, y - 18)
	}

	private bossEntrance(): void {
		if (!this.fish) {
			return
		}
		this.fish.setX(this.scale.width + this.fish.displayWidth)
		this.fish.setAlpha(0)
		this.tweens.add({
			targets: this.fish,
			x: this.scale.width * 0.73,
			alpha: 1,
			duration: this.reducedMotion ? 180 : 850,
			ease: "Back.Out",
		})
		if (!this.reducedMotion) {
			this.cameras.main.shake(260, 0.005)
		}
		this.ringBurst(this.scale.width * 0.68, this.scale.height * 0.52, 0xf5c240, 2)
	}

	private popFish(amount: number): void {
		if (!this.fish) {
			return
		}
		this.tweens.killTweensOf(this.fish)
		const baseScale = this.currentFish ? getFishScale(this.currentFish) : 1.25
		this.fish.setScale(baseScale * amount, baseScale * (2 - amount))
		this.tweens.add({
			targets: this.fish,
			scaleX: baseScale,
			scaleY: baseScale,
			duration: 170,
			ease: "Back.Out",
		})
	}

	private ringBurst(x: number, y: number, tint: number, scale = 1): void {
		const ring = this.add.image(x, y, "ocean", "vfx_glow_ring_default.png").setDepth(31).setScale(0.12 * scale).setAlpha(0.78)
		ring.setTint(tint)
		ring.setBlendMode(Phaser.BlendModes.ADD)
		this.tweens.add({
			targets: ring,
			scale: 1.2 * scale,
			alpha: 0,
			duration: this.reducedMotion ? 240 : 520,
			ease: "Quad.Out",
			onComplete: () => ring.destroy(),
		})
	}

	private floatText(text: string, x: number, y: number, color: number): void {
		const label = this.add.text(x, y, text, {
			fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
			fontSize: "22px",
			fontStyle: "900",
			color: `#${color.toString(16).padStart(6, "0")}`,
			stroke: "#020815",
			strokeThickness: 5,
		}).setOrigin(0.5).setDepth(42).setAlpha(0)
		this.tweens.add({
			targets: label,
			y: y - 46,
			alpha: { from: 1, to: 0 },
			scale: { from: 0.75, to: 1.12 },
			duration: this.reducedMotion ? 380 : 720,
			ease: "Back.Out",
			onComplete: () => label.destroy(),
		})
	}

	private hitStop(duration: number): void {
		if (this.reducedMotion || !this.sys) {
			return
		}
		this.hitStopUntil = Math.max(this.hitStopUntil, performance.now() + duration)
		if (this.hitStopTimer) {
			return
		}
		this.scene.pause()
		const release = () => {
			const remaining = this.hitStopUntil - performance.now()
			if (remaining > 0) {
				this.hitStopTimer = setTimeout(release, remaining)
				return
			}
			this.hitStopTimer = undefined
			this.hitStopUntil = 0
			if (this.sys && this.sys.isActive() === false) {
				this.scene.resume()
			}
		}
		this.hitStopTimer = setTimeout(release, duration)
	}

	private shutdownScene(): void {
		if (this.hitStopTimer) {
			clearTimeout(this.hitStopTimer)
			this.hitStopTimer = undefined
		}
		this.cleanup.forEach((dispose) => dispose())
		this.cleanup = []
		this.scale.off("resize", this.layout, this)
		this.sound.stopAll()
		this.bgLayers = []
		this.gameplayBackdrop = undefined
		this.ambientSprites = []
	}
}

function getFishScale(fish: FishSpecies): number {
	if (fish.id === bossFish) {
		return 1.94
	}
	if (fish.rarity === "rare") {
		return 1.42
	}
	if (fish.rarity === "uncommon") {
		return 1.34
	}
	return 1.24
}

function getFishDrift(fish: FishSpecies): number {
	switch (fish.behavior) {
		case "calm":
			return 8
		case "darting":
			return 18
		case "armored":
			return 6
		case "tricky":
			return 15
		case "swarm":
			return 13
		case "predator":
			return 18
		case "boss":
			return 22
	}
}

function setSoundVolume(sound: Phaser.Sound.BaseSound | undefined, volume: number): void {
	if (!sound) {
		return
	}
	const adjustable = sound as Phaser.Sound.BaseSound & { setVolume?: (value: number) => void; volume?: number }
	if (typeof adjustable.setVolume === "function") {
		adjustable.setVolume(volume)
		return
	}
	adjustable.volume = volume
}
