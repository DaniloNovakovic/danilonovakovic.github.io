# Scrub Rumble

> Mini-game design manual and Ridge reward contract.

## Overview

**Scrub Rumble** (formerly _Potassium Slip_) is the first secret mini-game: a tall sponge ricochet arena and affectionate **Ball x Pit homage** set inside a street dumpster. A little litter pile on the street is the way in; inside, the player launches one main sponge, recalls it yo-yo style, bounces it through falling junk, drafts stackable upgrades, defeats **Sir Rummage** (the raccoon who stole the street CRT's Circuit), and wins the **Circuit** back.

## Goal

Clear 10 procedural campaign waves, defeat the boss on wave 11, and collect the Circuit. After winning, the player can return to the city or continue the same run into endless mode.

## Controls

- **Launch:** Click/touch near the sponge, drag toward the target, and release.
- **Recall:** Hold anywhere while the sponge is flying to pull it back toward the launch pad.
- **Relaunch:** Keep holding as the sponge reaches the launch pad, aim, and release again.
- **Retry:** Press `R` or choose `Retry` after game over.
- **Return:** Press `E` or choose `Return to City` after a run ends, or use the header Back button at any time. `Esc` does nothing, so a stray press cannot end a run.
- **Endless:** Press `Space` or choose `Endless Mode` after winning.

## Core Loop

- Enemies and wall blockers spawn in 5-column rows and fall straight down. Trash Bags reserve two adjacent columns.
- The sponge bounces off arena walls and ricochets off enemies. Each fast wall hit leaves a little dishwasher splash: a wet streak on the wall and a few soap bubbles that pop (visual only, throttled, skipped while recalling). With **Mini Sponges** unlocked, the same wall hits also shake loose tiny sponges that fan back into the arena.
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

Scrub Rumble is the existing arcade anchor for Sketchbook Ridge. It owns the
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

Scrub Rumble is a goofy street-side caper. After Danilo finds the Glasses,
the overworld becomes readable enough to reveal a little litter pile on the
sidewalk (crumpled paper, a tipped soda can) with raccoon paw prints trotting
off toward a dumpster. Danilo bends down to tidy up, slips on a soapy puddle,
and tumbles into the dumpster, where **Sir Rummage**, a raccoon in a cardboard
crown, sits on a hoard of street junk.

The chain should read without explanation:

1. The street CRT is dark because its Circuit is missing.
2. Raccoons hoard shiny junk; Sir Rummage pried the Circuit out and dragged it
   home.
3. In the dumpster Danilo grabs a smiling kitchen sponge, the one clean thing
   in there, and starts bouncing it. Everything else in the dumpster is the
   raccoon's hoard and defends it.
4. Beating Sir Rummage wins the Circuit back, and the Circuit boots the CRT.

Everything in the run is cleaning-themed: the litter gets Danilo in, the
sponge is the thing he throws, and every upgrade is a cleaning supply (suds,
disinfectant, soap bubbles, spray bottle, shower head). The old name and banana
peel were retired because they no longer fit; code ids still say `potassium`
and `banana` (see Enemies).

The campaign reward stays the **Circuit**. Potassium remains optional side
progress unless the route canon explicitly makes it part of a later alternate
path.

The thematic thread under the joke is unchanged: the playful thing is what
gets the useful thing back. The sponge is a bouncy toy first and a cleaning
tool second: Danilo is not tidying the dumpster, he is ricocheting a smiling
sponge around until the hoard gives up its treasure.

On return to the street or the Ridge, Potassium should leave a visible memory
rather than only an inventory flag. Good first candidates are:

- Sir Rummage sulking beside his bin near the street CRT once the Circuit is
  owned
- a tiny circuit sticker on or near the Relay route
- a doodled "wet floor" sign next to the tidied-up litter spot
- a Ridge Guide or Cicka margin note quietly acknowledging the nonsense

Tone target: cute and goofy, never gross. Pests are cartoon-friendly (dust
bunnies, roly-polies, pigeons); avoid cockroaches, rats, flies, and grime that
reads as disgusting rather than funny.

## Enemies

Runtime enemy kind ids (`intern`, `scope`, `deadline`, `wall`, `hardWall`,
`splitter`, `shield`, `boss`) are historical and stay unchanged; only the
player-facing names and art changed. Likewise the runtime still calls the
thrown sponge `banana` (`this.banana`, `bananaSpeed`, `BananaVisuals`), the
scene id is `potassium`, the overworld secret id is `banana-peel-clue` (kept
for save compatibility), and skill kinds are still `fire`, `poison`,
`explosion`, `duplicate`, `ghostHorizontal`, and `ghostVertical`. Textures are
`potassium_sponge`, `potassium_sponge_poison`, and `potassium_suds`.

- **Dust Bunny** (`intern`): tiny fluffball that goes poof. Easy to clear, but
  it makes the first rows feel alive.
- **Mystery Leftovers** (`scope`): multi-hit wobbly glob in a cracked
  container. It should read as soft, jiggly, and stubborn.
- **Roly-Poly** (`deadline`): faster falling hazard. It is curled into a ball
  and spins as it rolls down, so the speed has a visible reason.
- **Pizza Box** (`wall`): high-HP one-cell destructible blocker that forces
  ricochet angles. Damage shows cracks and tears, not bandages.
- **Cinder Block** (`hardWall`): indestructible one-cell blocker introduced
  later. It never costs lives; it just does not care about sponges.
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
- sponge upgrade effects staying joyful and bright enough to contrast the gray
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
off the sponge, and Danilo catches it.

## Skill Drafts

Each main skill has two ranks: unlock and `+`. Skills stack permanently for the current run. Every skill is a cleaning supply with its own look (code kind in brackets):

- **Suds Trail** (`fire`): moving sponges leave stinging foam puddles. `Suds Trail +` makes hits drop extra suds puddles.
- **Germ-B-Gone** (`poison`): hits douse junk in extra-strength disinfectant that ticks over time. `Germ-B-Gone +` makes disinfected junk spread it on death.
- **Bubble Pop** (`explosion`): hits swell a soap bubble that pops into droplets with falloff damage. `Bubble Pop +` makes bigger bubbles apply statuses.
- **Mini Sponges** (`duplicate`): fast wall bounces (not enemy hits) shake loose 2 tiny sponges that fan back into the arena. Throttled (450ms) and capped at 9 active. `Mini Sponges +` adds one more and lets them apply half-strength procs.
- **Spray Bottle** (`ghostHorizontal`): hits squirt a wobbly water jet across the row. `Spray Bottle +` makes jets apply statuses.
- **Shower Head** (`ghostVertical`): hits rain a shower down the column from a little shower head. `Shower Head +` makes showers apply statuses.

When all six skills are fully upgraded, drafts switch to repeatable generic upgrades:

- **Elbow Grease +** (damage)
- **Extra Strength +** (Germ-B-Gone strength)
- **Bigger Bubbles +** (Bubble Pop radius)
- **Mini Sponge Time +** (mini sponge lifetime)
- **Sponge Speed +**
- **Bonus Life**

## Presentation

Potassium uses a dedicated `vertical-board` presentation. Phaser still runs at the fixed global design resolution, but the React shell frames a tall portrait board and the playable arena uses the central vertical slice directly. The contextual hint lives below the board like the overworld status panel.

The HUD intentionally stays compact: wave, score, and lives only. Active upgrades are communicated through stacked sponge visuals instead of a long text list:

- Germ-B-Gone turns the sponge green and sudsy.
- Suds Trail adds a ring of foam bubbles.
- Bubble Pop adds a little soap-bubble cluster.
- Mini Sponges adds yellow echo marks.
- Spray Bottle and Shower Head add water droplets along their axis.
- Recall uses opacity only, so it reads as a control state without conflicting with upgrade colors.

## Current Experimental Feel

The yo-yo recall uses a direct pull-back model: holding recall pulls the sponge toward the launch pad and slightly reduces its bounce so it does not chatter against the bottom wall. Releasing recall returns the sponge to normal bounce physics.
