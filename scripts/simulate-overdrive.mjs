const ZONE_1_STAGES = [
	{
		zone: 1,
		id: "warmup",
		seconds: 75,
		quota: 5,
		autoExecute: true,
		words: ["f", "j", "d", "k", "s", "l", "a", "e", "i", "o"],
	},
	{
		zone: 1,
		id: "rush",
		seconds: 70,
		quota: 8,
		autoExecute: true,
		words: ["as", "in", "it", "to", "of", "on", "up", "go", "we", "no"],
	},
	{
		zone: 1,
		id: "glitch",
		seconds: 65,
		quota: 12,
		autoExecute: true,
		words: ["the", "and", "you", "for", "run", "key", "hit", "win", "tap", "aim"],
	},
]

const ZONE_2_STAGES = [
	{
		zone: 2,
		id: "warmup",
		seconds: 75,
		quota: 8,
		autoExecute: false,
		words: ["key", "run", "tap", "aim", "code", "dash", "flow", "type"],
	},
	{
		zone: 2,
		id: "rush",
		seconds: 70,
		quota: 12,
		autoExecute: false,
		words: ["hit", "win", "move", "shift", "focus", "clear", "guard", "press"],
	},
	{
		zone: 2,
		id: "glitch",
		seconds: 65,
		quota: 18,
		autoExecute: false,
		words: ["block", "spark", "drive", "quick", "combo", "react", "pulse", "stage"],
	},
]

const PROTECTED_STAGES = [...ZONE_1_STAGES, ...ZONE_2_STAGES]

const PROFILES = [
	{ label: "First keys", wpm: 1, accuracy: 0.7 },
	{ label: "Hunt-peck", wpm: 5, accuracy: 0.78 },
	{ label: "New typist", wpm: 10, accuracy: 0.84 },
	{ label: "Beginner 12", wpm: 12, accuracy: 0.85 },
	{ label: "Beginner 13", wpm: 13, accuracy: 0.86 },
	{ label: "Developing", wpm: 20, accuracy: 0.88 },
	{ label: "Steady", wpm: 40, accuracy: 0.92 },
	{ label: "Skilled", wpm: 60, accuracy: 0.96 },
	{ label: "Expert", wpm: 90, accuracy: 0.98 },
]

const RUNS = 2_000
const FOCUS_PAUSE_SECONDS = 4
const AEGIS_SECONDS = 30
const OVERDRIVE_MAX = 100
const OVERDRIVE_GAIN = 3
const OVERDRIVE_TYPO_DRAIN = 15

function mulberry32(seed) {
	return function next() {
		let value = seed += 0x6d2b79f5
		value = Math.imul(value ^ value >>> 15, value | 1)
		value ^= value + Math.imul(value ^ value >>> 7, value | 61)
		return ((value ^ value >>> 14) >>> 0) / 4_294_967_296
	}
}

function percentile(sorted, ratio) {
	return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))]
}

function formatDuration(seconds) {
	if (seconds < 60) return `${Math.round(seconds)}s`
	const minutes = Math.floor(seconds / 60)
	const remainder = Math.round(seconds % 60)
	return `${minutes}m${String(remainder).padStart(2, "0")}s`
}

function simulateProtectedRoute(profile, seed) {
	const random = mulberry32(seed)
	const secondsPerInput = 60 / (profile.wpm * 5)
	let charge = 0
	let wallSeconds = 0
	let totalRescues = 0
	const stageResults = []

	for (const stage of PROTECTED_STAGES) {
		let timeLeft = stage.seconds
		let score = 0
		let combo = 0
		let mult = 1
		let rescues = 0
		const stageStartedAt = wallSeconds

		const advanceInputInterval = () => {
			wallSeconds += secondsPerInput
			timeLeft -= Math.min(secondsPerInput, FOCUS_PAUSE_SECONDS)
			if (timeLeft <= 0) {
				rescues += 1
				totalRescues += 1
				timeLeft += AEGIS_SECONDS
			}
		}

		while (score < stage.quota) {
			const word = stage.words[Math.floor(random() * stage.words.length)]
			let clean = true

			for (let index = 0; index < word.length; index += 1) {
				let accepted = false
				while (!accepted) {
					advanceInputInterval()
					if (random() <= profile.accuracy) {
						accepted = true
						charge = Math.min(OVERDRIVE_MAX, charge + OVERDRIVE_GAIN)
					} else {
						if (stage.zone > 1) clean = false
						charge = Math.max(0, charge - OVERDRIVE_TYPO_DRAIN)
					}
				}
			}

			if (!stage.autoExecute) advanceInputInterval()

			if (clean) {
				combo += 1
				if (combo % 10 === 0) mult += 1
				const releasesOverdrive = charge >= OVERDRIVE_MAX
				score += word.length * mult * (releasesOverdrive ? 2 : 1)
				if (releasesOverdrive) charge = 0
			} else {
				combo = 0
				mult = 1
				score += word.length
			}
		}

		stageResults.push({
			key: `z${stage.zone}-${stage.id}`,
			wallSeconds: wallSeconds - stageStartedAt,
			rescues,
		})
	}

	return { wallSeconds, totalRescues, stageResults }
}

console.log("PROTECTED BEGINNER ROUTE · 6 stages · 1 key → short words + Space")
console.log("Focus Pause after 4s · unlimited visible Aegis +30s rescues · no speed scaling")

for (const profile of PROFILES) {
	const routeTimes = []
	const rescueCounts = []
	const stageTimes = Object.fromEntries(
		PROTECTED_STAGES.map((stage) => [`z${stage.zone}-${stage.id}`, []]),
	)

	for (let run = 0; run < RUNS; run += 1) {
		const result = simulateProtectedRoute(profile, run * 97 + profile.wpm * 13)
		routeTimes.push(result.wallSeconds)
		rescueCounts.push(result.totalRescues)
		for (const stage of result.stageResults) {
			stageTimes[stage.key].push(stage.wallSeconds)
		}
	}

	routeTimes.sort((left, right) => left - right)
	rescueCounts.sort((left, right) => left - right)
	for (const values of Object.values(stageTimes)) {
		values.sort((left, right) => left - right)
	}

	const zoneOneSeconds = ZONE_1_STAGES.reduce(
		(total, stage) => total + percentile(stageTimes[`z1-${stage.id}`], 0.5),
		0,
	)
	const zoneTwoSeconds = ZONE_2_STAGES.reduce(
		(total, stage) => total + percentile(stageTimes[`z2-${stage.id}`], 0.5),
		0,
	)

	console.log(
		`${profile.label.padEnd(12)} ${String(profile.wpm).padStart(2)} WPM`
		+ ` · route p50 ${formatDuration(percentile(routeTimes, 0.5))}`
		+ ` · Z1 ${formatDuration(zoneOneSeconds)}`
		+ ` · Z2 ${formatDuration(zoneTwoSeconds)}`
		+ ` · rescues p50/p90 ${percentile(rescueCounts, 0.5)}/${percentile(rescueCounts, 0.9)}`,
	)
}
