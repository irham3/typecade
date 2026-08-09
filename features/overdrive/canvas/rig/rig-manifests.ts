import type {
	AnimationClip,
	AnimationClipName,
	RigDefinition,
	RigKeyframe,
	RigPartDefinition,
	RigTrack,
	RigTransform,
} from "./rig-definition"

export type CombatRigId = "warden" | "packet" | "needle" | "null"

const transform = (
	x = 0,
	y = 0,
	rotation = 0,
	scaleX = 1,
	scaleY = 1,
	alpha = 1,
): RigTransform => ({ x, y, rotation, scaleX, scaleY, alpha })

const part = (
	id: string,
	x: number,
	y: number,
	zIndex: number,
	parentId?: string,
): RigPartDefinition => ({
	id,
	texture: id,
	parentId,
	pivot: { x: 128, y: 128 },
	defaultTransform: transform(x, y),
	zIndex,
})

const track = (
	partId: string,
	keyframes: readonly RigKeyframe[],
): RigTrack => ({ partId, keyframes })

const clip = (
	name: AnimationClipName,
	durationMs: number,
	loop: boolean,
	priority: number,
	tracks: readonly RigTrack[],
	contactMs?: number,
	recoveryStartMs?: number,
): AnimationClip => ({
	name,
	durationMs,
	loop,
	priority,
	contactMs,
	recoveryStartMs,
	tracks,
})

function clipRecord(clips: readonly AnimationClip[]) {
	return Object.fromEntries(
		clips.map((definition) => [definition.name, definition]),
	) as Partial<Record<AnimationClipName, AnimationClip>>
}

export const RIG_REQUIRED_CLIPS: Record<CombatRigId, readonly AnimationClipName[]> = {
	warden: [
		"idle",
		"ready",
		"chain-1",
		"chain-2",
		"chain-3",
		"dash",
		"execute",
		"block",
		"hurt",
		"recover",
		"overdrive",
	],
	packet: ["locomotion", "idle", "anticipation", "attack", "hit", "defeat", "special"],
	needle: ["locomotion", "idle", "anticipation", "attack", "hit", "defeat", "special"],
	null: ["locomotion", "idle", "anticipation", "attack", "hit", "defeat", "special"],
}

export const RIG_PART_IDS: Record<CombatRigId, readonly string[]> = {
	warden: [
		"torso",
		"pelvis",
		"head",
		"visor",
		"near_shoulder",
		"far_shoulder",
		"near_upper_arm",
		"far_upper_arm",
		"near_forearm",
		"far_forearm",
		"cannon_barrel",
		"cannon_core",
		"near_thigh",
		"far_thigh",
		"near_shin",
		"far_shin",
		"near_foot",
		"far_foot",
	],
	packet: [
		"core_torso",
		"head",
		"jaw",
		"near_front_upper_leg",
		"near_front_lower_leg",
		"far_front_upper_leg",
		"far_front_lower_leg",
		"near_rear_upper_leg",
		"near_rear_lower_leg",
		"far_rear_upper_leg",
		"far_rear_lower_leg",
		"tail_base",
		"tail_tip",
		"near_back_plate",
		"far_back_plate",
	],
	needle: [
		"chest_core",
		"head",
		"neck_segment",
		"spine_front",
		"spine_rear",
		"near_blade_upper_arm",
		"near_blade_forearm",
		"far_blade_upper_arm",
		"far_blade_forearm",
		"near_fin",
		"far_fin",
		"tail_segment_one",
		"tail_segment_two",
		"tail_tip",
	],
	null: [
		"void_core",
		"crown_center",
		"crown_near_plate",
		"crown_far_plate",
		"near_shoulder",
		"far_shoulder",
		"near_upper_arm",
		"far_upper_arm",
		"near_forearm",
		"far_forearm",
		"near_hand",
		"far_hand",
		"cloak_segment_one",
		"cloak_segment_two",
		"cloak_segment_three",
		"lower_core",
	],
}

