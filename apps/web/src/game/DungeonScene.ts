import { BackSide, BoxGeometry, BufferGeometry, CircleGeometry, Color, ConeGeometry, CylinderGeometry, DirectionalLight, DoubleSide, DynamicDrawUsage, Euler, FogExp2, HemisphereLight, InstancedMesh, Matrix4, Mesh, MeshBasicMaterial, MeshStandardMaterial, OctahedronGeometry, PCFShadowMap, OrthographicCamera, PlaneGeometry, PointLight, Quaternion, RingGeometry, Scene, SphereGeometry, Vector2, Vector3, WebGLRenderer } from "three"
import type { DungeonEnemy, DungeonEvents, DungeonState, EnemyKind, PartyWorld } from "@typecade/contracts"
import { dungeonTerrain as T, dungeonBalance as B, dungeonBiomes, dungeonObjects, dungeonSupplies } from "@typecade/content"
import { createSeededRng } from "@typecade/game-rules"
import { GameEventBridge } from "../bridge/game-event-bridge"
import { DungeonModels } from "./DungeonModels"
import { DungeonAudio } from "./DungeonAudio"
import { DungeonVfx, type VisualEffect } from "./DungeonVfx"
import { PostProcessing } from "./render/PostProcessing"
import { TextureFactory } from "./render/TextureFactory"
import { FloorDecor } from "./scene/FloorDecor"
import { WeaponVisuals } from "./scene/WeaponVisuals"
import { heroPose, moveDuration, selectMove, type HeroMove } from "./scene/HeroMoves"
import { wingedKinds } from "./models/monsters"

const kinds: EnemyKind[] = ["skeleton", "goblin", "guard", "bomber", "mage", "minotaur", "boss", "barrel", "chest", "bat", "shield", "potion", "mana", "sentry",
 "wolf", "slime", "spider", "wraith", "archer", "shaman", "golem", "imp", "rat", "necromancer", "serpent", "beetle", "assassin", "troll", "wisp",
 "gargoyle", "mimic", "sporeling", "ghoul", "deathknight"]
/** Per-kind presentation: gait tempo, hover altitude and death tint. */
const gait: Partial<Record<EnemyKind,{pace?:number;altitude?:number;tint?:number}>> = {
 goblin:{pace:9,tint:0x96b657},boss:{pace:3.5,tint:0xb9ccdb},minotaur:{pace:3.5},guard:{tint:0xb9ccdb},mage:{altitude:1},bat:{altitude:1.25},
 wolf:{pace:8,tint:0x8d97a2},slime:{pace:3,tint:0x6fd38a},spider:{pace:11,tint:0x52445d},wraith:{pace:2.5,altitude:.35,tint:0x9cf0ff},archer:{tint:0xe5caa1},
 shaman:{tint:0x96b657},golem:{pace:2.6,tint:0x8f8b82},imp:{pace:7,altitude:1,tint:0xff8a4a},rat:{pace:13,tint:0x8a7a6d},necromancer:{pace:3,tint:0x7dff9a},
 serpent:{pace:4,tint:0x7cb556},beetle:{pace:7,tint:0x2f5f73},assassin:{pace:7,tint:0x7a2f3a},troll:{pace:3.2,tint:0x7fa078},wisp:{pace:4,altitude:1,tint:0xffd27a},
 gargoyle:{pace:3,altitude:1.4,tint:0xa58bff},mimic:{pace:9,tint:0xe8b966},sporeling:{pace:6,tint:0xd8433f},ghoul:{pace:10,tint:0x9fae8f},deathknight:{pace:3.2,tint:0x7dff9a},
}
type Batch = { body: InstancedMesh; outline: InstancedMesh; left: InstancedMesh | null; right: InstancedMesh | null; arm: InstancedMesh | null; weapon: InstancedMesh | null; scale: number }
type Actor = DungeonEnemy & { vx: number; vz: number; angle: number; hitAt: number; strikeAt: number; deadAt: number; bornAt: number; layers: number }

