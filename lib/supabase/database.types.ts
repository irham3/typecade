export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
	public: {
		Tables: {
			daily_seeds: {
				Row: {
					id: number
					run_date: string
					language: "EN" | "ID"
					ruleset_version: string
					rng_version: string
					word_pool_version: string
					seed: string
					created_at: string
				}
				Insert: Omit<Database["public"]["Tables"]["daily_seeds"]["Row"], "id" | "created_at">
				Update: Partial<Database["public"]["Tables"]["daily_seeds"]["Insert"]>
				Relationships: []
			}
			runs: {
				Row: {
					id: number
					public_id: string
					client_run_id: string
					user_id: string | null
					mode: "daily" | "free"
					status: "started" | "submitted" | "accepted" | "verified" | "rejected"
					run_date: string | null
					seed: string
					language: "EN" | "ID"
					ruleset_version: string
					rng_version: string
					word_pool_version: string
					client_version: string
					win: boolean | null
					final_zone: number | null
					final_stage: "warmup" | "rush" | "glitch" | null
					standard_score: number | null
					endless_score: number | null
					final_score: number | null
					duration_ms: number | null
					accuracy_bps: number | null
					average_wpm_x100: number | null
					total_typos: number | null
					max_combo: number | null
					highest_mult: number | null
					build: Json
					replay_sha256: string | null
					rejection_code: string | null
					started_at: string
					submitted_at: string | null
					verified_at: string | null
					created_at: string
					updated_at: string
				}
				Insert: Omit<Database["public"]["Tables"]["runs"]["Row"], "id" | "public_id" | "started_at" | "created_at" | "updated_at">
				Update: Partial<Database["public"]["Tables"]["runs"]["Insert"]>
				Relationships: []
			}
			leaderboard_entries: {
				Row: {
					id: number
					run_id: number
					run_public_id: string
					user_id: string
					display_name: string
					board: "daily" | "endless"
					board_date: string | null
					language: "EN" | "ID"
					ruleset_version: string
					score: number
					final_zone: number
					accuracy_bps: number
					average_wpm_x100: number
					build_fingerprint: Json
					verification_state: "accepted" | "verified"
					finished_at: string
					created_at: string
				}
				Insert: Omit<Database["public"]["Tables"]["leaderboard_entries"]["Row"], "id" | "created_at">
				Update: Partial<Database["public"]["Tables"]["leaderboard_entries"]["Insert"]>
				Relationships: []
			}
			replays: {
				Row: {
					id: number
					run_id: number
					user_id: string | null
					codec_version: number
					storage_key: string
					byte_length: number
					input_count: number
					sha256: string
					verification_state: "pending" | "verified" | "rejected"
					verification_code: string | null
					created_at: string
					verified_at: string | null
				}
				Insert: Omit<Database["public"]["Tables"]["replays"]["Row"], "id" | "created_at">
				Update: Partial<Database["public"]["Tables"]["replays"]["Insert"]>
				Relationships: []
			}
		}
		Views: Record<string, never>
		Functions: Record<string, never>
		enums: Record<string, never>
		CompositeTypes: Record<string, never>
	}
}
