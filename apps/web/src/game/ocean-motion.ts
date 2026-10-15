/** Shared screen anchors keep fish labels clear of the typing controls. */
export function shoalLayout(width: number, height: number) {
 if (width >= 600 && height <= 500) return [{ x: .12, y: .33 }, { x: .12, y: .45 }, { x: .12, y: .57 }]
 if (width <= 700) return [{ x: .18, y: .30 }, { x: .50, y: .38 }, { x: .82, y: .30 }]
 return [{ x: .26, y: .43 }, { x: .18, y: .61 }, { x: .82, y: .56 }]
}
export function waveHeight(x: number, z: number, time: number): number {
 return Math.sin(x * 1.6 + z * .6 + time * 1.2) * .065 + Math.sin(z * 2.1 - time * .8) * .035
}
