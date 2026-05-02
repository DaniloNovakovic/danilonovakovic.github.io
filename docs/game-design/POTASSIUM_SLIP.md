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

- Enemies and wall blockers spawn in 5-column rows and fall straight down.
- The banana bounces off arena walls and ricochets off enemies.
- Regular enemies cost lives if they reach the bottom. Filing Walls do not hurt the player. The boss instantly ends the run if it reaches the bottom.
- The player starts with 5 lives.
- After each cleared non-boss wave, the player chooses one of two upgrade drafts.

## Waves And Modes

- **Campaign:** Waves 1-10 are deterministic procedural row waves that grow denser and tankier over time.
- **Boss:** Wave 11 is the Potassium Compliance Officer. Defeating it grants the Circuit once.
- **Endless:** Wave 12+ continues the same run with existing score, lives, skills, and escalating procedural waves.
- **Records:** Finished runs are saved to a local top-5 leaderboard in browser storage.

## Enemies

- **Intern Bug:** Basic small target.
- **Scope Blob:** Round multi-hit target.
- **Meeting Brick:** Chunkier blocker-like enemy.
- **Deadline Drone:** Faster falling hazard.
- **Filing Wall:** High-HP non-damaging blocker that forces ricochet angles.
- **Potassium Compliance Officer:** Campaign boss with diagonal drift and high HP.

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
