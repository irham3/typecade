/** Most drops drawn before collapsing into "drop ×N", so big armored foes stay one line. */
const MAX_DROPS = 5

/** Pixel blood drop on an 8×10 grid: dark rim, red body, one lit pixel. */
function Drop() {
  return <svg viewBox="0 0 8 10" aria-hidden="true" className="life-drop" shapeRendering="crispEdges">
    <path d="M3 0h2v2h1v2h1v1h1v4H7v1H1V9H0V5h1V4h1V2h1z" fill="#3a0608" />
    <path d="M3 1h2v2h1v2h1v3H6v1H2V8H1V5h1V3h1z" fill="#d8323a" />
    <path d="M5 6h1v2H5zM3 8h3v1H3z" fill="#8e1820" />
    <path d="M2 5h1v2H2z" fill="#ff9a9a" />
  </svg>
}

/** One drop per remaining word layer: how many words this enemy still takes. */
export function LifeDrops({ layers }: { layers: number }) {
  if (layers <= 0) return null
  return <span className="life-drops" aria-label={`${layers} ${layers === 1 ? "layer" : "layers"} left`}>
    {layers > MAX_DROPS ? <><Drop /><b>×{layers}</b></> : Array.from({ length: layers }, (_, i) => <Drop key={i} />)}
  </span>
}
