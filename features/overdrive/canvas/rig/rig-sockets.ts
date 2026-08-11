import type { RigDefinition } from "./rig-definition"

export type RigSocket = {
	partId: string
	x: number
	y: number
	rotation: number
}

export type ResolvedRigSocket = {
	x: number
	y: number
	rotation: number
	partId: string
	fallback: boolean
}

export function resolveRigSocket(definition: RigDefinition, name: string): ResolvedRigSocket {
	const socket = definition.sockets?.[name]
	if (socket && definition.parts.some((part) => part.id === socket.partId)) {
		return { ...socket, fallback: false }
	}
	const fallbackPart = definition.parts.find((part) => (
		name === "weapon" && /cannon|hand|forearm/i.test(part.id)
	)) ?? definition.parts[0]
	return {
		x: fallbackPart?.defaultTransform.x ?? 0,
		y: fallbackPart?.defaultTransform.y ?? 0,
		rotation: fallbackPart?.defaultTransform.rotation ?? 0,
		partId: fallbackPart?.id ?? "fallback",
		fallback: true,
	}
}
