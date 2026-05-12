# Interactive Shell Responsive UI Spike

> Design spike for the playable portfolio shell. This is not shipped player
> behavior; it is a planning and prototype note for M4d.5.

## Why This Exists

M4d proved that scene-owned React UI is useful: Stampede status/start/result UI
and Potassium upgrade/terminal panels are more readable outside Phaser canvas
text. The next problem is larger than either scene. The playable shell still
feels like a centered card with spare screen space around it, while touch input
and UI placement are partly constrained by that card.

Before adding M4e pickups/upgrades, we should test a responsive shell direction
that uses empty viewport space better and gives mobile landscape a first-class
layout.

## Current UI Problems

### 1. The Game Card Is The Layout Anchor

`InteractiveApp` centers one framed game card in the middle row. The card is
visually strong, but it also becomes the invisible constraint for most design
choices:

- vertical arcade scenes stay tall and narrow even when a landscape phone has
  useful side space;
- overlays tend to be described relative to the card, then patched to escape
  the card when they clip;
- the footer/status row competes with the card for height on short screens;
- empty left/right space is mostly decorative instead of becoming useful UI.

### 2. Touch Input Area Is Inconsistent

Side-view shell gestures already exist at React-shell level for swipe/tap
movement. Arcade scenes such as Stampede and Potassium still mainly rely on
Phaser pointer input inside the canvas/card. That makes touch behavior feel
scene-dependent:

- touching inside the card works;
- touching nearby empty paper often does nothing;
- mobile players cannot treat the whole sketchbook surface as the control area.

For arcade mini-games, the input surface should probably be larger than the
visible canvas, with the owning scene deciding how to interpret gestures.

### 3. Mobile Landscape Is Under-Designed

The current layout is friendlier in mobile portrait than mobile landscape.
Landscape phones have constrained height and wide side areas, but the shell
still behaves like a vertical-board card with header and footer rows.

The likely fix is not "make the card bigger" in all cases. Some scenes need:

- side rails for status/actions;
- floating status chips;
- overlays that center in the viewport, not only in the card;
- optional removal of nonessential global chrome such as Static Mode.

### 4. Presentation Modes Are Too Coarse

Current scene presentation is roughly:

- `portrait-cover` for side-view scenes;
- `vertical-board` for Potassium and Stampede;
- `full-board` reserved by policy.

That helped avoid scene-specific layout code, but Potassium and Stampede are
already showing different needs. A future shell may need typed layout profiles
such as:

- `sideViewWorld`
- `verticalArcadeCard`
- `arcadeSideRails`
- `fullBleedSketchbook`
- `sceneOverlayStage`

These profiles should remain shell policy, not Phaser scene internals.

### 5. Header Chrome Is Too Expensive On Small Screens

Inventory, Dev, Back, and Static Mode all compete for the most valuable mobile
space. Some scenes do not need every global control always visible. Static Mode
can move into a menu, a less prominent corner, or disappear from scene-focused
play if it blocks better gameplay layout.

Header chrome should be scene-aware and priority-based:

1. scene escape/back;
2. required gameplay or debug controls;
3. optional global mode switch.

### 6. Scene UI Needs Placement Rules, Not One-Off Fixes

Scene UI currently supports status and panel surfaces. Potassium can request an
overlay chrome style; Stampede mostly uses default scene UI panels and a footer
status. That is good enough for M4d, but a scalable system needs placement rules:

- where status lives in portrait, landscape, and desktop;
- whether a panel blocks gameplay;
- whether a panel centers in the card or viewport;
- how far it may extend beyond the canvas;
- how touch input is gated under a panel.

## Design Goals

- Preserve the Digital Sketchbook identity: paper, ink, thick borders, hard
  offset shadows, handwritten emphasis only where readable.
- Use more of the viewport without turning the game into a generic dashboard.
- Keep the playfield readable first; put text-heavy UI in DOM.
- Make mobile landscape a deliberate layout, not a squeezed portrait layout.
- Let arcade scenes use a larger touch/control surface than the visible canvas.
- Keep shell layout policy in React and scene gameplay state in Phaser/runtime.
- Avoid a broad rewrite before one prototype proves the direction.

## Static Prototype Lab

Open the static prototype lab here:

[`docs/prototypes/interactive-shell/index.html`](../prototypes/interactive-shell/index.html)

The lab intentionally has no Phaser and no bridge. It now keeps one stable
candidate instead of several equal concepts, so review can focus on whether the
recommended shape is worth implementing.

Earlier exploration options were:

- current card plus wider touch;
- full-screen sketchbook stage;
- responsive side rails;
- scene overlay stage;
- scene layout profiles.

Those were folded into the two current coded candidates below. As of May 11,
2026, **Notebook Hybrid is Danilo's favorite candidate so far**. Stable Hybrid
remains the practical baseline/fallback.

The next refinement artifact is the template tournament:

- [`notebook-hybrid-template-tournament.md`](./notebook-hybrid-template-tournament.md)
  records the scene-template matrix, judging rubric, current winners, and mood
  frame prompts.