const wardenParts: readonly RigPartDefinition[] = [
	part("far_foot", -30, 62, 0, "far_shin"),
	part("far_shin", -20, 64, 1, "far_thigh"),
	part("far_thigh", -26, 54, 2, "pelvis"),
	part("far_forearm", -52, 42, 3, "far_upper_arm"),
	part("far_upper_arm", -58, 12, 4, "far_shoulder"),
	part("far_shoulder", -52, -38, 5, "torso"),
	part("pelvis", -4, 70, 6, "torso"),
	part("torso", 0, 0, 7),
	part("head", 8, -78, 8, "torso"),
	part("visor", 28, -2, 9, "head"),
	part("near_thigh", 24, 54, 10, "pelvis"),
	part("near_shin", 18, 66, 11, "near_thigh"),
	part("near_foot", 30, 64, 12, "near_shin"),
	part("near_shoulder", 58, -34, 13, "torso"),
	part("near_upper_arm", 58, 14, 14, "near_shoulder"),
	part("near_forearm", 58, 42, 15, "near_upper_arm"),
	part("cannon_barrel", 68, 0, 16, "near_forearm"),
	part("cannon_core", 250, 0, 17, "cannon_barrel"),
]

const wardenClips = clipRecord([
	clip("idle", 1_200, true, 0, [
		track("torso", [
			{ atMs: 0, y: 0 },
			{ atMs: 600, y: -3 },
			{ atMs: 1_200, y: 0 },
		]),
		track("head", [
			{ atMs: 0, rotation: -0.01 },
			{ atMs: 600, rotation: 0.015 },
			{ atMs: 1_200, rotation: -0.01 },
		]),
		track("cannon_core", [
			{ atMs: 0, alpha: 0.72 },
			{ atMs: 600, alpha: 1 },
			{ atMs: 1_200, alpha: 0.72 },
		]),
	]),
	clip("ready", 1_200, true, 0, [
		track("torso", [
			{ atMs: 0, y: 0, rotation: -0.015 },
			{ atMs: 600, y: -2, rotation: 0 },
			{ atMs: 1_200, y: 0, rotation: -0.015 },
		]),
		track("near_forearm", [
			{ atMs: 0, rotation: -0.08 },
			{ atMs: 600, rotation: -0.04 },
			{ atMs: 1_200, rotation: -0.08 },
		]),
	]),
	clip("chain-1", 180, false, 1, [
		track("torso", [
			{ atMs: 0, x: 0, rotation: 0 },
			{ atMs: 35, x: 2, rotation: -0.04 },
			{ atMs: 90, x: 16, rotation: 0.07, easing: "cubic-out" },
			{ atMs: 180, x: 4, rotation: 0 },
		]),
		track("near_shoulder", [
			{ atMs: 0, rotation: -0.08 },
			{ atMs: 35, rotation: -0.28 },
			{ atMs: 90, rotation: 0.22, easing: "cubic-out" },
			{ atMs: 180, rotation: -0.04 },
		]),
		track("near_forearm", [
			{ atMs: 0, rotation: 0.1 },
			{ atMs: 35, rotation: -0.18 },
			{ atMs: 90, rotation: 0.3, easing: "cubic-out" },
			{ atMs: 180, rotation: 0 },
		]),
	], 90, 90),
	clip("chain-2", 180, false, 1, [
		track("torso", [
			{ atMs: 0, x: 4, rotation: 0.03 },
			{ atMs: 35, x: 6, rotation: 0.08 },
			{ atMs: 90, x: 24, rotation: -0.06, easing: "cubic-out" },
			{ atMs: 180, x: 8, rotation: 0 },
		]),
		track("far_shoulder", [
			{ atMs: 0, rotation: 0.08 },
			{ atMs: 35, rotation: 0.24 },
			{ atMs: 90, rotation: -0.2, easing: "cubic-out" },
			{ atMs: 180, rotation: 0 },
		]),
		track("far_forearm", [
			{ atMs: 0, rotation: -0.08 },
			{ atMs: 90, rotation: -0.36, easing: "cubic-out" },
			{ atMs: 180, rotation: 0 },
		]),
	], 90, 90),
	clip("chain-3", 180, false, 1, [
		track("torso", [
			{ atMs: 0, x: 8, y: 0 },
			{ atMs: 35, x: 4, y: 2 },
			{ atMs: 90, x: 32, y: -6, easing: "cubic-out" },
			{ atMs: 180, x: 12, y: 0 },
		]),
		track("near_forearm", [
			{ atMs: 0, rotation: -0.12 },
			{ atMs: 90, rotation: 0.08, easing: "cubic-out" },
			{ atMs: 180, rotation: -0.04 },
		]),
		track("cannon_barrel", [
			{ atMs: 0, scaleX: 0.94 },
			{ atMs: 90, scaleX: 1.1, easing: "ease-out-back" },
			{ atMs: 180, scaleX: 1 },
		]),
	], 90, 90),
	clip("dash", 180, false, 2, [
		track("torso", [
			{ atMs: 0, x: 0, y: 0 },
			{ atMs: 45, x: -8, y: 4 },
			{ atMs: 120, x: 72, y: -8, easing: "cubic-out" },
			{ atMs: 180, x: 56, y: 0 },
		]),
	], 120, 120),
	clip("execute", 300, false, 3, [
		track("torso", [
			{ atMs: 0, x: 12, y: 0, rotation: 0 },
			{ atMs: 60, x: 4, y: 4, rotation: -0.08 },
			{ atMs: 145, x: 52, y: -8, rotation: 0.09, easing: "cubic-out" },
			{ atMs: 220, x: 20, y: 0, rotation: 0 },
			{ atMs: 300, x: 0, y: 0, rotation: 0 },
		]),
		track("near_forearm", [
			{ atMs: 0, rotation: -0.12 },
			{ atMs: 145, rotation: 0.16, easing: "cubic-out" },
			{ atMs: 300, rotation: -0.08 },
		]),
	], 145, 220),
	clip("block", 360, false, 4, [
		track("torso", [
			{ atMs: 0, x: 0, rotation: 0 },
			{ atMs: 90, x: -8, rotation: -0.08, easing: "cubic-out" },
			{ atMs: 240, x: -6, rotation: -0.05 },
			{ atMs: 360, x: 0, rotation: 0 },
		]),
		track("near_forearm", [
			{ atMs: 0, x: 58, rotation: 0 },
			{ atMs: 90, x: 30, rotation: -1.05, easing: "ease-out-back" },
			{ atMs: 240, x: 30, rotation: -1.05 },
			{ atMs: 360, x: 58, rotation: 0 },
		]),
	], 120, 280),
	clip("hurt", 180, false, 5, [
		track("torso", [
			{ atMs: 0, x: 0, rotation: 0 },
			{ atMs: 45, x: -8, rotation: -0.08 },
			{ atMs: 180, x: 0, rotation: 0, easing: "cubic-out" },
		]),
	], 45, 120),
	clip("recover", 240, false, 1, [
		track("torso", [
			{ atMs: 0, x: 20, y: -4, rotation: 0.05 },
			{ atMs: 240, x: 0, y: 0, rotation: 0, easing: "cubic-out" },
		]),
	], undefined, 90),
	clip("overdrive", 320, false, 6, [
		track("torso", [
			{ atMs: 0, x: 0, y: 0, rotation: 0 },
			{ atMs: 48, x: -12, y: 4, rotation: -0.08 },
			{ atMs: 186, x: 120, y: -18, rotation: 0.12, easing: "cubic-out" },
			{ atMs: 320, x: 0, y: 0, rotation: 0, easing: "cubic-out" },
		]),
		track("cannon_core", [
			{ atMs: 0, scaleX: 1, scaleY: 1, alpha: 0.8 },
			{ atMs: 96, scaleX: 1.35, scaleY: 1.35, alpha: 1, easing: "ease-out-back" },
			{ atMs: 320, scaleX: 1, scaleY: 1, alpha: 0.8 },
		]),
	], 186, 186),
])

