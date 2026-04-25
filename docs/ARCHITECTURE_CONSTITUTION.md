# Project Constitution: Scalable Browser Game Architecture

This document describes the architectural direction for the project. For what exists in code today, treat [`docs/ARCHITECTURE_RUNTIME.md`](ARCHITECTURE_RUNTIME.md), `AGENTS.md`, and the scoped `.cursor/rules/` files as the current operational guidance.

## 1. Architectural Philosophy

This project is built on three core pillars to ensure that adding future complex minigames does not create technical debt or "God Objects."

### A. Entity Component System (ECS)

- **Entities:** Numeric IDs representing game objects (e.g., The Player, an NPC, a Note).
- **Components:** Pure Data objects (no methods). Examples: `Transform`, `Velocity`, `Appearance`, `Health`.
- **Systems:** Logic loops that process entities with specific component sets. 
- **Goal:** Logic is decoupled from data. If the player is in the street, scene runtime applies physics-backed systems; if a mini-game is a React overlay, it should stay in the UI layer and avoid Phaser coupling.

### B. Hexagonal (Clean) Architecture

- **Domain (Core):** Pure TypeScript logic. No `window`, `document`, or engine-specific (`PIXI`, `Phaser`) references.
- **Infrastructure (Adapters):** The "Body." This is where Phaser, Web Audio API, and DOM event listeners live.
- **The Bridge (Hybrid UI):** Use the custom bridge store in `src/shared/bridge/store.ts` as the source of truth between the Game Engine and HTML Modals.

### C. Micro-Kernel (Plugin) Architecture

- **Kernel:** Handles global lifecycle, scene/context orchestration, and typed kernel events. Asset loading remains owned by the Phaser runtime and scene/plugin code unless a dedicated asset pipeline is introduced.
- **Plugins (Contexts):** Each Phaser context is isolated behind a plugin definition. React-overlay buildings remain registry-driven overlays rather than kernel plugins unless they need Phaser scene lifecycle.
  - *Street:* Side-scrolling world logic.
  - *Hobbies:* Interior Phaser scene logic.
  - *Future rhythm or terminal games:* Add only when their runtime needs justify a new context.
- **Scene Manager:** Responsible for entering/exiting Phaser contexts, resume capture, and pause propagation through the Phaser adapter. ECS systems are currently called from scene runtime code as part of the incremental migration.

---

## 2. Technical Standards

- **Visual Architecture:** Modular "Paper-Doll" Peeps. Characters are layered textures (Head + Body + Hair + Accessory).
- **Asset Naming:** `[entity]_[state]_[direction]_[frame].png` (e.g., `peep_walk_left_01.png`). Always lowercase.
- **Folder Structure:** Modular by feature:
  - `/src/core` (ECS Engine & Domain)
  - `/src/infra` (Renderer Adapters)
  - `/src/runtime` (Phaser runtime scenes and registries)
  - `/src/contextPlugins` (Kernel context plugin definitions)
  - `/src/shared` (State store/The Bridge)

---

## 3. Current Implementation Status (v3)

This constitution is now partially implemented. Current canonical runtime paths:

- **Bridge store:** `src/shared/bridge/store.ts`
- **Kernel:** `src/core/kernel/GameKernel.ts`
- **Scene manager:** `src/core/kernel/SceneManager.ts`
- **Phaser adapter:** `src/infra/phaser/PhaserSceneAdapter.ts`
- **Context plugins:** `src/contextPlugins/plugins/StreetPlugin.ts`, `src/contextPlugins/plugins/HobbiesPlugin.ts`
- **ECS foundation:** `src/core/ecs/`*
- **Phaser 4 render guardrails:** currently documented as runtime policy; helper module may be reintroduced under `src/infra/phaser/render/` when shared logic is needed.

When proposing future refactors, prefer extending these modules instead of re-introducing callback-only scene orchestration or ad-hoc global state.

---

## 4. Pattern Reference

Architectural decisions in this project are anchored to Robert Nystrom's *[Game Programming Patterns](https://gameprogrammingpatterns.com/)*. Per-pattern notes, adoption status, and JS/TS + Phaser caveats live in [docs/patterns/](./patterns/README.md). Scoped AI rules that mirror those patterns live under [.cursor/rules/](../.cursor/rules/).