import { Color } from "three"
import { glowColors } from "../render/vertexGlow"
import { SurfaceClass } from "../render/surfaceDetail"

const hsl = { h: 0, s: 0, l: 0 }
const probe = new Color()
const cache = new Map<number, SurfaceClass>()

/**
 * Picks a surface family from a part's paint, so existing blueprints gain grain
 * without per-part tags: greys read as stone or steel, warm golds as brass, pale
 * yellows as bone, browns as wood or leather, greens as hide, skin stays clean, the rest as cloth.
 */
export function surfaceClassFor(hex: number): SurfaceClass {
  const known = cache.get(hex)
  if (known !== undefined) return known
  probe.setHex(hex).getHSL(hsl)
  const { h, s, l } = hsl
  let result: SurfaceClass
  if (glowColors.has(hex)) result = SurfaceClass.None
  // Skin tones stay clean so faces keep their read; grain lives on what the hero wears.
  else if (h >= .02 && h <= .1 && s >= .3 && s <= .75 && l >= .55 && l <= .82) result = SurfaceClass.None
  else if (s < .2) result = l >= .5 ? SurfaceClass.Metal : SurfaceClass.Stone
  else if (h >= .08 && h <= .17 && l > .74) result = SurfaceClass.Stone
  else if (h >= .08 && h <= .15 && s > .45 && l >= .45) result = SurfaceClass.Metal
  else if (h >= .17 && h <= .47) result = SurfaceClass.Hide
  else if ((h < .12 || h > .95) && l < .55 && s < .65) result = l < .3 ? SurfaceClass.Hide : SurfaceClass.Wood
  else if (s < .32 && l < .45) result = SurfaceClass.Stone
  else result = SurfaceClass.Cloth
  cache.set(hex, result)
  return result
}
