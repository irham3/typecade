import Phaser from "phaser"
import type { FishSpecies } from "@typecade/contracts"
import type { GameEventBridge } from "../bridge/game-event-bridge"

export interface FishingSceneData {
	bridge: GameEventBridge
}

type VolumeCategory = "music" | "environment" | "gameplay" | "typing"

const layers = ["sky", "water", "midground", "encounter", "foreground"] as const
const zones = ["zone1", "zone2", "zone3"] as const
const rareOrBossFish = new Set(["moonfin_snapper", "glass_eel", "reef_shark", "crown_leviathan"])
const bossFish = "crown_leviathan"
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
	private fish?: Phaser.GameObjects.Sprite
	private lure?: Phaser.GameObjects.Image
	private rod?: Phaser.GameObjects.Image
	private line?: Phaser.GameObjects.Graphics
	private splashEmitter?: Phaser.GameObjects.Particles.ParticleEmitter
	private bubbleEmitter?: Phaser.GameObjects.Particles.ParticleEmitter
	private sparkEmitter?: Phaser.GameObjects.Particles.ParticleEmitter
	private currentFish?: FishSpecies
	private reducedMotion = false
	private volumes: Record<VolumeCategory, number> = {
		music: 0.45,
		environment: 0.55,
		gameplay: 0.72,
		typing: 0.38,
	}
	private loopsStarted = false

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
		this.reducedMotion = false
		this.loopsStarted = false
	}

	preload(): void {
		this.load.on("loaderror", (file: { key?: string; src?: string }) => {
			console.error("[typecade] asset load failed", file.key, file.src)
		})
		this.load.atlas("ocean", "/assets/ocean/atlases/atlas_ocean.png", "/assets/ocean/atlases/atlas_ocean.json")
		for (const zone of zones) {
			for (const layer of layers) {
				this.load.image(`bg_${zone}_${layer}`, `/assets/ocean/backgrounds/bg_shallow_coast_${zone}_${layer}.webp`)
			}
		}
		this.load.image("bg_route_map", "/assets/ocean/backgrounds/bg_shallow_coast_route_map.webp")
		this.load.image("bg_weather_dawn", "/assets/ocean/backgrounds/bg_shallow_coast_weather_dawn.webp")
		for (const audio of audioFiles) {
			this.load.audio(audio, `/assets/ocean/audio/${audio}.ogg`)
		}
	}

	create(): void {
		for (const layer of layers) {
			const image = this.add.image(0, 0, `bg_zone1_${layer}`).setOrigin(0, 0)
			image.setDepth(layer === "foreground" ? 18 : layer === "encounter" ? 8 : 0)
			this.bgLayers.push(image)
		}

		this.line = this.add.graphics()
		this.line.setDepth(20)
		this.rod = this.add.image(120, 760, "ocean", "ui_equipment_rod_bamboo.png").setDepth(22).setOrigin(0.1, 0.9)
		this.rod.setScale(2.45).setRotation(-0.78)
		this.lure = this.add.image(760, 530, "ocean", "ui_equipment_bait_shell.png").setDepth(23).setScale(0.42)
		this.fish = this.add.sprite(970, 515, "ocean", "fish_reef_minnow_idle_0.png").setDepth(24).setScale(1.35)

		this.bubbleEmitter = this.add.particles(0, 0, "ocean", {
			frame: "vfx_bubble_default.png",
			emitting: false,
			lifespan: 1050,
			speed: { min: 20, max: 70 },
			scale: { start: 0.22, end: 0.04 },
			alpha: { start: 0.72, end: 0 },
			maxParticles: 56,
		})
		this.splashEmitter = this.add.particles(0, 0, "ocean", {
			frame: "vfx_foam_droplet_default.png",
			emitting: false,
			lifespan: 650,
			speed: { min: 70, max: 190 },
			angle: { min: 210, max: 330 },
			gravityY: 220,
			scale: { start: 0.36, end: 0.08 },
			alpha: { start: 0.9, end: 0 },
			maxParticles: 72,
		})
		this.sparkEmitter = this.add.particles(0, 0, "ocean", {
			frame: "vfx_sharp_spark_default.png",
			emitting: false,
			lifespan: 520,
			speed: { min: 80, max: 220 },
			scale: { start: 0.2, end: 0.02 },
			tint: 0xf5c240,
			alpha: { start: 0.95, end: 0 },
			maxParticles: 48,
		})

		this.subscribeToBridge()
		this.events.once("shutdown", this.shutdownScene, this)
		this.scale.on("resize", this.layout, this)
		this.input.once("pointerdown", () => this.startLoops())
		this.input.keyboard?.once("keydown", () => this.startLoops())
		this.layout()
		this.updateLine()
	}

	override update(time: number): void {
		const width = this.scale.width
		const height = this.scale.height
		this.bgLayers.forEach((layer, index) => {
			const drift = Math.sin(time / (2600 + index * 850)) * (index + 1) * 2.5
			layer.setPosition(drift - 8, 0)
			layer.setDisplaySize(width + 16, height)
		})

		if (this.fish && this.currentFish) {
			const bossScale = this.currentFish.id === bossFish ? 1.38 : 1
			const driftY = Math.sin(time / (this.currentFish.behavior === "darting" ? 310 : 760)) * (this.currentFish.behavior === "calm" ? 8 : 15)
			const driftX = Math.sin(time / (this.currentFish.behavior === "predator" ? 520 : 980)) * (this.currentFish.behavior === "swarm" ? 26 : 12)
			this.fish.setPosition(width * 0.62 + driftX, height * 0.53 + driftY)
			this.fish.setScale((this.currentFish.id === bossFish ? 1.82 : 1.22) * bossScale)
			this.fish.setRotation(Math.sin(time / 900) * 0.035)
		}

		if (this.lure) {
			this.lure.setPosition(width * 0.47, height * 0.57 + Math.sin(time / 520) * 5)
		}
		this.updateLine()
	}

	private subscribeToBridge(): void {
		const bridge = this.bridge
		if (!bridge) {
			return
		}

		this.cleanup.push(
			bridge.on("encounter:started", ({ fish }) => {
				this.currentFish = fish
				this.setZoneBackground(fish.habitat)
				this.playFishAnimation(fish, "bite")
				this.time.delayedCall(360, () => this.playFishAnimation(fish, "swim"))
				this.bubbleEmitter?.explode(8, this.scale.width * 0.62, this.scale.height * 0.53)
				if (fish.rarity === "rare" || fish.rarity === "boss") {
					this.sparkEmitter?.explode(14, this.scale.width * 0.62, this.scale.height * 0.5)
				}
			}),
			bridge.on("fish:hooked", ({ fish }) => {
				this.currentFish = fish
				this.playFishAnimation(fish, "bite")
				this.playAudio("sfx_splash_a", "gameplay")
			}),
			bridge.on("word:completed", ({ combo }) => {
				this.splashEmitter?.explode(combo >= 5 ? 16 : 8, this.scale.width * 0.61, this.scale.height * 0.55)
				if (combo > 0 && combo % 5 === 0) {
					this.sparkEmitter?.explode(20, this.scale.width * 0.61, this.scale.height * 0.49)
					this.playAudio("sfx_combo_milestone_a", "gameplay")
				} else {
					this.playAudio("sfx_word_complete_a", "typing")
				}
			}),
			bridge.on("typo:occurred", ({ ignoredBySteelLine }) => {
				if (this.currentFish) {
					this.playFishAnimation(this.currentFish, ignoredBySteelLine ? "stunned" : "struggle")
				}
				if (!ignoredBySteelLine && !this.reducedMotion) {
					this.cameras.main.shake(90, 0.0035)
				}
				this.playAudio(ignoredBySteelLine ? "sfx_skill_ready_a" : "sfx_typo_thud_a", ignoredBySteelLine ? "gameplay" : "typing")
			}),
			bridge.on("line:changed", ({ tension }) => {
				if (tension >= 82) {
					this.playAudio("sfx_line_critical_a", "gameplay")
				}
			}),
			bridge.on("phase:changed", ({ phase }) => {
				if (!this.reducedMotion) {
					this.cameras.main.flash(140, 245, 194, 64)
					this.cameras.main.shake(160, 0.005)
				}
				this.sparkEmitter?.explode(34, this.scale.width * 0.61, this.scale.height * 0.5)
				this.playAudio(phase === 3 ? "sfx_rare_sting_a" : "sfx_combo_milestone_b", "gameplay")
			}),
			bridge.on("skill:used", ({ skillId }) => {
				this.playAudio(skillId === "cast_net" ? "sfx_cast_net_a" : "sfx_skill_activate_a", "gameplay")
				this.sparkEmitter?.explode(18, this.scale.width * 0.47, this.scale.height * 0.57)
			}),
			bridge.on("catch:resolved", ({ result }) => {
				if (this.currentFish) {
					this.playFishAnimation(this.currentFish, result.caught ? "caught" : "escape")
				}
				this.playAudio(result.caught ? "sfx_catch_impact_a" : "sfx_escape_snap_a", "gameplay")
				if (result.caught) {
					this.splashEmitter?.explode(40, this.scale.width * 0.61, this.scale.height * 0.54)
					this.sparkEmitter?.explode(28, this.scale.width * 0.61, this.scale.height * 0.48)
				}
			}),
			bridge.on("audio:play", ({ key, category }) => this.playAudio(key, category)),
			bridge.on("settings:volumes", (volumes) => {
				this.volumes = { ...volumes }
				this.updateLoopVolumes()
			}),
			bridge.on("settings:effects", ({ reducedMotion }) => {
				this.reducedMotion = reducedMotion
			}),
		)
	}

	private playFishAnimation(fish: FishSpecies, state: string): void {
		if (!this.fish) {
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
				frameRate: fish.id === bossFish ? 7 : 8,
				repeat: state === "caught" || state === "escape" ? 0 : -1,
			})
		}
		this.fish.play(key, true)
	}

	private setZoneBackground(habitat: FishSpecies["habitat"]): void {
		const zoneKey = habitat === "zone_3" ? "zone3" : habitat === "zone_2" ? "zone2" : "zone1"
		this.bgLayers.forEach((image, index) => {
			image.setTexture(`bg_${zoneKey}_${layers[index]}`)
		})
	}

	private updateLine(): void {
		if (!this.line || !this.lure) {
			return
		}
		const width = this.scale.width
		const height = this.scale.height
		this.line.clear()
		this.line.lineStyle(2, 0xe7fbff, 0.9)
		this.line.lineBetween(width * 0.27, height * 0.32, this.lure.x, this.lure.y)
		this.line.lineStyle(1, 0xf5c240, 0.55)
		this.line.lineBetween(width * 0.27 + 4, height * 0.32, this.lure.x + 2, this.lure.y)
	}

	private layout(): void {
		const width = this.scale.width
		const height = this.scale.height
		this.bgLayers.forEach((image) => image.setDisplaySize(width + 16, height))
		this.rod?.setPosition(width * 0.07, height + 20)
		this.lure?.setPosition(width * 0.47, height * 0.57)
		this.fish?.setPosition(width * 0.62, height * 0.53)
		this.updateLine()
	}

	private startLoops(): void {
		if (this.loopsStarted) {
			return
		}
		this.loopsStarted = true
		this.sound.play("sfx_ambient_ocean_loop", { loop: true, volume: this.volumes.environment })
		this.sound.play("sfx_music_expedition_loop", { loop: true, volume: this.volumes.music })
	}

	private updateLoopVolumes(): void {
		for (const sound of this.sound.sounds) {
			if (sound.key === "sfx_ambient_ocean_loop") {
				sound.setVolume(this.volumes.environment)
			}
			if (sound.key === "sfx_music_expedition_loop" || sound.key === "sfx_music_boss_layer") {
				sound.setVolume(this.volumes.music)
			}
		}
	}

	private playAudio(key: string, category: VolumeCategory): void {
		if (!this.cache.audio.exists(key)) {
			return
		}
		this.sound.play(key, {
			volume: this.volumes[category],
		})
	}

	private shutdownScene(): void {
		this.cleanup.forEach((dispose) => dispose())
		this.cleanup = []
		this.scale.off("resize", this.layout, this)
		this.sound.stopAll()
	}
}
