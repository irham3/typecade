import type { DungeonState, DungeonLanguage } from "@typecade/contracts"
import { runAccuracy, runWpm } from "@typecade/game-rules"
import { readStorage, writeStorage } from "./storage"

export interface RunRecord { id:string; mode:"endless"|"dojo"|"sprint"|"clash"|"raid"; at:number; language:DungeonLanguage; seconds:number; level:number; kills:number; gold:number; depth:number; wpm:number; accuracy:number; status:"fallen"|"saved"|"retired"|"complete" }
const key="typecade:dungeon:history:v1"
export function readRunHistory():RunRecord[] {
 try {
  const rows:unknown=JSON.parse(readStorage("localStorage",key)??"[]")
  if(!Array.isArray(rows))return []
  for(const r of rows)if(r&&typeof r==="object"&&r.mode===undefined)r.mode="endless"
  return rows.filter((r):r is RunRecord=>!!r&&typeof r.id==="string"&&r.id.length<=200&&["en","id"].includes(r.language)&&["fallen","saved","retired","complete"].includes(r.status)&&["endless","dojo","sprint","clash","raid"].includes(r.mode)&&[r.at,r.seconds,r.level,r.kills,r.gold,r.depth,r.wpm,r.accuracy].every(n=>typeof n==="number"&&Number.isFinite(n)&&n>=0)&&r.accuracy<=100).slice(0,50)
 } catch { return [] }
}
export function rememberRun(s:DungeonState,retired=false) {
 if(s.time<=0)return
 const record:RunRecord={id:s.seed,mode:"endless",at:Date.now(),language:s.language,seconds:Math.floor(s.time),level:s.level,kills:s.kills,gold:s.gold,depth:s.biome+1,wpm:runWpm(s),accuracy:runAccuracy(s),status:s.phase==="dead"?"fallen":retired?"retired":"saved"}
 rememberResult(record)
}

export function rememberResult(record:RunRecord) {
 writeStorage("localStorage",key,JSON.stringify([record,...readRunHistory().filter(r=>r.id!==record.id)].slice(0,50)))
}
