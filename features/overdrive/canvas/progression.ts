export type EnemyAssetRole = "primary" | "intruder"

export function enemyAssetRoleForOrdinal(ordinal: number): EnemyAssetRole {
	return ((ordinal % 3) + 3) % 3 === 2 ? "intruder" : "primary"
}

export function combatBuildTier(keycapCount: number, macroCount: number) {
	return Math.min(
		3,
		Math.ceil(Math.max(0, keycapCount) / 2) + (macroCount > 0 ? 1 : 0),
	)
}