/** Presentation only: domain frames are the sole source of live combat state. */
export class DungeonScene {
 readonly ready: Promise<void>
 readonly renderer: WebGLRenderer
 private scene = new Scene()
 private camera = new OrthographicCamera(-20, 20, 12, -12, .1, 220)
 private models = new DungeonModels()
 private vfx = new DungeonVfx(this.scene)
 private actors = new Map<number, Actor>()
 private swingAt = -10
 private swingKind: HeroMove = "slash"
 private hitStopUntil = -10
 private flashAt = -10
 private zoomPunch = 0
 private castAt = -10
 private celebrateAt = -10
 private echoes: InstancedMesh
 private barricade: InstancedMesh
 private weather: InstancedMesh
 private landmarks: InstancedMesh
 private swingSide = 1
 private lastPhase = "ready"
 private dashAt = -10
 private lastDash = -10
 private dashFrom = new Vector3()
 private dashTo = new Vector3()
 private heroAngle = .55
 private heroFacing = .55
 private heroHitAt = -10
 private lastHp = 6
 private shieldHitAt = -10
 private partyShields:InstancedMesh
 private heroShield:Mesh
 private sentryMesh:Mesh
 private orbitals:InstancedMesh
 private telegraphs:InstancedMesh
 private lastLevel = 1
 private lastPower = 3
 private heroHurtAngle = 0
 private heroMaterial: MeshStandardMaterial
 private lastEnemyCue = -10
 private lastBossHp = 0
 private partyActions = new Map<string, number>()
 private partyPoses = new Map<string, { x:number;z:number;angle:number;hitAt:number }>()
 private bossHitAt = -10
 private lastBossAttack = -1000
 private cameraTrauma = 0
 private euler = new Euler()
 private audio = new DungeonAudio()
 private textures = new TextureFactory()
 private accent = new Color()
 private post: PostProcessing
 private decor: FloorDecor
 private weaponVisuals: WeaponVisuals
 private sun: DirectionalLight
 private batches = new Map<EnemyKind, Batch>()
 private partyBatches:Batch[]=[]
 private party:PartyWorld|null=null
 private instances: InstancedMesh[] = []
 private materials: Array<MeshBasicMaterial | MeshStandardMaterial> = []
 private knight = this.models.rig("knight")
 private dummy = this.models.rig("dummy")
 private sensei = this.models.rig("sensei")
 private tiles: InstancedMesh
 private moss: InstancedMesh
 private banners: InstancedMesh
 private bannerPoints: Vector3[]=[]
 private wind = { value: 0 }
 private walls: InstancedMesh
 private flames: InstancedMesh
 private torchFixtures: InstancedMesh
 private gems: InstancedMesh
 private coins: InstancedMesh
 private projectiles: InstancedMesh
 private embers: InstancedMesh
 private shadows: InstancedMesh
 private marker: Mesh<RingGeometry,MeshBasicMaterial>
 private aura: Mesh<SphereGeometry,MeshBasicMaterial>
 private lights: PointLight[] = []
 private torchColor=0xff923d
 private torchPoints: Vector3[] = []
 private bridgeTorches = [-7,7].flatMap(x=>[-5,5].map(z=>new Vector3(x,2.5,z)))
 private matrix = new Matrix4()
 private local = new Matrix4()
 private rotation = new Quaternion()
 private sway = new Quaternion()
 private up = new Vector3(0, 1, 0)
 private scale = new Vector3()
 private point = new Vector3()
 private color = new Color()
 private focus = new Vector3()
 private cleanup: Array<() => void> = []
 private observer: ResizeObserver
 private state: DungeonState | null = null
 private screen: DungeonEvents["screen"] = "title"
 private width = 1
 private height = 1
 private last = 0
 private elapsed = 0
 private chunk = ""
 private dirty = true
 private reduced = false
 private adaptive = false
 private slowFrames = 0
 private disposed = false
 private lost = false
 private lastEffect = 0
 private lastCorrect = 0
 private lastMetrics = 0
 private lastProjection = 0
 private trainingHit = -10
 private lastTrainingCorrect = 0
 private partyElapsedAt=0
 private bridgeDeck:Mesh
 private hurdles:InstancedMesh
 constructor(private host: HTMLElement, private bridge: GameEventBridge<DungeonEvents>) {
  this.renderer = new WebGLRenderer({ antialias: false, alpha: false, powerPreference: "low-power" })
  this.renderer.setPixelRatio(1); this.renderer.info.autoReset = false
  this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = PCFShadowMap
  this.renderer.domElement.style.imageRendering = "pixelated"; this.renderer.domElement.setAttribute("aria-hidden", "true"); host.append(this.renderer.domElement)
  this.scene.background = new Color(0x17202a); this.scene.fog = new FogExp2(0x17202a, .016)
  this.scene.add(new HemisphereLight(0xb4cdff, 0x3a2a3e, 1.35))
  this.sun = new DirectionalLight(0xffe2b8, 2.9); this.sun.position.set(-8, 16, 6); this.sun.castShadow = true
  this.sun.shadow.mapSize.set(1024, 1024); this.sun.shadow.bias = -.0015; this.sun.shadow.normalBias = .04
  Object.assign(this.sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 60 })
  this.scene.add(this.sun, this.sun.target)
  const fill = new DirectionalLight(0x6fa8ff, 1.0); fill.position.set(8, 8, 12); this.scene.add(fill)
  // Cool rim from behind the camera's view separates silhouettes from the floor.
  const rim = new DirectionalLight(0xb48cff, 1.1); rim.position.set(-14, 6, -16); this.scene.add(rim)
  this.scene.add(this.knight.root, this.dummy.root, this.sensei.root)
  this.heroMaterial=this.models.material.clone();this.materials.push(this.heroMaterial)
  for(const part of [this.knight.body,...this.knight.legs,this.knight.arm!,this.knight.weapon!]){part.material=this.heroMaterial;part.castShadow=true}
  const echoMaterial=new MeshBasicMaterial({vertexColors:true,color:0x78d9f0,transparent:true,opacity:.24,depthWrite:false});this.materials.push(echoMaterial);this.echoes=this.instance(this.knight.body.geometry,echoMaterial,3)
  this.heroShield=new Mesh(this.models.actor("shield").body,this.models.material);this.heroShield.scale.setScalar(.65);this.heroShield.position.set(0,-.9,.22);this.knight.arm!.add(this.heroShield)
  this.partyShields=this.instance(this.models.actor("shield").body,this.models.material,6)
  this.sentryMesh=new Mesh(this.models.actor("sentry").body,this.models.material);this.sentryMesh.visible=false;this.scene.add(this.sentryMesh)
  const bridgeParts:Parameters<DungeonModels["geometry"]>[0]=[[0x67626b,0,-.35,0,18,.5,12]]
  for(let z=-5.5;z<6;z++)for(let x=-8;x<9;x+=2)bridgeParts.push([Math.abs(z)<2?(x%4?0x5d465b:0x664e60):(x%4?0x716d73:0x7b777a),x,.01,z,1.86,.18,.90])
  for(const z of [-6,6])for(let x=-8;x<=8;x++)bridgeParts.push([x%2?0x666371:0x78716b,x,.5,z,.94,1.2,.9])
  for(const x of [-7,7])for(const z of [-5,5])bridgeParts.push([0x484654,x,-2.5,z,1.5,5,1.5])
  for(const point of this.bridgeTorches)bridgeParts.push([0x514d55,point.x,1.1,point.z,.65,2.2,.65],[0xa38a60,point.x,2.25,point.z,.85,.2,.85])
  this.bridgeDeck=new Mesh(this.models.geometry(bridgeParts),this.models.material);this.bridgeDeck.visible=false;this.scene.add(this.bridgeDeck)
  this.hurdles=this.instance(this.models.geometry([[0x795135,0,.8,0,1.4,.45,.18],[0x4f372a,-.6,.5,0,.18,1,.3],[0x4f372a,.6,.5,0,.18,1,.3],[0xb48a50,0,1.1,0,1.5,.12,.3]]),this.models.material,6)
  this.dummy.root.position.set(2.8, 0, -.2); this.sensei.root.position.set(-3.8, 0, -3)
  const wallTextures=this.textures.wall(),floorTextures=this.textures.floor()
  const stone = new MeshStandardMaterial({ color: 0xffffff, roughness: .9, map: wallTextures.map, normalMap: wallTextures.normalMap, normalScale: new Vector2(.9, .9) }); this.materials.push(stone)
  const floor = new MeshStandardMaterial({ color: 0xffffff, roughness: .88, map: floorTextures.map, normalMap: floorTextures.normalMap, normalScale: new Vector2(1.1, 1.1) }); this.materials.push(floor)
  this.tiles = this.instance(this.models.keep(new BoxGeometry(2, .12, 2)), floor, 9 * 256)
  this.walls = this.instance(this.models.geometry([[0xffffff,0,0,0,1.03,.72,.78]]), stone, 9 * 192)
  this.tiles.receiveShadow = true; this.walls.castShadow = this.walls.receiveShadow = true
  this.decor = new FloorDecor(this.scene, this.models)
  this.weaponVisuals = new WeaponVisuals(this.scene, this.models)
  const mossMaterial=new MeshStandardMaterial({color:0x43573d,roughness:1,side:DoubleSide});this.materials.push(mossMaterial)
  this.moss=this.instance(this.models.keep(new CircleGeometry(1,7)),mossMaterial,9*12)
  const cloth=this.models.material.clone();this.materials.push(cloth)
  cloth.onBeforeCompile=shader=>{shader.uniforms.wind=this.wind;shader.vertexShader="uniform float wind;\n"+shader.vertexShader.replace("#include <begin_vertex>","#include <begin_vertex>\ntransformed.z += sin(wind + instanceMatrix[3].x + position.y * 3.) * .12 * max(0., .65 - position.y);")}
  this.banners=this.instance(this.models.geometry([[0x753f50,0,0,0,.66,1.5,.06],[0x9e4f5e,0,.18,.035,.48,1.12,.025],[0xdeb57b,0,.72,0,.78,.10,.12],[0xd2a868,0,.2,.07,.26,.26,.02,"box",Math.PI/4],[0xffe066,0,.2,.08,.1,.1,.02,"box",Math.PI/4],[0xd2a868,0,-.62,.05,.5,.12,.02,"cone",Math.PI]]),cloth,18)
  const fire = new MeshBasicMaterial({ color: 0xffffff }); this.materials.push(fire)
  this.flames = this.instance(this.models.keep(new ConeGeometry(.23, .9, 4)), fire, 72)
  this.torchFixtures=this.instance(this.models.geometry([[0x302b35,0,-.42,-.10,.18,.85,.18],[0x9a724a,0,-.18,0,.30,.28,.30],[0x6e5a4b,0,0,0,.43,.19,.43,"cylinder"],[0xe7ad5c,0,.08,0,.46,.08,.46,"cylinder"]]),this.models.material,36)
  const bright = new MeshBasicMaterial({ vertexColors: true }); this.materials.push(bright)
  this.gems = this.instance(this.models.tinted(new OctahedronGeometry(.18)), bright, 256)
  this.coins = this.instance(this.models.tinted(new CylinderGeometry(.16, .16, .06, 8)), bright, 256)
  this.projectiles = this.instance(this.models.tinted(new OctahedronGeometry(.23)), bright, 64*3)
  this.orbitals=this.instance(this.models.geometry([[0xc1d5df,0,0,0,.58,.12,.15],[0x66503b,-.23,0,0,.10,.38,.12],[0x66503b,.23,0,0,.10,.38,.12],[0xffffff,0,.12,0,.14,.26,.14,"cone"],[0x9c723c,0,-.12,0,.12,.27,.12]]),bright,12)
  const weatherMaterial=new MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.75,side:DoubleSide,depthWrite:false,fog:false});this.materials.push(weatherMaterial)
  this.weather=this.instance(this.models.keep(new PlaneGeometry(.10,.16)),weatherMaterial,32)
  this.barricade=this.instance(this.models.geometry([[0x66513c,0,.78,0,.16,1.56,.2],[0xae8b57,0,1.60,0,.20,.25,.23,"cone"],[0x806441,0,.55,0,1.5,.14,.13],[0x9f7d4e,0,1.12,0,1.5,.14,.13],[0xb6a27a,0,.55,.09,.09,.08,.04],[0xb6a27a,0,1.12,.09,.09,.08,.04]]),this.models.material,24)
  this.landmarks=this.instance(this.models.geometry([[0x4c5462,0,0,0,1.6,.24,1.3],[0x897b64,0,.3,0,1.1,.4,1.0],[0x586174,0,1.3,0,.8,1.6,.7],[0xd9be77,0,2.2,0,1.1,.22,.95],[0x74c6dd,0,2.6,0,.35,.6,.35,"cone"],[0x86775a,-.7,.7,0,.2,1.2,.2],[0x86775a,.7,.7,0,.2,1.2,.2]]),this.models.material,18)
  this.telegraphs=this.instance(this.models.tinted(new BoxGeometry(1,.025,1)),bright,128)
  const glow=new MeshBasicMaterial({vertexColors:true,fog:false});this.materials.push(glow)
  this.embers = this.instance(this.models.tinted(new BoxGeometry(.12, .12, .12)), glow, 16)
  const shade=new MeshBasicMaterial({color:0x050e16,transparent:true,opacity:.35,depthWrite:false});this.materials.push(shade)
  this.shadows=this.instance(this.models.keep(new CircleGeometry(.62,16)),shade,145)
  const markerMaterial=new MeshBasicMaterial({color:0x76cfe3,transparent:true,opacity:.65,side:2,depthWrite:false});this.materials.push(markerMaterial)
  this.marker=new Mesh(this.models.keep(new RingGeometry(.6,.66,16)),markerMaterial);this.marker.rotation.x=-Math.PI/2;this.scene.add(this.marker)
  const auraMaterial=new MeshBasicMaterial({color:0x72cddd,transparent:true,opacity:.11,depthWrite:false});this.materials.push(auraMaterial)
  this.aura=new Mesh(this.models.keep(new SphereGeometry(1.3,12,8)),auraMaterial);this.scene.add(this.aura)
  const outline = new MeshBasicMaterial({ color: 0x0a1424, side: BackSide }); this.materials.push(outline)
  const heroOutline = new Mesh(this.knight.body.geometry, outline);heroOutline.scale.setScalar(1.045);this.knight.body.add(heroOutline)
  const batch = (model: ReturnType<DungeonModels["actor"]>, cap: number): Batch => ({
   body:this.castShadow(this.instance(model.body,this.models.material,cap)),outline:this.instance(model.body,outline,cap),
   left:model.leg?this.instance(model.leg,this.models.material,cap):null,right:model.leg?this.instance(model.leg,this.models.material,cap):null,
   arm:model.arm?this.instance(model.arm,this.models.material,cap):null,weapon:model.weapon?this.instance(model.weapon,this.models.material,cap):null,scale:model.scale,
  })
  for (const kind of kinds) this.batches.set(kind,batch(this.models.actor(kind),144))
  for(const color of [0x4999d4,0xd06b62,0x8ab768,0xd5b35a]){
   const model=this.models.actor("knight",color)
   this.partyBatches.push(batch(model,8))
  }
  for (let i = 0; i < 4; i++) { const light = new PointLight(0xffa34b, 18, 12, 2); this.lights.push(light); this.scene.add(light) }
  this.post = new PostProcessing(this.renderer, this.scene, this.camera)
  this.cleanup.push(bridge.on("frame", state => {
   if (state.seed !== this.state?.seed) { this.lastEnemyCue=-10;this.lastLevel=state.level;this.lastPower=Object.values(state.skills).reduce((n,s)=>n+s.level,0)+Object.values(state.relics).reduce((n,v)=>n+v,0);this.heroHitAt=-10;this.lastCorrect = state.correct; this.lastEffect = state.nextId-1; this.lastDash=state.player.dashAt;this.lastHp=state.player.hp;this.lastPhase=state.phase;this.actors.clear();this.vfx.clear();this.dashAt=this.swingAt=-10;this.cameraTrauma=0;this.knight.root.position.set(state.player.x, 0, state.player.z); this.focus.set(state.player.x, 0, state.player.z) }
   this.syncAudio(state)
   this.receive(state)
   this.state = state; this.dirty = true
   if (!["paused", "ready"].includes(state.phase)) {
    if (state.correct > this.lastCorrect) this.audio.play("tick")
    for (const fx of state.effects) if (fx.id > this.lastEffect) {
     const nearHero=Math.hypot(fx.x-state.player.x,fx.z-state.player.z)<.2
     const kind=fx.kind==="hit"&&fx.value<0?"hurt":fx.kind==="slash"&&nearHero&&state.phase!=="overdrive"?"cleave":fx.kind==="storm"&&(!nearHero||fx.value<0)?"explosion":fx.kind
     this.audio.play(fx.kind==="treasure"?"chest":fx.kind==="blast"||fx.kind==="slam"?"explosion":fx.kind==="lightning"?"storm":fx.kind==="firebolt"?"sentry":fx.kind==="ward"?"armor":fx.kind==="summon"?"deploy":fx.kind==="blink"?"magnet":kind,(fx.x-state.player.x)/12)
    }
   }
   this.lastCorrect = state.correct; this.lastEffect = state.nextId - 1
  }), bridge.on("screen", screen => { this.screen = screen;this.vfx.clear();this.partyActions.clear();this.lastBossHp=0;this.lastTrainingCorrect=0; this.dirty = true; this.last = 0; this.syncAudio() }), bridge.on("settings", settings => { this.reduced = settings.reduced; this.audio.setMix(settings.volume,settings.music,settings.effects); this.post.configure({ bloom: !settings.reduced, outline: !settings.reduced }); this.renderer.shadowMap.enabled = !settings.reduced; this.dirty = true; this.resize() }),bridge.on("training",({correct})=>{if(correct>this.lastTrainingCorrect){this.trainingHit=this.swingAt=this.elapsed;this.vfx.emit("slash",2.4,-.2,1.3,.85);this.vfx.emit("shatter",2.8,-.2);this.audio.play("tick")};this.lastTrainingCorrect=correct;this.dirty=true}))
  this.cleanup.push(bridge.on("party",party=>{this.syncAudio(this.state,party);this.receiveParty(party);this.party=party;this.partyElapsedAt=this.elapsed;this.dirty=true}))
  this.listen(window, "keydown", () => this.audio.unlock()); this.listen(window, "pointerdown", () => this.audio.unlock())
  this.listen(window,"click",e=>{if(e.target instanceof Element&&e.target.closest("button,select"))this.audio.play("ui")})
  this.listen(document, "visibilitychange", () => { this.last = 0; this.audio.setVisible(!document.hidden&&!this.lost); this.dirty = true })
  this.listen(this.renderer.domElement, "webglcontextlost", e => { e.preventDefault(); this.lost = true; this.audio.setVisible(false); bridge.emit("renderer", { status: "lost", calls: 0, geometries: 0, textures: 0 }) })
  this.listen(this.renderer.domElement, "webglcontextrestored", () => { this.lost = false; this.audio.setVisible(!document.hidden);this.last = 0; this.resize(); this.report("ready") })
  this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(host)
  this.resize(); this.renderer.setAnimationLoop(timestamp => this.tick(timestamp))
  this.ready = Promise.resolve().then(() => { if (!this.disposed) { this.render(); this.report("ready") } })
 }
 private syncAudio(state=this.state,party=this.party) {
  if(this.screen==="endless"||this.screen==="tutorial"){
   if(!state){this.audio.setScene({mood:"title"});return}
   const phase=state.phase,mood=phase==="paused"?"paused":phase==="dead"?"dead":phase==="draft"?"draft":phase==="ready"?"title":"arena"
   let nearby=0,nearest:DungeonEnemy|undefined,nearestDistance=Infinity
   for(const e of state.enemies){
    if(dungeonObjects.includes(e.kind))continue
    const distance=Math.hypot(e.x-state.player.x,e.z-state.player.z)
    if(distance<9)nearby++
    if(distance<nearestDistance){nearest=e;nearestDistance=distance}
   }
   this.audio.setScene({mood,pressure:Math.min(1,nearby/8),critical:state.player.hp>0&&state.player.hp/state.player.maxHp<=.34,boss:state.boss!==null})
   if(mood==="arena"&&state.worldTime-this.lastEnemyCue>2&&nearest&&nearestDistance<6){this.audio.play(`enemy-${nearest.kind}`,(nearest.x-state.player.x)/12);this.lastEnemyCue=state.worldTime}
  }else if(this.screen==="multiplayer"&&party?.phase==="racing"){
   const own=party.players.find(p=>p.id===party.ownId)
   this.audio.setScene({mood:own?.hp===0?"draft":"arena",pressure:.6,critical:own!==undefined&&own.hp>0&&own.hp<=30,boss:!!party.boss&&party.boss.hp>0})
  }else this.audio.setScene({mood:this.screen==="dojo"?"dojo":"title"})
 }
 private receive(s: DungeonState) {
  const now=this.elapsed,newEffects=s.effects.filter(fx=>fx.id>this.lastEffect),dash=s.player.dashAt!==this.lastDash
  if(dash){
   this.dashFrom.copy(this.knight.root.position);this.dashTo.set(s.player.x,0,s.player.z);this.dashAt=this.swingAt=now;this.swingSide=s.words%2?1:-1
   const landing=newEffects.find(fx=>fx.kind==="slash"||fx.kind==="finisher"),struck=landing?[...this.actors.values()].find(a=>Math.hypot(a.x-landing.x,a.z-landing.z)<.3):undefined
   this.swingKind=selectMove({wordsCompleted:s.words,targetLayers:struck?.layers??1,finisher:newEffects.some(fx=>fx.kind==="finisher"),whirl:newEffects.some(fx=>fx.kind==="whirl")})
   if(this.swingKind!=="slash")this.audio.play(this.swingKind,(s.player.x-this.dashFrom.x)/12)
   if(this.swingKind==="finisher"){this.hitStopUntil=now+.14;this.flashAt=now+.1;this.zoomPunch=1;this.cameraTrauma=Math.max(this.cameraTrauma,.45)}
   else if(this.swingKind==="leap"||this.swingKind==="whirl"){this.zoomPunch=Math.max(this.zoomPunch,.5);this.cameraTrauma=Math.max(this.cameraTrauma,.18)}
   this.heroAngle=Math.atan2(this.dashTo.x-this.dashFrom.x,this.dashTo.z-this.dashFrom.z);this.lastDash=s.player.dashAt
   this.vfx.emit("dust",this.dashFrom.x,this.dashFrom.z,this.heroAngle,1.2)
   this.vfx.emit("dash",this.dashFrom.x,this.dashFrom.z,this.heroAngle,1,{x:s.player.x,z:s.player.z})
  }
  const storm=newEffects.some(fx=>fx.kind==="storm"&&fx.value>0),live=new Set(s.enemies.map(e=>e.id))
  for(const [id,actor]of this.actors){
   if(!live.has(id)&&actor.deadAt<0){
    if(newEffects.some(fx=>["shatter","hit","storm","blast","treasure"].includes(fx.kind)&&Math.hypot(fx.x-actor.x,fx.z-actor.z)<1.5)){
     actor.deadAt=now;actor.hitAt=now;this.vfx.emit(actor.kind in dungeonSupplies?"pickup":"death",actor.x,actor.z,actor.angle,actor.kind==="boss"?2:1,undefined,gait[actor.kind]?.tint??0xe5caa1)
     this.audio.play(actor.kind in dungeonSupplies?actor.kind==="potion"?"heal":actor.kind==="shield"?"shield":actor.kind==="sentry"?"deploy":"mana":actor.kind==="barrel"||actor.kind==="bomber"?"explosion":actor.kind==="chest"?"chest":actor.kind==="boss"?"victory":`death-${actor.kind}`,(actor.x-s.player.x)/12)
     if(actor.kind==="barrel"){this.vfx.emit("cleave",actor.x,actor.z,0,1.2);this.cameraTrauma=.25}
     this.cameraTrauma=Math.max(this.cameraTrauma,actor.kind==="boss"?.4:.08)
    }else this.actors.delete(id)
   }
  }
  for(const e of s.enemies){
   const old=this.actors.get(e.id)
   if(old){if((e.words.length<old.layers||e.health<old.health)&&now-old.hitAt>.1)old.hitAt=now;Object.assign(old,e,{layers:e.words.length})}
   else {
    const arriving=this.state?.seed===s.seed&&(this.screen==="endless"||this.screen==="tutorial")&&s.phase!=="ready"
    this.actors.set(e.id,{...e,layers:e.words.length,vx:e.x,vz:e.z,angle:Math.atan2(s.player.x-e.x,s.player.z-e.z),hitAt:-10,strikeAt:-10,deadAt:-1,bornAt:arriving?now:-10})
    if(arriving){this.vfx.emit("spawn",e.x,e.z);if(!dungeonObjects.includes(e.kind)&&Math.hypot(e.x-s.player.x,e.z-s.player.z)<11)this.audio.play(`enemy-${e.kind}`,(e.x-s.player.x)/12)}
   }
  }
  const corpses=[...this.actors.values()].filter(a=>a.deadAt>=0).sort((a,b)=>b.deadAt-a.deadAt)
  for(const actor of corpses.slice(16))this.actors.delete(actor.id)
  if(s.player.hp<this.lastHp&&newEffects.some(fx=>fx.kind==="hit"&&fx.value<0)){
   this.heroHitAt=now;this.cameraTrauma=.22
   this.vfx.emit("hurt",s.player.x,s.player.z,this.heroAngle)
   const nearest=[...this.actors.values()].filter(e=>e.deadAt<0&&!dungeonObjects.includes(e.kind)).sort((a,b)=>Math.hypot(a.x-s.player.x,a.z-s.player.z)-Math.hypot(b.x-s.player.x,b.z-s.player.z))[0]
   if(nearest){this.audio.play(`enemy-${nearest.kind}`,(nearest.x-s.player.x)/12);nearest.strikeAt=now;this.heroHurtAngle=Math.atan2(s.player.x-nearest.x,s.player.z-nearest.z)}
  }
  if(s.level>this.lastLevel){this.celebrateAt=now;this.vfx.emit("level",s.player.x,s.player.z);this.audio.play("level")}
  const power=Object.values(s.skills).reduce((n,skill)=>n+skill.level,0)+Object.values(s.relics).reduce((n,v)=>n+v,0)
  if(power>this.lastPower||this.lastPhase==="draft"&&s.phase==="arena"){this.celebrateAt=now;this.vfx.emit("upgrade",s.player.x,s.player.z);this.audio.play("upgrade")}
  this.lastLevel=s.level;this.lastPower=power
  this.lastHp=s.player.hp
  for(const fx of newEffects){
   if(fx.kind==="slash"&&s.phase==="overdrive"&&s.cursor%3!==0)continue
   let kind:VisualEffect=fx.kind==="spore"?"spore":fx.kind==="barrier"?fx.value===0?"death":"shatter":fx.kind==="ward"?"shield":fx.kind==="summon"?"spawn":fx.kind==="blink"?"dash":fx.kind
   if(fx.kind==="barrier"){this.audio.play(fx.value===0?"explosion":"armor");if(fx.to)for(const actor of this.actors.values())if(Math.hypot(actor.x-fx.to.x,actor.z-fx.to.z)<.1)actor.strikeAt=now}
   if(fx.kind==="slash"&&dash)kind=this.swingKind==="whirl"||this.swingKind==="finisher"?"slash":this.swingKind
   if(fx.kind==="meteor"||fx.kind==="finisher")this.cameraTrauma=Math.max(this.cameraTrauma,fx.kind==="finisher"?.45:.16)
   if(fx.kind==="nova"||fx.kind==="frost"){this.castAt=now;this.cameraTrauma=Math.max(this.cameraTrauma,.08)}
   if(fx.kind==="lightning"||fx.kind==="firebolt"){this.castAt=now;if(fx.to)this.heroAngle=Math.atan2(fx.to.x-s.player.x,fx.to.z-s.player.z)}
   if(fx.kind==="slam"||fx.kind==="blast"){this.cameraTrauma=.18;for(const actor of this.actors.values())if(actor.kind==="boss")actor.strikeAt=now}
   if(fx.kind==="block")this.shieldHitAt=now
   if(fx.kind==="slash"&&!dash&&s.phase!=="overdrive"&&Math.hypot(fx.x-s.player.x,fx.z-s.player.z)<.1){kind="cleave";this.swingAt=now;this.swingKind="cleave";this.cameraTrauma=.12}
   if(fx.kind==="nova")kind="nova"
   this.vfx.emit(kind,fx.x,fx.z,this.heroAngle,1,fx.to??(fx.kind==="pickup"?{x:s.player.x,z:s.player.z}:undefined),fx.kind==="barrier"?0xc59b66:fx.kind==="ward"?0x8fe0a0:fx.kind==="summon"?0x7dff9a:fx.kind==="blink"?0x9cc8ff:undefined)
   if(storm&&fx.kind==="shatter")this.vfx.emit("lightning",fx.x,fx.z,this.heroAngle)
   if(fx.kind==="shatter")this.cameraTrauma=Math.max(this.cameraTrauma,.055)
   if(fx.kind==="slash"&&s.phase==="overdrive"){this.swingAt=now-.07;this.swingSide=s.cursor%2?1:-1;this.heroAngle=Math.atan2(fx.x-s.player.x,fx.z-s.player.z)}
  }
  if(s.phase==="overdrive"&&this.lastPhase!=="overdrive"){const boss=s.enemies.find(e=>e.id===s.boss);if(boss){this.vfx.emit("cleave",boss.x,boss.z,0,1.4);this.vfx.emit("storm",boss.x,boss.z,0,.8);this.cameraTrauma=.25}}
  this.lastPhase=s.phase
 }
 private receiveParty(party: PartyWorld|null) {
  if(!party){this.partyActions.clear();this.partyPoses.clear();this.lastBossAttack=-1000;return}
  if(party.mode!==this.party?.mode)this.partyPoses.clear()
  for(const id of this.partyPoses.keys())if(!party.players.some(p=>p.id===id))this.partyPoses.delete(id)
  for(const p of party.players){
   const previous=this.party?.players.find(other=>other.id===p.id)
   if(previous&&p.hp<previous.hp){this.vfx.emit(p.hp===0?"death":"hurt",p.x,p.z);const pose=this.partyPoses.get(p.id);if(pose)pose.hitAt=this.elapsed;if(p.id===party.ownId){this.heroHitAt=this.elapsed;this.audio.play(p.hp===0?"defeat":"hurt")}}
   if(p.action==="idle"||this.partyActions.get(p.id)===p.actionAt)continue
   this.partyActions.set(p.id,p.actionAt)
   if(party.now-p.actionAt>700)continue
   const target=party.players.find(other=>other.id===p.target),to=p.target==="boss"?{x:3,z:-4}:target??p,angle=Math.atan2(to.x-p.x,to.z-p.z)
   const kind:VisualEffect=p.action==="heal"||p.action==="revive"?"heal":p.action==="storm"?"storm":p.action==="block"?"block":p.action==="dodge"?"dust":p.action==="ignite"||p.action==="cleave"?"cleave":"slash"
   this.vfx.emit(kind,to.x,to.z,angle)
   if(kind==="slash"){this.vfx.emit("shatter",to.x,to.z,angle);this.cameraTrauma=.06}
   this.audio.play(p.action==="ignite"?"explosion":kind)
  }
  if(party.boss&&this.lastBossHp>party.boss.hp)this.bossHitAt=this.elapsed
  if(party.boss&&this.lastBossHp>0&&party.boss.hp===0){this.vfx.emit("death",3,-4,0,3);this.vfx.emit("storm",3,-4);this.cameraTrauma=.35;this.audio.play("victory")}
  this.lastBossHp=party.boss?.hp??0
  if(party.boss&&party.boss.attackAt!==this.lastBossAttack){
   this.lastBossAttack=party.boss.attackAt
   if(party.now-party.boss.attackAt<700){const target=party.players.find(p=>p.id===party.boss!.target);this.vfx.emit("cleave",3,-4,0,.75);if(target)this.vfx.emit("hit",target.x,target.z);this.cameraTrauma=.15}
  }
 }
 private instance(geometry: BufferGeometry, material: MeshStandardMaterial | MeshBasicMaterial, count: number) {
  const mesh = new InstancedMesh(geometry, material, count); mesh.instanceMatrix.setUsage(DynamicDrawUsage); mesh.frustumCulled = false; mesh.count = 0; this.scene.add(mesh); this.instances.push(mesh); return mesh
 }
 private castShadow(mesh: InstancedMesh) { mesh.castShadow = true; return mesh }
 private listen(target: EventTarget, type: string, handler: EventListener) { target.addEventListener(type, handler); this.cleanup.push(() => target.removeEventListener(type, handler)) }
 private resize() {
  this.width = Math.max(1, this.host.clientWidth); this.height = Math.max(1, this.host.clientHeight)
  const aspect = this.width / this.height, halfHeight = this.width<700?Math.min(18,Math.max(8.5,8.5/aspect)):9.6
  this.camera.left = -halfHeight * aspect; this.camera.right = halfHeight * aspect; this.camera.top = halfHeight; this.camera.bottom = -halfHeight; this.camera.updateProjectionMatrix()
  const pixel = Math.max(2,Math.ceil(this.width/(this.reduced?480:this.adaptive?640:960)),Math.ceil(this.height/(this.reduced?360:this.adaptive?480:640)))
  const w = Math.max(1, Math.ceil(this.width / pixel)), h = Math.max(1, Math.ceil(this.height / pixel))
  this.renderer.setSize(w, h, false); this.post.setSize(w, h)
  this.dirty = true; this.update(0); this.render()
 }
 private terrain(x: number, z: number) {
  const biome=(this.state?.biome??0)+Math.floor((this.state?.time??0)/120),tone=dungeonBiomes[biome%dungeonBiomes.length]!
  const cx = Math.round(x / T.chunkSize), cz = Math.round(z / T.chunkSize), key = `${cx}:${cz}:${biome}`
  if (key === this.chunk) return
  this.chunk = key; let tile = 0, wall = 0,patch=0,landmark=0; this.torchPoints = [];this.bannerPoints=[]
  this.torchColor=tone.flame;this.scene.background=new Color(tone.fog);(this.scene.fog as FogExp2).color.setHex(tone.fog);this.lights.forEach(light=>light.color.setHex(tone.flame))
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
   const bx = (cx + dx) * T.chunkSize, bz = (cz + dz) * T.chunkSize
   const rng = createSeededRng(`dungeon:${bx}:${bz}`)
   for (let tz = 0; tz < 16; tz++) for (let tx = 0; tx < 16; tx++) {
    // Quarter-turned tiles break up repetition; rare inlaid tiles add colour to the floor.
    this.matrix.makeRotationY(Math.floor(rng.nextFloat() * 4) * Math.PI / 2).setPosition(bx + tx*2 - 15, -.09 - rng.nextFloat() * .008, bz + tz*2 - 15)
    const inlay=rng.nextFloat()
    this.tiles.setMatrixAt(tile, this.matrix); this.color.setHex(tone.stone).lerp(this.accent.setHex(inlay<.012?tone.flame:0x4b8f9a),inlay<.024?.18:0).multiplyScalar(.95 + rng.nextFloat() * .14); this.tiles.setColorAt(tile++, this.color)
   }
   for(let i=0;i<12;i++){this.matrix.makeRotationX(-Math.PI/2).scale(this.scale.set(.25+rng.nextFloat()*.65,.18+rng.nextFloat()*.55,1)).setPosition(bx+rng.nextFloat()*28-14,-.024,bz+rng.nextFloat()*28-14);this.moss.setMatrixAt(patch++,this.matrix)}
   for(const offset of [0,-16]){
   // All solid ruins stay inside the same footprint used by domain reachability.
   for (let row = 0; row < 4; row++) for (let block = 0; block < 8; block++) {
    if (row > 1 && rng.nextFloat() > .55) continue
    this.matrix.makeTranslation(bx + offset + 6.3 + block * 1.08 + (row % 2) * .25, .36 + row * .76, bz + offset + 10)
    this.walls.setMatrixAt(wall, this.matrix); this.color.setHex(row === 0 ? 0x7d7a6c : 0x948a82).multiplyScalar(.8 + rng.nextFloat() * .35); this.walls.setColorAt(wall++, this.color)
   }
   for (const px of [6.5, 13.5]) for (let level = 0; level < 5; level++) {
    this.matrix.makeScale(1.3, 1, 1.5).setPosition(bx + offset + px, .36 + level * .73, bz + offset + 8.8)
    this.walls.setMatrixAt(wall, this.matrix); this.color.setHex(level % 2 ? 0x8a847c : 0x9f9586); this.walls.setColorAt(wall++, this.color)
   }
   for(const px of [6.5,13.5])for(const [height,size]of [[.12,1.85],[3.75,1.6]] as const){this.matrix.makeScale(size,.35,size).setPosition(bx+offset+px,height,bz+offset+8.8);this.walls.setMatrixAt(wall,this.matrix);this.walls.setColorAt(wall++,this.color.setHex(0x87909c))}
   for(const px of [6.3,13.8])for(let depth=0;depth<3;depth++)for(let row=0;row<3;row++){
    this.matrix.makeRotationY(Math.PI/2).setPosition(bx+offset+px,.36+row*.76,bz+offset+10.8+depth*.5)
    this.walls.setMatrixAt(wall,this.matrix);this.walls.setColorAt(wall++,this.color.setHex(row===2?0x777b86:0x646775))
   }
   for(let i=0;i<20;i++){
    this.matrix.makeRotationY(rng.nextFloat()*3).scale(this.scale.set(.3+rng.nextFloat()*.4,.10+rng.nextFloat()*.2,.3+rng.nextFloat()*.4)).setPosition(bx+offset+5+rng.nextFloat()*11,.12,bz+offset+7+rng.nextFloat()*7)
    this.walls.setMatrixAt(wall,this.matrix);this.color.setHex(0x56564f);this.walls.setColorAt(wall++,this.color)
   }
   const variant=Math.floor(rng.nextFloat()*3)
   for(let j=0;j<6;j++){
    this.matrix.makeScale(1.08,variant===1?1.5:.65,1.2).setPosition(bx+offset+7.5+j,variant===1?4.5:3.7+Math.sin(j/5*Math.PI)*.75,bz+offset+10)
    this.walls.setMatrixAt(wall,this.matrix);this.walls.setColorAt(wall++,this.color.setHex(variant===2?0x809386:0x8f887b))
   }
   this.matrix.makeRotationY(variant*Math.PI/2).scale(this.scale.setScalar(variant===1?1.2:.8)).setPosition(bx+offset+10,.1,bz+offset+9)
   this.landmarks.setMatrixAt(landmark++,this.matrix)
   this.torchPoints.push(new Vector3(bx + offset + 6.5, 2.5, bz + offset + 10.7), new Vector3(bx + offset + 13.5, 2.5, bz + offset + 10.7))
   this.bannerPoints.push(new Vector3(bx+offset+10,1.35,bz+offset+10.45))
   }
  }
  this.decor.rebuild(cx,cz,tone.flame)
  this.landmarks.count=landmark;this.landmarks.instanceMatrix.needsUpdate=true;this.tiles.count = tile; this.walls.count = wall;this.moss.count=patch;this.moss.instanceMatrix.needsUpdate=true
  for (const mesh of [this.tiles, this.walls]) { mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor!.needsUpdate = true }
 }
 private update(delta: number) {
  const s = this.state, active = (this.screen === "endless"||this.screen === "tutorial"), dojo = this.screen === "dojo"
  const px = active && s ? s.player.x : this.screen==="multiplayer"?this.party?.focus.x??0:0, pz = active && s ? s.player.z : this.screen==="multiplayer"?this.party?.focus.z??0:0
  this.terrain(px, pz)
  this.dummy.root.visible = this.sensei.root.visible = dojo
  const multiplayer=this.screen==="multiplayer"&&this.party!==null&&this.party.phase!=="waiting"
  const partyNow=this.party?this.party.now+Math.min(2000,(this.elapsed-this.partyElapsedAt)*1000):0
  const onBridge=multiplayer&&this.party?.mode==="clash";this.bridgeDeck.visible=onBridge;this.tiles.visible=this.walls.visible=this.moss.visible=this.banners.visible=this.landmarks.visible=!onBridge;this.decor.setVisible(!onBridge);this.decor.update(this.elapsed,this.reduced)
  this.wind.value=this.reduced?0:this.elapsed*2.5
  this.bannerPoints.forEach((p,i)=>{this.matrix.makeRotationX(this.reduced?0:Math.sin(this.elapsed*2+i)*.07).setPosition(p);this.banners.setMatrixAt(i,this.matrix)});this.banners.count=this.bannerPoints.length;this.banners.instanceMatrix.needsUpdate=true
  this.knight.root.visible=!multiplayer
  this.focus.lerp(this.point.set(px, 0, pz), Math.min(1, delta * 6 || 1))
  const offset = this.screen === "title" ? -5 : 0, side = this.height < 520 && active ? this.screen==="tutorial"?0:5 : dojo&&this.width<600 ? -3 : 0
  const trainingOffset=dojo?(this.height/2-(this.width<600?215:235))*(2*this.camera.top/this.height)/Math.sqrt(2/3):0
  const fx=this.focus.x+offset+side+trainingOffset,fz=this.focus.z-side+trainingOffset
  this.cameraTrauma=Math.max(0,this.cameraTrauma-delta*1.7)
  const shake=this.reduced?0:this.cameraTrauma*this.cameraTrauma
  this.camera.position.set(fx+24+Math.sin(this.elapsed*61)*shake,24,fz+24+Math.cos(this.elapsed*53)*shake);this.camera.lookAt(fx,0,fz)
  this.zoomPunch=Math.max(0,this.zoomPunch-delta*2.5);this.camera.zoom=1+(this.reduced?0:this.zoomPunch*this.zoomPunch*.12);this.camera.updateProjectionMatrix();this.camera.updateMatrixWorld()
  this.sun.position.set(fx-8,16,fz+6);this.sun.target.position.set(fx,0,fz);this.sun.target.updateMatrixWorld()
  const hero = this.knight.root, age=this.elapsed-this.dashAt, swingAge=this.elapsed-this.swingAt
  const hurt=Math.max(0,1-(this.elapsed-this.heroHitAt)/.45)
  this.heroMaterial.emissive.setHex(0xff5738);this.heroMaterial.emissiveIntensity=hurt*.9;this.post.setFeedback(hurt,this.reduced?0:Math.max(0,1-(this.elapsed-this.flashAt)/.22)*.55)
  const celebration=this.reduced?0:Math.max(0,1-(this.elapsed-this.celebrateAt)/1.0),casting=this.reduced?0:Math.max(0,1-(this.elapsed-this.castAt)/.4)
  const dash=active&&!this.reduced?Math.max(0,1-age/(this.swingKind==="leap"||this.swingKind==="finisher"?.32:.19)):0, swing=this.reduced?0:Math.max(0,1-swingAge/moveDuration[this.swingKind])
  const selected=s?.enemies.find(e=>e.id===(s.phase==="overdrive"?s.boss:s.target)),charge=active&&selected&&selected.words.length?Math.min(1,s!.prefix.length/selected.words[0]!.length):0
  if(dash>0)hero.position.lerpVectors(this.dashFrom,this.dashTo,1-dash**3)
  else hero.position.set(px,0,pz)
  if(!this.reduced){hero.position.x+=Math.sin(this.heroHurtAngle)*Math.sin(hurt*Math.PI)*.25;hero.position.z+=Math.cos(this.heroHurtAngle)*Math.sin(hurt*Math.PI)*.25}
  if(selected&&(charge>0||s?.phase==="overdrive"))this.heroAngle=Math.atan2(selected.x-hero.position.x,selected.z-hero.position.z)
  const facing=active?this.heroAngle:dojo?1.3:.55,turn=Math.atan2(Math.sin(facing-this.heroFacing),Math.cos(facing-this.heroFacing))
  this.heroFacing+=turn*Math.min(1,delta*22||1);hero.rotation.y=this.heroFacing
  hero.rotation.x=this.reduced?0:dash*.27+Math.sin(swingAge*18)*swing*.09
  hero.position.y=this.reduced?0:Math.sin(this.elapsed*2.3)*.025+Math.sin((1-dash)*Math.PI)*.23+Math.sin(celebration*Math.PI)*.55
  this.knight.legs.forEach((leg,i)=>{leg.rotation.x=this.reduced?0:Math.sin(this.elapsed*22+i*Math.PI)*dash*.9;leg.rotation.z=this.reduced?0:(i?-.04:.04)-swing*.06})
  const moveProgress=Math.min(1,swingAge/moveDuration[this.swingKind]),pose=heroPose(this.swingKind,this.reduced||moveProgress>=1?0:moveProgress,this.swingSide)
  this.knight.body.rotation.y=this.reduced?0:pose.bodyYaw+Math.sin(celebration*Math.PI)*.3
  this.knight.body.rotation.z=this.reduced?0:Math.sin(this.elapsed*2)*.018
  this.knight.weapon!.rotation.set(this.reduced?0:-.2+pose.weaponPitch-charge*.5,this.reduced?0:pose.weaponYaw,this.reduced?-.12:-.15+charge*.5+pose.weaponRoll)
  this.knight.arm!.rotation.set(this.reduced?0:-.15+pose.armPitch-casting*1.4-celebration*.8,0,this.reduced?0:.12+swing*.35)
  this.knight.weapon!.position.z=pose.weaponReach
  hero.rotation.y=this.heroFacing+(this.reduced?0:pose.bodySpin)
  hero.position.y+=this.reduced?0:pose.lift
  hero.rotation.x+=this.reduced?0:pose.lean
  this.echoes.count=0
  if(dash>0)for(let i=0;i<3;i++){const t=Math.max(0,1-dash**3-.12-i*.15);this.point.lerpVectors(this.dashFrom,this.dashTo,t);this.rotation.setFromEuler(this.euler.set(.15,this.heroAngle,0));this.matrix.compose(this.point,this.rotation,this.scale.setScalar(1-i*.05));this.echoes.setMatrixAt(this.echoes.count++,this.matrix)}
  this.echoes.instanceMatrix.needsUpdate=true
  this.knight.body.scale.setScalar(!this.reduced&&this.elapsed-this.heroHitAt<.09?1.06:1)
  if(dojo){const hit=Math.max(0,1-(this.elapsed-this.trainingHit)/.3);this.dummy.body.rotation.z=this.reduced?0:-Math.sin(hit*Math.PI)*.27;this.dummy.body.position.z=-hit*.12;this.sensei.body.rotation.z=this.reduced?0:Math.sin(this.elapsed*1.5)*.018}
  this.marker.visible=active&&!!selected
  if(selected){this.marker.position.set(selected.x,.03,selected.z);this.marker.scale.setScalar(this.batches.get(selected.kind)!.scale);this.marker.material.color.setHex(0x76cfe3)}
  if(multiplayer&&this.party?.boss&&this.party.boss.hp>0&&this.party.boss.nextAttack-partyNow<800){this.marker.visible=true;this.marker.position.set(3,.035,-4);this.marker.scale.setScalar(4.5+Math.sin(this.elapsed*16)*.3);this.marker.material.color.setHex(0xff8d59)}
  this.heroShield.visible=active&&!!s&&s.player.shield>0
  this.heroShield.rotation.z=this.reduced?0:Math.sin(this.elapsed*2)*.04
  const shieldPulse=Math.max(0,1-(this.elapsed-this.shieldHitAt)/.35)
  this.aura.scale.setScalar(1+shieldPulse*.15);this.aura.material.opacity=s?.player.shield ? .14+shieldPulse*.18 : .10
  this.aura.visible=active&&s!==null&&(s.phase==="skills"||s.player.invincible>.5||s.player.shield>0);this.aura.position.copy(hero.position);this.aura.position.y=1.1
  this.orbitals.count=0;this.telegraphs.count=0
  if(active&&s)this.weaponVisuals.update(s,hero.position.x,hero.position.z,this.elapsed,this.reduced);else this.weaponVisuals.hide()
  if(active&&s){
   const relics=[...(s.relics.lightning?[0x8ce9fa,0xb9fbff]:[]),...(s.relics.vowels?[0xffbb68,0xff8d54]:[])]
   relics.forEach((hex,i)=>{const a=(this.reduced?0:this.elapsed*1.4)+i*Math.PI*2/relics.length;this.matrix.makeRotationY(a).setPosition(hero.position.x+Math.sin(a)*1.15,1+Math.sin(a*2)*.13,hero.position.z+Math.cos(a)*1.15);this.orbitals.setMatrixAt(i,this.matrix);this.orbitals.setColorAt(i,this.color.setHex(hex))});this.orbitals.count=relics.length
   for(const e of s.enemies){
    if(e.id===s.boss&&s.phase==="overdrive"&&e.motion==="windup"){this.matrix.makeScale(3,1,3).setPosition(hero.position.x,.08,hero.position.z);this.telegraphs.setMatrixAt(this.telegraphs.count,this.matrix);this.telegraphs.setColorAt(this.telegraphs.count++,this.color.setHex(0xf07855))}
    if(e.motion==="windup"&&e.aim){const length=Math.hypot(e.aim.x-e.x,e.aim.z-e.z),angle=Math.atan2(e.aim.x-e.x,e.aim.z-e.z);this.matrix.makeRotationY(angle).scale(this.scale.set(length<.1?6:.9,1,length<.1?6:length)).setPosition((e.x+e.aim.x)/2,.075,(e.z+e.aim.z)/2);this.telegraphs.setMatrixAt(this.telegraphs.count,this.matrix);this.telegraphs.setColorAt(this.telegraphs.count++,this.color.setHex(0xde6948))}
    else if((e.kind==="mage"||e.kind==="archer"||e.kind==="imp"||e.kind==="necromancer"||e.kind==="shaman")&&e.attack<1.1){this.matrix.makeScale(.55,1,.55).setPosition(e.x,.08,e.z);this.telegraphs.setMatrixAt(this.telegraphs.count,this.matrix);this.telegraphs.setColorAt(this.telegraphs.count++,this.color.setHex(0xc29aff))}
   }
  }
  for(const mesh of [this.orbitals,this.telegraphs]){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true}
  this.sentryMesh.visible=active&&!!s?.sentry
  if(s?.sentry){const tower=s.sentry;this.sentryMesh.position.set(tower.x,0,tower.z);const shot=s.effects.findLast(fx=>fx.kind==="sentry"&&fx.to);if(shot?.to)this.sentryMesh.rotation.y=Math.atan2(shot.to.x-tower.x,shot.to.z-tower.z)}
  let shadowIndex=0
  this.matrix.makeRotationX(-Math.PI/2).setPosition(hero.position.x,.015,hero.position.z);this.shadows.setMatrixAt(shadowIndex++,this.matrix)
  for (const [kind, batch] of this.batches) {
   const enemies:Actor[]=!dojo&&this.screen!=="multiplayer"?[...this.actors.values()].filter(e=>e.kind===kind):multiplayer?this.party!.obstacles.filter(o=>o.kind===kind).map((o,i)=>({...o,id:i,kind,words:[o.word],speed:0,frozen:0,attack:0,health:1,maxHealth:1,layers:1,vx:o.x,vz:o.z,angle:-Math.PI/2,hitAt:-10,strikeAt:-10,deadAt:-1,bornAt:-10})):[]
   if(kind==="boss"&&multiplayer&&this.party?.boss&&this.party.boss.hp>0)enemies.push({id:0,kind,x:3,z:-4,vx:3,vz:-4,words:[],speed:0,frozen:0,attack:this.party.boss.nextAttack-partyNow,health:this.party.boss.hp,maxHealth:this.party.boss.maxHp,layers:5,angle:2.3,hitAt:this.bossHitAt,strikeAt:this.elapsed-(partyNow-this.party.boss.attackAt)/1000,deadAt:-1,bornAt:-10})
   let index = 0
   for (const e of enemies) {
    const death=e.deadAt<0?0:Math.min(1,(this.elapsed-e.deadAt)/.65)
    if(death>=1){this.actors.delete(e.id);continue}
    const siege=active&&s?.phase==="overdrive"&&s.bossArena&&s.bossArena.hp>0&&e.id!==s.boss&&!dungeonObjects.includes(kind)&&Math.hypot(e.x-s.bossArena.x,e.z-s.bossArena.z)<B.barrierRadius+.8
    const hit=Math.max(0,1-(this.elapsed-e.hitAt)/.24),strike=Math.max(Math.max(0,1-(this.elapsed-e.strikeAt)/.4),siege&&!this.reduced?Math.max(0,Math.sin(this.elapsed*6+e.id))*.65:0)
    const arrival=this.reduced?1:Math.min(1,(this.elapsed-e.bornAt)/.4)
    const scale = batch.scale*(.4+.6*(1-(1-arrival)**3))*(1-Math.max(0,death-.35)/.65),angle=e.deadAt<0&&Math.hypot(px-e.x,pz-e.z)>.05?Math.atan2(px-e.x,pz-e.z):e.angle,turn=Math.atan2(Math.sin(angle-e.angle),Math.cos(angle-e.angle))
    e.angle+=turn*Math.min(1,delta*7)
    const pace=this.elapsed*(.6+e.speed)*(gait[kind]?.pace??5)+e.id*1.9
    const walk=this.reduced||e.frozen>0||death>0||dungeonObjects.includes(kind)?0:Math.sin(pace)*(active ? Math.min(.65,Math.hypot(e.x-e.vx,e.z-e.vz)*8) : .16)
    e.vx+=(e.x-e.vx)*Math.min(1,delta*18);e.vz+=(e.z-e.vz)*Math.min(1,delta*18)
    const recoil=this.reduced?0:hit*.23+(e.deadAt<0?0:(1-(1-death)**3)*1.4),lunge=e.kind==="boss"&&s?.phase==="overdrive"&&!this.reduced?Math.sin(strike*Math.PI)*.4:0,x=e.vx-Math.sin(angle)*recoil+Math.sin(angle)*lunge,z=e.vz-Math.cos(angle)*recoil+Math.cos(angle)*lunge
    const altitude=gait[kind]?.altitude??0,still=this.reduced||death>0||e.frozen>0
    const hop=(kind==="slime"||kind==="sporeling")&&!still?Math.max(0,Math.sin(pace*.8)):0,floating=kind==="mage"||kind==="wraith"||kind==="imp"||kind==="wisp"
    const bob=altitude+(still?0:floating?Math.sin(pace*.65)*(kind==="imp"?.28:.18):kind==="bat"?Math.sin(pace*1.3)*.22:kind in dungeonSupplies?.15+Math.sin(pace)*.08:kind==="slime"?hop*.55:kind==="sporeling"?hop*.25:kind==="gargoyle"?Math.sin(pace*.5)*.3:kind==="serpent"?0:Math.abs(walk)*(kind==="goblin"||kind==="rat"||kind==="wolf"?.13:.065))
    const hammer=e.motion==="windup"?Math.max(0,1-(e.motionTime??0)/.8)*1.5:e.motion==="recover"?-1.1:0
    this.matrix.makeRotationX(-Math.PI/2).scale(this.scale.setScalar(scale*1.1)).setPosition(x,.015,z);this.shadows.setMatrixAt(shadowIndex++,this.matrix)
    this.rotation.setFromEuler(this.euler.set(this.reduced?0:-hit*.22+strike*.22+death*1.3+(e.motion==="windup"?-.2:e.motion==="charge"?.35:0),e.angle,this.reduced?0:walk*.065+death*.6,"YXZ"))
    // Slimes squash on landing and stretch in the air; serpents sway along their length.
    const squash=kind==="slime"&&!still?(hop>.05?-hop*.18:.22*Math.abs(Math.sin(pace*.8))):0
    if(kind==="serpent"&&!still)this.rotation.multiply(this.sway.setFromAxisAngle(this.up,Math.sin(pace*1.2)*.3))
    this.matrix.compose(this.point.set(x,bob-death*.1,z),this.rotation,this.scale.set(scale*(1+squash),scale*(1-squash),scale*(1+squash)))
    batch.body.setMatrixAt(index,this.matrix);batch.body.setColorAt(index,this.color.setHex(e.frozen>0?0x89c9ef:0xffffff).multiplyScalar(this.reduced?1:hit>.65?2.5:1-death*.55))
    batch.outline.setMatrixAt(index,this.local.makeScale(1.04,1.04,1.04).premultiply(this.matrix))
    for(const [part,sign]of [[batch.left,-1],[batch.right,1]] as const)if(part){if(wingedKinds.has(kind))this.local.makeRotationZ(this.reduced?sign*.2:sign*(.18+Math.sin(pace*2.6)*.65)).setPosition(.6*sign,1.13,0);else this.local.makeRotationX(walk*sign+death*sign*2).setPosition(.25*sign+death*sign*.5,.7+Math.sin(death*Math.PI)*.45,death*sign*.25);part.setMatrixAt(index,this.local.premultiply(this.matrix))}
    if(batch.arm){this.local.makeRotationX(-walk*.6+strike*.8-death*2).setPosition(-.62-death*.6,1.52,death*.2);batch.arm.setMatrixAt(index,this.local.premultiply(this.matrix))}
    const windup=kind==="boss"&&multiplayer?Math.max(0,1-e.attack/800):kind==="mage"?Math.max(0,1-e.attack/.8):Math.max(0,1-Math.hypot(px-e.x,pz-e.z)/2)
    if(batch.weapon){this.local.makeRotationX(this.reduced?0:walk*.55-strike*2.2+windup*.7+hammer+death*2-(kind==="mage"?Math.sin(pace)*.2:0)).setPosition(.62+death*.6,1.52+Math.sin(death*Math.PI)*.4,death*.2);batch.weapon.setMatrixAt(index,this.local.premultiply(this.matrix))}
    index++
   }
   for (const part of [batch.body,batch.outline,batch.left,batch.right,batch.arm,batch.weapon]) if (part) { part.count = index; part.instanceMatrix.needsUpdate = true; if (part.instanceColor) part.instanceColor.needsUpdate = true }
  }
  const party=this.party
  this.partyShields.count=0
  if(multiplayer&&party)for(const p of party.players){if(p.shield){this.matrix.makeScale(.7,.7,.7).setPosition(p.x-.6,.2,p.z+.25);this.partyShields.setMatrixAt(this.partyShields.count++,this.matrix)}}
  this.partyShields.instanceMatrix.needsUpdate=true
  const hurdles=multiplayer?party!.obstacles.filter(o=>o.kind==="barrier"):[]
  hurdles.forEach((p,i)=>{this.matrix.makeRotationY(Math.PI/2).setPosition(p.x,0,p.z);this.hurdles.setMatrixAt(i,this.matrix)});this.hurdles.count=hurdles.length;this.hurdles.instanceMatrix.needsUpdate=true
  this.partyBatches.forEach((batch,colorIndex)=>{
   const players=multiplayer&&party?party.players.filter(p=>p.color===[0x4999d4,0xd06b62,0x8ab768,0xd5b35a][colorIndex]):[]
   players.forEach((p,i)=>{
    const jump=p.action==="dodge"&&!this.reduced?Math.max(0,1-(partyNow-p.actionAt)/600):0
    const target=party!.players.find(other=>other.id===p.target),destination=p.target==="boss"?{x:3,z:-4}:target
    const attack=["strike","cleave","ignite"].includes(p.action)&&!this.reduced?Math.max(0,1-(partyNow-p.actionAt)/450):0
    const distance=destination?Math.hypot(destination.x-p.x,destination.z-p.z):1,travel=Math.sin(Math.min(1,(1-attack)*2)*Math.PI/2)*attack*Math.max(0,Math.min(2.5,distance-1))
    const goalX=p.x+(destination?(destination.x-p.x)/Math.max(.01,distance)*travel:0),goalZ=p.z+(destination?(destination.z-p.z)/Math.max(.01,distance)*travel:0)
    const pose=this.partyPoses.get(p.id)??{x:p.x,z:p.z,angle:Math.PI/2,hitAt:-10};this.partyPoses.set(p.id,pose)
    pose.x+=(goalX-pose.x)*(1-Math.exp(-delta*18));pose.z+=(goalZ-pose.z)*(1-Math.exp(-delta*18))
    const facing=party!.mode==="sprint"?Math.PI/2:Math.atan2((destination?.x??3)-p.x,(destination?.z??-4)-p.z)
    pose.angle+=Math.atan2(Math.sin(facing-pose.angle),Math.cos(facing-pose.angle))*Math.min(1,delta*14)
    const gait=this.reduced?0:Math.sin(this.elapsed*10+i*1.9)*(party!.mode==="sprint"?.7:.06),x=pose.x,z=pose.z
    this.rotation.setFromEuler(this.euler.set(this.reduced?0:attack*.18+Math.abs(gait)*.08,pose.angle,0,"YXZ"))
    this.matrix.compose(this.point.set(x,p.hp===0?-.8:jump+Math.abs(gait)*.07,z),this.rotation,this.scale.setScalar(p.hp===0?.75:1))
    batch.body.setMatrixAt(i,this.matrix);batch.body.setColorAt(i,this.color.setScalar(!this.reduced&&this.elapsed-pose.hitAt<.12?2.5:p.hp===0?.6:1))
    batch.outline.setMatrixAt(i,this.local.makeScale(1.04,1.04,1.04).premultiply(this.matrix))
    for(const [part,sign] of [[batch.left,-1],[batch.right,1]] as const){this.local.makeRotationX(gait*sign).setPosition(.25*sign,.7,0);part!.setMatrixAt(i,this.local.premultiply(this.matrix))}
    this.local.makeRotationX(this.reduced?0:-.2-Math.sin((1-attack)*Math.PI)*attack*2-gait*.5).setPosition(.62,1.52,0);batch.weapon!.setMatrixAt(i,this.local.premultiply(this.matrix))
    this.local.makeRotationX(this.reduced?0:gait*.5+attack*.5).setPosition(-.62,1.52,0);batch.arm!.setMatrixAt(i,this.local.premultiply(this.matrix))
    this.matrix.makeRotationX(-Math.PI/2).setPosition(x,.02,z);this.shadows.setMatrixAt(shadowIndex++,this.matrix)
    if(p.id===party!.ownId){this.aura.visible=party!.casting;this.aura.position.set(x,1.1,z)}
   })
   for(const part of [batch.body,batch.outline,batch.left,batch.right,batch.arm,batch.weapon]){part!.count=players.length;part!.instanceMatrix.needsUpdate=true;if(part!.instanceColor)part!.instanceColor.needsUpdate=true}
  })
  if(this.last-this.lastProjection>=33&&this.screen==="multiplayer")this.bridge.emit("partyProjected",multiplayer&&party?party.players.map(p=>{this.point.set(p.x,2.7,p.z).project(this.camera);return {id:p.id,name:p.name,color:p.color,hp:p.hp,role:p.role,x:(this.point.x+1)*.5*this.width,y:(1-this.point.y)*.5*this.height}}):[])
  this.shadows.count=shadowIndex;this.shadows.instanceMatrix.needsUpdate=true
  const torchPoints=onBridge?this.bridgeTorches:this.torchPoints
  torchPoints.forEach((p, i) => {
   const flicker = this.reduced ? 1 : 1 + Math.sin(this.elapsed * 13 + i) * .15 + Math.sin(this.elapsed * 21 + i * 2) * .12
   this.matrix.makeScale(1, flicker, 1).setPosition(p.x, p.y + .3, p.z); this.flames.setMatrixAt(i * 2, this.matrix);this.flames.setColorAt(i*2,this.color.setHex(this.torchColor))
   this.matrix.makeScale(.5, flicker * .8, .5).setPosition(p.x, p.y + .1, p.z+.06); this.flames.setMatrixAt(i * 2 + 1, this.matrix);this.flames.setColorAt(i*2+1,this.color.setHex(0xffe6a1))
   this.matrix.makeTranslation(p.x,p.y-.18,p.z);this.torchFixtures.setMatrixAt(i,this.matrix)
  }); this.flames.count = torchPoints.length * 2; this.flames.instanceMatrix.needsUpdate = true;this.flames.instanceColor!.needsUpdate=true
  this.torchFixtures.count=torchPoints.length;this.torchFixtures.instanceMatrix.needsUpdate=true
  const near = [...torchPoints].sort((a, b) => a.distanceToSquared(this.focus) - b.distanceToSquared(this.focus))
  this.lights.forEach((light, i) => { light.visible=this.reduced?i===0:!this.adaptive||i<2;light.position.copy(near[i]!); light.intensity = 15 + (this.reduced ? 0 : Math.sin(this.elapsed * 11 + i) * 2) })
  const loot = active && s ? s.loot : []
  loot.forEach((item, i) => {
   this.matrix.makeRotationY(this.elapsed + i).setPosition(item.x, .4 + (this.reduced ? 0 : Math.sin(this.elapsed * 3 + i) * .12), item.z)
   this.gems.setMatrixAt(i, this.matrix); this.gems.setColorAt(i, this.color.setHex(item.xp >= 60 ? 0xb38aed : item.xp >= 25 ? 0x63d9e6 : 0x83db75))
   this.matrix.makeRotationX(Math.PI / 2).setPosition(item.x + .32, .24, item.z)
   this.coins.setMatrixAt(i, this.matrix); this.coins.setColorAt(i, this.color.setHex(0xf8cc61))
  }); this.gems.count = this.coins.count = loot.length
  const projectiles = active && s ? s.projectiles : []
  projectiles.forEach((p,i)=>{for(let tail=0;tail<(this.reduced?1:3);tail++){this.matrix.makeRotationY(this.elapsed*3).scale(this.scale.setScalar(1-tail*.28)).setPosition(p.x-p.vx*tail*.11,.9,p.z-p.vz*tail*.11);this.projectiles.setMatrixAt(i*(this.reduced?1:3)+tail,this.matrix);this.projectiles.setColorAt(i*(this.reduced?1:3)+tail,this.color.setHex(tail?0x926fd7:0xf1c5ff))}});this.projectiles.count=projectiles.length*(this.reduced?1:3)
  const wall=active&&s?.phase==="overdrive"?s.bossArena:null
  this.barricade.count=wall?24:0
  if(wall)for(let i=0;i<24;i++){
   // Stakes topple progressively (scattered order) so the remaining barricade health reads in the world, not only in the HUD.
   const a=i*Math.PI/12,broken=wall.hp===0||(i*7)%24<Math.floor((1-wall.hp/B.barrierHp)*14),front=Math.sin(a)+Math.cos(a)>0
   this.rotation.setFromEuler(this.euler.set(broken?1.35:0,a,0));this.matrix.compose(this.point.set(wall.x+Math.sin(a)*B.barrierRadius,broken?.05:0,wall.z+Math.cos(a)*B.barrierRadius),this.rotation,this.scale.set(1,broken?.6:front?.65:1,1))
   this.barricade.setMatrixAt(i,this.matrix);this.barricade.setColorAt(i,this.color.setHex(wall.cooldown>.55?0xffb37b:wall.hp<B.barrierHp/3?0xb98d68:0xffffff))
  }
  this.barricade.instanceMatrix.needsUpdate=true;if(this.barricade.instanceColor)this.barricade.instanceColor.needsUpdate=true
  // Weather belongs to the place: each depth has its own airborne motif (ash, crypt wisps, forge sparks, snow, leaves).
  const place=(s?.biome??0)%dungeonBiomes.length,motif=[
   {count:20,speed:.03,fall:true,top:5,span:5,size:[.5,.5],colors:[0xe2ded6,0xbfb9b0]},
   {count:16,speed:.025,fall:false,top:3.2,span:3,size:[.38,.38],colors:[0x9cf0ff,0x6fd3f0]},
   {count:24,speed:.11,fall:false,top:3.6,span:3.4,size:[.28,.42],colors:[0xffc06a,0xff8a3d]},
   {count:32,speed:.065,fall:true,top:6,span:6,size:[.55,.55],colors:[0xf4f8ff,0xd6e6ff]},
   {count:14,speed:.04,fall:true,top:4.5,span:3.8,size:[1.3,1],colors:[0xa9d36b,0xd9bf62]},
  ][place]!
  this.weather.count=this.reduced?0:motif.count
  for(let i=0;i<this.weather.count;i++){
   const t=(this.elapsed*motif.speed*(1+(i%3)*.18)+i*.137)%1,sway=place===4?Math.sin(this.elapsed*1.1+i)*.9:place===1?Math.sin(this.elapsed*.6+i)*.35:Math.sin(this.elapsed*.35+i)*.6
   const x=Math.floor(px/16)*16+8+((i*7.31)%32)-16+sway,z=Math.floor(pz/16)*16+8+((i*4.79)%32)-16+(place===0?t*1.4:0)
   this.rotation.setFromEuler(this.euler.set(Math.PI/4+Math.sin(this.elapsed+i)*(place===4?.9:.25),this.elapsed*(place===4?1.2:.3)+i,Math.sin(this.elapsed*.8+i)*.5))
   const pulse=place===1?.7+Math.sin(this.elapsed*3+i)*.3:place===2?.6+Math.abs(Math.sin(this.elapsed*9+i*1.7))*.4:1
   this.matrix.compose(this.point.set(x,motif.fall?motif.top-t*motif.span:.3+t*motif.span,z),this.rotation,this.scale.set(motif.size[0]!*pulse,motif.size[1]!*pulse,1))
   this.weather.setMatrixAt(i,this.matrix);this.weather.setColorAt(i,this.color.setHex(motif.colors[i%2]!))
  }
  this.weather.instanceMatrix.needsUpdate=true;if(this.weather.instanceColor)this.weather.instanceColor.needsUpdate=true
  this.embers.count=0
  if(!this.reduced&&!onBridge)for(let i=0;i<16;i++){
   const at=near[Math.floor(i/4)]!,phase=(this.elapsed*.45+i*.23)%1,index=this.embers.count++
   this.matrix.makeScale(.45,.45,.45).setPosition(at.x+Math.sin(i+this.elapsed)*.18,at.y+phase*1.5,at.z+Math.cos(i)*.18);this.embers.setMatrixAt(index,this.matrix);this.embers.setColorAt(index,this.color.setHex(0xf5a44a))
  }
  for (const mesh of [this.gems, this.coins, this.projectiles, this.embers]) { mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true }
  this.vfx.update(delta,this.reduced)
  for(const p of near.slice(0,this.reduced?1:4))this.vfx.groundLight(p.x,p.z,this.torchColor,this.reduced?.10:.18+Math.sin(this.elapsed*9)*.015)
  if (active && s && this.last-this.lastProjection>=33) this.bridge.emit("projected", [...s.queue.map(id => {
   const enemy = s.enemies.find(e => e.id === id)!
   const scale = this.batches.get(enemy.kind)!.scale
   this.point.set(enemy.x, objectsHeight(enemy.kind) * scale, enemy.z).project(this.camera)
   const x = (this.point.x + 1) * .5 * this.width, y = (1 - this.point.y) * .5 * this.height
   return { id, x, y, visible: x >= 0 && x <= this.width && y >= 0 && y <= this.height }
  }),...s.effects.filter(effect=>effect.source&&effect.kind==="shatter"||effect.kind==="hit"&&effect.value<0||["blast","treasure","heal","mana","shield","block","pickup","level","upgrade","barrier","finisher"].includes(effect.kind)).slice(-6).map(effect=>{this.point.set(effect.x,1.6,effect.z).project(this.camera);return {id:effect.id,x:(this.point.x+1)*.5*this.width,y:(1-this.point.y)*.5*this.height,visible:true}})])
  if(this.last-this.lastProjection>=33)this.lastProjection=this.last
 }
 private tick(timestamp: number) {
  if (this.disposed || this.lost || document.hidden) { this.last = 0; return }
  const frozen = (this.screen === "endless"||this.screen === "tutorial") && this.state && ["paused", "draft", "dead"].includes(this.state.phase)
  // Clean frames must not consume the next input frame's rendering slot.
  if ((frozen || this.reduced) && !this.dirty) return
  if (this.last && timestamp - this.last < (this.reduced||this.adaptive ? 32 : 16)) return
  if(this.last&&!this.adaptive){this.slowFrames=timestamp-this.last>35?this.slowFrames+1:Math.max(0,this.slowFrames-1);if(this.slowFrames>=30){this.adaptive=true;this.resize()}}
  const delta = this.last ? Math.min(.1, (timestamp - this.last) / 1000) : 0; this.last = timestamp
  const hitStop=!this.reduced&&this.elapsed<this.hitStopUntil?.12:1
  if (!frozen) this.elapsed += delta * hitStop * ((this.screen==="endless"||this.screen==="tutorial")&&this.state?.phase === "skills" ? .5 : 1)
  this.update(frozen ? 0 : delta); this.render(); this.dirty = false
  if (timestamp - this.lastMetrics > 1000) { this.lastMetrics = timestamp; this.report("ready") }
 }
 private render() { if (this.lost) return; this.renderer.info.reset();if(this.reduced){this.renderer.setRenderTarget(null);this.renderer.render(this.scene,this.camera);return}; this.post.render(1/60) }
 private report(status: "ready" | "lost" | "error") { this.host.dataset.vfxCount=String(this.vfx.count);this.bridge.emit("renderer", { status, calls: this.renderer.info.render.calls, geometries: this.renderer.info.memory.geometries, textures: this.renderer.info.memory.textures }) }
 destroy() {
  if (this.disposed) return
  this.disposed = true; this.renderer.setAnimationLoop(null); this.observer.disconnect(); this.cleanup.forEach(stop => stop()); this.cleanup.length = 0
  this.audio.dispose();this.vfx.dispose();this.actors.clear();this.partyPoses.clear();this.partyActions.clear(); this.instances.forEach(mesh => mesh.dispose()); this.instances.length = 0
  this.materials.forEach(material => material.dispose()); this.materials.length = 0;this.textures.dispose(); this.post.dispose(); this.decor.dispose(); this.weaponVisuals.dispose(); this.models.dispose()
  this.scene.clear(); this.renderer.dispose(); this.renderer.forceContextLoss(); this.renderer.domElement.remove()
 }
}
function objectsHeight(kind: EnemyKind) { return dungeonObjects.includes(kind) ? 1.8 : kind==="gargoyle"?3.8:kind==="deathknight"?3.1:kind==="mimic"||kind==="sporeling"?2.1:kind==="ghoul"?1.9:kind==="bat"?3.4:kind==="mage"||kind==="imp"||kind==="wisp"?3.5:kind==="golem"||kind==="troll"?3.4:kind==="rat"||kind==="slime"?1.6:kind==="wolf"||kind==="spider"||kind==="beetle"||kind==="serpent"?2:2.5 }
