import type { DungeonLanguage, EnemyKind } from "../../contracts/src/survival"
import { combatLessons, combatLessonWords } from "../../content/src/dungeon"
import { SurvivalRun, xpThreshold } from "./survival"

/** Isolated lessons use the real combat rules and never write a checkpoint or record. */
export class CombatLesson {
 step=0
 run:SurvivalRun
 private demonstrated=false
 private ids={goal:0,decoy:0}
 constructor(private language:DungeonLanguage){this.run=this.prepare()}
 get lesson(){return combatLessons[this.step]!}
 get complete(){
  const s=this.run.state
  switch(this.lesson.id){
   case "strike":case "armor":case "treasure":case "barrel":return s.enemies.length===0
   case "cancel":return !s.enemies.some(e=>e.id===this.ids.goal)&&s.enemies.some(e=>e.id===this.ids.decoy)
   case "heal":return this.demonstrated&&s.player.hp===s.player.maxHp
   case "storm":return s.skills.storm.cooldown>0
   case "upgrade":return this.demonstrated&&s.pendingDrafts===0
  }
 }
 next(){if(!this.complete||this.step===combatLessons.length-1)return false;this.step++;this.demonstrated=false;this.run=this.prepare();return true}
 input(key:string){if(this.complete&&key!=="Escape")return;this.run.input(key)}
 advance(dt:number){
  const s=this.run.state
  if(s.phase==="paused")return
  s.player.invincible=s.spawnAt=3600;s.nextBoss=s.time+3600
  this.run.advance(dt)
  // Finishing the decoy instead of cancelling restarts the cancel lesson.
  if(this.lesson.id==="cancel"&&!s.enemies.some(e=>e.id===this.ids.decoy)){this.run=this.prepare();return}
  if(!this.demonstrated&&s.time>=.6){
   this.demonstrated=true
   if(this.lesson.id==="heal"){s.player.invincible=0;this.run.damage(2);s.player.invincible=3600}
   if(this.lesson.id==="upgrade"){this.run.gainXp(xpThreshold(s.level));this.run.advance(.001)}
  }
 }
 private prepare(){
  const r=new SurvivalRun(`combat-lesson:${this.step}`,this.language),s=r.state,w=combatLessonWords[this.language]
  r.start();s.enemies=[];s.queue=[];s.recentWords=[];s.spawnAt=s.player.invincible=3600;s.nextBoss=3600
  const spawn=(kind:EnemyKind,words:readonly string[],x:number,z:number)=>{const e=r.spawn(kind,{x,z})!;e.words=[...words];e.speed=0;return e}
  switch(this.lesson.id){
   case "strike":spawn("skeleton",[w.strike],2,0);break
   case "cancel":{const decoy=spawn("goblin",[w.cancel.decoy],2,1),goal=spawn("skeleton",[w.cancel.goal],-2,-1);this.ids={goal:goal.id,decoy:decoy.id};s.target=decoy.id;s.prefix=w.cancel.decoy[0]!;break}
   case "armor":spawn("guard",w.armor,2,0);break
   case "treasure":spawn("chest",[w.treasure],2,0);break
   case "barrel":spawn("barrel",[w.barrel],2,0);spawn("skeleton",[w.strike],3,1);spawn("goblin",[w.strike],3,-1);break
   case "storm":for(const [x,z]of [[2,0],[-2,0],[0,-3]] as const)spawn("guard",w.armor,x,z);break
  }
  r.refreshQueue();return r
 }
}
