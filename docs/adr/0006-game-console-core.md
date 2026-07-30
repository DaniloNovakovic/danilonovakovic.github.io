# Game Console Core (Headless Full-Game Play)

Status: accepted.

The whole interactive game — Overworld, Basement, Potassium Slip (discrete), and
Ridge — is playable through one pure TypeScript console session. Phaser and
React remain presentation adapters. AI agents and humans share the same command
surface via `pnpm game:console`.

## Decision

1. **`GameConsoleSession` is the cross-scene gameplay authority for headless
   play.** It owns inventory, equipped items, discovered secrets, active scene,
   and overlay focus. Sub-areas (overworld walk, basement room, discrete
   Potassium campaign, Ridge bridge) are delegated modules, not parallel stores.
2. **No bridge/store imports in `src/game/core/**`.** Durable browser bridge
   state stays in `src/game/bridge/store.ts` for the live app. The console
   session mirrors the same inventory/progress vocabulary as plain data so Node
   scripts and tests never need Phaser or React.
3. **One command surface.** Shared verbs (`look`, `go`, `interact`, `inventory`,
   `equip`, `close`, plus scene-local `advance`/`choose`/`fight`/`draft`) drive
   `pnpm game:console` and can later drive thin Phaser adapters the same way
   Ridge already does.
4. **Potassium headless mode is discrete, not Arcade Physics.** Wave clear,
   draft pick, win → Circuit are turn commands. The live Phaser Potassium scene
   keeps real-time physics; the console proves route reachability and reward
   wiring for AI playtests.
5. **`pnpm ridge:console` remains a Ridge-only alias.** Prefer
   `pnpm game:console` for full-route smoke paths (glasses → peel → Circuit →
   CRT → Ridge).

## Relationship To Prior ADRs

- Extends ADR-0005's console-core pattern from Ridge to the full game graph.
- Does not replace ADR-0005 for Ridge-internal stage/conversation truth.

## Consequences

- Full AI smoke paths no longer require a browser.
- Overworld and Basement Phaser scenes are thin adapters over
  `GameConsoleSession` (physics/art stay in Phaser; interact/gating decisions
  and shared street/room spots live in `src/game/core/console/`).
- Real-time Potassium physics stays Phaser-only; do not pretend the discrete
  console is a frame-accurate physics sim.
