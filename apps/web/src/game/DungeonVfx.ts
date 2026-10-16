import { AdditiveBlending, BoxGeometry, BufferGeometry, CanvasTexture, Color, DoubleSide, DynamicDrawUsage, Euler, Float32BufferAttribute, InstancedMesh, Matrix4, MeshBasicMaterial, PlaneGeometry, Quaternion, RingGeometry, Scene, Vector3 } from "three"
import type { Point } from "@typecade/contracts"

export type VisualEffect = "slash" | "cleave" | "hit" | "storm" | "lightning" | "heal" | "pickup" | "shatter" | "magnet" | "death" | "dust" | "dash" | "block" | "spawn" | "hurt" | "level" | "upgrade" | "shield" | "mana" | "deploy" | "sentry" | "firebolt" | "blast" | "treasure" | "slam" | "thrust" | "uppercut"
type Burst = Point & { kind: VisualEffect; age: number; life: number; angle: number; power: number; end?: Point; tint?: number }
const colors = { slash: 0x65dfff, cleave: 0xffa64f, hit: 0xff7651, storm: 0x73cdff, lightning: 0xb3eaff, heal: 0x8cffad, pickup: 0x9af3b8, shatter: 0xffd99b, magnet: 0xa3dfff, death: 0xe5caa1, dust: 0x8c959c, dash:0x7bdcff, block: 0xffd376, spawn:0x9a9cfa, hurt:0xff694f, level:0xffd571, upgrade:0xffdf91, shield:0x76deef, mana:0x9bafff, deploy:0xf1d38a, sentry:0x9df2ff, firebolt:0xffa24f, blast:0xff8645, treasure:0xffd36b, slam:0xff7046, thrust:0xb8f5ff, uppercut:0x8bd7ff }
const major:VisualEffect[]=["cleave","storm","heal","magnet","death","hurt","level","upgrade","shield","deploy","block","slam","blast","treasure"]

/** Bounded presentation bursts. Neither effects nor their clocks change combat or input. */
export class DungeonVfx {
 readonly sparks: InstancedMesh
 readonly arcs: InstancedMesh
 readonly rings: InstancedMesh
 readonly bolts: InstancedMesh
 readonly glows: InstancedMesh
 private bursts: Burst[] = []
 private matrix = new Matrix4()
 private rotation = new Quaternion()
 private euler = new Euler()
 private point = new Vector3()
 private scale = new Vector3()
 private color = new Color()
 private material = new MeshBasicMaterial({ transparent: true, blending: AdditiveBlending, depthWrite: false, side: DoubleSide, toneMapped: false, fog: false })
 private glowMaterial: MeshBasicMaterial
 private texture: CanvasTexture

