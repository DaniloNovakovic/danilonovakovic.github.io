# Project Constitution: Scalable Browser Game Architecture

## 1. Architectural Philosophy
This project is built on three core pillars to ensure that adding complex minigames (Guitar Hero, Terminal, Fighting) does not create technical debt or "God Objects."

### A. Entity Component System (ECS)
* **Entities:** Numeric IDs representing game objects (e.g., The Player, an NPC, a Note).
* **Components:** Pure Data objects (no methods). Examples: `Transform`, `Velocity`, `Appearance`, `Health`.
* **Systems:** Logic loops that process entities with specific component sets. 
* **Goal:** Logic is decoupled from data. If the player is in the 'Street,' they have a `PhysicsSystem`. if they are in the 'Barber Shop,' they only have a `UIAppearanceSystem`.

### B. Hexagonal (Clean) Architecture
* **Domain (Core):** Pure TypeScript logic. No `window`, `document`, or engine-specific (`PIXI`, `Phaser`) references.
* **Infrastructure (Adapters):** The "Body." This is where PixiJS/Phaser, Web Audio API, and DOM Event Listeners live.
* **The Bridge (Hybrid UI):** Use a shared state store (e.g., Zustand or Signals) as the source of truth between the Game Engine and HTML Modals.

### C. Micro-Kernel (Plugin) Architecture
* **Kernel:** Handles the global lifecycle, asset management, and the central Event Bus.
* **Plugins (Contexts):** Every building or minigame is an isolated module. 
    * *Street:* Side-scrolling world logic.
    * *Guitar Game:* Rhythm/Time-based logic using Web Audio.
    * *Coding Terminal:* HTML/DOM-driven text parser.
* **Scene Manager:** Responsible for mounting/unmounting specific ECS Systems when transitioning between contexts.

---

## 2. Technical Standards
* **Visual Architecture:** Modular "Paper-Doll" Peeps. Characters are layered textures (Head + Body + Hair + Accessory).
* **Asset Naming:** `[entity]_[state]_[direction]_[frame].png` (e.g., `peep_walk_left_01.png`). Always lowercase.
* **Folder Structure:** Modular by feature:
    * `/src/core` (ECS Engine & Domain)
    * `/src/infra` (Renderer Adapters)
    * `/src/games` (Isolated minigame logic)
    * `/src/shared` (State store/The Bridge)

---

## 3. AI Instructions for Codebase Analysis
**Role:** Expert Game Architect.

**Task:**
1.  **Read and Analyze:** Review the current `@src` folder. Identify instances of "God Objects" (classes doing too much) and tight coupling between game logic and the rendering engine.
2.  **Evaluate State Management:** Check how the UI communicates with the game. Is it using "The Bridge" (State Store) or direct DOM manipulation from within game classes?
3.  **Propose Rework:** * Identify how to extract existing logic into the **Micro-Kernel** plugin structure.
    * Show how to refactor the **Player** class into a composite ECS Entity.
    * Design the interface for the **SceneManager** to handle transitions (Side-scroll to Isometric).

**Output Requirements:** Provide a step-by-step refactoring guide with code snippets that enforce these architectural boundaries.

---

## 4. Current Implementation Status (v3)

This constitution is now partially implemented. Current canonical runtime paths:

- **Bridge store:** `src/shared/bridge/store.ts`
- **Kernel:** `src/core/kernel/GameKernel.ts`
- **Scene manager:** `src/core/kernel/SceneManager.ts`
- **Phaser adapter:** `src/infra/phaser/PhaserSceneAdapter.ts`
- **Context plugins:** `src/games/plugins/StreetPlugin.ts`, `src/games/plugins/HobbiesPlugin.ts`
- **ECS foundation:** `src/core/ecs/*`
- **Phaser 4 render guardrails:** currently documented as runtime policy; helper module may be reintroduced under `src/infra/phaser/render/` when shared logic is needed.

When proposing future refactors, prefer extending these modules instead of re-introducing callback-only scene orchestration or ad-hoc global state.