import { readFile, stat } from "node:fs/promises"
import path from "node:path"
import process from "node:process"

const projectRoot = process.cwd()
const rigRoot = path.join(projectRoot, "public", "overdrive", "art", "rigs")
const arenaPath = path.join(
	projectRoot,
	"public",
	"overdrive",
	"art",
	"signal-trench-arena-v2.png",
)
const maxAtlasDimension = 2_048
const firstStageCompressedBudget = 5 * 1024 * 1024
const residentTextureBudget = 64 * 1024 * 1024

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
		"far_back_plate",
	],
	needle: [
		"chest_core", "head", "neck_segment", "spine_front", "spine_rear",
		"near_blade_upper_arm", "near_blade_forearm", "far_blade_upper_arm",
		"far_blade_forearm", "near_fin", "far_fin", "tail_segment_one",
		"tail_segment_two", "tail_tip",
	],
	null: [
		"void_core", "crown_center", "crown_near_plate", "crown_far_plate",
		"near_shoulder", "far_shoulder", "near_upper_arm", "far_upper_arm",
		"near_forearm", "far_forearm", "near_hand", "far_hand",
		"cloak_segment_one", "cloak_segment_two", "cloak_segment_three",
		"lower_core",
	],
}

const requiredClips = {
	warden: [
		"idle", "ready", "chain-1", "chain-2", "chain-3", "dash",
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
const byId = Object.fromEntries(results.map((result) => [result.id, result]))
const arenaSize = await readImageSize(arenaPath)
const arenaStats = await stat(arenaPath)
const arenaTextureBytes = arenaSize.width * arenaSize.height * 4
const firstStageBytes = arenaStats.size + byId.warden.bytes + byId.packet.bytes

if (firstStageBytes > firstStageCompressedBudget) {
	throw new Error(
		`First-stage combat art is ${(firstStageBytes / 1024 / 1024).toFixed(2)} MB`,
	)
}

for (const enemyId of ["packet", "needle", "null"]) {
	const residentBytes = arenaTextureBytes
		+ byId.warden.textureBytes
		+ byId[enemyId].textureBytes
	if (residentBytes > residentTextureBudget) {
		throw new Error(
			`${enemyId} stage resident textures are ${(residentBytes / 1024 / 1024).toFixed(2)} MB`,
		)
	}
}

console.log(
	`Validated ${results.length} rigs. First-stage combat art: ${(firstStageBytes / 1024 / 1024).toFixed(2)} MB.`,
)
