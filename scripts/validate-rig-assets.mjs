import { readFile, stat } from "node:fs/promises"
import path from "node:path"
import process from "node:process"

const projectRoot = process.cwd()
const rigRoot = path.join(projectRoot, "public", "overdrive", "art", "rigs")
const maxAtlasDimension = 2_048
const variantParts = {
	packet: {
		"cache-hound": [
			"cache_sensor_muzzle", "cache_ankle_guard", "cache_hook_tail",
			"cache_split_relay",
		],
		"relay-ram": [
			"ram_forehead_wedge", "ram_shoulder_relay", "ram_foreleg_guard",
			"ram_back_capacitor",
		],
	},
	needle: {
		"vector-mantis": [
			"mantis_scythe_near", "mantis_scythe_far", "mantis_head_fin",
			"mantis_signal_tail",
		],
		"spine-courier": [
			"courier_spine_relay", "courier_stabilizer", "courier_fin_near",
			"courier_fin_far",
		],
	},
	null: {
		"crown-hand": [
			"hand_plate_near", "hand_plate_far", "hand_wrist_crown",
			"hand_shoulder_shard",
		],
		"void-shard": [
			"shard_crown_spear", "shard_core_casing", "shard_lower_spear",
			"shard_orbit_plate",
		],
	},
}

const requiredParts = {
	warden: [
		"torso", "pelvis", "head", "visor", "near_shoulder", "far_shoulder",
		"near_upper_arm", "far_upper_arm", "near_forearm", "far_forearm",
		"cannon_barrel", "cannon_core", "near_thigh", "far_thigh",
		"near_shin", "far_shin", "near_foot", "far_foot",
	],
	packet: [
		"core_torso", "head", "jaw", "near_front_upper_leg",
		"near_front_lower_leg", "far_front_upper_leg", "far_front_lower_leg",
		"near_rear_upper_leg", "near_rear_lower_leg", "far_rear_upper_leg",
		"far_rear_lower_leg", "tail_base", "tail_tip", "near_back_plate",
		"far_back_plate", ...Object.values(variantParts.packet).flat(),
	],
	needle: [
		"chest_core", "head", "neck_segment", "spine_front", "spine_rear",
		"near_blade_upper_arm", "near_blade_forearm", "far_blade_upper_arm",
		"far_blade_forearm", "near_fin", "far_fin", "tail_segment_one",
		"tail_segment_two", "tail_tip",
		...Object.values(variantParts.needle).flat(),
	],
	null: [
		"void_core", "crown_center", "crown_near_plate", "crown_far_plate",
		"near_shoulder", "far_shoulder", "near_upper_arm", "far_upper_arm",
		"near_forearm", "far_forearm", "near_hand", "far_hand",
		"cloak_segment_one", "cloak_segment_two", "cloak_segment_three",
		"lower_core", ...Object.values(variantParts.null).flat(),
	],
}

const requiredClips = {
	warden: [
		"idle", "ready", "cannon-burst", "rail-step", "tether-pull",
		"breach-slide", "recoil-vault", "crossfire-pivot", "execution",
		"overdrive-breach", "chain-1", "chain-2", "chain-3", "dash",
		"execute", "block", "hurt", "recover", "overdrive",
	],
	packet: ["locomotion", "idle", "anticipation", "attack", "hit", "defeat", "special"],
	needle: ["locomotion", "idle", "anticipation", "attack", "hit", "defeat", "special"],
	null: ["locomotion", "idle", "anticipation", "attack", "hit", "defeat", "special"],
}

function readUint24LE(buffer, offset) {
	return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16)
}

