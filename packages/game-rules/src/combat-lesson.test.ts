import { expect,it } from "vitest"
import { CombatLesson } from "./combat-lesson"
import { combatLessonWords,dungeonUpgrades,skillRules } from "../../content/src/dungeon"

for(const language of ["en","id"] as const)it(`teaches actual combat and upgrades safely in ${language}`,()=>{
 const lesson=new CombatLesson(language),type=(word:string)=>{for(const key of word)lesson.input(key)},words=combatLessonWords[language]
 const tick=()=>{for(let i=0;i<25;i++)lesson.advance(1/30)}
 expect(lesson.next()).toBe(false);expect(lesson.complete).toBe(false)
 lesson.input("?");expect(lesson.run.state.errors).toBe(1)
 lesson.input("Escape");const time=lesson.run.state.time;lesson.advance(.1);expect(lesson.run.state.time).toBe(time);lesson.input("Escape")
 type(words.strike);expect(lesson.complete).toBe(true);expect(lesson.run.state.kills).toBe(1);expect(lesson.run.state.player.x).toBe(2)
 lesson.input("a");expect(lesson.run.state.errors).toBe(1);tick();expect(lesson.next()).toBe(true)
 type(words.armor[0]!);expect(lesson.complete).toBe(false);expect(lesson.run.state.enemies[0]!.words).toHaveLength(1);type(words.armor[1]!);expect(lesson.complete).toBe(true);lesson.next()
 type(words.treasure);expect(lesson.run.state.gold).toBe(25);expect(lesson.run.state.totalXp).toBe(50);lesson.next()
 type(words.barrel);expect(lesson.run.state.kills).toBe(3);expect(lesson.complete).toBe(true);lesson.next()
 expect(lesson.complete).toBe(false);tick();expect(lesson.run.state.player.hp).toBe(4);expect(lesson.run.state.effects.some(fx=>fx.kind==="hit"&&fx.value===-2)).toBe(true)
 lesson.input("Tab");type(skillRules.heal[language]);expect(lesson.run.state.player.hp).toBe(6);expect(lesson.complete).toBe(true);lesson.next()
 expect(lesson.complete).toBe(false);lesson.input("Tab");type(skillRules.storm[language]);expect(lesson.complete).toBe(true);expect(lesson.run.state.enemies.every(e=>e.words.length===1)).toBe(true);lesson.next()
 expect(lesson.complete).toBe(false);tick();expect(lesson.run.state.phase).toBe("draft");expect(lesson.run.state.level).toBe(2)
 const offer=lesson.run.state.offers[0]!,before=lesson.run.upgradeLevel(offer);type(dungeonUpgrades[offer][language]);expect(lesson.run.upgradeLevel(offer)).toBe(before+1);expect(lesson.complete).toBe(true);expect(lesson.next()).toBe(false)
 lesson.input("Escape");expect(lesson.run.state.phase).toBe("paused")
})
