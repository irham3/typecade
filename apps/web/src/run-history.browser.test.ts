import { afterEach,expect,it } from "vitest"
import { SurvivalRun } from "@typecade/game-rules"
import { readRunHistory,rememberRun,rememberResult } from "./run-history"
afterEach(()=>localStorage.clear())
it("keeps bounded independent local run records, updates resumes and distinguishes defeats",()=>{
 const r=new SurvivalRun("history");rememberRun(r.state);expect(readRunHistory()).toEqual([])
 r.state.time=12.5;rememberRun(r.state);r.state.time=20;rememberRun(r.state,true)
 expect(readRunHistory()).toHaveLength(1);expect(readRunHistory()[0]).toMatchObject({seconds:20,status:"retired",language:"id"})
 r.state.phase="dead";rememberRun(r.state);expect(readRunHistory()[0]!.status).toBe("fallen")
 for(let i=0;i<60;i++){r.state.seed="run-"+i;rememberRun(r.state)}
 expect(readRunHistory()).toHaveLength(50);expect(readRunHistory()[0]!.id).toBe("run-59")
 localStorage.setItem("typecade:dungeon:history:v1","not json");expect(readRunHistory()).toEqual([])
 localStorage.setItem("typecade:dungeon:history:v1","{}");expect(readRunHistory()).toEqual([])
 localStorage.setItem("typecade:dungeon:history:v1",JSON.stringify([null,"invalid",{id:7},{id:"x",language:"id",status:"bad"},{id:"x",language:"id",status:"saved",at:0,seconds:0,level:1,kills:0,gold:0,depth:1,wpm:0,accuracy:101}]))
 expect(readRunHistory()).toEqual([])
 const valid={id:"r",mode:"dojo" as const,at:0,seconds:1,language:"en" as const,level:1,kills:0,gold:0,depth:0,wpm:60,accuracy:100,status:"complete" as const}
 rememberResult(valid);expect(readRunHistory()).toEqual([valid])
 const legacy={...valid} as Partial<typeof valid>;delete legacy.mode;localStorage.setItem("typecade:dungeon:history:v1",JSON.stringify([legacy]));expect(readRunHistory()[0]?.mode).toBe("endless")
 for(const patch of [{id:"x".repeat(201)},{language:"bad"},{status:"bad"},{mode:"bad"},{seconds:"bad"},{seconds:-1},{accuracy:101}]){localStorage.setItem("typecade:dungeon:history:v1",JSON.stringify([{...valid,...patch}]));expect(readRunHistory()).toEqual([])}
})