const packetParts: readonly RigPartDefinition[] = [
	part("far_front_lower_leg", -52, 42, 0, "far_front_upper_leg"),
	part("far_front_upper_leg", -50, 24, 1, "core_torso"),
	part("far_rear_lower_leg", 54, 42, 0, "far_rear_upper_leg"),
	part("far_rear_upper_leg", 48, 28, 1, "core_torso"),
	part("far_back_plate", 14, -42, 2, "core_torso"),
	part("tail_tip", 70, 12, 3, "tail_base"),
	part("tail_base", 58, 4, 4, "core_torso"),
	part("core_torso", 0, 0, 5),
	part("head", -58, -18, 8, "core_torso"),
	part("jaw", -32, 18, 9, "head"),
	part("near_back_plate", 4, -48, 10, "core_torso"),
	part("near_front_upper_leg", -42, 30, 11, "core_torso"),
	part("near_front_lower_leg", -48, 46, 12, "near_front_upper_leg"),
	part("near_rear_upper_leg", 42, 30, 11, "core_torso"),
	part("near_rear_lower_leg", 50, 46, 12, "near_rear_upper_leg"),
]

const packetClips = clipRecord([
	clip("idle", 1_200, true, 0, [
		track("core_torso", [
			{ atMs: 0, y: 0 },
			{ atMs: 600, y: -2 },
			{ atMs: 1_200, y: 0 },
		]),
		track("head", [
			{ atMs: 0, rotation: -0.03 },
			{ atMs: 600, rotation: 0.04 },
			{ atMs: 1_200, rotation: -0.03 },
		]),
		track("jaw", [
			{ atMs: 0, rotation: 0 },
			{ atMs: 600, rotation: 0.05 },
			{ atMs: 1_200, rotation: 0 },
		]),
	]),
	clip("locomotion", 800, true, 0, [
		track("core_torso", [
			{ atMs: 0, y: 0, rotation: -0.02 },
			{ atMs: 200, y: -4, rotation: 0.02 },
			{ atMs: 400, y: 0, rotation: -0.02 },
			{ atMs: 600, y: -4, rotation: 0.02 },
			{ atMs: 800, y: 0, rotation: -0.02 },
		]),
		track("near_front_upper_leg", [
			{ atMs: 0, rotation: 0.22 },
			{ atMs: 400, rotation: -0.22 },
			{ atMs: 800, rotation: 0.22 },
		]),
		track("near_rear_upper_leg", [
			{ atMs: 0, rotation: -0.2 },
			{ atMs: 400, rotation: 0.2 },
			{ atMs: 800, rotation: -0.2 },
		]),
		track("tail_base", [
			{ atMs: 0, rotation: -0.08 },
			{ atMs: 400, rotation: 0.12 },
			{ atMs: 800, rotation: -0.08 },
		]),
	]),
	clip("anticipation", 240, false, 2, [
		track("core_torso", [
			{ atMs: 0, x: 0, y: 0 },
			{ atMs: 240, x: 14, y: 6, rotation: 0.06, easing: "cubic-out" },
		]),
		track("jaw", [
			{ atMs: 0, rotation: 0 },
			{ atMs: 240, rotation: 0.28 },
		]),
	], undefined, 180),
	clip("attack", 120, false, 3, [
		track("core_torso", [
			{ atMs: 0, x: 14, y: 6 },
			{ atMs: 64, x: -46, y: -4, easing: "cubic-out" },
			{ atMs: 120, x: -24, y: 0 },
		]),
	], 64, 64),
	clip("hit", 90, false, 4, [
		track("core_torso", [
			{ atMs: 0, x: 0, rotation: 0 },
			{ atMs: 36, x: 8, rotation: 0.08 },
			{ atMs: 90, x: 0, rotation: 0 },
		]),
	], 36, 54),
	clip("defeat", 300, false, 6, [
		track("core_torso", [
			{ atMs: 0, x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, alpha: 1 },
			{ atMs: 300, x: 48, y: 20, rotation: 0.28, scaleX: 0.82, scaleY: 0.82, alpha: 0 },
		]),
	], 40, 300),
	clip("special", 360, false, 3, [
		track("tail_base", [
			{ atMs: 0, rotation: -0.08 },
			{ atMs: 140, rotation: -0.5, easing: "cubic-out" },
			{ atMs: 240, rotation: 0.55, easing: "ease-out-back" },
			{ atMs: 360, rotation: -0.08 },
		]),
		track("tail_tip", [
			{ atMs: 0, rotation: 0 },
			{ atMs: 240, rotation: 0.65, easing: "ease-out-back" },
			{ atMs: 360, rotation: 0 },
		]),
	], 240, 240),
])

