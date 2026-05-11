# Potassium Slip: Mini-Game Manual

## Overview

**Potassium Slip** is the first secret mini-game: a tall banana ricochet arena and affectionate **Ball x Pit homage** filtered through office nonsense. The player launches one main banana, recalls it yo-yo style, bounces it through falling enemies, drafts stackable upgrades, defeats the **Potassium Compliance Officer**, and earns the **Circuit** item.

## Goal

Clear 10 procedural campaign waves, defeat the boss on wave 11, and collect the Circuit. After winning, the player can return to the city or continue the same run into endless mode.

## Controls

- **Launch:** Click/touch near the banana, drag toward the target, and release.
- **Recall:** Hold anywhere while the banana is flying to pull it back toward the launch pad.
- **Relaunch:** Keep holding as the banana reaches the launch pad, aim, and release again.
- **Retry:** Press `R` or choose `Retry` after game over.
- **Return:** Press `E`, choose `Return to City`, or press `Esc`.
- **Endless:** Press `Space` or choose `Endless Mode` after winning.

## Core Loop

- Enemies and wall blockers spawn in 5-column rows and fall straight down. Splitter Memos reserve two adjacent columns.
- The banana bounces off arena walls and ricochets off enemies.
- Regular enemies cost lives if they reach the bottom. Wooden Walls and Hard Filing Walls do not hurt the player. The boss instantly ends the run if it reaches the bottom.
- The player starts with 5 lives.
- After each cleared non-boss wave, the player chooses one of two upgrade drafts.
- Normal enemies do not show floating HP labels. Characters show cracks/scuffs/bandages as they weaken; wooden walls use crack/splinter-only damage marks.

## Waves And Modes

- **Campaign:** Waves 1-10 are deterministic procedural row waves that grow denser, tankier, and more mechanically varied over time.
- **Boss:** Wave 11 is the Potassium Compliance Officer. Defeating it grants the Circuit once.
- **Endless:** Wave 12+ continues the same run with existing score, lives, skills, and escalating procedural waves.
- **Records:** Finished runs are saved to a local top-5 leaderboard in browser storage.

## Ridge Anchor Contract

Potassium Slip is the existing arcade anchor for Sketchbook Ridge. It owns the
ricochet lane and should remain the benchmark for a deep opt-in mini-game, not
the template every future mini-game must match.

The Circuit is Potassium's durable world reward and the alternate key for the
first Relay Spire gate. Future Ridge gate code should check existing inventory
ownership with `isItemOwned('circuit')`, or the equivalent bridge inventory read,
instead of adding a separate Ridge progress flag such as `circuitOwned`.

Ridge signs, Trail Cards, NPCs, and stickers may acknowledge Potassium and the
Circuit, but Potassium run behavior should stay scene-owned: fresh-start entry,
campaign victory grants the Circuit once, and endless mode continues only inside
the Potassium scene.

## Narrative Contract

Potassium Slip is the Ridge's secret **joy audit**. After Danilo finds the
Glasses, the overworld becomes readable enough to reveal the hidden banana.
Peeling it opens a ridiculous compliance test where the sketchbook asks whether
fun is allowed to count as real progress.

The banana is the player's counter-argument: an unserious toy that turns
pressure into signal through ricochet, recall, and escalating upgrade nonsense.
The enemies are not literal monsters; they are anxious office artifacts produced
by the Potassium Compliance Officer to prove that play should be scoped,
approved, filed, and made sensible before it can help the Ridge.

The campaign reward should stay the **Circuit**. Fictionally, the Compliance
Officer has withheld it because the Relay Spire signal is "not properly
approved." Beating the boss recovers the Circuit and lets Potassium act as the
alternate key to the first Relay Spire gate.

On return to the Ridge, Potassium should leave a visible memory rather than only
an inventory flag. Good first candidates are:

- a tiny circuit sticker on or near the Relay route
- a doodled banana warning sign that has been crossed out or re-captioned
- one Relay Spire light flickering on after the Circuit is owned
- a Ridge Guide or Cicka margin note quietly acknowledging the nonsense

