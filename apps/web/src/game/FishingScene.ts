import {
	BufferAttribute, BufferGeometry, Color, DoubleSide, DynamicDrawUsage, Group,
	HemisphereLight, DirectionalLight, InstancedMesh, Line, LineBasicMaterial,
	Matrix4, Mesh, MeshBasicMaterial, MeshStandardMaterial, OrthographicCamera,
	PlaneGeometry, RingGeometry, Scene, ShaderMaterial, Vector2, Vector3, WebGLRenderer,
} from "three"
import type { FishSpecies } from "@typecade/contracts"
import { createSeededRng } from "@typecade/game-rules"
import type { GameEventBridge } from "../bridge/game-event-bridge"
import { OceanAssets, gobyFrames, type FishVisualState } from "./OceanAssets"
import { OceanAudio } from "./OceanAudio"
import { fishLayout, surfaceY } from "./ocean-motion"

type PixelMesh = Mesh<PlaneGeometry, MeshBasicMaterial>
interface Particle { x: number; y: number; vx: number; vy: number; life: number; size: number; bubble: boolean }
interface Ring { mesh: Mesh<RingGeometry, MeshBasicMaterial>; life: number; scale: number }
const eyes: Record<string, [number, number, number, number, number]> = {
	fish_kelp_darter: [23, 53, 13, 11, 0xb1cb59], fish_sunny_guppy: [30, 61, 16, 17, 0xffd145],
	fish_shellback_puffer: [42, 57, 14, 14, 0xbcdcca], fish_tide_skipper: [14, 54, 9, 6, 0x57bde0],
	fish_coral_fry: [43, 62, 17, 17, 0xf9b7af], fish_glass_eel: [40, 51, 8, 6, 0xe7c861],
	fish_moonfin_snapper: [29, 51, 12, 10, 0x8c83b0], fish_reef_shark: [24, 56, 9, 4, 0x8cb6bf],
	fish_crown_leviathan: [30, 76, 10, 4, 0x258da9], fish_pebble_goby: [35, 55, 7, 6, 0xb9a864],
}

/** Rendering only: outcomes arrive through domain events, never through scene internals. */
export class FishingScene {
	readonly ready: Promise<void>
	readonly renderer: WebGLRenderer
	readonly scene = new Scene()
	readonly camera = new OrthographicCamera(0, 1, 0, -1, .1, 200)
	private readonly assets = new OceanAssets()
	private readonly audio = new OceanAudio()
	private readonly cleanups: Array<() => void> = []
	private readonly geometries = new Set<BufferGeometry>()
	private readonly materials = new Set<MeshBasicMaterial | MeshStandardMaterial | ShaderMaterial | LineBasicMaterial>()
	private readonly observer: ResizeObserver
	private readonly random = createSeededRng("ocean-renderer-v1")
	private disposed = false
	private contextLost = false
	private initialized = false
	private dirty = true
	private paused = true
	private reduced = false
	private screen = "menu"
	private width = 1
	private height = 1
	private time = 0
	private lastFrame = 0
	private stateUntil = 0
	private hitStop = 0
	private trauma = 0
	private progress = 0
	private tension = 28
	private durability = 100
	private lastTick = -1
	private lastCritical = -1
	private currentFish?: FishSpecies
	private fishState: FishVisualState = "idle"
	private fishWidth = 160
	private fishHeight = 108
	private endTime = -1
	private endX = 0
	private endY = 0
	private lastTexture = ""
	private backdrop!: PixelMesh
	private boat!: PixelMesh
	private rod!: PixelMesh
	private fishBody!: PixelMesh
	private fishTail!: PixelMesh
	private eyelid!: PixelMesh
	private eyeLine!: PixelMesh
	private gill!: PixelMesh
	private readonly fish = new Group()
	private wake!: Mesh<RingGeometry, MeshBasicMaterial>
	private line!: Line<BufferGeometry, LineBasicMaterial>
	private lure!: PixelMesh
	private water!: Mesh<PlaneGeometry, ShaderMaterial>
	private surface!: Mesh<PlaneGeometry, MeshStandardMaterial>
	private particles!: InstancedMesh<PlaneGeometry, MeshBasicMaterial>
	private readonly pool: Particle[] = []
	private readonly rings: Ring[] = []
	private readonly ambient: PixelMesh[] = []
	private readonly matrix = new Matrix4()
	private readonly color = new Color()
	private readonly rodTip = new Vector3()

