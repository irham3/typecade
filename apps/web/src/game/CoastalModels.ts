import { BoxGeometry, BufferGeometry, ConeGeometry, CylinderGeometry, ExtrudeGeometry, Group, Mesh, MeshStandardMaterial, Path, Shape, ShapeGeometry, SphereGeometry, Vector2 } from "three"
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js"

/** Share palette materials and bake static parts together to bound draw calls. */
export class CoastalModels {
	readonly materials = new Map<number, MeshStandardMaterial>()
	readonly geometries = new Set<BufferGeometry>()
	private readonly box = this.keep(new BoxGeometry(1, 1, 1))
	private readonly cone = this.keep(new ConeGeometry(1, 1, 6))
	private readonly cylinder = this.keep(new CylinderGeometry(1, 1, 1, 8))
	private readonly rock = this.keep(new SphereGeometry(1, 5, 3))
	keep<T extends BufferGeometry>(geometry: T): T { this.geometries.add(geometry); return geometry }
	material(color: number) {
		if (!this.materials.has(color)) this.materials.set(color, new MeshStandardMaterial({ color, flatShading: true, roughness: 1 }))
		return this.materials.get(color)!
	}
	part(parent: Group, color: number, x: number, y: number, z: number, sx: number, sy: number, sz: number, shape: "box" | "cone" | "cylinder" | "rock" = "box") {
		const mesh = new Mesh(this[shape], this.material(color))
		mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz); parent.add(mesh)
		return mesh
	}
	bake(group: Group) {
		group.updateMatrixWorld(true)
		const batches = new Map<MeshStandardMaterial, BufferGeometry[]>()
		for (const child of [...group.children]) {
			if (!(child instanceof Mesh)) continue
			const geometry = child.geometry.clone().applyMatrix4(child.matrix)
			const batch = batches.get(child.material) ?? []; batch.push(geometry); batches.set(child.material, batch)
			group.remove(child)
		}
		for (const [material, parts] of batches) {
			group.add(new Mesh(this.keep(mergeGeometries(parts)!), material)); parts.forEach(part => part.dispose())
		}
		return group
	}
	island() {
		const group = new Group(); group.name = "lighthouse-island"
		this.part(group, 0xdbb77b, 0, .08, 0, 3.6, .46, 2.9, "cylinder")
		this.part(group, 0x71824b, .2, .35, -.25, 3.15, .30, 2.5, "cylinder")
		for (let i = 0; i < 5; i++) {
			const x = .4 + (i % 3) * .85, z = -1.6 + Math.floor(i / 3) * 1.9
			const tree = new Group(); tree.name = `pine-${i}`; tree.position.set(x,.35,z)
			this.part(tree, 0x755133, 0, .5, 0, .17, 1.1, .17)
			for (let tier = 0; tier < 3; tier++) this.part(tree, tier === 2 ? 0x344c3b : 0x4d633d, 0, .8 + tier * .48, 0, .77 - tier * .17, 1.3, .77 - tier * .17, "cone")
			this.bake(tree); group.add(tree)
		}
		for (let i = 0; i < 9; i++) this.part(group, i % 2 ? 0x797b77 : 0x97978b, Math.sin(i * 2) * 3.1, .37, Math.cos(i * 2) * 2.5, .38 + i % 3 * .12, .4 + i % 2 * .3, .45, "rock")
		const lx = -1.25, lz = -.7
		this.part(group, 0xeee2c1, lx, .6, lz, .74, .36, .74, "cylinder")
		for (let i = 0; i < 5; i++) this.part(group, i % 2 ? 0xb84f3c : 0xede3cc, lx, .9 + i * .47, lz, .53 - i * .035, .48, .53 - i * .035, "cylinder")
		this.part(group, 0x263b3b, lx, 3.18, lz, .56, .12, .56, "cylinder")
		this.part(group, 0xffd994, lx, 3.42, lz, .35, .38, .35, "cylinder")
		this.part(group, 0x704332, lx, 3.76, lz, .66, .32, .66, "cone")
		for (let i = 0; i < 10; i++) this.part(group, i % 2 ? 0xa06a3c : 0xb17a44, -1.3, .34, 1.15 + i * .19, 1.35, .13, .17)
		for (const x of [-1.85, -.75]) for (const z of [1.4, 2.8]) this.part(group, 0x6b4630, x, .15, z, .15, 1, .15)
		return this.bake(group)
	}
	boat() {
		const hull = new Group(); hull.name = "wooden-rowboat"
		const contour = [[-.85, -1.2], [-.78, .9], [0, 1.65], [.78, .9], [.85, -1.2], [.5, -1.5], [-.5, -1.5]].map(([x, y]) => new Vector2(x, y))
		const interior = contour.map(point => point.clone().multiplyScalar(.82))
		const shape = new Shape(contour); shape.holes.push(new Path([...interior].reverse()))
		const shell = new Mesh(this.keep(new ExtrudeGeometry(shape, { depth: .44, bevelEnabled: false })), this.material(0x543a28))
		shell.rotation.x = -Math.PI / 2; hull.add(shell)
		const floor = new Mesh(this.keep(new ShapeGeometry(new Shape(interior))), this.material(0xb57a3d))
		floor.rotation.x = -Math.PI / 2; floor.position.y = .22; hull.add(floor)
		for (const z of [-.75, .5]) this.part(hull, 0xcf9556, 0, .57, z, 1.62, .12, .23)
		this.part(hull, 0xc69151, 0, .44, -1.12, 1.5, .24, .25)
		this.bake(hull)
		const angler = new Group(); angler.name = "fisherman"
		this.part(angler, 0x394d4d, -.15, .72, .35, .24, .27, .63)
		this.part(angler, 0x394d4d, .19, .72, .35, .24, .27, .63)
		this.part(angler, 0xddae51, 0, 1.12, .35, .55, .67, .40)
		this.part(angler, 0xf1bf88, 0, 1.61, .35, .40, .40, .36)
		this.part(angler, 0x3d2c27, 0, 1.83, .35, .49, .20, .46)
		this.part(angler, 0x735035, 0, 1.84, .35, .74, .07, .65)
		this.part(angler, 0x172f31, -.1, 1.65, .55, .06, .06, .04)
		this.bake(angler); hull.add(angler)
		const arm = new Group(); arm.name = "reeling-arm"
		this.part(arm, 0xe3b459, -.34, .02, .02, .24, .22, .55)
		this.part(arm, 0xefc18c, -.34, .03, -.28, .18, .18, .15)
		this.bake(arm); arm.position.set(0, 1.28, .15); hull.add(arm)
		return { hull, angler, arm }
	}
	fish(color: number) {
		const body = new Group(); body.name = "swimming-fish"
		this.part(body, color, 0, 0, 0, .65, .4, .27, "rock")
		this.part(body, 0xf6d8a2, -.23, -.13, 0, .29, .18, .20, "rock")
		this.part(body, color, 0, .30, 0, .22, .32, .09, "cone")
		this.part(body, 0x172f31, -.42, .08, .21, .075, .075, .055)
		this.part(body, 0xfff1d0, -.44, .105, .245, .026, .026, .02)
		this.part(body, 0x8a4834, -.27, -.01, .245, .025, .21, .025)
		const crown = new Group(); crown.name = "crown"
		for (let i = 0; i < 3; i++) this.part(crown, 0xf3c469, -.2 + i * .25, .42, 0, .09, .22, .09, "cone")
		this.bake(crown)
		this.bake(body); body.add(crown)
		const tail = new Group(); tail.name = "tail"
		this.part(tail, color, .13, .08, 0, .26, .4, .08, "cone").rotation.z = -Math.PI / 2
		this.bake(tail); tail.position.x = .60; body.add(tail)
		return { body, tail }
	}
	dispose() { this.geometries.forEach(geometry => geometry.dispose()); this.materials.forEach(material => material.dispose()); this.geometries.clear(); this.materials.clear() }
}
