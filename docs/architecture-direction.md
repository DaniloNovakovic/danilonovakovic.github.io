# Architecture Direction

This document describes the current architectural direction for the project: the
why behind the runtime shape, and the direction future refactors should preserve.
For what exists in code today, treat [`runtime-architecture.md`](runtime-architecture.md),
`AGENTS.md`, and the scoped `.agents/rules/` files as the operational guidance.

Ridge caveat: architecture notes about the typed Ridge blockout apply to the
current Phaser prototype/runtime. They do not override the Ridge pre-production
route in [`game-design/ridge/README.md`](./game-design/ridge/README.md).

## 1. Architectural Philosophy

This project is built on three core pillars to ensure that adding future complex scenes and overlays does not create technical debt or "God Objects."

### A. Entity Component System (ECS)

- **Entities:** Numeric IDs representing game objects (e.g., The Player, an NPC, a Note).
- **Components:** Pure Data objects (no methods). Examples: `Transform`, `Velocity`, `Appearance`, `Health`.
- **Systems:** Logic loops that process entities with specific component sets. 
- **Goal:** Use ECS where pure gameplay decision logic benefits from data/logic separation. This is not an "ECS everything" mandate; deep runtime modules remain preferred when they concentrate scene lifecycle, interaction, or policy knowledge behind a small interface.

### B. Hexagonal (Clean) Architecture

- **Domain (Core):** Pure TypeScript logic. No `window`, `document`, or engine-specific (`PIXI`, `Phaser`) references.
- **Adapters:** Concrete connections to outside APIs. This is where Phaser, Web Audio API, and DOM event listeners live when they are not scene-owned.
- **The Bridge (Hybrid UI):** Use the existing bridge store as the source of truth between Phaser scenes and React overlays. Do not introduce a second durable runtime state store.

### C. Scene Lifecycle Architecture

- Scene lifecycle handles global scene orchestration and typed lifecycle events.
- Asset loading remains owned by Phaser scene/runtime code unless a dedicated asset pipeline is introduced.
- Each lifecycle scene entry should be isolated behind a scene context definition.
- Scene management should stay responsible for entering/exiting Phaser contexts, resume capture, and pause propagation through the Phaser adapter.
- ECS systems can be called from scene runtime code as part of the incremental migration; do not push scene orchestration into ECS for architecture aesthetics.

---

## 2. Technical Standards

- **Visual Architecture:** Modular "Paper-Doll" Peeps. Characters are layered textures (Head + Body + Hair + Accessory).
- **Asset Naming:** `[entity]_[state]_[direction]_[frame].png` (e.g., `peep_walk_left_01.png`). Always lowercase.
- **Ownership:** Keep code modular by scene, overlay, shared runtime, pure decision logic, and external adapter ownership. Use [`runtime-architecture.md`](runtime-architecture.md) and [`src/README.md`](../src/README.md) for the current folder map.

---

## 3. Directional Implementation Anchors

This document is directional. For exact current implementation details and file
paths, prefer [`runtime-architecture.md`](runtime-architecture.md). When
proposing future refactors:

- Prefer extending existing lifecycle, bridge, overlay, scene UI, and shared runtime seams instead of re-introducing callback-only scene orchestration, ad-hoc overlay maps, or ad-hoc global state.
- For current/prototype Ridge runtime work, keep spatial truth in the typed
  Ridge blockout source and compiled facts instead of rebuilding parallel
  parent/route/spatial catalogs.
- Introduce shared render helpers only when repeated render policy code appears.

---

## 4. Agent Guidance

For implementation work, prefer the smallest change that fits the nearby code. Use [`runtime-architecture.md`](runtime-architecture.md), `AGENTS.md`, and [`.agents/rules/`](../.agents/rules/) for current operational guidance.
