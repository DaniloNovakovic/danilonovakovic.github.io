# Project Constitution: Scalable Browser Game Architecture

This document describes the architectural direction for the project. For what exists in code today, treat [`ARCHITECTURE_RUNTIME.md`](ARCHITECTURE_RUNTIME.md), `AGENTS.md`, and the scoped `.agents/rules/` files as the current operational guidance.

## 1. Architectural Philosophy

This project is built on three core pillars to ensure that adding future complex minigames does not create technical debt or "God Objects."

### A. Entity Component System (ECS)

- **Entities:** Numeric IDs representing game objects (e.g., The Player, an NPC, a Note).
- **Components:** Pure Data objects (no methods). Examples: `Transform`, `Velocity`, `Appearance`, `Health`.
- **Systems:** Logic loops that process entities with specific component sets. 
- **Goal:** Use ECS where pure gameplay decision logic benefits from data/logic separation. This is not an "ECS everything" mandate; deep runtime Modules remain preferred when they concentrate scene lifecycle, interaction, or policy knowledge behind a small Interface.

### B. Hexagonal (Clean) Architecture

- **Domain (Core):** Pure TypeScript logic. No `window`, `document`, or engine-specific (`PIXI`, `Phaser`) references.
- **Infrastructure (Adapters):** The "Body." This is where Phaser, Web Audio API, and DOM event listeners live.
- **The Bridge (Hybrid UI):** Use the custom bridge store in `src/game/bridge/store.ts` as the source of truth between the Game Engine and HTML Modals.

### C. Micro-Kernel (Plugin) Architecture

- **Kernel:** Handles global lifecycle, scene/context orchestration, and typed kernel events. Asset loading remains owned by the Phaser runtime and scene/plugin code unless a dedicated asset pipeline is introduced.
- **Scene Contexts:** Each Phaser scene lifecycle entry is isolated behind a scene context definition. React-overlay buildings remain registry-driven overlays rather than scene contexts unless they need Phaser scene lifecycle.
  - *Street:* Side-scrolling world logic.
  - *Hobbies:* Interior Phaser scene logic.
  - *Future rhythm or terminal games:* Add only when their runtime needs justify a new context.
- **Scene Manager:** Responsible for entering/exiting Phaser contexts, resume capture, and pause propagation through the Phaser adapter. ECS systems are currently called from scene runtime code as part of the incremental migration.

---

## 2. Technical Standards

- **Visual Architecture:** Modular "Paper-Doll" Peeps. Characters are layered textures (Head + Body + Hair + Accessory).
- **Asset Naming:** `[entity]_[state]_[direction]_[frame].png` (e.g., `peep_walk_left_01.png`). Always lowercase.
- **Folder Structure:** Modular by feature:
  - `/src/App.tsx` and `/src/modePicker` (thin React mode routing)
  - `/src/static` (static portfolio surface)
  - `/src/game` (playable mode shell, bridge, registry, scenes, runtime, kernel, and adapters)
  - `/src/shared` (shared UI, hooks, content, and config reused by static and game)
  - `/src/game/core` (ECS Engine & Domain)
  - `/src/game/infra` (Renderer Adapters)
  - `/src/game/runtime` (Phaser runtime scenes and registries)
  - `/src/game/sceneContexts` and `/src/game/scenes/*/sceneContext.ts` (Kernel scene context assembly and scene-owned lifecycle definitions)

---

## 3. Directional Implementation Anchors

This constitution is directional. For exact current implementation details, prefer `docs/ARCHITECTURE_RUNTIME.md`. Current canonical runtime anchors:

- **Bridge store:** `src/game/bridge/store.ts`
- **Kernel:** `src/game/kernel/GameKernel.ts`
- **Scene manager:** `src/game/kernel/SceneManager.ts`
- **Phaser adapter:** `src/game/infra/phaser/PhaserSceneAdapter.ts`
- **Scene context assembly:** `src/game/sceneContexts/createSceneContexts.ts`
- **ECS foundation:** `src/game/core/ecs/`*
- **Shared runtime Modules:** `src/game/runtime/player/SideViewPlayerRuntime.ts`, `src/game/runtime/interactions/InteriorInteractionRuntime.ts`, `src/game/runtime/sceneResumePolicy.ts`
- **Phaser 4 render guardrails:** currently documented as runtime policy; introduce a shared render helper only when repeated policy code appears.

When proposing future refactors, prefer extending these modules instead of re-introducing callback-only scene orchestration or ad-hoc global state.

---

## 4. Pattern Reference

Architectural decisions in this project are anchored to Robert Nystrom's *[Game Programming Patterns](https://gameprogrammingpatterns.com/)*. Per-pattern notes, adoption status, and JS/TS + Phaser caveats live in [docs/patterns/](./patterns/README.md). Scoped AI rules that mirror those patterns live under [.agents/rules/](../.agents/rules/).
