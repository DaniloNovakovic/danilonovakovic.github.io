# Potassium Slip

> Mini-game design manual and Ridge reward contract.

## Overview

**Potassium Slip** is the first secret mini-game: a tall banana ricochet arena and affectionate **Ball x Pit homage** set inside a street dumpster. The player launches one main banana, recalls it yo-yo style, bounces it through falling junk, drafts stackable upgrades, defeats **Sir Rummage** (the raccoon who stole the street CRT's Circuit), and wins the **Circuit** back.

## Goal

Clear 10 procedural campaign waves, defeat the boss on wave 11, and collect the Circuit. After winning, the player can return to the city or continue the same run into endless mode.

## Controls

- **Launch:** Click/touch near the banana, drag toward the target, and release.
- **Recall:** Hold anywhere while the banana is flying to pull it back toward the launch pad.
- **Relaunch:** Keep holding as the banana reaches the launch pad, aim, and release again.
- **Retry:** Press `R` or choose `Retry` after game over.
- **Return:** Press `E` or choose `Return to City` after a run ends, or use the header Back button at any time. `Esc` does nothing, so a stray press cannot end a run.
- **Endless:** Press `Space` or choose `Endless Mode` after winning.

## Core Loop

- Enemies and wall blockers spawn in 5-column rows and fall straight down. Trash Bags reserve two adjacent columns.
- The banana bounces off arena walls and ricochets off enemies.
- Regular enemies cost lives if they reach the bottom. Pizza Boxes and Cinder Blocks do not hurt the player. The boss instantly ends the run if it reaches the bottom.
- The player starts with 5 lives.
- After each cleared non-boss wave, the player chooses one of two upgrade drafts.
- Normal enemies do not show floating HP labels. Characters show cracks/scuffs/bandages as they weaken; pizza boxes use crack/tear-only damage marks.

## Waves And Modes

- **Campaign:** Waves 1-10 are deterministic procedural row waves that grow denser, tankier, and more mechanically varied over time.
- **Boss:** Wave 11 is Sir Rummage. Defeating him grants the Circuit once.
- **Endless:** Wave 12+ continues the same run with existing score, lives, skills, and escalating procedural waves.
- **Records:** Finished runs are saved to a local top-5 leaderboard in browser storage.

## Ridge Anchor Contract

Potassium Slip is the existing arcade anchor for Sketchbook Ridge. It owns the
ricochet lane and should remain the benchmark for a deep opt-in mini-game, not
the template every future mini-game must match.

The Circuit is Potassium's durable world reward in the current/prototype
runtime. Inserting it into the overworld street CRT boots Ridge as an optional
secret side story (game-inside-the-game). Potassium remains optional side fun
and should not be required Living Proof for the first ending unless the active
route canon deliberately reopens that decision. Current runtime code that reads
the Circuit should use existing inventory ownership with
`isItemOwned('circuit')`, or the equivalent bridge inventory read, instead of
adding a separate Ridge progress flag such as `circuitOwned`.

Ridge signs, Trail Cards, NPCs, and stickers may acknowledge Potassium and the
Circuit, but Potassium run behavior should stay scene-owned: fresh-start entry,
campaign victory grants the Circuit once, and endless mode continues only inside
the Potassium scene.

## Narrative Contract

Potassium Slip is a goofy street-side caper. After Danilo finds the Glasses,
the overworld becomes readable enough to reveal a banana peel on the sidewalk.
Stepping on it is the "slip": Danilo tumbles into the dumpster behind it, where
**Sir Rummage**, a raccoon in a cardboard crown, sits on a hoard of street junk.

The chain should read without explanation:

1. The street CRT is dark because its Circuit is missing.
2. Raccoons hoard shiny junk; Sir Rummage pried the Circuit out and dragged it
   home.
3. The banana peel is the one piece of trash that fights back. Everything else
   in the dumpster is the raccoon's hoard and defends it.
4. Beating Sir Rummage wins the Circuit back, and the Circuit boots the CRT.

The campaign reward stays the **Circuit**. Potassium remains optional side
progress unless the route canon explicitly makes it part of a later alternate
path.

The thematic thread under the joke is unchanged: the playful thing is what
gets the useful thing back. Danilo does not clean the dumpster or tidy anything
up; he bounces a banana around until the hoard gives up its treasure.

On return to the street or the Ridge, Potassium should leave a visible memory
rather than only an inventory flag. Good first candidates are:

- Sir Rummage sulking beside his bin near the street CRT once the Circuit is
  owned
- a tiny circuit sticker on or near the Relay route
- a doodled "slippery" warning sign next to the peel, crossed out or
  re-captioned
- a Ridge Guide or Cicka margin note quietly acknowledging the nonsense

Tone target: cute and goofy, never gross. Pests are cartoon-friendly (dust
bunnies, roly-polies, pigeons); avoid cockroaches, rats, flies, and grime that
reads as disgusting rather than funny.

## Enemies

Runtime enemy kind ids (`intern`, `scope`, `deadline`, `wall`, `hardWall`,
`splitter`, `shield`, `boss`) are historical and stay unchanged; only the
player-facing names and art changed.

- **Dust Bunny** (`intern`): tiny fluffball that goes poof. Easy to clear, but
  it makes the first rows feel alive.
- **Mystery Leftovers** (`scope`): multi-hit wobbly glob in a cracked
  container. It should read as soft, jiggly, and stubborn.
- **Roly-Poly** (`deadline`): faster falling hazard. It is curled into a ball
  and spins as it rolls down, so the speed has a visible reason.
- **Pizza Box** (`wall`): high-HP one-cell destructible blocker that forces
  ricochet angles. Damage shows cracks and tears, not bandages.
- **Cinder Block** (`hardWall`): indestructible one-cell blocker introduced
  later. It never costs lives; it just does not care about bananas.
- **Trash Bag** (`splitter`): two-column tied bag that bursts into two Dust
  Bunnies on death, one from each occupied lane.
- **Lid Pigeon** (`shield`): a pigeon holding a trash-can lid. The lid is the
  visible shield plate; hits from the lid side clang off without damage.
- **Sir Rummage** (`boss`): the raccoon. Campaign boss with patrol phases,
  orbiting soda cans, hide-in-the-bin armor windows, and summons. He holds the
  stolen Circuit.

## Asset Direction

Enemy art is generated in `runtime/renderer.ts` with Phaser Graphics and must
keep the existing texture sizes so hitbox families stay unchanged. Enemies
should read as cute dumpster junk and friendly pests at silhouette distance.

Useful sprite motifs:

- cardboard, pizza grease spots, tied bag knots, soda cans, cinder-block holes,
  and a dented trash-can lid
- damage states shown through scuffs, cracks, tears, and loosened bits rather
  than gore, mess, or heavy facial distress
- Sir Rummage visibly holding the Circuit so the reward is obviously tied to
  the final encounter
- banana upgrade effects staying joyful and bright enough to contrast the gray
  and brown junk without breaking the sketchbook style

## Boss Fight

Sir Rummage is intentionally more of a fight than a falling target:

- **Phase 1:** patrols across the upper-middle board, showing off the Circuit,
  and drifts down slowly.
- **Phase 2:** three soda cans from his hoard orbit him as indestructible
  blockers.
- **Phase 3:** he periodically ducks into his bin (short gray-tinted armored
  windows) and whistles for backup: extra Mystery Leftovers and Roly-Polies
  fall in.

The boss is tankier than normal enemies so stacked upgrades have room to shine without instantly ending the encounter.

Future polish candidate: on defeat, Sir Rummage fumbles the Circuit, it bounces
off the banana, and Danilo catches it.

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
