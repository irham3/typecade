import {
 BufferAttribute, BufferGeometry, Color, DirectionalLight, DynamicDrawUsage, Group,
 HemisphereLight, InstancedMesh, Line, LineBasicMaterial, Matrix4, Mesh, MeshBasicMaterial,
 NearestFilter, OrthographicCamera, PlaneGeometry, RingGeometry, Scene, ShaderMaterial,
 Vector2, Vector3, WebGLRenderTarget, WebGLRenderer,
} from "three"
import type { FishSpecies } from "@typecade/contracts"
import { fishSpecies } from "@typecade/content"
import { createSeededRng } from "@typecade/game-rules"
import type { GameEventBridge } from "../bridge/game-event-bridge"
import { OceanAudio } from "./OceanAudio"
import { CoastalModels } from "./CoastalModels"
import { shoalLayout, waveHeight } from "./ocean-motion"

const fishColors = [0xc57850, 0xbdb465, 0x72a4a1, 0xd49452, 0xe18c6b, 0x87aaa3, 0xdb6447, 0x66848f, 0x739a8b, 0x41676d]
interface Splash { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number }

/** The renderer consumes domain events. Gameplay and saves never depend on scene objects. */
export class FishingScene {
 readonly ready: Promise<void>
 readonly renderer: WebGLRenderer
 readonly scene = new Scene()
 readonly camera = new OrthographicCamera(-16, 16, 9, -9, .1, 160)
 private readonly models = new CoastalModels()
 private readonly audio = new OceanAudio()
 private readonly cleanups: Array<() => void> = []
 private readonly observer: ResizeObserver
 private readonly random = createSeededRng("sunset-coast-v1")
 private readonly scratch = new Vector3()
 private readonly grip = new Vector3()
 private readonly tip = new Vector3()
 private dirty = true
 private readonly matrix = new Matrix4()
 private readonly target = new WebGLRenderTarget(1, 1, { minFilter: NearestFilter, magFilter: NearestFilter, depthBuffer: true })
 private readonly postScene = new Scene()
 private readonly postCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
 private readonly post: ShaderMaterial
 private readonly water: Mesh<PlaneGeometry, ShaderMaterial>
 private readonly island: Group
 private readonly boat: ReturnType<CoastalModels["boat"]>
 private readonly shoal: ReturnType<CoastalModels["fish"]>[] = []
 private readonly birds: Group[] = []
 private readonly shoreline: Mesh<RingGeometry, MeshBasicMaterial>
 private readonly wake: Mesh<RingGeometry, MeshBasicMaterial>
 private readonly rod: Line<BufferGeometry, LineBasicMaterial>
 private readonly line: Line<BufferGeometry, LineBasicMaterial>
 private readonly foam: InstancedMesh<PlaneGeometry, MeshBasicMaterial>
 private readonly particles: InstancedMesh<PlaneGeometry, MeshBasicMaterial>
 private readonly pool: Splash[] = []
 private disposed = false
 private contextLost = false
 private paused = true
 private reduced = false
 private screen = "menu"
 private width = 1
 private height = 1
 private time = 0
 private lastFrame = 0
 private progress = 0
 private tension = 28
 private durability = 100
 private pull = 0
 private endTime = -1
 private caught = false
 private currentFish: FishSpecies = fishSpecies[0]!
 private schoolSpecies = fishSpecies.filter(fish => fish.habitat === "zone_1" && fish.rarity !== "boss")

