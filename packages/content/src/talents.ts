/** Skill tree catalog: permanent nodes bought between runs with Embers. Pure data; rules live in game-rules/talents. */
import type { TalentId } from "../../contracts/src/survival"

export type TalentBranch = "root" | "vitality" | "focus" | "arsenal"

export interface TalentNode {
  id: TalentId
  branch: TalentBranch
  name: string
  /** What one rank does, in plain words. */
  effect: string
  /** Ember cost of each rank, in order; its length is the max rank. */
  costs: readonly number[]
  /** Node that needs at least one rank first; the root needs nothing. */
  requires: TalentId | null
  /** Column (branch) and row (depth) on the tree grid. */
  column: number
  row: number
}

/**
 * One root, three branches of four. The first node is affordable after a single short run, so the
 * first death already buys something; the deepest nodes take dozens of runs. No node types for the
 * player: typing stays the only way to fight.
 */
export const talentTree: readonly TalentNode[] = [
  { id: "heart", branch: "root", name: "Ember Heart", effect: "+1 max heart.", costs: [5], requires: null, column: 1, row: 0 },

  { id: "vigor", branch: "vitality", name: "Vigor", effect: "+1 max heart per rank.", costs: [20, 45], requires: "heart", column: 0, row: 1 },
  { id: "guard", branch: "vitality", name: "Iron Guard", effect: "Start each run with +1 shield charge per rank.", costs: [35, 75], requires: "vigor", column: 0, row: 2 },
  { id: "mending", branch: "vitality", name: "Mending", effect: "Out-of-combat healing comes 20% sooner per rank.", costs: [60, 120], requires: "guard", column: 0, row: 3 },
  { id: "laststand", branch: "vitality", name: "Last Stand", effect: "Once per run, a killing blow leaves you at 1 heart with 3 seconds of safety.", costs: [200], requires: "mending", column: 0, row: 4 },

  { id: "focus", branch: "focus", name: "Scholar", effect: "+10% XP per rank.", costs: [12, 30, 60], requires: "heart", column: 1, row: 1 },
  { id: "composure", branch: "focus", name: "Composure", effect: "A typo halves your streak instead of resetting it.", costs: [50], requires: "focus", column: 1, row: 2 },
  { id: "wellspring", branch: "focus", name: "Wellspring", effect: "+2 mana per finished word per rank.", costs: [45, 90], requires: "composure", column: 1, row: 3 },
  { id: "veteran", branch: "focus", name: "Veteran", effect: "Begin each run with one free upgrade pick.", costs: [180], requires: "wellspring", column: 1, row: 4 },

  { id: "reach", branch: "arsenal", name: "Long Reach", effect: "+20% pickup radius per rank.", costs: [12, 35], requires: "heart", column: 2, row: 1 },
  { id: "bounty", branch: "arsenal", name: "Bounty", effect: "+15% Embers per rank.", costs: [40, 80, 160], requires: "reach", column: 2, row: 2 },
  { id: "arcana", branch: "arsenal", name: "Arcana", effect: "Skills need 1 fewer word to recharge per rank.", costs: [50, 110], requires: "bounty", column: 2, row: 3 },
  { id: "armory", branch: "arsenal", name: "Spirit Armory", effect: "Begin each run with Spirit Blades rank 1.", costs: [150], requires: "arcana", column: 2, row: 4 },
]

export const talentIds = talentTree.map(node => node.id)

export function talentById(id: string): TalentNode | undefined {
  return talentTree.find(node => node.id === id)
}

export const talentBranchColors: Record<TalentBranch, string> = { root: "#ffb85a", vitality: "#ef6a5a", focus: "#64cfe9", arsenal: "#e8b966" }
