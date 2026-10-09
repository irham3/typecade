import fs from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"

const root = path.resolve("apps/web/public/assets/ocean")
const sources = {
	ui_skill_cast_net: "reference-derived-pixel-pack/equipment_hook.png",
	ui_skill_steel_line: "reference-derived-pixel-pack/equipment_fishing_line.png",
	ui_skill_sonar: "reference-derived-pixel-pack/icon_stat_accuracy.png",
	ui_skill_calm_current: "reference-derived-pixel-pack/icon_currency_gem.png",
	ui_skill_perfect_bait: "reference-derived-pixel-pack/equipment_bobber.png",
	ui_skill_reel_mastery: "reference-derived-pixel-pack/equipment_fishing_rod.png",
	fish_kelp_darter: "concepts/fish-catalog-v2/fish_catalog_v2_08.png",
	fish_sunny_guppy: "concepts/fish-catalog-v2/fish_catalog_v2_03.png",
	fish_shellback_puffer: "concepts/fish-catalog-v2/fish_catalog_v2_04.png",
	fish_tide_skipper: "concepts/fish-catalog-v2/fish_catalog_v2_05.png",
	fish_coral_fry: "concepts/fish-catalog-v2/fish_catalog_v2_06.png",
	fish_glass_eel: "concepts/fish-catalog-v2/fish_catalog_v2_14.png",
	fish_moonfin_snapper: "reference-derived-pixel-pack/fish_moonfin_snapper.png",
	fish_reef_shark: "concepts/fish-catalog-v2/fish_catalog_v2_21.png",
	fish_crown_leviathan: "concepts/fish-catalog-v2/fish_catalog_v2_40.png",
	ui_equipment_boat_default: "mainmenu/ship-mainmenu.png",
	ui_equipment_rod_bamboo: "reference-derived-pixel-pack/equipment_fishing_rod.png",
	ui_equipment_rod_tideglass: "reference-derived-pixel-pack/equipment_fishing_rod.png",
	ui_equipment_line_luminous: "reference-derived-pixel-pack/equipment_fishing_line.png",
	ui_equipment_bait_moon: "reference-derived-pixel-pack/equipment_bobber.png",
}
const atlasPath = path.join(root, "atlases/atlas_ocean.png")
const atlas = JSON.parse(await fs.readFile(path.join(root, "atlases/atlas_ocean.json"), "utf8"))
const original = await sharp(atlasPath).raw().toBuffer({ resolveWithObject: true })
const tiles = []
for (const [key, source] of Object.entries(sources)) {
	const frames = Object.entries(atlas.frames).filter(([name]) => name === `${key}.png` || name.startsWith(`${key}_`))
	if (!frames.length) throw new Error(`Missing atlas frames: ${key}`)
	for (const [name, { frame }] of frames) {
		const tile = await sharp(path.join(root, source)).trim().resize(frame.w, frame.h, { fit: "contain", kernel: "nearest", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()
		// Clear the old frame so its silhouette cannot bleed through transparent pixels.
		for (let y = frame.y; y < frame.y + frame.h; y++) original.data.fill(0, (y * original.info.width + frame.x) * 4, (y * original.info.width + frame.x + frame.w) * 4)
		tiles.push({ input: tile, left: frame.x, top: frame.y })
		if (name === `${key}_idle_0.png` || name === `${key}.png` || name === `${key}_default.png`) await fs.writeFile(path.join(root, key.startsWith("fish_") ? "sprites/fish" : key.startsWith("ui_skill_") ? "ui" : "equipment", name), tile)
	}
}
await sharp(original.data, { raw: original.info }).composite(tiles).png().toFile(`${atlasPath}.new`)
await fs.rename(`${atlasPath}.new`, atlasPath)
console.log(`Updated ${tiles.length} atlas frames; retained frame names and pivots.`)
