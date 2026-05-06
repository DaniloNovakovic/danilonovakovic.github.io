# Architecture Direction

This document describes the current architectural direction for the project. For what exists in code today, treat [`runtime-architecture.md`](runtime-architecture.md), `AGENTS.md`, and the scoped `.agents/rules/` files as the operational guidance.

## 1. Architectural Philosophy

This project is built on three core pillars to ensure that adding future complex scenes and overlays does not create technical debt or "God Objects."

### A. Entity Component System (ECS)

- **Entities:** Numeric IDs representing game objects (e.g., The Player, an NPC, a Note).
- **Components:** Pure Data objects (no methods). Examples: `Transform`, `Velocity`, `Appearance`, `Health`.
- **Systems:** Logic loops that process entities with specific component sets. 
- **Goal:** Use ECS where pure gameplay decision logic benefits from data/logic separation. This is not an "ECS everything" mandate; deep runtime Modules remain preferred when they concentrate scene lifecycle, interaction, or policy knowledge behind a small Interface.

### B. Hexagonal (Clean) Architecture

- **Domain (Core):** Pure TypeScript logic. No `window`, `document`, or engine-specific (`PIXI`, `Phaser`) references.
- **Adapters:** Concrete connections to outside APIs. This is where Phaser, Web Audio API, and DOM event listeners live when they are not scene-owned.
- **The Bridge (Hybrid UI):** Use the custom bridge store in `src/game/bridge/store.ts` as the source of truth between Phaser scenes and React overlays.

### C. Scene Lifecycle Architecture

- **Scenes:** Phaser worlds such as the overworld, Hobbies, Basement, and Potassium.
- **Overlays:** React surfaces rendered above the current scene by `OverlayHost`.
- **Triggers:** Scene-owned interaction points that call `enterScene` or `openOverlay`.
- **Scene Lifecycle:** Handles global scene orchestration and typed lifecycle events. Asset loading remains owned by Phaser scene/runtime code unless a dedicated asset pipeline is introduced.
- **Scene Contexts:** Each Phaser scene lifecycle entry is isolated behind a scene context definition.
- **Scene Manager:** Responsible for entering/exiting Phaser contexts, resume capture, and pause propagation through the Phaser adapter. ECS systems are currently called from scene runtime code as part of the incremental migration.

---

## 2. Technical Standards

- **Visual Architecture:** Modular "Paper-Doll" Peeps. Characters are layered textures (Head + Body + Hair + Accessory).
- **Asset Naming:** `[entity]_[state]_[direction]_[frame].png` (e.g., `peep_walk_left_01.png`). Always lowercase.
- **Folder Structure:** Modular by scene/overlay ownership:
  - `/src/App.tsx` and `/src/modePicker` (thin React mode routing)
  - `/src/static` (static portfolio surface)
  - `/src/game` (playable mode shell, bridge, scenes, overlays, scene lifecycle, shared scene runtime, core, and adapters)
  - `/src/shared` (shared UI, hooks, content, and config reused by static and game)
  - `/src/game/core` (pure ECS, input, and player decisions)
  - `/src/game/adapters` (concrete engine/browser adapters)
  - `/src/game/sharedSceneRuntime` (shared Phaser-facing runtime machinery)
  - `/src/game/overlays` (shared overlay host, ids, registry, and global overlays)
  - `/src/game/sceneLifecycle` and `/src/game/scenes/*/sceneContext.ts` (scene context assembly and scene-owned lifecycle definitions)

---

## 3. Directional Implementation Anchors

This document is directional. For exact current implementation details, prefer [`runtime-architecture.md`](runtime-architecture.md). Current runtime anchors:

- **Bridge store:** `src/game/bridge/store.ts`
- **Scene lifecycle controller:** `src/game/sceneLifecycle/SceneLifecycleController.ts`
- **Scene manager:** `src/game/sceneLifecycle/SceneManager.ts`
- **Phaser adapter:** `src/game/adapters/phaser/PhaserSceneAdapter.ts`
- **Scene context assembly:** `src/game/sceneLifecycle/contexts/createSceneContexts.ts`
- **Scene ids/lookup:** `src/game/scenes/sceneIds.ts`, `src/game/scenes/sceneRegistry.ts`
- **Overlay ids/lookup:** `src/game/overlays/overlayIds.ts`, `src/game/overlays/overlayRegistry.ts`, `src/game/overlays/OverlayHost.tsx`
- **ECS foundation:** `src/game/core/ecs/`
- **Shared scene runtime Modules:** `src/game/sharedSceneRuntime/player/SideViewPlayerRuntime.ts`, `src/game/sharedSceneRuntime/interactions/InteriorInteractionRuntime.ts`, `src/game/sharedSceneRuntime/sceneResumePolicy.ts`
- **Phaser 4 render guardrails:** currently documented as runtime policy; introduce a shared render helper only when repeated policy code appears.

When proposing future refactors, prefer extending these modules instead of re-introducing callback-only scene orchestration, ad-hoc overlay maps, or ad-hoc global state.

---

## 4. Agent Guidance

For implementation work, prefer the smallest change that fits the nearby code. Use [`runtime-architecture.md`](runtime-architecture.md), `AGENTS.md`, and [`.agents/rules/`](../.agents/rules/) for current operational guidance.
