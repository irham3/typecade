const paths = {
 tower: "M3 22v-4h3V9H3V2h4v3h3V2h4v3h3V2h4v7h-3v9h3v4H3zm7-4h4v-7h-4z",
 sword: "M4 21l6-6-2-2 2-2 2 2L21 2l1 1-8 12 2 2-2 2-2-2-6 6z",
 storm: "M2 4h20v3H6v3h13v3H9v3h7v3h-4v3H9v-3H6v-3H3v-3h3v-3H2z",
 heal: "M9 2h6v7h7v6h-7v7H9v-7H2V9h7z",
 shield: "M3 2h18v12l-9 9-9-9zm4 4v7l5 5 5-5V6z",
 gem: "M12 1l9 10-9 12L3 11zM12 5v13l5-7z",
 gear: "M9 1h6v4h4v4h4v6h-4v4h-4v4H9v-4H5v-4H1V9h4V5h4zm0 8v6h6V9z",
 flag: "M3 1h3v22H3zm4 1h15l-4 5 4 5H7z",
 book: "M2 3h9l1 2 1-2h9v18h-9l-1 2-1-2H2zm3 3v12h5V6zm9 0v12h5V6z",
}
export function Glyph({name}:{name:keyof typeof paths}) { return <svg viewBox="0 0 24 24" aria-hidden="true" className="glyph" shapeRendering="crispEdges"><path d={paths[name]} fill="currentColor" fillRule="evenodd"/></svg> }