- [`docs/prototypes/interactive-shell/tournament.html`](../prototypes/interactive-shell/tournament.html)
  previews Current Overworld, Ridge, Potassium, Stampede, Telegraph, and Domino
  across practical, expressive, and mobile-first variants.
- [`docs/prototypes/interactive-shell/notebook-template-tournament-moodboard.png`](../prototypes/interactive-shell/notebook-template-tournament-moodboard.png)
  captures the four-panel mood direction from the tournament pass.
- [`docs/design/notebook-shell-design-language.md`](../design/notebook-shell-design-language.md)
  captures the reusable shell primitives and profile families to consider
  before runtime or Storybook work.

## Practical Baseline: Hybrid Shell

This combines the strongest parts of C and D:

- use low-chrome margin UI when there is real horizontal space;
- keep portrait close to the current card/status rhythm;
- render scene panels in a viewport-level scene UI stage;
- make the arcade touch/control field larger than the visible card;
- allow optional global chrome, such as Static Mode, to collapse into a compact
  menu or disappear from scene-focused play.

Pros:

- fixes mobile landscape without forcing every scene into a full-screen redesign;
- preserves the sketchbook card as the visual anchor;
- gives text-heavy UI enough room to breathe;
- keeps Phaser gameplay objects and React scene UI cleanly separated;
- creates a small path to scene layout profiles without committing to a large
  framework up front.

Cons:

- introduces more shell policy than the current single-card layout;
- needs careful input gating so touch drags outside the card do not conflict
  with buttons, overlays, or page scrolling;
- side rails can become noisy if they turn into extra cards; the preferred
  treatment is margin chrome, not boxed panels;
- the implementation will touch shared shell and scene UI seams, so it should
  land as one serialized slice before M4e.

Reviewer refinements applied to the prototype:

- persistent side actions were removed from normal play; scene actions should
  live in the panel/result state or shell header when genuinely global;
- modal actions should remain reachable through sticky or non-scrolled action
  rows;
- phone landscape should use compact edge chips/margin notes, not boxed side
  cards;
- tablet landscape must be tested separately from tablet portrait;
- the large touch field should feel like paper in shipped UI, not a visible
  dashed control box.

Runtime rules this implies:

- input priority is UI panel/buttons/menu first, active drag capture second,
  shell arcade input third, Phaser canvas fallback last;
- high-frequency pointer movement should use an imperative input adapter rather
  than React state updates per frame;
- scene panels must be clipped by the app viewport, not by the game card or an
  intermediate shell wrapper;
- scene panel placement should support `card`, `viewport`, and `wideViewport`
  chrome with safe-area padding, max-height, scroll containment, focus handling,
  and pointer gating.

## Preferred Candidate: Living Notebook Shell

The preferred direction is a more explicit notebook metaphor:

- the whole interactive mode becomes an open notebook surface;
- each scene is a page, spread, taped insert, or margin sketch;
- Phaser renders the living drawing on the page;
- React renders notes, buttons, prompts, overlays, and page chrome as DOM paper
  pieces above it;
- plain paper is gameplay input unless a note/button/panel sits above it;
- panels are loose sheets that can span the page or notebook spread.

Layout shape:

- desktop/tablet: open notebook spread, with playable page plus a notes/status
  page or margin;
- phone portrait: single page fills the viewport, with compact tabs and
  bottom/torn-paper status;
- phone landscape: sideways notebook spread, central playable page, margin
  status, compact edge tabs;
- Potassium can be a board-like ruled page with extended drag mat;
- Stampede can be a cleaner full-page survival sketch.

Pros:

- more distinctive than a game inside a card;
- uses empty space as part of the game fantasy;
- naturally explains overlays, notes, menus, and larger touch areas;
- could make mobile landscape feel intentional.

Risks:

- bigger conceptual and implementation shift than the stable hybrid;
- easy to over-theme with too many sticky notes, arrows, tabs, and scraps;
- input coordinate mapping gets more complex when the touch surface is larger
  than the canvas;
- still needs disciplined scene profiles so every scene does not invent a new
  notebook rule set.

Current static trial:

- [`docs/prototypes/interactive-shell/index.html`](../prototypes/interactive-shell/index.html)
  includes a `Notebook Hybrid` concept toggle beside the stable hybrid. The
  Notebook Hybrid is the current favorite candidate to refine next.
- [`docs/prototypes/interactive-shell/notebook-shell-moodboard.png`](../prototypes/interactive-shell/notebook-shell-moodboard.png)
  is the generated mood frame used as the visual north star.

Refinement focus before runtime implementation:

- make phone landscape feel as strong as the mood frame without shrinking tap
  targets too much;
- keep notebook notes/tape/tabs restrained so gameplay stays readable;
- prove touch outside the visible canvas works while buttons/panels block input;
- decide whether Potassium's board page and Stampede's survival page can share
  one notebook-shell implementation with scene profile parameters.

## Mood Frame Prompts

