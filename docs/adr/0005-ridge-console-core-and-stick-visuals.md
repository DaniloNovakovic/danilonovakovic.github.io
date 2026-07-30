# Ridge Console Core And Stick Visual Provider

Status: accepted for the Ridge runtime rebuild.

Ridge gameplay authority lives in a pure console-capable core under
`src/game/core/ridge/`. Phaser and React are presentation adapters. Stick-figure
math art is the default Visual Provider and can be replaced later without
rewriting route logic.

## Decision

1. **Console core is gameplay truth.** Progress, beats, nearby interactables,
   conversation halt, and route outcomes are decided in pure TypeScript with no
   Phaser, React, or DOM imports.
2. **AI and humans share one command surface.** Commands such as `look`,
   `go left|right`, `interact`, `advance`, and `choose` drive both
   `pnpm ridge:console` and the Phaser scene.
3. **Stage spots are progress-based.** A Compact Ridge Stage is a left-to-right
   progress line (`0..1`) with labeled spots and interact radii. This replaces
   the heavy Walk-Rail authoring / Stage Debugger workflow for First Playable
   Route work.
4. **VisualProvider hides art volatility.** Runtime renders a view model through
   a stick provider today; future iPad/Procreate art plugs in behind the same
   interface.
5. **Conversation uses Scene UI.** Talking halts explore mode in core; React
   Scene UI owns the Persona-style panel (speaker, portrait slot, text,
   advance/choices).

## Relationship To Prior ADRs

- Supersedes ADR-0004 as the active First Playable Route runtime authority.
- ADR-0004 Stage Composition Source ideas remain historical reference for
  detailed plate/rail authoring if a later area needs that complexity again.
- ADR-0001 / ADR-0003 remain historical folded-desk blockout records.

## Consequences

- Ridge internals may break while Overworld and other shipped surfaces stay
  protected.
- Large PNG stage plates and the Ridge Stage Debugger are disposable for the
  Bridge tracer rebuild.
- Future areas should start from console content + stick visuals, then swap art
  through VisualProvider when ready.
