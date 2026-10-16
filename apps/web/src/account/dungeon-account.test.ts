import { expect, it, vi } from "vitest"
import { SurvivalRun } from "@typecade/game-rules"
import { loadDungeonAccount, uploadDungeonCheckpoint } from "./dungeon-account"
import type { SupabaseClient } from "@supabase/supabase-js"

it("validates checkpoints and revisions, uses isolated tables and propagates conflicts",async()=>{
 const run=new SurvivalRun("cloud"),rpc=vi.fn(async()=>({data:2,error:null as unknown}))
 const client={rpc} as unknown as SupabaseClient
 expect(await uploadDungeonCheckpoint(client,run.serialize(),1,"<Knight>")).toBe(2)
 expect(rpc).toHaveBeenCalledWith("save_dungeon_checkpoint",expect.objectContaining({expected_revision:1,knight_name:"Knight"}))
 await expect(uploadDungeonCheckpoint(client,"{}",0,"A")).rejects.toThrow("invalid")
 await expect(uploadDungeonCheckpoint(client,run.serialize(),-1,"A")).rejects.toThrow("invalid")
 rpc.mockResolvedValueOnce({data:2,error:new Error("Save conflict")});await expect(uploadDungeonCheckpoint(client,run.serialize(),1,"A")).rejects.toThrow("Save conflict")
 rpc.mockResolvedValueOnce({data:0,error:null});await expect(uploadDungeonCheckpoint(client,run.serialize(),0,"")).rejects.toThrow("revision")
})
it("loads ownership-scoped saves, achievements and public reported records without touching older data",async()=>{
 const value={checkpoint:{save_data:JSON.parse(new SurvivalRun("load").serialize()),revision:1}},error=null as unknown
 const query={select:vi.fn(()=>query),eq:vi.fn(()=>query),maybeSingle:vi.fn(async()=>({data:value.checkpoint,error})),then:(resolve:(v:unknown)=>void)=>resolve({data:[],error:null})}
 const from=vi.fn<(table:string)=>typeof query>().mockReturnValue(query),rpc=vi.fn(async()=>({data:[],error:null as unknown})),client={from,rpc} as unknown as SupabaseClient
 expect((await loadDungeonAccount(client,"own-id")).checkpoint?.revision).toBe(1)
 expect(from.mock.calls.map(([table])=>table)).toEqual(["dungeon_saves","dungeon_achievements"])
 expect(query.eq).toHaveBeenCalledWith("user_id","own-id")
 value.checkpoint.revision=0;await expect(loadDungeonAccount(client,"own-id")).rejects.toThrow("incompatible")
 query.maybeSingle.mockResolvedValueOnce({data:null as never,error:null});expect((await loadDungeonAccount(client,"own-id")).checkpoint).toBeNull()
 query.maybeSingle.mockResolvedValueOnce({data:{save_data:{},revision:1},error:null});await expect(loadDungeonAccount(client,"own-id")).rejects.toThrow("incompatible")
 rpc.mockResolvedValueOnce({data:[],error:new Error("Schema unavailable")});await expect(loadDungeonAccount(client,"own-id")).rejects.toThrow("Schema unavailable")
 query.maybeSingle.mockResolvedValueOnce({data:null as never,error:null});rpc.mockResolvedValueOnce({data:null as never,error:null});const then=query.then;query.then=(resolve)=>resolve({data:null as never,error:null});expect((await loadDungeonAccount(client,"own-id")).board).toEqual([]);query.then=then
})