Use image generation for mood frames, not exact product UI mocks.

### Full-Screen Living Notebook

```text
A hand-drawn browser game interface mood frame, full-screen digital sketchbook
notebook UI, the entire viewport feels like an open notebook page on a desk.
A simple playable game world sits directly on the paper, not inside a heavy app
frame. Pencil-drawn margin notes, arrows, small taped labels, and lightly
sketched side annotations surround the play area. A centered modal panel floats
above the page like a taped paper note, readable and high contrast.
Touch/control areas are hinted by faint graphite smudges and soft pencil
boundaries, extending beyond the visible game world. Black ink outlines,
off-white paper, subtle marker accents, indie coming-of-age journal mood,
hand-drawn but clean, readable, modern browser game shell, spacious composition.
```

### Mobile Landscape Notebook Arcade

```text
A responsive mobile-landscape browser game shell concept in a hand-drawn
digital sketchbook style. Wide phone screen used efficiently: central gameplay
page is large and clean, with lightweight handwritten status notes in the left
margin and compact action buttons in the right margin. A small menu replaces
bulky global navigation. The game area and touch surface extend across the
notebook page, with interactive zones shown as subtle pencil shading, not hard
UI boxes. A floating modal appears centered above the game world, like a paper
insert taped into a notebook. High-contrast ink, minimal clutter, playful
school-notebook details, readable typography, tactile hand-drawn UI, no fantasy
ornaments.
```

### Notebook Scene Profiles

```text
A mood frame for a scalable hand-drawn notebook-based browser game interface
where each game scene is a different notebook page. One page shows a clean
survival arena, another has board-like ruled paper lanes, with shared shell
language across scenes. UI elements float as paper scraps, sticky notes, side
annotations, and small pencil icons over and around the game world. A large
accessible modal is layered above the page, while status information lives as
margin writing or footer notes. The clickable/touchable area is suggested by
gentle graphite washes around the page, allowing interaction outside the visible
game card. Digital Sketchbook aesthetic, black ink outlines, soft paper texture,
restrained marker accents, readable and spacious.
```

Avoid generic fantasy frames, ornate gold borders, sci-fi HUDs, neon
glassmorphism, dark blurred backgrounds, tiny readable text, and too many sticky
notes competing with gameplay.

## Recommended Next Slice

Add **M4d.5 Responsive Shell and Input Surface** before M4e.

Acceptance should be small:

- refine and implement the Notebook Hybrid direction for Stampede and Potassium
  first, using Stable Hybrid as the practical fallback if a layout breaks down;
- define scene layout profile names and responsibilities;
- make arcade touch/control area intentionally larger than the visible canvas;
- support mobile landscape without clipping key panels or wasting side space;
- document where Static Mode lives when a scene needs the header space.

Do not migrate every scene in the same slice. Stampede and Potassium are enough
to validate the pattern because they already exercise arcade input, scene UI
panels, footer/status, and scene-aware Back chrome.

Runtime checkpoint:

- Potassium is the first `ruledBoardPage` runtime client and keeps its visible
  board frame separate from the wider shell control mat.
- Stampede is the first `survivalPage` runtime client and reuses the same
  owner-scoped control-mat pointer bridge for drag-to-move outside the visible
  page.

## Decisions From Review

Decided on May 11, 2026:

- **Static Mode can move behind compact chrome.** It does not need to stay
  globally visible on every interactive scene when it costs scene layout space.
- **Arcade touch should cover more than the card.** The larger the valid input
  area, the better, as long as clickable UI layers sit above it and do not
  conflict with gameplay gestures.
- **Potassium and Stampede can use different arcade profiles.** Potassium can
  remain more board-like because enemies flow top-to-bottom, while Stampede can
  use a larger cleaner survival field because pressure can arrive from multiple
  directions. Both still need touch gestures to continue working when the
  player's finger leaves the visible card/canvas.
- **Ridge/Overworld should enter the profile system as the default side-view
  profile, but should not be visually reworked in M4d.5.** The profile system
  should name and protect the current side-view behavior without forcing arcade
  layout changes onto exploration scenes.

Remaining implementation question:

- Should the first arcade touch field be literally whole-shell, or a large
  shell-level "control mat" that excludes header/menu/panel/status hit areas?
  The recommended first implementation is the control mat because it is easier
  to test and less likely to fight browser scrolling or UI buttons.

## Suggested Evaluation Checklist

For each POC, test:

- phone portrait: panel actions reachable, status readable, touch target large;
- phone landscape: no cramped header/footer, playfield remains central;
- desktop: side space is useful but not noisy;
- overlay state: panel centers and scrolls when needed;
- gameplay state: normal play keeps center and lower-middle playfield clear;
- implementation risk: minimal bridge/shared runtime churn.

For the tournament pass, also judge:

- whether a scene can reuse one of the named profile families;
- whether the notebook treatment explains input instead of adding decoration;
- whether a generated mood frame can be translated into static HTML rules;
- whether the winning variant still has a Stable Hybrid fallback.
