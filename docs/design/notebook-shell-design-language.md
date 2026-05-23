# Notebook Shell Design Language

> Draft design language for the Notebook Hybrid shell. This guides M4d.5
> prototypes, Storybook specimens, and runtime profile work; it is not a
> shipped behavior manual.

Status: current runtime shell/UI guidance. This document can guide notebook
presentation for current scenes and optional mini-game prototypes, but it does
not decide active Ridge route canon. For Bridge, Concert, Dance Festival, Relay,
Living Proof, or ending design, start from
[`../game-design/ridge/README.md`](../game-design/ridge/README.md).

## Core Idea

Interactive mode should feel like a living sketchbook page, not a game trapped
inside an app card. The notebook metaphor is useful only when it makes three
things clearer:

- where the player can touch or drag;
- where scene-owned React UI can appear;
- how different mini-games can share one shell without looking identical.

## Material Rules

- Paper is the base surface: off-white, lightly ruled or smudged when useful.
- Ink owns gameplay readability: dark contours, high contrast, few accents.
- Shadows use one down-right sketchbook light source. Depth changes by semantic
  elevation, not random direction.
- Tabs, loose sheets, scraps, ruled lines, and margin notes are functional props.
- Color is sparse material tint. It should not become a new scene palette.
- Tape is deferred for v1 unless it communicates temporary attachment, blocking
  state, or authored evidence. Do not use tape as generic decoration.

Anti-slop rule: every notebook primitive must explain something the player can
do, touch, remember, read, or avoid. If a doodle, stain, scrap, or tint cannot
answer that, it should not ship as reusable shell language.

Avoid over-themed notebook clutter. The center and lower-middle playfield stay
clear during normal play.

## Shell Primitives

| Primitive | Use |
| --- | --- |
| Page | Primary playable surface for a scene. |
| Spread | Desktop/tablet layout with a playable page and a notes/status page. |
| Tab | Global navigation such as Back or compact Menu. |
| Margin note | Low-density status, objective, or reward memory. |
| Loose sheet | Blocking scene panel such as start, result, upgrade, or Trail Card. |
| Hint slip | Compact controls/context hint, usually in the reserved footer slot. |
| Status slip | Live timer, score, phase, feedback, or meter. |
| Choice card | Upgrade, route, or result choice with enough copy to be readable outside canvas. |
| Menu sheet | Compact shell menu for Static Mode, inventory, dev tools, and settings. |
| Control mat | Shell-level touch surface larger than the visible canvas. |

Choice cards are selectable paper options, not floating action cards. Hover
should clarify that the option is pressable without making the card jump off the
page.

Storybook scene stories should prove shell layout, spacing, and reusable
component behavior with generic mock state. Avoid scene-specific copy or
decorative gameplay details unless the story is explicitly testing that scene's
visual language.

Storybook stories are profile specimens, not scene mocks. Scene names, shipped
copy, rewards, enemy art, and exact gameplay labels belong in runtime scene
integrations. Runtime adoption must map real scenes onto these profiles instead
of copying Storybook mock labels or placeholder marks.

## Shadow Roles

| Role | Use |
| --- | --- |
| `pressed` | Active/pressed state, nearly flush with the page. |
| `control` | Buttons, tabs, scraps, and compact status slips. |
| `sheet` | Blocking scene panels and loose sheets. |
| `page` | Page/spread frames above the notebook paper. |
| `stage` | Quiet notebook paper behind shell chrome; no heavy card shadow by default. |

The stage is structural, not the main visual card. The strongest ink border
belongs to the current page, board, or blocking sheet so the shell does not read
as a card wrapped around another card.

## Profile Families

| Profile | Scenes | Layout Intent |
| --- | --- | --- |
| `sideViewPage` | Current Overworld, legacy/prototype Ridge, possible future Ridge if the active route adopts it | Horizontal trail on paper with sparse prompts and overlays. |
| `ruledBoardPage` | Potassium Slip | Tall ruled board, drag/recall control mat, board-like rhythm. |
| `survivalPage` | Stampede Sketch | Clean open arena, edge status, minimal decoration. |
| `timingPage` | Telegraph Terrace | One readable timing subject and one obvious parry surface. |
| `puzzleDeskPage` | Domino Desk | Stable grid, reachable undo, optional desk-paper trim. |

Potassium is the first runtime proof for `ruledBoardPage`. Stampede is the
first runtime proof for `survivalPage`. `sideViewPage` should enter runtime
later, when Ridge/Overworld visual rework has product value instead of being a
matching exercise.

## Responsive Rules

- Desktop/tablet landscape can use either a spread or a Focus page. Arcade
  scenes should prefer Focus when notes would steal useful play/control space.
- Phone portrait uses a single page with tabs and a reserved hint/status slip.
- Phone landscape uses edge chips and compact tabs; persistent footers usually
  disappear.
- Arcade scenes default to one live status locus: live state in the page chip,
  footer slip for hints/context only.
- Footer slips reserve layout space by default. Floating footers are opt-in for
  intentional overlays only.
- Panels center in the viewport/shell stage, not inside the canvas.
- Panels have max height, internal scrolling, and sticky or reachable actions.
- Touch targets should stay at least 44 px high/wide when rendered as controls.

## Input Layering

Input priority should be:

1. panels, buttons, tabs, menus, and other explicit UI;
2. active drag capture;
3. shell-level scene control mat;
4. Phaser canvas fallback.

High-frequency pointer movement should eventually go through an imperative
input adapter if profiling shows React bridge churn. The current Potassium and
Stampede runtime proofs use a narrow owner-scoped bridge queue so the
control-mat contract stays testable before broader extraction.

## Scene Notes

- Potassium should feel board-like, with ruled paper lanes and drag support that
  continues outside the visible canvas. Its upgrade and terminal panels remain
  scene-owned under `src/game/scenes/potassiumSlip/sceneUi`, not shared
  Notebook Shell content.
- Stampede should feel like a clean survival page, with pressure and status at
  the edge and almost no center decoration.
- Ridge should sell the notebook fantasy through landmarks, resident changes,
  Cicka presence, Trail Cards when needed, and margin memory, not through dense
  side panels. Active route/ending decisions still belong in the Ridge router
  docs, not this shell-language note.
- Future scenes should choose a profile before designing custom UI.

## Storybook Readiness

Storybook proved the visual component language before runtime wiring, and it
should stay mock-data-only unless a future story is explicitly about a shared
component state.
Use Storybook viewport controls as the source of responsive review. Do not add
fake phone, tablet, or landscape wrapper stories that mask whether the component
itself responds to the preview viewport.
The first Storybook extraction covered:

- scene profile selection;
- page/spread shell wrapper;
- viewport scene panel placement;
- control mat input gating;
- responsive header chrome.

Runtime adoption has begun with Potassium and Stampede. Those real scenes
should continue to be reviewed through runtime integrations; the Notebook Shell
stories themselves should remain scene-agnostic.
