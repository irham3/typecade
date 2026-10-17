import type { MeshStandardMaterial } from "three"

/**
 * Colours that read as light sources (eyes, runes, embers, crystals). Parts painted in
 * these colours emit their own colour so the bloom pass picks them out of the dark.
 */
export const glowColors: ReadonlySet<number> = new Set([
  0xff986c, 0xed895e, 0xff8352, 0xff9b55, 0x7dff9a, 0x8ff5ff, 0xffe46a, 0xff5a5a, 0xffd25a,
  0xa58bff, 0xff6b3d, 0xffe066, 0xfff36a, 0x7fd6ff, 0x81d9eb, 0xffe27a, 0xff4a5a, 0x7dffb0,
  0xffcf4a, 0xff5a6a, 0xffe05a, 0xbca1ff, 0xd8a7ff, 0x98edfa, 0x9ff5fa, 0xb7f0ff, 0xffa040,
  0xfff0a0, 0xffa83f, 0x7fe0a0, 0xffd27a, 0xe45f3c, 0x85cde1, 0xa9e9ff,
])

/** Name of the per-vertex 0..1 emission weight written by `DungeonModels.geometry`. */
export const GLOW_ATTRIBUTE = "glow"

const EMISSION_GAIN = "2.2"

/**
 * Adds vertex-weighted self-illumination to a standard material without a custom shader.
 * Meshes lacking the attribute read the WebGL default (0) and are unaffected.
 */
export function withVertexGlow<T extends MeshStandardMaterial>(material: T): T {
  const previous = material.onBeforeCompile.bind(material)
  material.onBeforeCompile = (shader, renderer) => {
    previous(shader, renderer)
    shader.vertexShader = `attribute float ${GLOW_ATTRIBUTE};\nvarying float vGlow;\n` + shader.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>\nvGlow = ${GLOW_ATTRIBUTE};`)
    shader.fragmentShader = "varying float vGlow;\n" + shader.fragmentShader.replace(
      "#include <emissivemap_fragment>",
      `#include <emissivemap_fragment>\n#ifdef USE_COLOR\ntotalEmissiveRadiance += vColor.rgb * vGlow * ${EMISSION_GAIN};\n#endif`,
    )
  }
  material.customProgramCacheKey = () => "vertex-glow"
  return material
}
