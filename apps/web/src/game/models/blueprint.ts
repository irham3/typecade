/** Primitive used by a model part. */
export type Shape = "box" | "cone" | "round" | "cylinder"

/** One vertex-coloured primitive: colour, position, scale, optional shape and roll (radians around Z). */
export type Part = [color: number, x: number, y: number, z: number, sx: number, sy: number, sz: number, shape?: Shape, rz?: number]

/**
 * Declarative actor description. `leg`, `arm` and `weapon` are animated limbs the scene
 * mounts at fixed sockets; arms and weapons may be null when absent.
 */
export interface ActorBlueprint {
  body: Part[]
  leg: Part[]
  arm: Part[] | null
  weapon: Part[] | null
  scale: number
}

/** Shared palette so families stay visually related. */
export const palette = {
  ink: 0x111b2b,
  bone: 0xeadbb2,
  leather: 0x543c36,
  steel: 0xbed4df,
  gold: 0xe8b966,
} as const

/** Mirrors a part across the actor's vertical axis (x → -x, roll inverted). */
export function mirror(part: Part): Part {
  const [color, x, y, z, sx, sy, sz, shape = "box", rz = 0] = part
  return [color, -x, y, z, sx, sy, sz, shape, -rz]
}

/** A part plus its mirror image, for symmetric features such as eyes, horns and pauldrons. */
export function pair(part: Part): Part[] {
  return [part, mirror(part)]
}
