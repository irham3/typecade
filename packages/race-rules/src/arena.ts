import { createSeededRng } from "../../game-rules/src/rng"
import { dungeonWords, skillRules } from "../../content/src/dungeon"
import type { DungeonLanguage, SkillId } from "../../contracts/src/survival"
import type { RaceConfig, RacePlayer } from "./index"

export type DungeonRoomMode = "sprint" | "clash" | "raid"
export type DungeonRole = "dps" | "healer" | "tank"
export interface ArenaPlayer {
 hp: number; shield: number; guardUntil: number; mana: number; words: number; score: number; distance: number; role: DungeonRole; cooldowns: Record<SkillId,number>; skillSeq: number
}
export interface ArenaAction { id:number; player:string; target:string; kind:"strike"|"cleave"|"block"|"heal"|"revive"|"dodge"|"ignite"|"storm"|"boss-hit"; value:number; at:number }
export interface ArenaCombat {
 mode:DungeonRoomMode; players:Record<string,ArenaPlayer>; order:string[]; bossHp:number; bossMaxHp:number; revives:number; nextAttack:number; nextId:number; actions:ArenaAction[]; winner:string|null; ended:boolean
}
const skillIds:SkillId[]=["cleave","storm","heal"]
const roles:DungeonRole[]=["dps","dps","healer","tank"]
export function createArenaCombat(mode:DungeonRoomMode,players:readonly RacePlayer[],now:number):ArenaCombat {
 const order=players.map(p=>p.id),bossMaxHp=1000*Math.max(1,players.length/4)
 return {mode,order,players:Object.fromEntries(players.map((p,i)=>[p.id,{hp:100,shield:0,guardUntil:0,mana:100,words:0,score:0,distance:0,role:p.role??roles[i%4]!,cooldowns:{cleave:0,storm:0,heal:0},skillSeq:0}])),bossHp:bossMaxHp,bossMaxHp,revives:3,nextAttack:now+5000,nextId:1,actions:[],winner:null,ended:false}
}
function action(c:ArenaCombat,player:string,target:string,kind:ArenaAction["kind"],value:number,at:number){c.actions.push({id:c.nextId++,player,target,kind,value,at});if(c.actions.length>16)c.actions.shift()}
function hit(c:ArenaCombat,source:string,target:string,amount:number,now:number){
 const p=c.players[target]!
 const absorbed=Math.min(p.guardUntil>now?p.shield:0,amount);p.shield-=absorbed
 const damage=Math.min(p.hp,amount-absorbed);p.hp-=damage
 c.players[source]!.score+=damage;action(c,source,target,absorbed?"block":"strike",damage,now)
}
function healParty(c:ArenaCombat,source:string,amount:number,now:number){
 const down=c.order.find(id=>c.players[id]!.hp===0)
 if(down&&c.revives>0){c.revives--;c.players[down]!.hp=50;action(c,source,down,"revive",50,now)}
 for(const id of c.order){const p=c.players[id]!;if(p.hp>0){const healed=Math.min(amount,100-p.hp);p.hp+=healed;c.players[source]!.score+=healed;if(healed)action(c,source,id,"heal",healed,now)}}
}
export function applyArenaWord(c:ArenaCombat,id:string,word:string,now:number){
 const p=c.players[id]
 if(!p||p.hp<=0||c.ended)return
 p.words++;p.mana=Math.min(100,p.mana+5);for(const skill of skillIds)p.cooldowns[skill]=Math.max(0,p.cooldowns[skill]-1)
 const upper=word.toUpperCase().replace(/[.!?,]/g,"")
 if(c.mode==="sprint"){
  const dodge=["DODGE","LOMPAT"].includes(upper),ignite=["IGNITE","LEDAKKAN"].includes(upper)
  p.distance+=5+(dodge?5:ignite?8:0);p.score+=dodge?5:ignite?8:1;action(c,id,id,dodge?"dodge":ignite?"ignite":"strike",dodge?10:ignite?13:5,now)
 }else if(c.mode==="clash"){
  if(["BLOCK","SHIELD","TANGKIS","PERISAI"].includes(upper)){p.shield=Math.min(40,p.shield+20);p.guardUntil=now+5000;action(c,id,id,"block",20,now)}
  else{
   const start=c.order.indexOf(id),target=c.order.slice(start+1).concat(c.order.slice(0,start)).find(other=>c.players[other]!.hp>0)
   if(target)hit(c,id,target,["CRUSH","HANCURKAN"].includes(upper)?20:12,now)
  }
 }else{
  if(p.role==="healer")healParty(c,id,8,now)
  else{const damage=p.role==="tank"?6:12;c.bossHp=Math.max(0,c.bossHp-damage);p.score+=damage;action(c,id,"boss","strike",damage,now);if(p.role==="tank"){p.shield=Math.min(40,p.shield+8);p.guardUntil=now+6000}}
 }
 resolveArena(c)
}
export function castArenaSkill(c:ArenaCombat,id:string,skill:SkillId,seq:number,now:number):string{
 const p=c.players[id]
 if(!p||p.hp<=0||c.ended||!skillIds.includes(skill)||!Number.isSafeInteger(seq)||seq<=p.skillSeq)return "Invalid skill request"
 p.skillSeq=seq
 const rule=skillRules[skill]
 if(p.cooldowns[skill]>0)return `Complete ${p.cooldowns[skill]} more words`
 if(p.mana<rule.cost)return `Need ${rule.cost} mana`
 if(skill==="heal"&&c.mode!=="raid"&&p.hp===100)return "Health is full"
 p.mana-=rule.cost;p.cooldowns[skill]=rule.words
 if(skill==="heal"){
  if(c.mode==="raid")healParty(c,id,25,now)
  else{const restored=Math.min(25,100-p.hp);p.hp+=restored;action(c,id,id,"heal",restored,now)}
 }else if(c.mode==="raid"){
  const damage=skill==="storm"?55:35;c.bossHp=Math.max(0,c.bossHp-damage);p.score+=damage;action(c,id,"boss",skill,damage,now)
 }else if(c.mode==="clash"){
  for(const other of c.order)if(other!==id&&c.players[other]!.hp>0)hit(c,id,other,skill==="storm"?20:15,now)
  action(c,id,id,skill,skill==="storm"?20:15,now)
 }else{p.distance+=skill==="storm"?12:8;action(c,id,id,skill,8,now)}
 resolveArena(c);return ""
}
export function tickArena(c:ArenaCombat,now:number,connected:readonly string[]){
 if(c.ended)return
 for(const p of Object.values(c.players))if(p.guardUntil<=now)p.shield=0
 if(c.mode==="raid"&&now>=c.nextAttack){
  c.nextAttack=now+5000
  const target=c.order.find(id=>connected.includes(id)&&c.players[id]!.hp>0&&c.players[id]!.role==="tank")??c.order.find(id=>connected.includes(id)&&c.players[id]!.hp>0)
  if(target){const p=c.players[target]!,amount=14,absorbed=Math.min(p.shield,amount);p.shield-=absorbed;p.hp=Math.max(0,p.hp-(amount-absorbed));action(c,"boss",target,"boss-hit",amount-absorbed,now)}
 }
 resolveArena(c)
}
function resolveArena(c:ArenaCombat){
 const alive=c.order.filter(id=>c.players[id]!.hp>0)
 if(c.mode==="raid"&&(c.bossHp===0||!alive.length)){c.ended=true;c.winner=c.bossHp===0?"team":"boss"}
 if(c.mode==="clash"&&alive.length<=1){c.ended=true;c.winner=alive[0]??null}
}
export function generateDungeonRoomText(config:RaceConfig,seed:string):string{
 const random=createSeededRng(seed),language:DungeonLanguage=config.language
 const vocabulary=language==="en"?["strike","dash","leap","cut","sprint","DODGE","BLOCK","CRUSH","IGNITE","SHIELD","HEAL"]:["tebas","serbu","sabet","lari","babat","LOMPAT","TANGKIS","HANCURKAN","LEDAKKAN","PERISAI","SEMBUH"]
 const pool=[...new Set([...dungeonWords[language].skeleton,...dungeonWords[language].goblin,...vocabulary.slice(0,5)])],recent:string[]=[]
 const count=config.mode==="sprint"&&config.format==="words"?config.wordCount:1000
 return Array.from({length:count},(_,i)=>{
  const action=i%7===5?vocabulary[5]!:i%11===8?vocabulary[8]!:random.pick(vocabulary)
  const word=vocabulary.slice(5).includes(action)?action:random.pick(pool.filter(word=>!recent.includes(word)))
  recent.push(word);if(recent.length>8)recent.shift();return word
 }).join(" ")
}
export function arenaMinimum(mode:DungeonRoomMode){return mode==="raid"?4:2}
export function leaveArena(c:ArenaCombat,id:string){delete c.players[id];c.order=c.order.filter(player=>player!==id);resolveArena(c)}
export const courseDistance=(text:string)=>text.trim().split(/\s+/).length*5
export function finishArenaDeadline(c:ArenaCombat){
 if(c.ended)return
 c.ended=true
 if(c.mode==="raid"){c.winner=c.bossHp===0?"team":"boss";return}
 const ranked=c.order.filter(id=>c.players[id]!.hp>0).sort((a,b)=>c.players[b]!.score-c.players[a]!.score||c.players[b]!.hp-c.players[a]!.hp)
 const first=ranked[0],second=ranked[1]
 c.winner=first&&(!second||c.players[first]!.score!==c.players[second]!.score||c.players[first]!.hp!==c.players[second]!.hp)?first:null
}