const needleParts: readonly RigPartDefinition[] = [
	part("far_fin", 18, -48, 0, "spine_rear"),
	part("far_blade_forearm", -48, 32, 1, "far_blade_upper_arm"),
	part("far_blade_upper_arm", -40, 6, 2, "chest_core"),
	part("tail_tip", 54, 6, 1, "tail_segment_two"),
	part("tail_segment_two", 48, 4, 2, "tail_segment_one"),
	part("tail_segment_one", 44, 2, 3, "spine_rear"),
	part("spine_rear", 38, 0, 4, "spine_front"),
	part("spine_front", 32, 0, 5, "chest_core"),
	part("chest_core", 0, 0, 6),
	part("neck_segment", -30, -12, 7, "chest_core"),
	part("head", -40, -4, 8, "neck_segment"),
	part("near_fin", 12, -52, 9, "spine_rear"),
	part("near_blade_upper_arm", -34, 10, 10, "chest_core"),
	part("near_blade_forearm", -52, 34, 11, "near_blade_upper_arm"),
]

const needleClips = clipRecord([
	clip("idle", 1_200, true, 0, [
		track("chest_core", [
			{ atMs: 0, y: 0 },
			{ atMs: 600, y: -3 },
			{ atMs: 1_200, y: 0 },
		]),
		track("spine_rear", [
			{ atMs: 0, rotation: -0.04 },
			{ atMs: 600, rotation: 0.06 },
			{ atMs: 1_200, rotation: -0.04 },
		]),
		track("near_fin", [
			{ atMs: 0, rotation: -0.08 },
			{ atMs: 600, rotation: 0.04 },
			{ atMs: 1_200, rotation: -0.08 },
		]),
	]),
	clip("locomotion", 1_000, true, 0, [
		track("chest_core", [
			{ atMs: 0, y: 0, rotation: -0.02 },
			{ atMs: 250, y: -5, rotation: 0.025 },
			{ atMs: 500, y: 0, rotation: -0.02 },
			{ atMs: 750, y: 4, rotation: 0.02 },
			{ atMs: 1_000, y: 0, rotation: -0.02 },
		]),
		track("spine_rear", [
			{ atMs: 0, rotation: -0.08 },
			{ atMs: 500, rotation: 0.12 },
			{ atMs: 1_000, rotation: -0.08 },
		]),
		track("near_fin", [
			{ atMs: 0, rotation: -0.12 },
			{ atMs: 500, rotation: 0.08 },
			{ atMs: 1_000, rotation: -0.12 },
		]),
	]),
	clip("anticipation", 240, false, 2, [
		track("chest_core", [
			{ atMs: 0, x: 0, rotation: 0 },
			{ atMs: 240, x: 18, rotation: 0.12, easing: "cubic-out" },
		]),
		track("near_blade_upper_arm", [
			{ atMs: 0, rotation: 0 },
			{ atMs: 240, rotation: -0.6, easing: "cubic-out" },
		]),
	], undefined, 180),
	clip("attack", 120, false, 3, [
		track("chest_core", [
			{ atMs: 0, x: 18, y: 0, rotation: 0.12 },
			{ atMs: 56, x: -56, y: -12, rotation: -0.14, easing: "cubic-out" },
			{ atMs: 120, x: -28, y: 0, rotation: 0 },
		]),
		track("near_blade_forearm", [
			{ atMs: 0, rotation: -0.2 },
			{ atMs: 56, rotation: 0.72, easing: "ease-out-back" },
			{ atMs: 120, rotation: 0 },
		]),
	], 56, 56),
	clip("hit", 90, false, 4, [
		track("chest_core", [
			{ atMs: 0, x: 0, rotation: 0 },
			{ atMs: 32, x: 8, rotation: 0.1 },
			{ atMs: 90, x: 0, rotation: 0 },
		]),
	], 32, 54),
	clip("defeat", 300, false, 6, [
		track("chest_core", [
			{ atMs: 0, x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, alpha: 1 },
			{ atMs: 300, x: 48, y: -32, rotation: -0.6, scaleX: 0.82, scaleY: 0.82, alpha: 0 },
		]),
	], 40, 300),
	clip("special", 360, false, 3, [
		track("spine_rear", [
			{ atMs: 0, rotation: -0.08 },
			{ atMs: 140, rotation: -0.45 },
			{ atMs: 240, rotation: 0.5, easing: "ease-out-back" },
			{ atMs: 360, rotation: -0.08 },
		]),
		track("near_fin", [
			{ atMs: 0, scaleY: 1, alpha: 0.8 },
			{ atMs: 240, scaleY: 1.35, alpha: 1, easing: "ease-out-back" },
			{ atMs: 360, scaleY: 1, alpha: 0.8 },
		]),
	], 240, 240),
])

