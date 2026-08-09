import re

file_path = "features/overdrive/canvas/choreography/combat-director.ts"
with open(file_path, "r") as f:
    content = f.read()

# Replace this.staged[0] -> this.slotForOrdinal(this.state.targetOrdinal)
# Wait, let's just replace specific parts

# Delete retireTarget entirely
content = re.sub(r'\tprivate retireTarget.*?^\t}\n\n', '', content, flags=re.MULTILINE | re.DOTALL)

# Delete promoteTargets entirely
content = re.sub(r'\tprivate promoteTargets.*?^\t}\n\n', '', content, flags=re.MULTILINE | re.DOTALL)

# Delete targetBaseScale entirely
content = re.sub(r'\tprivate targetBaseScale.*?^\t}\n\n', '', content, flags=re.MULTILINE | re.DOTALL)

# Delete updateTargetTransitions entirely
content = re.sub(r'\tprivate updateTargetTransitions.*?^\t}\n\n', '', content, flags=re.MULTILINE | re.DOTALL)

# Delete updateRetiring entirely
content = re.sub(r'\tprivate updateRetiring.*?^\t}\n\n', '', content, flags=re.MULTILINE | re.DOTALL)

# Delete layoutStaged entirely
content = re.sub(r'\tprivate layoutStaged.*?^\t}\n\n', '', content, flags=re.MULTILINE | re.DOTALL)

# Delete laneForRole entirely
content = re.sub(r'\tprivate laneForRole.*?^\t}\n\n', '', content, flags=re.MULTILINE | re.DOTALL)

# Replace this.staged[0] safely
content = content.replace("this.staged[0]", "this.formation.getActiveTargets().get(this.state.targetOrdinal)")
content = content.replace("this.retiring.at(-1)", "undefined")

# In updateHits:
update_hits_new = """	private updateHits(deltaMs: number) {
		for (const slot of this.formation.getActiveTargets().values()) {
			if (slot.isHit || slot.hitMs > 0) {
				slot.hitMs = Math.max(0, slot.hitMs - deltaMs)
				slot.rig.setTint(V.text)
			} else {
				slot.rig.setTint(0xffffff)
			}
		}
	}"""
content = re.sub(r'\tprivate updateHits.*?^\t}', update_hits_new, content, flags=re.MULTILINE | re.DOTALL)

# targetCorePosition
target_core_new = """	private targetCorePosition(slot: FormationTarget) {
		const visualCenterY = slot.rig.getVisualSize().height * 0.5
		return {
			x: slot.root.x,
			y: slot.root.y - visualCenterY * slot.layoutScale,
		}
	}"""
content = re.sub(r'\tprivate targetCorePosition\(slot: EnemySlot\).*?^\t}', target_core_new, content, flags=re.MULTILINE | re.DOTALL)

# slotForOrdinal
slot_for_ordinal_new = """	private slotForOrdinal(ordinal: number) {
		return this.formation.getActiveTargets().get(ordinal)
	}"""
content = re.sub(r'\tprivate slotForOrdinal\(ordinal: number\).*?^\t}', slot_for_ordinal_new, content, flags=re.MULTILINE | re.DOTALL)

# spawnScorePopup
content = content.replace("private spawnScorePopup(slot: EnemySlot, scoreGain: number)", "private spawnScorePopup(slot: FormationTarget, scoreGain: number)")

# startCharacterTravel
content = content.replace("startCharacterTravel(\n\t\tindex: number,\n\t\twordLength: number,\n\t\ttarget: EnemySlot,", "startCharacterTravel(\n\t\tindex: number,\n\t\twordLength: number,\n\t\ttarget: FormationTarget,")

# acceptCharacter
#   const target = this.slotForOrdinal(event.targetOrdinal) ?? this.staged[0]
content = content.replace("const target = this.slotForOrdinal(event.targetOrdinal) ?? this.formation.getActiveTargets().get(this.state.targetOrdinal)", "const target = this.slotForOrdinal(event.targetOrdinal)")

# completeWord
#   const target = this.slotForOrdinal(event.targetOrdinal) ?? this.staged[0]
#   this.retireTarget(target, event.scoreGain > 0) -> REMOVED
#   this.promoteTargets(event.targetOrdinal) -> REMOVED
content = content.replace("const target = this.slotForOrdinal(event.targetOrdinal) ?? this.formation.getActiveTargets().get(this.state.targetOrdinal)", "const target = this.slotForOrdinal(event.targetOrdinal)")
content = content.replace("\t\tthis.retireTarget(target, event.scoreGain > 0)\n", "")
content = content.replace("\t\tthis.promoteTargets(event.targetOrdinal)\n", "")

with open(file_path, "w") as f:
    f.write(content)

print("Done")