	constructor(private readonly host: HTMLElement, private readonly bridge: GameEventBridge) {
		this.renderer = new WebGLRenderer({ antialias: false, alpha: false, preserveDrawingBuffer: true, powerPreference: "low-power" })
		this.renderer.setPixelRatio(1)
		this.renderer.domElement.setAttribute("aria-hidden", "true")
		this.renderer.domElement.style.imageRendering = "pixelated"
		this.host.append(this.renderer.domElement)
		this.scene.background = new Color(0x051326)
		this.camera.position.z = 100
		this.observer = new ResizeObserver(() => this.resize())
		this.observer.observe(host)
		this.listen(window, "keydown", () => this.audio.unlock())
		this.listen(window, "pointerdown", () => this.audio.unlock())
		this.listen(document, "visibilitychange", () => { this.lastFrame = 0; this.syncAudio() })
		this.listen(this.renderer.domElement, "webglcontextlost", event => {
			event.preventDefault(); this.contextLost = true; this.audio.setActive(false)
			this.host.dispatchEvent(new CustomEvent("renderer:error"))
		})
		this.resize()
		this.ready = this.initialize().catch(error => { this.destroy(); throw error })
	}

	private listen(target: EventTarget, type: string, handler: (event: Event) => void): void {
		target.addEventListener(type, handler)
		this.cleanups.push(() => target.removeEventListener(type, handler))
	}
	private geometry<T extends BufferGeometry>(geometry: T): T { this.geometries.add(geometry); return geometry }
	private material<T extends MeshBasicMaterial | MeshStandardMaterial | ShaderMaterial | LineBasicMaterial>(material: T): T { this.materials.add(material); return material }
	private pixel(name: string, parent: Scene | Group = this.scene, tint = 0xffffff): PixelMesh {
		const mesh = new Mesh(this.geometry(new PlaneGeometry(1, 1)), this.material(new MeshBasicMaterial({ transparent: true, alphaTest: .04, depthWrite: false, color: tint })))
		mesh.name = name; parent.add(mesh)
		return mesh
	}

	private async initialize(): Promise<void> {
		await this.assets.load()
		if (this.disposed) { this.assets.dispose(); return }
		this.backdrop = this.pixel("coast")
		this.backdrop.material.map = this.assets.textures.get("backdrop")!
		this.boat = this.pixel("boat"); this.frame(this.boat, "ui_equipment_boat_default.png")
		this.rod = this.pixel("rod"); this.frame(this.rod, "ui_equipment_rod_bamboo.png")
		this.scene.add(this.fish); this.fish.name = "hooked-fish"
		this.fishBody = this.pixel("body", this.fish, 0xe0f5ff)
		this.fishTail = this.pixel("tail", this.fish, 0xe0f5ff)
		this.eyelid = this.pixel("eyelid", this.fish)
		this.eyeLine = this.pixel("closed-eye", this.fish, 0x142d39)
		this.gill = this.pixel("gill", this.fish, 0x234653); this.gill.material.opacity = .5
		this.lure = this.pixel("lure", this.scene, 0xf5c240); this.lure.scale.set(3, 5, 1)
		const lineGeometry = this.geometry(new BufferGeometry())
		lineGeometry.setAttribute("position", new BufferAttribute(new Float32Array(33 * 3), 3).setUsage(DynamicDrawUsage))
		this.line = new Line(lineGeometry, this.material(new LineBasicMaterial({ color: 0xe7fbff, transparent: true, opacity: .9, depthTest: false })))
		this.scene.add(this.line)
		this.wake = new Mesh(this.geometry(new RingGeometry(.86, 1, 32)), this.material(new MeshBasicMaterial({ color: 0xb4eff3, transparent: true, opacity: .7, depthWrite: false })))
		this.scene.add(this.wake)
		this.createWater(); this.createEffects()
		for (const frame of ["fish_ambient_school_idle_0.png", "fish_ambient_shadow_idle_0.png", "fish_ambient_bubbles_idle_0.png"]) {
			const mesh = this.pixel(frame, this.scene, 0x71becb)
			this.frame(mesh, frame); mesh.material.opacity = .35; this.ambient.push(mesh)
		}
		this.initialized = true
		this.subscribe(); this.resize(); this.updateWorld(0)
		this.renderer.render(this.scene, this.camera)
		this.dirty = false
		this.renderer.setAnimationLoop(timestamp => this.tick(timestamp))
	}

