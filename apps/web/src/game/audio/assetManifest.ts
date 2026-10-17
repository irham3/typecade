/** Recorded audio shipped with the game (CC0; see ASSET-LICENSES.md). Paths are public URLs. */
const root = "/assets/dungeon/audio"

export const musicTracks = {
  menu: `${root}/music/menu.ogg`,
  dungeon: `${root}/music/dungeon.ogg`,
  battle: `${root}/music/battle.ogg`,
  boss: `${root}/music/boss.ogg`,
  defeat: `${root}/music/defeat.ogg`,
} as const
export type MusicTrackId = keyof typeof musicTracks

export const ambienceTrack = `${root}/music/ambience.ogg`

const variants = (name: string, count = 3) => Array.from({ length: count }, (_, i) => `${root}/sfx/${name}_00${i}.ogg`)
const files = (...names: string[]) => names.map(name => `${root}/sfx/${name}.ogg`)

/** Sample groups: one is picked at random per play so repeats never sound identical. */
export const sampleGroups = {
  slice: files("knifeSlice", "knifeSlice2", "chop"),
  draw: files("drawKnife1", "drawKnife2", "drawKnife3"),
  cloth: files("cloth1", "cloth2", "cloth3"),
  coins: files("handleCoins", "handleCoins2"),
  creak: files("creak1", "creak2", "doorOpen_1"),
  latch: files("metalLatch", "metalClick"),
  page: files("bookFlip1", "bookFlip2", "bookOpen"),
  metalLight: variants("impactMetal_light"),
  metalHeavy: variants("impactMetal_heavy"),
  plate: variants("impactPlate_medium"),
  plateHeavy: variants("impactPlate_heavy"),
  punch: variants("impactPunch_heavy"),
  wood: variants("impactWood_heavy"),
  bone: variants("impactPlank_medium"),
  soft: variants("impactSoft_heavy"),
  stone: variants("impactMining"),
  bell: variants("impactBell_heavy"),
  glass: variants("impactGlass_medium"),
} as const
export type SampleGroup = keyof typeof sampleGroups
