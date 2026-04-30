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

- [ ] **1.1: Core Phaser Layers Setup**
  - Implement two visual layers in `OverworldScene.ts`: `SketchLayer` and `PixelLayer`.
  - Add a global `hasGlasses` boolean to `gameState.ts` (store).
  - Write a masking or visibility toggle logic based on `hasGlasses`.
- [ ] **1.2: The Basement & The Glasses**
  - Add a hidden "hole" trigger in the Overworld sketch layout.
  - Create a simple "Basement" mini-scene or modal overlay.
  - Implement the interaction to pick up the "Glasses," triggering a visual transition.
- [ ] **1.3: Interaction Triggers**
  - Update the interaction system so that nearby sketch buildings "fill in" with pixel art when the user approaches while wearing glasses.

---

## Phase 2: Secret 1 - The Potassium Platformer (Mario Homage)
**Goal:** Implement the first secret mini-game hidden in the Overworld.

- [ ] **2.1: The Banana Trigger**
  - Place a `Banana` object in the Overworld.
  - Add an interaction that transitions the active scene to the `PotassiumPlatformerScene`.
- [ ] **2.2: Platformer Mechanics**
  - Create a new Phaser Scene (`PotassiumPlatformerScene.ts`).
  - Implement tight jump physics and horizontal momentum.
  - Add simple "Banana Blocks" and a "Goal Pole" logic.
- [ ] **2.3: Verification**
  - Ensure the user can enter the mini-game, complete the stage, and return to the Overworld seamlessly.

---

## Phase 3: Secret 2 - Muay Thai Mayhem (Street Fighter Homage)
**Goal:** Add the 1v1 combat secret to the Hobby Room.

- [ ] **3.1: The Heavy Bag Trigger**
  - In `HobbiesScene.ts`, modify the heavy bag interaction.
  - Require the `hasGlasses` state to be true to trigger the secret.
- [ ] **3.2: Combat Arena**
  - Create `MuayThaiMayhemScene.ts`.
  - Implement a 1v1 side-on view.
  - Add basic 3-button inputs (Jab, Kick, Block) mapped to the keyboard/touch bridge.
- [ ] **3.3: AI Opponent**
  - Create a simple state machine for the "TODO: Implement AI" enemy (Walk forward, Jab, Block).
  - Add a win/loss condition and return to the Hobby Room.

---

## Phase 4: Secret 3 - Ball x Pit Homage
**Goal:** Implement the Survival Roguelite brick-breaking hybrid.

- [ ] **4.1: The Old TV Trigger**
  - Place an `Old TV` in the Overworld.
  - Add a requirement for a "Circuit" item to activate it.
- [ ] **4.2: Vertical Pit Mechanics**
  - Create `BallXPitScene.ts`.
  - Implement vertical gravity and bouncy physics.
  - Add a player-controlled top-launcher that fires balls downward.
- [ ] **4.3: Ball Fusion & Enemies**
  - Spawn geometric enemy waves moving upwards.
  - Implement "Data Bits" drop on enemy death.
  - Add a rudimentary fusion system (e.g., collecting 5 bits splits the ball into 3).

---

## Phase 5: The Infinite Draft & Survivor's Guilt
**Goal:** Complete the final two hidden mini-games.

- [ ] **5.1: The Infinite Draft (Rogue-lite)**
  - Implement the "Glitchy Elevator" trigger in the Basement.
  - Build `InfiniteDraftScene.ts` with a simple procedural tile generator.
  - Add "Bug" enemies and "Code Snippet" pickups.
- [ ] **5.2: Survivor's Guilt (Vampire Survivors)**
  - Implement the "10-second standstill" trigger in a dark patch of the city.
  - Build `SurvivorsGuiltScene.ts` with top-down movement.
  - Add auto-firing "Coffee Breath" and swarms of "Deadline" enemies.

---

## Final Phase: Polish & Connecting the Pieces
- [ ] **6.1: The Glitch System**
  - Apply the "2-Frame Jitter" to all Sketch assets.
  - Add bit-crushed audio cues near secret entrances.
- [ ] **6.2: Save State & Persistence**
  - Ensure all unlocked secrets and mini-game completion statuses are persisted in `gameState.ts` and local storage.
