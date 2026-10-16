import type { SupabaseClient } from "@supabase/supabase-js"
import { restoreDungeonRun } from "@typecade/game-rules"

export interface CloudCheckpoint { save_data: unknown; revision: number }
export interface DungeonRecord { display_name: string; best_seconds: number; best_level: number; best_kills: number }
export interface DungeonAchievement { achievement_id: string; unlocked_at: string }
export const achievementNames: Record<string,string> = { first_strike:"First Strike", level_five:"Tempered Blade", clean_fifty:"Unbroken Rhythm", boss_slayer:"Obsidian Breaker" }

export async function loadDungeonAccount(client:SupabaseClient,userId:string) {
 const [save,achievements,board]=await Promise.all([
  client.from("dungeon_saves").select("save_data,revision").eq("user_id",userId).maybeSingle(),
  client.from("dungeon_achievements").select("achievement_id,unlocked_at").eq("user_id",userId),
  client.rpc("dungeon_leaderboard"),
 ])
 for(const result of [save,achievements,board])if(result.error)throw result.error
 const checkpoint=save.data as CloudCheckpoint|null
 if(checkpoint&&(!Number.isSafeInteger(checkpoint.revision)||checkpoint.revision<1||!restoreDungeonRun(JSON.stringify(checkpoint.save_data))))throw new Error("Cloud checkpoint is incompatible. Your local run is unchanged.")
 return {checkpoint,achievements:(achievements.data??[]) as DungeonAchievement[],board:(board.data??[]) as DungeonRecord[]}
}

export async function uploadDungeonCheckpoint(client:SupabaseClient,raw:string,revision:number,name:string) {
 const run=restoreDungeonRun(raw)
 if(!run||!Number.isSafeInteger(revision)||revision<0)throw new Error("Checkpoint is invalid. Nothing was uploaded.")
 const displayName=name.replace(/[<>\p{C}]/gu,"").trim().slice(0,24)||"Knight"
 const {data,error}=await client.rpc("save_dungeon_checkpoint",{checkpoint:JSON.parse(run.serialize()),expected_revision:revision,knight_name:displayName})
 if(error)throw error
 if(!Number.isSafeInteger(data)||data<=revision)throw new Error("Cloud save returned an invalid revision. Reload the cloud record before retrying.")
 return data as number
}
