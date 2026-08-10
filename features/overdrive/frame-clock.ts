export function elapsedFrameMs(now: number, previous: number) {
	if (!Number.isFinite(now) || !Number.isFinite(previous)) return 0
	return Math.max(0, now - previous)
}