const nullParts: readonly RigPartDefinition[] = [
	part("far_hand", -62, 52, 0, "far_forearm"),
	part("far_forearm", -54, 42, 1, "far_upper_arm"),
	part("far_upper_arm", -54, 18, 2, "far_shoulder"),
	part("far_shoulder", -50, -28, 3, "void_core"),
	part("crown_far_plate", -30, -66, 4, "crown_center"),
	part("cloak_segment_three", 20, 78, 3, "lower_core"),
	part("cloak_segment_two", -12, 72, 4, "lower_core"),
	part("lower_core", 0, 62, 5, "void_core"),
	part("void_core", 0, 0, 6),
	part("crown_center", 0, -62, 7, "void_core"),
	part("crown_near_plate", 34, -68, 8, "crown_center"),
	part("near_shoulder", 54, -26, 9, "void_core"),
	part("near_upper_arm", 56, 18, 10, "near_shoulder"),
	part("near_forearm", 58, 44, 11, "near_upper_arm"),
	part("near_hand", 66, 52, 12, "near_forearm"),
	part("cloak_segment_one", 42, 66, 9, "lower_core"),
]

const nullClips = clipRecord([
	clip("idle", 1_200, true, 0, [
		track("void_core", [
			{ atMs: 0, y: 0 },
			{ atMs: 600, y: -2 },
			{ atMs: 1_200, y: 0 },
		]),
		track("crown_near_plate", [
			{ atMs: 0, rotation: -0.04 },
			{ atMs: 600, rotation: 0.05 },
			{ atMs: 1_200, rotation: -0.04 },
		]),
		track("crown_far_plate", [
			{ atMs: 0, rotation: 0.05 },
			{ atMs: 600, rotation: -0.04 },
			{ atMs: 1_200, rotation: 0.05 },
		]),
	]),
	clip("locomotion", 1_200, true, 0, [
		track("void_core", [
			{ atMs: 0, y: 0 },
			{ atMs: 600, y: -5 },
			{ atMs: 1_200, y: 0 },
		]),
		track("crown_near_plate", [
			{ atMs: 0, rotation: -0.08 },
			{ atMs: 600, rotation: 0.1 },
			{ atMs: 1_200, rotation: -0.08 },
		]),
		track("crown_far_plate", [
			{ atMs: 0, rotation: 0.1 },
			{ atMs: 600, rotation: -0.08 },
			{ atMs: 1_200, rotation: 0.1 },
		]),
		track("cloak_segment_one", [
			{ atMs: 0, rotation: -0.04 },
			{ atMs: 600, rotation: 0.12 },
			{ atMs: 1_200, rotation: -0.04 },
		]),
	]),
	clip("anticipation", 240, false, 2, [
		track("void_core", [
			{ atMs: 0, x: 0, scaleX: 1, scaleY: 1 },
			{ atMs: 240, x: 12, scaleX: 1.06, scaleY: 1.06, easing: "cubic-out" },
		]),
		track("near_upper_arm", [
			{ atMs: 0, rotation: 0 },
			{ atMs: 240, rotation: -0.5, easing: "cubic-out" },
		]),
		track("far_upper_arm", [
			{ atMs: 0, rotation: 0 },
			{ atMs: 240, rotation: 0.5, easing: "cubic-out" },
		]),
	], undefined, 180),
	clip("attack", 120, false, 3, [
		track("void_core", [
			{ atMs: 0, x: 12, rotation: 0 },
			{ atMs: 72, x: -42, rotation: -0.06, easing: "cubic-out" },
			{ atMs: 120, x: -24, rotation: 0 },
		]),
		track("near_forearm", [
			{ atMs: 0, rotation: 0 },
			{ atMs: 72, rotation: 0.52, easing: "ease-out-back" },
			{ atMs: 120, rotation: 0 },
		]),
	], 72, 72),
	clip("hit", 90, false, 4, [
		track("void_core", [
			{ atMs: 0, x: 0, rotation: 0 },
			{ atMs: 40, x: 8, rotation: 0.06 },
			{ atMs: 90, x: 0, rotation: 0 },
		]),
	], 40, 54),
	clip("defeat", 300, false, 6, [
		track("void_core", [
			{ atMs: 0, x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, alpha: 1 },
			{ atMs: 300, x: 48, y: 24, rotation: 0.3, scaleX: 0.82, scaleY: 0.82, alpha: 0 },
		]),
		track("crown_near_plate", [
			{ atMs: 0, x: 34, y: -68, rotation: 0, alpha: 1 },
			{ atMs: 300, x: 72, y: -90, rotation: 0.7, alpha: 0 },
		]),
		track("crown_far_plate", [
			{ atMs: 0, x: -30, y: -66, rotation: 0, alpha: 1 },
			{ atMs: 300, x: -58, y: -82, rotation: -0.6, alpha: 0 },
		]),
	], 40, 300),
	clip("special", 420, false, 3, [
		track("crown_center", [
			{ atMs: 0, rotation: 0, scaleX: 1, scaleY: 1 },
			{ atMs: 210, rotation: 0.12, scaleX: 1.12, scaleY: 1.12, easing: "ease-out-back" },
			{ atMs: 420, rotation: 0, scaleX: 1, scaleY: 1 },
		]),
		track("near_hand", [
			{ atMs: 0, rotation: 0 },
			{ atMs: 210, rotation: -0.72, easing: "cubic-out" },
			{ atMs: 420, rotation: 0 },
		]),
		track("far_hand", [
			{ atMs: 0, rotation: 0 },
			{ atMs: 210, rotation: 0.72, easing: "cubic-out" },
			{ atMs: 420, rotation: 0 },
		]),
	], 210, 260),
])

const createDefinition = (
	id: CombatRigId,
	defaultClip: AnimationClipName,
	parts: readonly RigPartDefinition[],
	clips: Readonly<Partial<Record<AnimationClipName, AnimationClip>>>,
): RigDefinition => ({
	id,
	atlasUrl: `/overdrive/art/rigs/${id}-rig-v1.json`,
	defaultClip,
	parts,
	clips,
})

export const WARDEN_RIG = createDefinition("warden", "idle", wardenParts, wardenClips)
export const PACKET_RIG = createDefinition("packet", "locomotion", packetParts, packetClips)
export const NEEDLE_RIG = createDefinition("needle", "locomotion", needleParts, needleClips)
export const NULL_RIG = createDefinition("null", "locomotion", nullParts, nullClips)

export const COMBAT_RIG_MANIFESTS: Record<CombatRigId, RigDefinition> = {
	warden: WARDEN_RIG,
	packet: PACKET_RIG,
	needle: NEEDLE_RIG,
	null: NULL_RIG,
}
