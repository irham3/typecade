import { NextResponse } from "next/server"
import {
	OVERDRIVE_RNG_VERSION,
	OVERDRIVE_RULESET_VERSION,
	OVERDRIVE_WORD_POOL_VERSION,
} from "@/lib/telemetry"
import { deriveDailySeed } from "@/lib/overdrive/server/daily-seed"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

const competitiveEnabled = process.env.NEXT_PUBLIC_OVERDRIVE_COMPETITIVE === "true"

function isLanguage(value: string | null): value is "EN" | "ID" {
	return value === "EN" || value === "ID"
}

export async function GET(request: Request) {
	if (!competitiveEnabled) return new NextResponse(null, { status: 404 })

	const language = new URL(request.url).searchParams.get("language")
	if (!isLanguage(language)) {
		return NextResponse.json({ error: "language must be EN or ID" }, { status: 400 })
	}

	const runDate = new Date().toISOString().slice(0, 10)
	const secret = process.env.OVERDRIVE_DAILY_SECRET
	if (!secret) {
		return NextResponse.json({ error: "Daily seed is not configured" }, { status: 503 })
	}

	try {
		const admin = getSupabaseAdminClient()
		const existing = await admin
			.from("daily_seeds")
			.select("id, run_date, language, ruleset_version, rng_version, word_pool_version, seed")
			.eq("run_date", runDate)
			.eq("language", language)
			.eq("ruleset_version", OVERDRIVE_RULESET_VERSION)
			.maybeSingle()

		if (existing.error) throw existing.error
		if (existing.data) return NextResponse.json(existing.data)

		const seed = await deriveDailySeed(secret, runDate, language, OVERDRIVE_RULESET_VERSION)
		const inserted = await admin
			.from("daily_seeds")
			.insert({
				run_date: runDate,
				language,
				ruleset_version: OVERDRIVE_RULESET_VERSION,
				rng_version: OVERDRIVE_RNG_VERSION,
				word_pool_version: OVERDRIVE_WORD_POOL_VERSION,
				seed,
			})
			.select("id, run_date, language, ruleset_version, rng_version, word_pool_version, seed")
			.single()

		if (inserted.error) {
			const raced = await admin
				.from("daily_seeds")
				.select("id, run_date, language, ruleset_version, rng_version, word_pool_version, seed")
				.eq("run_date", runDate)
				.eq("language", language)
				.eq("ruleset_version", OVERDRIVE_RULESET_VERSION)
				.single()
			if (raced.error || !raced.data) throw inserted.error
			return NextResponse.json(raced.data)
		}

		return NextResponse.json(inserted.data)
	} catch {
		return NextResponse.json({ error: "Daily seed unavailable" }, { status: 503 })
	}
}