function readWebpSize(buffer) {
	if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") {
		throw new Error("Invalid WebP header")
	}
	let offset = 12
	while (offset + 8 <= buffer.length) {
		const type = buffer.toString("ascii", offset, offset + 4)
		const length = buffer.readUInt32LE(offset + 4)
		const data = offset + 8
		if (type === "VP8X") {
			return {
				width: readUint24LE(buffer, data + 4) + 1,
				height: readUint24LE(buffer, data + 7) + 1,
			}
		}
		if (type === "VP8L") {
			const first = buffer[data + 1]
			const second = buffer[data + 2]
			const third = buffer[data + 3]
			const fourth = buffer[data + 4]
			return {
				width: 1 + first + ((second & 0x3f) << 8),
				height: 1 + (second >> 6) + (third << 2) + ((fourth & 0x0f) << 10),
			}
		}
		if (type === "VP8 ") {
			return {
				width: buffer.readUInt16LE(data + 6) & 0x3fff,
				height: buffer.readUInt16LE(data + 8) & 0x3fff,
			}
		}
		offset = data + length + (length % 2)
	}
	throw new Error("WebP dimensions were not found")
}

function readPngSize(buffer) {
	if (buffer.toString("hex", 0, 8) !== "89504e470d0a1a0a") {
		throw new Error("Invalid PNG header")
	}
	return {
		width: buffer.readUInt32BE(16),
		height: buffer.readUInt32BE(20),
	}
}

async function readImageSize(filePath) {
	const buffer = await readFile(filePath)
	return filePath.endsWith(".webp")
		? readWebpSize(buffer)
		: readPngSize(buffer)
}

async function validateRig(rigId) {
	const jsonPath = path.join(rigRoot, `${rigId}-rig-v1.json`)
	const imagePath = path.join(rigRoot, `${rigId}-rig-v1.webp`)
	const [jsonSource, imageInfo, imageStats] = await Promise.all([
		readFile(jsonPath, "utf8"),
		readImageSize(imagePath),
		stat(imagePath),
	])
	const atlas = JSON.parse(jsonSource)
	const metaSize = atlas.meta?.size
	if (
		!metaSize
		|| metaSize.w !== imageInfo.width
		|| metaSize.h !== imageInfo.height
	) {
		throw new Error(`${rigId} atlas metadata does not match its image`)
	}
	if (
		imageInfo.width > maxAtlasDimension
		|| imageInfo.height > maxAtlasDimension
	) {
		throw new Error(`${rigId} atlas exceeds 2048 by 2048`)
	}

	for (const partId of requiredParts[rigId]) {
		const frame = atlas.frames?.[`${rigId}/${partId}`]?.frame
		const pivot = atlas.meta?.rig?.parts?.[partId]?.pivot
		if (!frame) throw new Error(`${rigId} is missing frame ${partId}`)
		if (!pivot) throw new Error(`${rigId} is missing pivot ${partId}`)
		if (
			frame.x < 0
			|| frame.y < 0
			|| frame.w <= 0
			|| frame.h <= 0
			|| frame.x + frame.w > imageInfo.width
			|| frame.y + frame.h > imageInfo.height
		) {
			throw new Error(`${rigId} frame ${partId} is outside atlas bounds`)
		}
		if (
			pivot.x < 0
			|| pivot.y < 0
			|| pivot.x > frame.w
			|| pivot.y > frame.h
		) {
			throw new Error(`${rigId} pivot ${partId} is outside its frame`)
		}
	}

	const clips = new Set(atlas.meta?.rig?.clips ?? [])
	for (const clip of requiredClips[rigId]) {
		if (!clips.has(clip)) throw new Error(`${rigId} is missing clip ${clip}`)
	}
	for (const [variantId, partIds] of Object.entries(variantParts[rigId] ?? {})) {
		const declared = new Set(atlas.meta?.rig?.variants?.[variantId] ?? [])
		for (const partId of partIds) {
			if (!declared.has(partId)) {
				throw new Error(`${rigId} variant ${variantId} is missing ${partId}`)
			}
		}
	}

	return {
		id: rigId,
		path: imagePath,
		size: imageInfo,
		bytes: imageStats.size,
		textureBytes: imageInfo.width * imageInfo.height * 4,
	}
}

const rigs = Object.keys(requiredParts)
const results = await Promise.all(rigs.map(validateRig))
console.log(
	`Validated ${results.length} variant-capable rig atlases.`,
)
