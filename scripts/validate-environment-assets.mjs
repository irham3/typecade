import { readFile, stat } from "node:fs/promises"
import path from "node:path"
import process from "node:process"

const projectRoot = process.cwd()
const artRoot = path.join(projectRoot, "public", "overdrive", "art")
const environmentRoot = path.join(artRoot, "environment")
const rigRoot = path.join(artRoot, "rigs")
const manifestPath = path.join(environmentRoot, "signal-trench-kit-v1.json")
const requiredRoles = [
	"far",
	"machinery",
	"midground",
	"deck",
	"foreground",
	"atmosphere",
]
const maxTextureDimension = 2_048
const firstStageCompressedBudget = 5 * 1024 * 1024
const residentTextureBudget = 64 * 1024 * 1024

function readUint24LE(buffer, offset) {
	return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16)
}

function readWebpSize(buffer) {
	if (
		buffer.toString("ascii", 0, 4) !== "RIFF"
		|| buffer.toString("ascii", 8, 12) !== "WEBP"
	) {
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

async function imageInfo(filePath) {
	const [buffer, fileStats] = await Promise.all([readFile(filePath), stat(filePath)])
	const size = readWebpSize(buffer)
	return {
		...size,
		bytes: fileStats.size,
		textureBytes: size.width * size.height * 4,
	}
}

const manifest = JSON.parse(await readFile(manifestPath, "utf8"))
if (manifest.id !== "signal-trench-v1") {
	throw new Error("Signal Trench environment manifest ID is invalid")
}
if (!Array.isArray(manifest.layers) || manifest.layers.length !== requiredRoles.length) {
	throw new Error("Signal Trench must contain exactly six runtime layers")
}

const layersByRole = new Map()
for (const layer of manifest.layers) {
	if (layersByRole.has(layer.role)) {
		throw new Error(`Duplicate environment role ${layer.role}`)
	}
	layersByRole.set(layer.role, layer)
}

const environmentFiles = []
for (const role of requiredRoles) {
	const layer = layersByRole.get(role)
	if (!layer) throw new Error(`Signal Trench is missing ${role}`)
	if (!layer.src?.startsWith("/overdrive/art/environment/")) {
		throw new Error(`${role} has an invalid runtime path`)
	}
	const filePath = path.join(projectRoot, "public", layer.src)
	const info = await imageInfo(filePath)
	if (info.width !== layer.width || info.height !== layer.height) {
		throw new Error(`${role} manifest dimensions do not match its texture`)
	}
	if (info.width > maxTextureDimension || info.height > maxTextureDimension) {
		throw new Error(`${role} exceeds the maximum runtime texture dimension`)
	}
	if (!layer.hasAlpha) throw new Error(`${role} lost its alpha channel`)
	if (
		role !== "far"
		&& (!Number.isFinite(layer.alphaCoverage) || layer.alphaCoverage >= 0.995)
	) {
		throw new Error(`${role} retained an unintended opaque panel background`)
	}
	environmentFiles.push(info)
}

const validRoles = new Set(requiredRoles)
for (const [pointType, points] of Object.entries(manifest.points ?? {})) {
	if (!Array.isArray(points) || points.length === 0) {
		throw new Error(`${pointType} has no authored environment points`)
	}
	for (const point of points) {
		if (
			!validRoles.has(point.layer)
			|| !Number.isFinite(point.x)
			|| !Number.isFinite(point.y)
			|| point.x < 0
			|| point.x > 1
			|| point.y < 0
			|| point.y > 1
		) {
			throw new Error(`${pointType} contains an invalid authored point`)
		}
	}
}

const rigInfo = {}
for (const rigId of ["warden", "packet", "needle", "null"]) {
	rigInfo[rigId] = await imageInfo(
		path.join(rigRoot, `${rigId}-rig-v1.webp`),
	)
}
const environmentCompressedBytes = environmentFiles.reduce(
	(total, info) => total + info.bytes,
	0,
)
const environmentTextureBytes = environmentFiles.reduce(
	(total, info) => total + info.textureBytes,
	0,
)
const firstStageBytes = environmentCompressedBytes
	+ rigInfo.warden.bytes
	+ rigInfo.packet.bytes
if (firstStageBytes > firstStageCompressedBudget) {
	throw new Error(
		`First-stage combat art is ${(firstStageBytes / 1024 / 1024).toFixed(2)} MB`,
	)
}
for (const enemyId of ["packet", "needle", "null"]) {
	const residentBytes = environmentTextureBytes
		+ rigInfo.warden.textureBytes
		+ rigInfo[enemyId].textureBytes
	if (residentBytes > residentTextureBudget) {
		throw new Error(
			`${enemyId} stage resident textures are ${(residentBytes / 1024 / 1024).toFixed(2)} MB`,
		)
	}
}

console.log(
	`Validated six Signal Trench layers. First-stage combat art: ${(firstStageBytes / 1024 / 1024).toFixed(2)} MB.`,
)