Tone target: silly substory seriousness. The joke should stay warm and
practical: Danilo did not defeat paperwork by becoming less playful; he defeated
it by making the playful thing useful.

## Enemies

- **Intern Bug:** Small anxious request. It is easy to clear, but it makes the
  first rows feel alive.
- **Scope Blob:** Round multi-hit scope creep. It should read as soft,
  expanding, and stubborn.
- **Deadline Drone:** Faster falling hazard.
- **Wooden Wall:** High-HP one-cell destructible blocker that forces ricochet
  angles. It shows wood planks and crack/splinter damage, not bandages.
- **Hard Filing Wall:** Indestructible one-cell blocker introduced later. It
  never costs lives, but it refuses to become paperwork.
- **Splitter Memo:** Two-column follow-up memo that splits into two smaller bugs
  on death, one from each occupied lane.
- **Shielded Form:** Protected requirement with a visible shield plate. Hits
  from the shielded side ricochet without damage.
- **Potassium Compliance Officer:** Campaign boss with patrol phases, orbiting
  indestructible blockers, stone armor windows, and summons. It owns the audit
  fiction and the withheld Circuit.

## Asset Direction

Future Potassium enemy art should preserve the current hitbox families and make
the audit fiction legible at silhouette distance. Enemies should read as
paperwork, office pressure, and over-processed requirements before they read as
generic monsters.

Useful sprite motifs:

- stamped forms, bent memo corners, binder clips, file tabs, checkboxes, and
  taped-on shield plates
- damage states shown through scuffs, cracks, ink leaks, splinters, and loosened
  stationery rather than gore or heavy facial distress
- the boss carrying or locking away a small Circuit mark so the reward feels
  related to the final encounter
- banana upgrade effects staying joyful and bright enough to contrast the
  paperwork enemies without breaking the sketchbook style

## Boss Fight

The boss is intentionally more of a fight than a falling target:

- **Phase 1:** patrols across the upper-middle board and drifts down slowly.
- **Phase 2:** adds rotating indestructible blockers around itself.
- **Phase 3:** enters short stone/armored windows and summons extra falling enemies.

The boss is tankier than normal enemies so stacked upgrades have room to shine without instantly ending the encounter.

## Skill Drafts

Each main skill has two ranks: unlock and `+`. Skills stack permanently for the current run.

- **Fire Trail:** Moving bananas leave fire. `Fire Trail +` makes hits drop fire patches.
- **Poison Damage:** Hits poison enemies over time. `Poison Damage +` makes poisoned enemies spread poison on death.
- **Explosion Damage:** Hits explode with falloff damage. `Explosion Damage +` makes bigger blasts apply statuses.
- **Duplicate:** Main hits spawn small bananas. `Duplicate +` adds one clone and lets clones apply half-strength procs.
- **Horizontal Ghost:** Hits fire a blue row beam. `Horizontal Ghost +` makes row beams apply statuses.
- **Vertical Ghost:** Hits fire a blue column beam. `Vertical Ghost +` makes column beams apply statuses.

When all six skills are fully upgraded, drafts switch to repeatable generic upgrades:

- **Damage +**
- **Poison +**
- **Explosion +**
- **Clone Time +**
- **Banana Speed +**
- **Bonus Life**

## Presentation

Potassium uses a dedicated `vertical-board` presentation. Phaser still runs at the fixed global design resolution, but the React shell frames a tall portrait board and the playable arena uses the central vertical slice directly. The contextual hint lives below the board like the overworld status panel.

The HUD intentionally stays compact: wave, score, and lives only. Active upgrades are communicated through stacked banana visuals instead of a long text list:

- Poison turns the banana green.
- Fire adds a warm aura.
- Explosion adds a red/orange spark.
- Duplicate adds yellow echo marks.
- Horizontal and vertical ghost upgrades add cyan shimmer lines.
- Recall uses opacity only, so it reads as a control state without conflicting with upgrade colors.

## Current Experimental Feel

The yo-yo recall uses a direct pull-back model: holding recall pulls the banana toward the launch pad and slightly reduces its bounce so it does not chatter against the bottom wall. Releasing recall returns the banana to normal bounce physics.