 constructor(scene: Scene) {
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 64
  const ctx = canvas.getContext("2d")!, gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, "#ffffff"); gradient.addColorStop(.18, "#ffffffb0"); gradient.addColorStop(.5, "#ffffff35"); gradient.addColorStop(1, "#ffffff00")
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 64, 64)
  this.texture = new CanvasTexture(canvas)
  this.glowMaterial = new MeshBasicMaterial({ map: this.texture, transparent: true, blending: AdditiveBlending, depthWrite: false, side: DoubleSide, toneMapped: false, fog: false })
  const batch = (geometry: BufferGeometry, capacity: number, material = this.material) => {
   const mesh = new InstancedMesh(geometry, material, capacity); mesh.count = 0; mesh.frustumCulled = false; mesh.instanceMatrix.setUsage(DynamicDrawUsage); scene.add(mesh); return mesh
  }
  this.sparks = batch(new BoxGeometry(1, 1, 1), 128)
  const arc=new RingGeometry(.63,1,32,1,-.8,Math.PI*1.45),positions=arc.getAttribute("position")
  for(let i=0;i<33;i++){const taper=1-.34*Math.sin(i/32*Math.PI)**.7,angle=-.8+i/32*Math.PI*1.45;positions.setXY(i,Math.cos(angle)*taper,Math.sin(angle)*taper)}
  this.arcs = batch(arc, 24)
  this.rings = batch(new RingGeometry(.97, 1, 48), 24)
  const vertices: number[] = [], zigzag = [0, .08, -.13, .12, -.08, .10, -.07, 0]
  for (let i = 0; i < 7; i++) {
   const x = zigzag[i]!, nx = zigzag[i + 1]!, y = i / 7, ny = (i + 1) / 7, w = .055
   vertices.push(x-w,y,0,x+w,y,0,nx+w,ny,0,x-w,y,0,nx+w,ny,0,nx-w,ny,0)
  }
  this.bolts = batch(new BufferGeometry().setAttribute("position", new Float32BufferAttribute(vertices, 3)), 32)
  this.glows = batch(new PlaneGeometry(1, 1), 24, this.glowMaterial)
 }
 get count() { return this.bursts.length }
 emit(kind: VisualEffect, x: number, z: number, angle = 0, power = 1, end?: Point, tint?:number) {
  if (this.bursts.length === 24) {
   const minor=this.bursts.findIndex(b=>!major.includes(b.kind))
   if(minor>=0)this.bursts.splice(minor,1)
   else if(!major.includes(kind))return
   else this.bursts.shift()
  }
  this.bursts.push({ kind, x, z, angle, power, end, tint, age: 0, life: kind==="level"||kind==="upgrade"?1.2:kind==="dash"?.24:kind === "heal" || kind === "death" ? .85 : kind === "pickup" ? .65 : kind === "slash" || kind === "cleave" ? .36 : .6 })
 }
 clear() { this.bursts.length = 0; for (const mesh of [this.sparks, this.arcs, this.rings, this.bolts, this.glows]) mesh.count = 0 }
 groundLight(x:number,z:number,color:number,intensity:number) { this.place(this.glows,x,.005,z,6,6,1,-Math.PI/2,0,0,color,intensity);this.glows.instanceMatrix.needsUpdate=true;this.glows.instanceColor!.needsUpdate=true }
 private place(mesh: InstancedMesh, x: number, y: number, z: number, sx: number, sy: number, sz: number, rx: number, ry: number, rz: number, hex: number, intensity: number) {
  if (mesh.count === mesh.instanceMatrix.count) return
  this.rotation.setFromEuler(this.euler.set(rx, ry, rz, "YXZ"))
  this.matrix.compose(this.point.set(x, y, z), this.rotation, this.scale.set(sx, sy, sz))
  mesh.setMatrixAt(mesh.count, this.matrix); mesh.setColorAt(mesh.count++, this.color.setHex(hex).multiplyScalar(Math.max(0, intensity)))
 }
 update(delta: number, reduced: boolean) {
  for (const mesh of [this.sparks, this.arcs, this.rings, this.bolts, this.glows]) mesh.count = 0
  for (const b of this.bursts) {
   b.age += delta
   const t = Math.min(1, b.age / b.life), fade = (1 - t) ** 2, color = b.tint??colors[b.kind], size = b.power
   if(["sentry","firebolt","lightning"].includes(b.kind)&&b.end){
    const angle=Math.atan2(b.end.x-b.x,b.end.z-b.z),length=Math.hypot(b.end.x-b.x,b.end.z-b.z)
    this.place(this.sparks,(b.x+b.end.x)/2,1.25,(b.z+b.end.z)/2,reduced?.035:.075,.055,length,0,angle,0,color,fade*1.6)
    if(b.kind==="lightning")this.place(this.bolts,b.end.x,.1,b.end.z,1,4,1,0,angle,0,color,fade*1.6)
    if(b.kind==="firebolt")for(let i=0;i<(reduced?1:5);i++){const travel=Math.max(0,Math.min(1,t*4-i*.06));this.place(this.sparks,b.x+(b.end.x-b.x)*travel,1.1+Math.sin(travel*Math.PI)*.35,b.z+(b.end.z-b.z)*travel,.22-i*.025,.17,.35,0,angle,0,i?color:0xffefb4,fade)}
    continue
   }
   if(b.kind==="thrust")this.place(this.sparks,b.x+Math.sin(b.angle)*t,1,b.z+Math.cos(b.angle)*t,.12,.1,3*(1-t),0,b.angle,0,color,fade*2)
   if(b.kind==="uppercut")this.place(this.arcs,b.x,1,b.z,1.7,2.4,1,0,b.angle,t*3,color,fade*1.8)
   if(b.kind==="blast"||b.kind==="slam"||b.kind==="treasure"){
    const radius=b.kind==="slam"?3*t:b.kind==="blast"?4*t:1+t
    this.place(this.rings,b.x,.09,b.z,radius,radius,1,-Math.PI/2,0,0,color,fade*1.6)
    if(!reduced)for(let i=0;i<6;i++){const a=i*Math.PI/3;this.place(this.sparks,b.x+Math.sin(a)*radius,b.kind==="treasure"?.8+Math.sin(t*Math.PI)*2:.12,b.z+Math.cos(a)*radius,b.kind==="treasure"?.17:.10,b.kind==="treasure"?.27:.10,b.kind==="treasure"?.17:1.8,0,a,0,color,fade*1.5)}
   }
   if(b.kind==="dash"&&b.end){
    if(!reduced)for(let i=0;i<4;i++){const spread=(i-1.5)*.19,d=Math.hypot(b.end.x-b.x,b.end.z-b.z);this.place(this.sparks,(b.x+b.end.x)/2+Math.cos(b.angle)*spread,.22+i*.18,(b.z+b.end.z)/2-Math.sin(b.angle)*spread,.055,.045,d*(1-t),0,b.angle,0,i%2?0xe0faff:color,fade*1.7)}
    continue
   }
   if (b.kind === "slash" || b.kind === "cleave") {
    const radius = (b.kind === "cleave" ? 3.6 : 1.8) * size * (.75 + t * .35)
    this.place(this.arcs,b.x,.8,b.z,radius,radius,1,-1.25,b.angle+t*2.4,0,color,fade*1.6)
    this.place(this.arcs,b.x,.83,b.z,radius*.90,radius*.90,1,-1.25,b.angle+t*2.4-.1,0,0xf2fcff,fade*1.3)
   }
   if (["storm", "lightning", "heal", "magnet", "cleave", "block", "hit", "spawn", "hurt", "level", "upgrade", "shield", "mana", "deploy"].includes(b.kind)) {
    const radius = b.kind === "storm" || b.kind === "magnet" ? .8+t*5 : b.kind === "cleave" ? .5+t*3.5 : .5+t*1.6
    this.place(this.rings,b.x,.06,b.z,radius*size,radius*size,1,-Math.PI/2,0,t*2,color,fade)
    this.place(this.glows,b.x,.04,b.z,radius*4,radius*4,1,-Math.PI/2,0,0,color,fade*.35)
   }
   if ((b.kind === "storm" || b.kind === "lightning") && !reduced) {
    const count = b.kind === "storm" ? 4 : 1
    for (let i=0;i<count;i++) {
     const a = i*2.4+b.angle, r = b.kind === "storm" ? 1+i*.65 : 0
     this.place(this.bolts,b.x+Math.sin(a)*r,.15,b.z+Math.cos(a)*r,1.5,5.5,1,0,b.angle+i*1.1,0,0xc4efff,fade*(.7+Math.abs(Math.sin(b.age*47+i))*.6))
    }
   }
   if(b.kind==="death"){
    this.place(this.rings,b.x,.04,b.z,(.45+t*1.4)*size,(.45+t*1.4)*size,1,-Math.PI/2,0,0,color,fade*.7)
    if(!reduced)this.place(this.glows,b.x,.07,b.z,2.4*size,2.4*size,1,-Math.PI/2,0,0,color,fade*.22)
   }
   if((b.kind==="slash"||b.kind==="cleave")&&!reduced)for(let i=0;i<3;i++){const a=b.angle+t*2.4-i*.16,r=(b.kind==="cleave"?3.2:1.6)*size;this.place(this.sparks,b.x+Math.sin(a)*r,.85,b.z+Math.cos(a)*r,.12,.07,.8-i*.15,0,a+.8,0,i?color:0xf0ffff,fade*(1-i*.2))}
   if (reduced) continue
   const count = b.kind === "death" ? 16 : b.kind === "heal" ? 10 : b.kind === "dust" ? 5 : 8
   for (let i=0;i<count;i++) {
    const a = i*2.399+b.angle, speed = .8+(i%4)*.45, r = t*speed*size, scale = (b.kind==="death"?.13+(i%3)*.055:.07+(i%3)*.035)*(1-t)
    let x=b.x+Math.sin(a)*r, z=b.z+Math.cos(a)*r, y=.8+Math.sin(t*Math.PI)*(.5+i%3*.4)-t*.8
    let sx=scale, sy=scale*(b.kind==="death"?2.8:1), sz=scale
    if(b.kind==="heal") {const pair=Math.floor(i/2),angle=pair*2.399+b.angle;y=.7+t*3.5+(pair%3)*.18;x=b.x+Math.sin(angle+t*2)*(.8-t*.25);z=b.z+Math.cos(angle+t*2)*(.8-t*.25);sx=i%2?scale*.65:scale*3;sy=i%2?scale*3:scale*.65}
    if(b.kind==="pickup"&&b.end){const ease=1-(1-t)**3;x=b.x+(b.end.x-b.x)*ease;z=b.z+(b.end.z-b.z)*ease;y=.35+Math.sin(t*Math.PI)*1.7;sy=scale*1.7}
    if(b.kind==="slash"||b.kind==="cleave"){y=.7+Math.sin(t*Math.PI)*.9;sx=scale*3;sz=scale*.5}
    if(b.kind==="dust"){y=.07+t*.3;sx=scale*2;sy=scale*.4;sz=scale*2}
    if(b.kind==="spawn"){y=t*2.6;x=b.x+Math.sin(a)*(.6-t*.4);z=b.z+Math.cos(a)*(.6-t*.4);sy=scale*3}
    if(b.kind==="level"||b.kind==="upgrade"){y=.2+t*4+(i%3)*.3;x=b.x+Math.sin(a+t*4)*(.8+t*.5);z=b.z+Math.cos(a+t*4)*(.8+t*.5);sy=scale*6}
    const impact=(b.kind==="hit"||b.kind==="shatter"||b.kind==="hurt")&&i<4&&t<.4
    if(impact){y=1+Math.sin(a)*(.2+t*2);x=b.x+Math.cos(a)*(.2+t*2);z=b.z;sx=.65*(1-t*2.5);sy=.035;sz=.05}
    this.place(this.sparks,x,Math.max(.04,y),z,sx,sy,sz,impact?0:b.age*4+i,impact?0:a,impact?a:b.age*5,impact?0xf4faff:color,fade*(impact?2.5:1.4))
   }
  }
  this.bursts = this.bursts.filter(b => b.age < b.life)
  for (const mesh of [this.sparks, this.arcs, this.rings, this.bolts, this.glows]) { mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true }
 }
 dispose() { for (const mesh of [this.sparks, this.arcs, this.rings, this.bolts, this.glows]) {mesh.removeFromParent();mesh.geometry.dispose();mesh.dispose()};this.material.dispose();this.glowMaterial.dispose();this.texture.dispose();this.bursts.length=0 }
}
