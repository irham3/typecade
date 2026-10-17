/** Pixel coin drawn on a 12×12 grid: dark rim, gold face, lit edge and a stamped bar. */
export function CoinIcon({ className = "" }: { className?: string }) {
  return <svg viewBox="0 0 12 12" aria-hidden="true" className={`coin-icon ${className}`} shapeRendering="crispEdges">
    <path d="M3 0h6l3 3v6l-3 3H3L0 9V3z" fill="#4a2f0c" />
    <path d="M3 1h6l2 2v6l-2 2H3L1 9V3z" fill="#e8b54a" />
    <path d="M10 4h1v5l-2 2H4v-1h5l1-1z" fill="#a8701f" />
    <path d="M3 2h4v1H3zM2 3h1v3H2z" fill="#fff0b8" />
    <path d="M5 4h2v4H5z" fill="#8a5a18" />
    <path d="M5 4h1v1H5z" fill="#ffd77a" />
  </svg>
}
