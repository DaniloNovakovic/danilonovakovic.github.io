# Interactive Mode Evolution: Multi-Session Execution Plan

This document serves as a long-term roadmap for implementing the "Artist's Journey" and the Secret Mini-Games. It is designed to be picked up by any AI agent across multiple sessions. 

**Branch:** `feat/multi-session-game-plan`

## Guidelines for AI Agents

1. **Mark Progress:** Check off completed tasks using `[x]`.
2. **One Phase per Session:** Avoid bleeding scope between sessions. Complete one sub-phase, verify it, and commit before moving on.
3. **AI-Friendly Aesthetics:** Stick to the 2-Frame Jitter and Runtime Pixelation principles outlined in `docs/game-design/MECHANICS.md`.

---

## Phase 1: The "Lens" Foundation

**Goal:** Establish the core visual toggling ("Style Phasing") and the first major discovery (The Glasses).

- [x] **1.1: Core Phaser Layers Setup**
  - Added sketch + pixel building layers in `OverworldScene.ts` via `StreetBuildings`.
  - Implemented glasses/inventory/equipment state in `src/shared/bridge/store.ts` (instead of `gameState.ts`) and wired scene/UI reads through the bridge.
  - Added pre-glasses distance haze and glasses-on/off player appearance switching.
- [x] **1.2: The Basement & The Glasses**
  - Added hidden hole trigger in Overworld and registered the `BasementScene`.
  - Implemented basement pickup flow for glasses and return path back to overworld.
  - Added scene resume + movement parity improvements (walk/sprint/jump) in interior scenes.
- [x] **1.3: Interaction Triggers** *(pivoted after playtest feedback)*
  - Original proximity color-reveal prototype was implemented and validated.
  - Direction changed to preserve monochrome world for now; colored-house reveal is disabled.
  - Glasses now primarily: (1) remove haze blindness, (2) reveal hidden secrets.
  - Added first glasses-only Overworld clue as a real inspectable secret with bridge-backed discovery state.

### Phase 1 Delivered Scope (Current State)

- Bridge-based inventory/equipment foundation (`collect/equip/unequip/toggle`) with tests.
- Bridge-based secret discovery foundation for runtime-only glasses clues.
- Small HUD inventory menu for toggling glasses on/off.
- Glasses sprite rendering across Overworld/Hobbies/Basement with re-entry sync fix.
- Basement unlock loop complete and stable for current testing placement.
- Monochrome art direction preserved while still giving glasses meaningful gameplay impact: haze removal + secret discovery.

### Phase 1 Notes For Phase 2

- The colored-house layer work still exists technically, but it is intentionally disabled in `OverworldScene.ts`.
- The first discovered clue is `banana-peel-clue`; it points toward the Phase 2 banana/platformer secret without starting that phase yet.
- Future secret triggers should reuse the same shape: only visible/interactable when glasses are equipped, then recorded in bridge progress if discovered.
- Current overworld handoff UX: first interaction is inspect clue, subsequent interaction becomes peel-ready prompt for Phase 2 trigger wiring.

---

## Phase 2: Secret 1 - The Potassium Platformer (Mario Homage)

**Goal:** Implement the first secret mini-game hidden in the Overworld.

- **2.1: The Banana Trigger**
  - Place a `Banana` object in the Overworld.
  - Add an interaction that transitions the active scene to the `PotassiumPlatformerScene`.
- **2.2: Platformer Mechanics**
  - Create a new Phaser Scene (`PotassiumPlatformerScene.ts`).
  - Implement tight jump physics and horizontal momentum.
  - Add simple "Banana Blocks" and a "Goal Pole" logic.
- **2.3: Verification**
  - Ensure the user can enter the mini-game, complete the stage, and return to the Overworld seamlessly.

---

## Phase 3: Secret 2 - Muay Thai Mayhem (Street Fighter Homage)

**Goal:** Add the 1v1 combat secret to the Hobby Room.

- **3.1: The Heavy Bag Trigger**
  - In `HobbiesScene.ts`, modify the heavy bag interaction.
  - Require the `hasGlasses` state to be true to trigger the secret.
- **3.2: Combat Arena**
  - Create `MuayThaiMayhemScene.ts`.
  - Implement a 1v1 side-on view.
  - Add basic 3-button inputs (Jab, Kick, Block) mapped to the keyboard/touch bridge.
- **3.3: AI Opponent**
  - Create a simple state machine for the "TODO: Implement AI" enemy (Walk forward, Jab, Block).
  - Add a win/loss condition and return to the Hobby Room.

---

## Phase 4: Secret 3 - Ball x Pit Homage

**Goal:** Implement the Survival Roguelite brick-breaking hybrid.

- **4.1: The Old TV Trigger**
  - Place an `Old TV` in the Overworld.
  - Add a requirement for a "Circuit" item to activate it.
- **4.2: Vertical Pit Mechanics**
  - Create `BallXPitScene.ts`.
  - Implement vertical gravity and bouncy physics.
  - Add a player-controlled top-launcher that fires balls downward.
- **4.3: Ball Fusion & Enemies**
  - Spawn geometric enemy waves moving upwards.
  - Implement "Data Bits" drop on enemy death.
  - Add a rudimentary fusion system (e.g., collecting 5 bits splits the ball into 3).

---

## Phase 5: The Infinite Draft & Survivor's Guilt

**Goal:** Complete the final two hidden mini-games.

- **5.1: The Infinite Draft (Rogue-lite)**
  - Implement the "Glitchy Elevator" trigger in the Basement.
  - Build `InfiniteDraftScene.ts` with a simple procedural tile generator.
  - Add "Bug" enemies and "Code Snippet" pickups.
- **5.2: Survivor's Guilt (Vampire Survivors)**
  - Implement the "10-second standstill" trigger in a dark patch of the city.
  - Build `SurvivorsGuiltScene.ts` with top-down movement.
  - Add auto-firing "Coffee Breath" and swarms of "Deadline" enemies.

---

## Final Phase: Polish & Connecting the Pieces

- **6.1: The Glitch System**
  - Apply the "2-Frame Jitter" to all Sketch assets.
  - Add bit-crushed audio cues near secret entrances.
- **6.2: Save State & Persistence**
  - Ensure all unlocked secrets and mini-game completion statuses are persisted in `gameState.ts` and local storage.