	private frame(mesh: PixelMesh, key: string, start = 0, end = 1): void {
		const texture = this.assets.textures.get("atlas")!
		const image = texture.image as HTMLImageElement
		const { x, y, w, h } = this.assets.frames[key].frame
		mesh.material.map = texture
		this.uv(mesh, (x + w * start) / image.width, 1 - (y + h) / image.height, (x + w * end) / image.width, 1 - y / image.height)
	}
	private uv(mesh: PixelMesh, left: number, bottom: number, right: number, top: number): void {
		const uv = mesh.geometry.getAttribute("uv") as BufferAttribute
		uv.setXY(0, left, top); uv.setXY(1, right, top); uv.setXY(2, left, bottom); uv.setXY(3, right, bottom)
		uv.needsUpdate = true
	}

	private createWater(): void {
		this.water = new Mesh(this.geometry(new PlaneGeometry(1, 1)), this.material(new ShaderMaterial({
			transparent: true, depthWrite: false,
			uniforms: { size: { value: new Vector2() }, time: { value: 0 }, motion: { value: 1 }, zone: { value: new Color(0x159cbd) } },
			vertexShader: `varying vec2 p; void main(){p=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
			fragmentShader: `varying vec2 p; uniform vec2 size; uniform float time; uniform float motion; uniform vec3 zone;
			void main(){
			 float x=p.x*size.x; float y=(1.0-p.y)*size.y;
			 float surface=size.y*.3+motion*(sin(p.x*18.0+time*.9)*1.4+sin(p.x*31.0-time*.6)*.6);
			 if(y<surface) discard;
			 float depth=clamp((y-surface)/(size.y*.7),0.0,1.0);
			 vec2 cell=floor(vec2(x,y)/3.0);
			 float light=pow(max(0.0,sin(cell.x*.045+cell.y*.024+time*.35*motion)),18.0)*(1.0-depth);
			 vec3 c=mix(zone,vec3(.012,.065,.17),depth); c+=light*.16;
			 gl_FragColor=vec4(c,.10+depth*.18+light*.08);
			 #include <colorspace_fragment>
			}`,
		})))
		this.water.position.z = 28; this.scene.add(this.water)
		this.surface = new Mesh(this.geometry(new PlaneGeometry(1, 1, 96, 1)), this.material(new MeshStandardMaterial({ color: 0x6bdfde, roughness: .65, metalness: .1, side: DoubleSide, transparent: true, opacity: .7, depthWrite: false })))
		this.surface.position.z = 30; this.scene.add(this.surface)
		this.scene.add(new HemisphereLight(0xb8eaff, 0x07304d, 1.5))
		const sun = new DirectionalLight(0xffe8b8, 2); sun.position.set(-100, 300, 100); this.scene.add(sun)
	}

	private createEffects(): void {
		this.particles = new InstancedMesh(this.geometry(new PlaneGeometry(1, 1)), this.material(new MeshBasicMaterial({ transparent: true, opacity: .7, depthWrite: false })), 128)
		this.particles.instanceMatrix.setUsage(DynamicDrawUsage); this.particles.frustumCulled = false
		this.scene.add(this.particles)
		for (let index = 0; index < 128; index++) {
			this.pool.push({ x: 0, y: 0, vx: 0, vy: 0, life: 0, size: 0, bubble: false })
			this.particles.setColorAt(index, this.color.set(0xffffff))
		}
		for (let index = 0; index < 6; index++) {
			const mesh = new Mesh(this.geometry(new RingGeometry(.95, 1, 40)), this.material(new MeshBasicMaterial({ transparent: true, depthWrite: false })))
			mesh.visible = false; this.scene.add(mesh); this.rings.push({ mesh, life: 0, scale: 1 })
		}
	}

	private syncAudio(): void { this.audio.setActive(!this.paused && this.screen === "game" && !document.hidden && !this.contextLost) }
	private subscribe(): void {
		this.cleanups.push(
			this.bridge.on("screen:changed", ({ screen }) => { this.screen = screen; this.syncAudio(); this.updateWorld(0) }),
			this.bridge.on("game:paused", ({ paused }) => { this.paused = paused; this.syncAudio() }),
			this.bridge.on("settings:effects", ({ reducedMotion }) => {
				this.reduced = reducedMotion; this.hitStop = 0
				this.water.material.uniforms.motion.value = reducedMotion ? 0 : 1; this.updateWorld(0)
			}),
			this.bridge.on("settings:volumes", volumes => this.audio.setVolumes(volumes)),
			this.bridge.on("encounter:started", ({ fish, encounter }) => {
				this.currentFish = fish
				this.progress = encounter.progress; this.tension = encounter.tension; this.durability = encounter.durability
				const frame = fish.assetKey === "fish_pebble_goby" ? { w: 128, h: 96 } : this.assets.frames[`${fish.assetKey}_swim_0.png`].frame
				this.fishWidth = frame.w; this.fishHeight = frame.h
				this.fishState = "bite"; this.stateUntil = this.time + .36; this.endTime = -1; this.lastTexture = ""
				this.water.material.uniforms.zone.value.set(fish.habitat === "zone_3" ? 0x5753a1 : fish.habitat === "zone_2" ? 0x159c91 : 0x159cbd)
				this.audio.setBoss(fish.rarity === "boss"); this.updateWorld(0); this.burst(18, 0x9ae7ff, true)
				if (fish.rarity === "rare" || fish.rarity === "boss") { this.ring(0xf5c240, 1.5); this.audio.play("sfx_rare_sting_a", "gameplay") }
			}),
			this.bridge.on("fish:hooked", () => { this.fishState = "bite"; this.stateUntil = this.time + .36; this.burst(18, 0x9ae7ff, true); this.audio.play("sfx_splash_a", "gameplay") }),
			this.bridge.on("character:correct", () => {
				this.trauma = Math.min(.5, this.trauma + .06)
				if (this.time - this.lastTick > .048) { this.lastTick = this.time; this.audio.play("sfx_correct_tick_a", "typing", .38) }
			}),
			this.bridge.on("word:completed", ({ perfect, combo }) => {
				this.trauma = .5; this.burst(combo >= 5 ? 18 : 8, perfect ? 0xf5c240 : 0x9ae7ff, true)
				if (combo > 0 && combo % 5 === 0) { this.ring(0xf5c240, 1.2); this.audio.play("sfx_combo_milestone_a", "gameplay") }
				else this.audio.play("sfx_word_complete_a", "typing")
			}),
			this.bridge.on("typo:occurred", ({ ignoredBySteelLine }) => {
				this.fishState = ignoredBySteelLine ? "stunned" : "struggle"; this.stateUntil = this.time + .42
				this.trauma = ignoredBySteelLine ? .2 : .6; this.ring(ignoredBySteelLine ? 0x73e39a : 0xf05a5e, .8)
				this.audio.play(ignoredBySteelLine ? "sfx_skill_ready_a" : "sfx_typo_thud_a", "typing")
			}),
			this.bridge.on("line:changed", ({ tension, durability, progress }) => {
				this.tension = tension; this.durability = durability; this.progress = progress
				if (tension >= 82 && this.time - this.lastCritical > .85) { this.lastCritical = this.time; this.audio.play("sfx_line_critical_a", "gameplay", .7) }
			}),
			this.bridge.on("phase:changed", ({ phase }) => { this.ring(phase === 3 ? 0xf05a5e : 0xf5c240, 2); this.burst(40, 0xf5c240, true); this.trauma = .8; this.audio.play("sfx_combo_milestone_b", "gameplay") }),
			this.bridge.on("boss:guard-broken", () => { this.ring(0xf5c240, 2.4); this.burst(32, 0xf5c240, true); this.audio.play("sfx_combo_milestone_b", "gameplay") }),
			this.bridge.on("boss:final-pull", () => { this.ring(0xf05a5e, 2.4); this.audio.play("sfx_rare_sting_a", "gameplay") }),
			this.bridge.on("skill:used", ({ skillId }) => {
				const color = skillId === "calm_current" ? 0x73e39a : skillId === "cast_net" || skillId === "reel_mastery" ? 0xf5c240 : skillId === "perfect_bait" ? 0xf899ff : 0x9ae7ff
				this.ring(color, skillId === "sonar" ? 2.5 : 1.3); this.burst(24, color, true)
				this.audio.play(skillId === "cast_net" ? "sfx_cast_net_a" : "sfx_skill_activate_a", "gameplay")
			}),
			this.bridge.on("catch:resolved", ({ result }) => {
				this.fishState = result.caught ? "caught" : "escape"
				this.endTime = this.time; this.endX = this.fish.position.x; this.endY = -this.fish.position.y
				this.hitStop = this.reduced ? 0 : .06
				this.burst(40, result.caught ? 0xf5c240 : 0xf05a5e, result.caught); this.ring(result.caught ? 0xf5c240 : 0xf05a5e, 2)
				this.audio.play(result.caught ? "sfx_catch_impact_a" : "sfx_escape_snap_a", "gameplay")
				if (result.caught) this.audio.play("sfx_reward_sting_a", "gameplay")
			}),
			this.bridge.on("level:up", () => { this.ring(0xf5c240, 2.8); this.burst(48, 0xf5c240, true); this.audio.play("sfx_reward_sting_a", "gameplay") }),
			this.bridge.on("audio:play", ({ key, category }) => this.audio.play(key, category)),
		)
	}

	private tick(timestamp: number): void {
		const delta = this.lastFrame ? Math.min(.048, Math.max(0, (timestamp - this.lastFrame) / 1000)) : 0
		this.lastFrame = timestamp
		if (this.disposed || this.contextLost || document.hidden) return
		if (!this.paused) {
			if (this.hitStop > 0) this.hitStop = Math.max(0, this.hitStop - delta)
			else { this.time += delta; this.updateWorld(delta) }
		}
		if (this.dirty) { this.renderer.render(this.scene, this.camera); this.dirty = false }
	}

	private resize(): void {
		this.width = Math.max(1, this.host.clientWidth); this.height = Math.max(1, this.host.clientHeight)
		this.camera.right = this.width; this.camera.bottom = -this.height; this.camera.updateProjectionMatrix()
		// Half CSS resolution, enlarged with nearest sampling to keep pixel edges consistent.
		this.renderer.setSize(Math.ceil(this.width / 2), Math.ceil(this.height / 2), false)
		if (!this.initialized) return
		this.backdrop.position.set(this.width / 2, -this.height * .443, 0)
		this.backdrop.scale.set(Math.max(this.width + 20, this.height * 1.1 * 16 / 9), this.height * 1.1, 1)
		this.water.scale.set(this.width, this.height, 1); this.water.position.set(this.width / 2, -this.height / 2, 28)
		this.water.material.uniforms.size.value.set(this.width, this.height)
		this.updateWorld(0)
	}

	private updateWorld(delta: number): void {
		this.dirty = true
		const w = this.width, h = this.height, t = this.time
		this.trauma = Math.max(0, this.trauma - delta * 2.4); this.water.material.uniforms.time.value = t
		const vertices = this.surface.geometry.getAttribute("position") as BufferAttribute
		for (let i = 0; i < vertices.count; i++) {
			const x = (i % 97) / 96 * w
			vertices.setXYZ(i, x, -surfaceY(x, w, h, t, this.reduced) + (i < 97 ? 1 : -3), Math.sin(x / w * 8 + t) * (this.reduced ? 0 : .8))
		}
		vertices.needsUpdate = true
		this.surface.geometry.computeVertexNormals(); this.surface.geometry.computeBoundingSphere()
		const boatSize = 128 * 2.4 * Math.min(1, w / 900, h / 1100)
		const boatX = w * .14, boatY = surfaceY(boatX, w, h, t, this.reduced)
		this.boat.position.set(boatX, -boatY + boatSize * .18, 22); this.boat.scale.set(boatSize, boatSize, 1)
		this.boat.rotation.z = this.reduced ? 0 : Math.atan2(surfaceY(boatX - 8, w, h, t, false) - surfaceY(boatX + 8, w, h, t, false), 16)
		this.wake.position.set(boatX, -boatY - 2, 32); this.wake.scale.set(boatSize * .4, 3, 1)
		this.rod.visible = this.screen === "game"
		this.rod.position.set(boatX + boatSize * .24, -boatY + boatSize * .12, 24)
		this.rod.scale.set(Math.min(.65, w / 1100) * 128, Math.min(.65, w / 1100) * 128, 1)
		this.rod.rotation.z = .82 - Math.max(0, this.tension - 30) * .002
		this.ambient.forEach((mesh, index) => {
			mesh.position.set(w * (.19 + index * .31 + (this.reduced ? 0 : Math.sin(t * .12 + index) * .08)), -h * (.5 + index * .13), 10 + index)
			mesh.scale.set(100 * Math.min(1, w / 900), 60 * Math.min(1, w / 900), 1)
		})
		this.fish.visible = this.screen === "game" && !!this.currentFish
		this.line.visible = this.lure.visible = this.fish.visible && this.endTime < 0
		if (this.currentFish) this.updateFish()
		this.rod.updateMatrixWorld()
		this.rodTip.set(.45, .38, 0).applyMatrix4(this.rod.matrixWorld)
		this.updateLine(this.rodTip.x, -this.rodTip.y); this.updateEffects(delta)
	}

	private updateFish(): void {
		const fish = this.currentFish!
		if (this.endTime < 0 && this.stateUntil <= this.time) this.fishState = "swim"
		const layout = fishLayout(fish, this.width, this.height, this.time, this.progress, this.tension, this.reduced, this.fishWidth, this.fishHeight)
		const breath = this.reduced ? 0 : Math.sin(this.time * 3)
		this.fish.position.set(layout.x, -layout.y, 20)
		this.fish.scale.set(layout.size * (1 + breath * .012), layout.size * (1 - breath * .015), 1)
		this.fish.rotation.y = this.reduced ? 0 : Math.sin(this.time * 1.2) * .10
		let alpha = 1
		if (this.endTime >= 0) {
			const amount = Math.min(1, (this.time - this.endTime) / (this.reduced ? .18 : .7))
			const caught = this.fishState === "caught"
			this.fish.position.x = this.endX + ((caught ? this.width * .22 : this.width + this.fishWidth) - this.endX) * amount * amount
			this.fish.position.y = -this.endY + ((caught ? -this.height * .30 : -this.endY - 30) + this.endY) * amount * amount
			alpha = 1 - amount
		}
		const goby = fish.assetKey === "fish_pebble_goby"
		const frameCount = goby ? gobyFrames[this.fishState] : fish.rarity === "rare" || fish.rarity === "boss" ? 6 : 4
		const frameIndex = Math.floor(this.time * (this.fishState === "struggle" ? 12 : 8)) % frameCount
		const key = `${fish.assetKey}_${this.fishState}_${frameIndex}.png`
		if (key !== this.lastTexture) {
			if (goby) {
				this.fishBody.material.map = this.assets.textures.get(this.fishState)!
				this.uv(this.fishBody, frameIndex / frameCount, 0, (frameIndex + 1) / frameCount, 1)
			} else { this.frame(this.fishBody, key, 0, .72); this.frame(this.fishTail, key, .7, 1) }
			this.lastTexture = key
		}
		this.fishBody.scale.set(this.fishWidth * (goby ? 1 : .72), this.fishHeight, 1)
		this.fishBody.position.x = goby ? 0 : -this.fishWidth * .14
		this.fishTail.visible = !goby; this.fishTail.scale.set(this.fishWidth * .3, this.fishHeight, 1)
		this.fishTail.position.set(this.fishWidth * .35, 0, .1)
		this.fishTail.rotation.y = this.reduced ? 0 : Math.sin(this.time * (this.fishState === "struggle" ? 10 : 5)) * .28
		const [ex, ey, ew, eh, color] = eyes[fish.assetKey]
		const blinking = !this.reduced && (this.time + ex * .113) % 3.9 < .14
		this.eyelid.visible = this.eyeLine.visible = blinking
		this.eyelid.position.set(ex - this.fishWidth / 2, this.fishHeight / 2 - ey, .3)
		this.eyelid.scale.set(ew, eh, 1); this.eyelid.material.color.set(color)
		this.eyeLine.position.copy(this.eyelid.position); this.eyeLine.position.z = .4; this.eyeLine.scale.set(ew, 2, 1)
		this.gill.position.set(ex - this.fishWidth / 2 + ew + 6, this.fishHeight / 2 - ey - 7, .3)
		this.gill.scale.set(2, 8 + breath * 2, 1)
		for (const mesh of [this.fishBody, this.fishTail, this.eyelid, this.eyeLine]) mesh.material.opacity = alpha
		this.gill.material.opacity = alpha * .5
	}

	private updateLine(x: number, y: number): void {
		const mouthX = this.fish.position.x - this.fishWidth * this.fish.scale.x * .34
		const mouthY = -this.fish.position.y + this.fishHeight * this.fish.scale.y * .04
		this.lure.position.set(mouthX - 4, -mouthY, 26)
		const danger = this.tension >= 82 || this.durability < 35
		this.line.material.color.set(danger ? 0xf05a5e : this.tension > 58 ? 0xf5c240 : 0xe7fbff)
		const points = this.line.geometry.getAttribute("position") as BufferAttribute
		for (let i = 0; i <= 32; i++) {
			const amount = i / 32, sag = Math.sin(amount * Math.PI) * (14 + this.tension * .08)
			const jitter = this.reduced ? 0 : Math.sin(this.time * 24 + amount * 12) * this.trauma * 3
			points.setXYZ(i, x + (mouthX - x) * amount + jitter, -(y + (mouthY - y) * amount + sag), 26)
		}
		points.needsUpdate = true; this.line.geometry.computeBoundingSphere()
	}

	private burst(count: number, tint: number, bubble: boolean): void {
		let remaining = this.reduced ? Math.min(count, 4) : count
		for (let i = 0; i < this.pool.length && remaining > 0; i++) {
			const particle = this.pool[i]
			if (particle.life > 0) continue
			particle.x = this.fish.position.x; particle.y = -this.fish.position.y
			particle.vx = (this.random.nextFloat() - .5) * 90; particle.vy = -20 - this.random.nextFloat() * 55
			particle.life = .5 + this.random.nextFloat() * .6; particle.size = 2 + this.random.nextFloat() * 3; particle.bubble = bubble
			this.particles.setColorAt(i, this.color.set(tint)); remaining--
		}
		this.particles.instanceColor!.needsUpdate = true
	}
	private ring(tint: number, scale: number): void {
		const ring = this.rings.find(item => item.life <= 0)
		if (!ring) return
		ring.life = .6; ring.scale = scale; ring.mesh.visible = true
		ring.mesh.position.set(this.fish.position.x, this.fish.position.y, 31); ring.mesh.material.color.set(tint)
	}
	private updateEffects(delta: number): void {
		for (let i = 0; i < this.pool.length; i++) {
			const particle = this.pool[i]; particle.life = Math.max(0, particle.life - delta)
			if (particle.life > 0) {
				particle.x += particle.vx * delta; particle.y += particle.vy * delta; particle.vy += (particle.bubble ? -12 : 120) * delta
				if (particle.bubble && particle.y < surfaceY(particle.x, this.width, this.height, this.time, this.reduced)) particle.life = 0
			}
			const size = particle.life > 0 ? particle.size * Math.min(1, particle.life * 4) : 0
			this.matrix.makeScale(size, size, 1).setPosition(particle.x, -particle.y, 31); this.particles.setMatrixAt(i, this.matrix)
		}
		this.particles.instanceMatrix.needsUpdate = true
		for (const ring of this.rings) {
			ring.life = Math.max(0, ring.life - delta); ring.mesh.visible = this.screen === "game" && ring.life > 0
			const radius = (1 - ring.life / .6) * (this.reduced ? 12 : 42) * ring.scale
			ring.mesh.scale.set(radius, radius * .65, 1); ring.mesh.material.opacity = ring.life
		}
		this.particles.visible = this.screen === "game"
	}

	destroy(): void {
		if (this.disposed) return
		this.disposed = true; this.renderer.setAnimationLoop(null); this.observer.disconnect()
		if (this.initialized) this.particles.dispose()
		this.cleanups.forEach(cleanup => cleanup()); this.cleanups.length = 0
		this.audio.dispose(); this.geometries.forEach(geometry => geometry.dispose()); this.materials.forEach(material => material.dispose())
		this.assets.dispose(); this.scene.clear(); this.renderer.dispose(); this.renderer.forceContextLoss(); this.renderer.domElement.remove()
	}
}