 constructor(private readonly host: HTMLElement, private readonly bridge: GameEventBridge) {
  this.renderer = new WebGLRenderer({ antialias: false, alpha: false, preserveDrawingBuffer: true, powerPreference: "low-power" })
  this.renderer.setPixelRatio(1); this.renderer.domElement.setAttribute("aria-hidden", "true")
  this.renderer.domElement.style.imageRendering = "pixelated"; host.append(this.renderer.domElement)
  this.scene.background = new Color(0xe8c18c)
  this.camera.position.set(12, 17, 21); this.camera.lookAt(0, 0, 0); this.camera.updateMatrixWorld()
  this.scene.add(new HemisphereLight(0xffead1, 0x406777, 2.2))
  const sun = new DirectionalLight(0xffcb87, 3); sun.position.set(-12, 18, -8); this.scene.add(sun)
  this.water = new Mesh(this.models.keep(new PlaneGeometry(120, 120, 90, 90)), new ShaderMaterial({
   uniforms: { time: { value: 0 }, size: { value: new Vector2(1, 1) } },
   vertexShader: `varying vec3 world; uniform float time;
    void main(){vec3 p=position; p.z+=sin(p.x*1.6-p.y*.6+time*1.2)*.065+sin(-p.y*2.1-time*.8)*.035;
    world=(modelMatrix*vec4(p,1.)).xyz; gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);}`,
   fragmentShader: `varying vec3 world; uniform float time; uniform vec2 size;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    void main(){vec2 p=world.xz; vec2 q=vec2(p.x*1.5+p.y*.8,p.y*1.2); vec2 cell=floor(q); float facet=hash(cell+step(fract(q.x),fract(q.y))*vec2(.63,.3));
     vec3 n=normalize(cross(dFdx(world),dFdy(world))); float shade=abs(dot(n,normalize(vec3(-.6,1.,-.3))));
     float depth=gl_FragCoord.y/size.y; vec3 c=mix(vec3(.08,.23,.29),vec3(.57,.49,.32),pow(depth,2.));
     c+=(facet-.5)*.045+shade*.025;
     float streak=sin(p.x*3.+p.y*4.+time*.6+facet*3.)+sin(p.x*6.-p.y*2.-time*.9+facet*5.);
     float glint=step(1.32,streak)*(.4+.6*facet);
     float sunpath=pow(max(0.,1.-abs(gl_FragCoord.x/size.x-(.13+depth*.10))/.40),3.);
     c=mix(c,vec3(1.,.82,.52),sunpath*(.25+glint*.75));
     c+=step(1.80,streak)*.13*(1.-sunpath); gl_FragColor=vec4(c,1.);
     #include <colorspace_fragment>
    }`,
  }))
  this.water.rotation.x = -Math.PI / 2; this.scene.add(this.water)
  this.island = this.models.island(); this.boat = this.models.boat(); this.scene.add(this.island, this.boat.hull)
  for (let i = 0; i < 6; i++) {
   const fish = this.models.fish(fishColors[i]!); this.shoal.push(fish); this.scene.add(fish.body)
  }
  const ringMaterial = new MeshBasicMaterial({ color: 0xffe7bc, transparent: true, opacity: .65, depthWrite: false })
  this.shoreline = new Mesh(this.models.keep(new RingGeometry(2.8, 3, 48)), ringMaterial)
  this.shoreline.rotation.x = -Math.PI / 2; this.scene.add(this.shoreline)
  this.wake = new Mesh(this.models.keep(new RingGeometry(.94, 1, 40)), ringMaterial.clone())
  this.wake.rotation.x = -Math.PI / 2; this.scene.add(this.wake)
  const makeLine = (name: string, count: number, color: number) => {
   const geometry = this.models.keep(new BufferGeometry()); geometry.setAttribute("position", new BufferAttribute(new Float32Array(count * 3), 3).setUsage(DynamicDrawUsage))
   const line = new Line(geometry, new LineBasicMaterial({ color })); line.name = name; line.frustumCulled = false; this.scene.add(line); return line
  }
  this.rod = makeLine("bending-rod", 24, 0x362e29); this.line = makeLine("taut-fishing-line", 24, 0xffedce)
  const geometry = this.models.keep(new PlaneGeometry(1, 1))
  this.foam = new InstancedMesh(geometry, new MeshBasicMaterial({ color: 0xb8d2c6, transparent: true, opacity: .42, depthWrite: false }), 80)
  this.particles = new InstancedMesh(this.models.keep(new PlaneGeometry(1, 1)), new MeshBasicMaterial({ color: 0xe9f8df, side: 2 }), 64)
  this.foam.instanceMatrix.setUsage(DynamicDrawUsage); this.particles.instanceMatrix.setUsage(DynamicDrawUsage)
  this.foam.frustumCulled = this.particles.frustumCulled = false; this.scene.add(this.foam, this.particles)
  for (let i = 0; i < 64; i++) this.pool.push({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0 })
  for (let i = 0; i < 4; i++) {
   const bird = new Group(); bird.name = "seabird"
   this.models.part(bird, 0xede8cc, -.13, 0, 0, .28, .04, .12).rotation.z = .2
   this.models.part(bird, 0xede8cc, .13, 0, 0, .28, .04, .12).rotation.z = -.2
   this.birds.push(bird); this.scene.add(bird)
  }
  this.post = new ShaderMaterial({
   uniforms: { image: { value: this.target.texture }, texel: { value: new Vector2(1, 1) }, outlines: { value: 1 } },
   vertexShader: `varying vec2 p;void main(){p=uv;gl_Position=vec4(position.xy,0.,1.);}`,
   fragmentShader: `varying vec2 p;uniform sampler2D image;uniform vec2 texel;uniform float outlines;
    void main(){vec3 c=texture2D(image,p).rgb;vec3 a=texture2D(image,p+vec2(texel.x,0.)).rgb;
     vec3 b=texture2D(image,p+vec2(0.,texel.y)).rgb;float edge=step(.30,length(c-a)+length(c-b));
     gl_FragColor=vec4(mix(c,c*.45,edge*outlines*.65),1.);
     #include <colorspace_fragment>
    }`,
  })
  this.postScene.add(new Mesh(this.models.keep(new PlaneGeometry(2, 2)), this.post))
  this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(host)
  this.listen(window, "keydown", () => this.audio.unlock()); this.listen(window, "pointerdown", () => this.audio.unlock())
  this.listen(document, "visibilitychange", () => { this.lastFrame = 0; this.syncAudio() })
  this.listen(this.renderer.domElement, "webglcontextlost", event => { event.preventDefault(); this.contextLost = true; this.audio.setActive(false); host.dispatchEvent(new CustomEvent("renderer:error")) })
  this.subscribe(); this.resize(); this.updateWorld(0); this.render()
  this.renderer.setAnimationLoop(timestamp => this.tick(timestamp))
  this.ready = Promise.resolve()
 }
 private listen(target: EventTarget, type: string, handler: (event: Event) => void) { target.addEventListener(type, handler); this.cleanups.push(() => target.removeEventListener(type, handler)) }
 private syncAudio() { this.audio.setActive(!this.paused && this.screen === "game" && !document.hidden && !this.contextLost) }
 private subscribe() {
  this.cleanups.push(
   this.bridge.on("screen:changed", ({ screen }) => { this.screen = screen; this.syncAudio(); this.resize() }),
   this.bridge.on("game:paused", ({ paused }) => { this.paused = paused; this.syncAudio() }),
   this.bridge.on("settings:effects", ({ reducedMotion }) => { this.reduced = reducedMotion; this.post.uniforms.outlines.value = reducedMotion ? 0 : 1; this.updateWorld(0); this.render() }),
   this.bridge.on("settings:volumes", volumes => this.audio.setVolumes(volumes)),
   this.bridge.on("encounter:started", ({ fish, encounter }) => {
    this.currentFish = fish; this.schoolSpecies = fishSpecies.filter(item => item.habitat === fish.habitat && item.rarity !== "boss")
    this.endTime = -1; this.progress = encounter.progress; this.tension = encounter.tension; this.durability = encounter.durability
    this.audio.setBoss(fish.rarity === "boss"); this.updateWorld(0)
   }),
   this.bridge.on("fish:hooked", () => { this.pull = .25; this.splash(12); this.audio.play("sfx_splash_a", "gameplay") }),
   this.bridge.on("character:correct", () => { this.pull = Math.min(1, this.pull + .18); this.audio.play("sfx_correct_tick_a", "typing", .38) }),
   this.bridge.on("word:completed", () => { this.splash(8); this.audio.play("sfx_word_complete_a", "typing") }),
   this.bridge.on("typo:occurred", () => { this.pull = .9; this.splash(5); this.audio.play("sfx_typo_thud_a", "typing") }),
   this.bridge.on("line:changed", ({ tension, durability, progress }) => { this.tension = tension; this.durability = durability; this.progress = progress; this.dirty = true }),
   this.bridge.on("phase:changed", () => { this.splash(28); this.audio.play("sfx_combo_milestone_b", "gameplay") }),
   this.bridge.on("boss:guard-broken", () => this.splash(24)),
   this.bridge.on("boss:final-pull", () => { this.pull = 1; this.splash(24) }),
   this.bridge.on("skill:used", () => { this.splash(18); this.audio.play("sfx_skill_activate_a", "gameplay") }),
   this.bridge.on("catch:resolved", ({ result }) => { this.endTime = this.time; this.caught = result.caught; this.splash(32); this.audio.play(result.caught ? "sfx_catch_impact_a" : "sfx_escape_snap_a", "gameplay") }),
   this.bridge.on("level:up", () => { this.splash(32); this.audio.play("sfx_reward_sting_a", "gameplay") }),
   this.bridge.on("audio:play", ({ key, category }) => this.audio.play(key, category)),
  )
 }
 private resize() {
  this.width = Math.max(1, this.host.clientWidth); this.height = Math.max(1, this.host.clientHeight)
  const aspect = this.width / this.height
  this.camera.left = -9 * aspect; this.camera.right = 9 * aspect; this.camera.updateProjectionMatrix()
  // Pixel render target stays at or below 640 × 480, independent of DPR and monitor size.
  const scale = Math.min(.5, 640 / this.width, 480 / this.height)
  const w = Math.max(1, Math.ceil(this.width * scale)), h = Math.max(1, Math.ceil(this.height * scale))
  this.renderer.setSize(w, h, false); this.target.setSize(w, h)
  this.post.uniforms.texel.value.set(1 / w, 1 / h); this.water.material.uniforms.size.value.set(w, h)
  this.updateWorld(0); this.render()
 }
 private point(x: number, y: number, target: Vector3) {
  target.set(x * 2 - 1, 1 - y * 2, 0).unproject(this.camera)
  this.scratch.set(0, 0, -1).transformDirection(this.camera.matrixWorld)
  target.addScaledVector(this.scratch, -target.y / this.scratch.y)
  return target
 }
 private updateWorld(delta: number) {
  this.dirty = true
  const t = this.reduced ? 0 : this.time, mobile = this.width <= 700, landscape = this.width >= 600 && this.height <= 500 && this.screen === "game"
  const size = mobile ? .7 : landscape ? .44 : 1
  this.pull = Math.max(0, this.pull - delta * 2.4); this.water.material.uniforms.time.value = t
  this.point(landscape ? .23 : mobile ? .88 : .84, mobile ? .29 : .26, this.island.position); this.island.scale.setScalar(mobile ? .32 : size)
  this.shoreline.position.copy(this.island.position); this.shoreline.position.y = .10; this.shoreline.scale.set((mobile ? .32 : size) * (1 + Math.sin(t) * .018), size * .82, size)
  this.shoreline.material.opacity = .4 + Math.sin(t * 1.2) * .12
  this.island.children.forEach((child, i) => { if (child.name.startsWith("pine-")) child.rotation.z = Math.sin(t * 1.4 + i) * .018 })
  this.point(landscape ? .23 : mobile ? .5 : this.screen === "menu" ? .64 : .52, mobile ? .29 : .46, this.boat.hull.position)
  const boat = this.boat.hull; boat.scale.setScalar(size * (mobile ? .92 : 1.1)); boat.rotation.y = -.5
  boat.position.y = waveHeight(boat.position.x, boat.position.z, t)
  boat.rotation.z = this.reduced ? 0 : Math.sin(t * 1.2) * .025; boat.rotation.x = this.reduced ? 0 : Math.sin(t * .8) * .018
  this.boat.angler.rotation.z = this.reduced ? 0 : -.07 * this.pull + Math.sin(t * 2) * .012
  this.boat.arm.rotation.x = this.reduced ? 0 : Math.sin(t * 5) * .08 + this.pull * .3
  this.wake.position.copy(boat.position); this.wake.position.y = .11; this.wake.scale.set(size * 1.15, size * 1.85, 1)
  const slots = shoalLayout(this.width, this.height)
  const selectedIndex = this.schoolSpecies.findIndex(fish => fish.id === this.currentFish.id)
  const activeIndex = this.currentFish.rarity === "boss" ? 0 : Math.max(0, selectedIndex)
  this.shoal.forEach(({ body, tail }, i) => {
   const slot = slots[i % 3]!, active = i === activeIndex
   this.point(slot.x, slot.y + (mobile ? .018 : .025) + (i >= 3 ? .07 : 0), body.position)
   body.position.x += Math.sin(t * (active ? 1.7 : .65) + i * 2) * size * .25
   body.position.z += Math.cos(t * .8 + i) * size * .10
   body.position.y = .07 + (active && this.screen === "game" ? Math.max(0, Math.sin(t * 1.7)) ** 8 * size * .65 + this.pull * size * .3 : 0)
   body.scale.setScalar(size * (active ? this.currentFish.rarity === "boss" ? 1.8 : 1.45 : i >= 3 ? .55 : .85))
   if (active) { body.position.x += (boat.position.x - body.position.x) * this.progress * .18; body.position.z += (boat.position.z - body.position.z) * this.progress * .18 }
   body.rotation.y = -.5 + Math.sin(t + i) * .08; body.rotation.z = active ? this.pull * -.18 : Math.sin(t * 1.2 + i) * .03
   const species = this.schoolSpecies[i % 3]!, color = active ? fishColors[fishSpecies.findIndex(fish => fish.id === this.currentFish.id)]! : i >= 3 ? 0x426f76 : fishColors[fishSpecies.indexOf(species)]!
   const crown = body.getObjectByName("crown")!; crown.visible = active && this.currentFish.rarity === "boss"
   for (const object of [body.children[0], tail.children[0]]) (object as Mesh).material = this.models.material(color)
   const profile = active ? this.currentFish : species
   body.scale.x *= profile.id === "glass_eel" ? 1.6 : profile.behavior === "armored" ? .83 : 1
   body.scale.y *= profile.behavior === "armored" ? 1.25 : profile.behavior === "predator" ? .8 : 1
   tail.rotation.y = Math.sin(t * (active && this.tension > 70 ? 12 : 6) + i) * .45
   body.visible = true
   if (active && this.endTime >= 0) {
    const amount = this.reduced ? 1 : Math.min(1, (this.time - this.endTime) / .8)
    if (this.caught) { body.position.lerp(boat.position, amount); body.position.y += Math.sin(amount * Math.PI) * size * 2 }
    else body.position.x -= amount * 12
    body.visible = amount < 1
   }
  })
  const active = this.shoal[activeIndex]!.body
  boat.updateMatrixWorld(true)
  const grip = this.grip.set(-.34,1.3,0).applyMatrix4(boat.matrixWorld)
  const tip = this.tip.copy(grip); tip.x -= size * (1.4 + this.pull * .2); tip.y += size * (1.9 - this.pull * .3)
  for (const [line, start, end, bend] of [[this.rod, grip, tip, size * .6], [this.line, tip, active.position, -size * (.12 + (1 - this.progress) * .2)]] as const) {
   const positions = line.geometry.getAttribute("position") as BufferAttribute
   for (let i = 0; i < 24; i++) { const a = i / 23; this.scratch.lerpVectors(start, end, a); this.scratch.y += Math.sin(a * Math.PI) * bend; positions.setXYZ(i, this.scratch.x, this.scratch.y, this.scratch.z) }
   positions.needsUpdate = true
  }
  this.line.material.color.set(this.tension >= 82 || this.durability < 35 ? 0xf05a5e : 0xffedce)
  this.line.visible = this.rod.visible = this.screen !== "race" && this.screen !== "practice" && this.endTime < 0
  for (let i = 0; i < 80; i++) {
   const x = ((i * 7.13) % 45) - 22, z = ((i * 3.71 + t * .24) % 35) - 17
   this.matrix.makeRotationX(-Math.PI / 2).scale(this.scratch.set(.16 + i % 4 * .12, .022, 1)).setPosition(x, waveHeight(x, z, t) + .08, z)
   this.foam.setMatrixAt(i, this.matrix)
  }
  this.foam.instanceMatrix.needsUpdate = true
  this.birds.forEach((bird, i) => {
   this.point(.12 + ((t * .017 + i * .24) % .78), mobile ? .16 : .21, bird.position); bird.position.y = size * 1.3
   bird.scale.setScalar(size * .6); bird.rotation.y = .3
   bird.children[0]!.rotation.z = Math.sin(t * 5 + i) * .45; bird.children[1]!.rotation.z = -Math.sin(t * 5 + i) * .45
  })
  for (let i = 0; i < this.pool.length; i++) {
   const p = this.pool[i]!; p.life = Math.max(0, p.life - delta)
   if (p.life > 0) { p.x += p.vx * delta; p.y += p.vy * delta; p.z += p.vz * delta; p.vy -= delta * 4; if (p.y < .04) p.life = 0 }
   this.matrix.makeRotationFromQuaternion(this.camera.quaternion).scale(this.scratch.setScalar(p.life > 0 ? size * .065 : 0)).setPosition(p.x, p.y, p.z); this.particles.setMatrixAt(i, this.matrix)
  }
  this.particles.instanceMatrix.needsUpdate = true
 }
 private splash(count: number) {
  this.dirty = true
  if (this.reduced) return
  const slot = Math.max(0, this.schoolSpecies.findIndex(fish => fish.id === this.currentFish.id)), fish = this.shoal[slot]!.body
  let remaining = count
  for (const particle of this.pool) {
   if (particle.life > 0 || remaining <= 0) continue
   particle.x = fish.position.x; particle.y = Math.max(.1, fish.position.y); particle.z = fish.position.z
   particle.vx = (this.random.nextFloat() - .5) * 2; particle.vz = (this.random.nextFloat() - .5) * 2
   particle.vy = .9 + this.random.nextFloat() * 1.5; particle.life = .6; remaining--
  }
 }
 private tick(timestamp: number) {
  if (this.disposed || this.contextLost || document.hidden) { this.lastFrame = 0; return }
  // Cap at 30 FPS; retain real elapsed time and freeze gameplay visuals on pause.
  if (this.lastFrame && timestamp - this.lastFrame < 32) return
  const delta = this.lastFrame ? Math.min(.1, (timestamp - this.lastFrame) / 1000) : 0; this.lastFrame = timestamp
  if (this.screen === "game" && this.paused || this.reduced) { if (this.dirty) { this.updateWorld(0); this.render() }; return }
  this.time += delta; this.updateWorld(delta); this.render()
 }
 private render() {
  if (this.disposed || this.contextLost) return
  this.renderer.setRenderTarget(this.target); this.renderer.render(this.scene, this.camera)
  this.renderer.setRenderTarget(null); this.renderer.render(this.postScene, this.postCamera); this.dirty = false
 }
 destroy() {
  if (this.disposed) return
  this.disposed = true; this.renderer.setAnimationLoop(null); this.observer.disconnect(); this.cleanups.forEach(cleanup => cleanup())
  this.cleanups.length = 0; this.audio.dispose(); this.foam.dispose(); this.particles.dispose()
  this.models.dispose(); this.water.material.dispose(); this.post.dispose(); this.target.dispose()
  this.scene.traverse(object => { if (object instanceof Line) object.material.dispose() })
  this.shoreline.material.dispose(); this.wake.material.dispose(); this.foam.material.dispose(); this.particles.material.dispose()
  this.scene.clear(); this.postScene.clear(); this.renderer.dispose(); this.renderer.forceContextLoss(); this.renderer.domElement.remove()
 }
}
