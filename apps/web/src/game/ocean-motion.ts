import type { FishSpecies } from "@typecade/contracts"

/** CSS pixel coordinates. The water shader uses the same two harmonics. */
export function surfaceY(x: number, width: number, height: number, time: number, reduced: boolean): number {
	return height * .3 + (reduced ? 0 : Math.sin(x / width * 18 + time * .9) * 1.4 + Math.sin(x / width * 31 - time * .6) * .6)
}

export function fishLayout(fish: FishSpecies, width: number, height: number, time: number, progress: number, tension: number, reduced: boolean, frameWidth = fish.rarity === "boss" ? 280 : 160, frameHeight = fish.rarity === "boss" ? 180 : 108) {
	const mobile = width <= 640
	const landscape = width >= 600 && height <= 500
	const worldWidth = landscape ? width * .32 : width
	const waterBottom = height * (landscape ? .65 : mobile ? .38 : .46)
	const factor = Math.min(1, width / 900, height / 1100)
	const size = Math.min((fish.rarity === "boss" ? .85 : 1.24) * factor, (waterBottom - height * .3 - 14) / (frameHeight * 1.06), worldWidth * .28 / frameWidth)
	const motion = reduced ? 0 : 1
	const speed = fish.behavior === "darting" ? 4 : fish.behavior === "predator" ? 2.6 : 1.2
	const drift = fish.behavior === "armored" ? 4 : fish.behavior === "calm" ? 6 : 13
	const x = worldWidth * (.73 - progress * (fish.rarity === "boss" ? .12 : .21)) + Math.sin(time * speed) * 12 * motion + Math.max(0, tension - 54) * .3
	const half = frameHeight * size * 1.06 / 2
	const y = Math.max(height * .3 + half + 6, Math.min(waterBottom - half - 4, height * (mobile ? .345 : .4) + Math.sin(time * speed) * drift * motion))
	return { x, y, size, frameWidth, frameHeight, waterBottom }
}
