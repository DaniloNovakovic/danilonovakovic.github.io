# Notebook Shell Design Language

> Draft design language for the Notebook Hybrid shell. This guides M4d.5
> prototypes and future runtime profile work; it is not a shipped behavior
> manual.

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
- Shadows are hard offset paper shadows, not blur-heavy app shadows.
- Tape, tabs, scraps, ruled lines, and margin notes are functional props.
- Color is sparse material tint. It should not become a new scene palette.

Avoid over-themed notebook clutter. The center and lower-middle playfield stay
clear during normal play.

## Shell Primitives

| Primitive | Use |
| --- | --- |
| Page | Primary playable surface for a scene. |
| Spread | Desktop/tablet layout with a playable page and a notes/status page. |
| Tab | Global navigation such as Back or compact Menu. |
| Margin note | Low-density status, objective, or reward memory. |
| Taped sheet | Blocking scene panel such as start, result, upgrade, or Trail Card. |
| Torn footer | Compact status or hint on portrait layouts. |
| Control mat | Shell-level touch surface larger than the visible canvas. |

## Profile Families

| Profile | Scenes | Layout Intent |
| --- | --- | --- |
| `sideViewPage` | Current Overworld, Ridge | Horizontal trail on paper with sparse prompts and overlays. |
| `ruledBoardPage` | Potassium Slip | Tall ruled board, drag/recall control mat, board-like rhythm. |
| `survivalPage` | Stampede Sketch | Clean open arena, edge status, minimal decoration. |
| `timingPage` | Telegraph Terrace | One readable timing subject and one obvious parry surface. |
| `puzzleDeskPage` | Domino Desk | Stable grid, reachable undo, optional desk-paper trim. |

The first runtime slice should prove `ruledBoardPage` and `survivalPage`.
`sideViewPage` can enter the profile system without a major visual rework.

## Responsive Rules

- Desktop/tablet landscape can use a spread, but side pages must remain quiet.
- Phone portrait uses a single page with tabs and a torn footer/status surface.
- Phone landscape uses edge chips and compact tabs; persistent footers usually
  disappear.
- Panels center in the viewport/shell stage, not inside the canvas.
- Panels have max height, internal scrolling, and sticky or reachable actions.
- Touch targets should stay at least 44 px high/wide when rendered as controls.

## Input Layering

Input priority should be:

1. panels, buttons, tabs, menus, and other explicit UI;
2. active drag capture;
3. shell-level scene control mat;
4. Phaser canvas fallback.

High-frequency pointer movement should go through an imperative input adapter
instead of React state updates per frame.

## Scene Notes

- Potassium should feel board-like, with ruled paper lanes and drag support that
  continues outside the visible canvas.
- Stampede should feel like a clean survival page, with pressure and status at
  the edge and almost no center decoration.
- Ridge should sell the notebook fantasy through landmarks, stickers, Trail
  Cards, and margin memory, not through dense side panels.
- Future scenes should choose a profile before designing custom UI.

## Storybook Readiness

Do not start Storybook from the static tournament alone. Start it after one
runtime implementation proves these primitives:

- scene profile selection;
- page/spread shell wrapper;
- viewport scene panel placement;
- control mat input gating;
- responsive header chrome.
