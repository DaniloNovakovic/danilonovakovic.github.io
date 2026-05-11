# Notebook Hybrid Template Tournament

> Design spike artifact for M4d.5. This is not shipped behavior.

## Purpose

The Notebook Hybrid is the preferred direction for interactive mode, but it
needs to become a reusable shell language instead of a set of one-off nice
screens. This tournament compares scene templates across current and planned
scenes, then extracts shared rules for runtime profiles and future Storybook
work.

The tournament ruling is:

- Notebook Hybrid is the preferred visual direction.
- Stable Hybrid remains the fallback if the notebook treatment becomes noisy.
- Mobile-first constraints are the judge, especially phone landscape.
- Scene profiles are the reuse mechanism.

## Tournament Method

Each scene gets three variants:

| Variant | Purpose |
| --- | --- |
| Practical/scalable | Smallest architecture step from the current shell. |
| Expressive notebook | Strongest paper/page fantasy. |
| Mobile-first | Harshest test of touch, landscape, and reachable actions. |

Every variant uses the same slots:

- page format
- playfield shape
- touch/control surface
- status placement
- panel/overlay placement
- header/back/menu behavior
- mobile portrait behavior
- mobile landscape behavior

Image generation should be used for mood frames only. Exact UI composition,
hit areas, responsive behavior, and implementation contracts should be proven
with static HTML/CSS prototypes and then runtime tests.

## Evaluation Rubric

Score out of 100. Higher implementation-cost score means cheaper and safer to
ship.

| Category | Weight | What To Judge |
| --- | ---: | --- |
| Hand-drawn identity | 15 | Digital Sketchbook paper, ink, thick borders, offset shadows, restraint. |
| Mobile portrait | 12 | Reachable actions, readable status, no vertical crowding. |
| Mobile landscape | 16 | Width used intentionally, not a tiny card with wasted margins. |
| Input/touch ergonomics | 15 | Large control mat, clear UI priority, UI blocks gameplay input. |
| Playfield readability | 15 | Gameplay stays primary; notes and panels do not pollute danger space. |
| Reuse across scenes | 14 | Supports Stampede, Potassium, Ridge, and future scenes without bespoke hacks. |
| Implementation cost | 13 | Shared-runtime churn is small, testable, and reversible. |

Current family score:

| Variant Family | Score | Verdict |
| --- | ---: | --- |
| Practical/scalable | 82 | Best fallback. Strong architecture, weaker identity. |
| Expressive notebook | 76 | Best fantasy, highest clutter risk. |
| Mobile-first | 83 | Best pressure test. Use it as constraint, not sole style. |
| Hybrid winners | 85 | Favorite: Notebook Hybrid on Stable Hybrid architecture. |

Critical ruling: Notebook Hybrid wins, Expressive Notebook alone loses, Stable
Hybrid survives as fallback, and Mobile-First becomes the test discipline.

## Scene-Template Matrix

| Scene | Variant | Page Format | Playfield Shape | Touch/Control Surface | Status Placement | Panel/Overlay Placement | Header/Back/Menu | Portrait | Landscape |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Current Overworld / Outskirts | Practical | Default side-view profile | Wide horizontal strip | Existing swipe/tap shell gestures | Thin footer hint | Global overlays | Current policy | Current rhythm | Cropped side-view, minimal chrome |
| Current Overworld / Outskirts | Expressive | Single rough trail page | Ink street across page | Whole paper strip accepts walk/interact | Margin note or torn footer | Trail Cards/manual as taped sheets | Page tabs | One page, footer prompt | Sideways page with tiny notes |
| Current Overworld / Outskirts | Mobile-first | Phone-first side-view page | Tall-safe horizontal strip | Lower paper control mat | Bottom torn prompt | Viewport modal | Back primary, menu compact | Readable prompts | Hide nonessential chrome |
| Ridge / Hobby Ridge | Practical | Side-view world profile | 3-5 screen ridge strip | Shared movement/interact gestures | Compact route/stamp strip | Trail Cards/manual overlays | Back to parent, compact menu | One trail page | Left/right status chips |
| Ridge / Hobby Ridge | Expressive | Open notebook spread | Ridge on playable page, notes on side page | Paper around trail accepts movement | Notes page or margin stickers | Trail Cards as taped sheets | Page tabs, Static in menu | Single page | Central trail plus slim notes |
| Ridge / Hobby Ridge | Mobile-first | Single-page trailhead | Wide side-view crop | Thumb-safe lower mat | Bottom stamp/pip strip | Full-viewport card | Back visible, menu subdued | Prompt/status stack | Side chips for objective |
| Potassium Slip | Practical | Vertical arcade board | Tall 5-column ruled board | Large mat around visible board | Wave/score/lives top or side | Draft/terminal scene UI | Back/menu compact | Board centered | Board plus status chip |
| Potassium Slip | Expressive | Ruled notebook board | Tall lane page with banana-law scraps | Whole ruled page supports drag/recall | Clipboard margin note | Draft as taped compliance form | Back tab high priority | Tall page, footer hint | Sideways notebook, tall board |
| Potassium Slip | Mobile-first | Portrait board first | Maximum-height board | Drag/recall mat excludes UI | Top mini HUD | Bottom/center sheet | Back small, menu tab | Board nearly fills viewport | Board plus narrow status rail |
| Stampede Sketch | Practical | Clean arcade page | Large survival field | Mat larger than canvas | Timer/pressure edge chip | Start/result/upgrade viewport panel | Back/menu compact | Field plus bottom status | Central field, status edge |
| Stampede Sketch | Expressive | Full-page survival sketch | Open paper arena around picnic mark | Whole page drag/floating stick | Margin pressure scribble | Taped sheet | Page tabs | Single page, torn footer | Spread with tiny left notes |
| Stampede Sketch | Mobile-first | Touch-first arena page | Largest clean arena | Full lower/center drag field | Bottom compact HUD | Sticky modal actions | Back visible, menu secondary | Big thumb-safe arena | Central arena, edge HUD only |
| Telegraph Terrace | Practical | Timing-lane profile | Cliff/bag lane | One large parry surface | Tempo/confidence top edge | Manual/result viewport panel | Back/menu compact | Parry below lane | Lane center, parry edge |
| Telegraph Terrace | Expressive | Terrace practice page | Heavy bag with three timing marks | Page tap/parry surface | Tempo ticks in margin | Manual glyph sheet | Page tabs | Oversized parry area | Sideways page, readable marks |
| Telegraph Terrace | Mobile-first | One-button portrait sheet | Vertical timing stack | Thumb-sized parry surface | Top tempo strip | Short panel, sticky actions | Back primary, menu tucked | Button dominates lower half | Bag left, parry right |
| Domino Desk | Practical | Puzzle-board profile | Compact desk grid | Tap-select, swipe-slide, undo | Moves/undo top or side | Hint/result viewport panel | Back/menu compact | Grid centered | Grid center, edge controls |
| Domino Desk | Expressive | Messy desk insert | Dominoes on taped desk scrap | Whole scrap accepts tap/swipe | Coffee-ring move counter | Sticky hint, permit result | Page tabs | Large tiles | Grid plus slim rules margin |
| Domino Desk | Mobile-first | Puzzle-first page | Stable square grid | Tap/swipe grid, undo reachable | Tiny top strip | Bottom hint/result sheet | Back visible, menu compact | Square grid, bottom controls | Grid left/center, controls right |

## Winners By Scene

| Scene | Current Winner | Reason |
| --- | --- | --- |
| Current Overworld / Outskirts | Practical with notebook trim | Preserve existing side-view behavior while preparing profile naming. |
| Ridge / Hobby Ridge | Expressive restrained | The Ridge should sell the notebook fantasy, but not become a map screen. |
| Potassium Slip | Expressive board with mobile-first controls | The ruled board can be distinctive if drag/recall works outside the canvas. |
| Stampede Sketch | Mobile-first clean page | Readability and touch comfort matter more than decoration here. |
| Telegraph Terrace | Mobile-first timing page | A timing toy needs one obvious parry surface before visual flourish. |
| Domino Desk | Practical puzzle board with expressive desk trim | Stable grids and undo controls matter more than desk clutter. |

## Mood Frame Prompts

Use the prompts below when generating mood frames. Keep generated images in the
prototype folder only after selecting useful directions.

Selected tournament moodboard:

- [`notebook-template-tournament-moodboard.png`](../prototypes/interactive-shell/notebook-template-tournament-moodboard.png)
  explores the current four strongest visual directions: spread, board, arena,
  and Ridge page.

### Full Notebook Spread System

```text
Mood frame for a hand-drawn Notebook Hybrid browser-game shell: an open
sketchbook spread fills the viewport, off-white paper, black ink, thick
imperfect outlines, faint graphite smudges showing the larger touch/control
surface. One playable page carries a living drawing; the opposite page holds
sparse margin status, tabs, scraps, and one loose modal sheet taped over the
spread. Spacious, readable, tactile, indie journal mood, paper-as-interface,
scene pages sharing one visual system.

Avoid exact UI mockups, dense sticky-note collage, heavy app frames, neon HUDs,
fantasy borders, tiny text, decorative clutter, and color-dependent hierarchy.
```

### Potassium Board Page

```text
Mood frame for Potassium as a board-like notebook page: ruled paper lanes,
top-to-bottom arcade flow, banana-law ricochet doodles, clipboard compliance
marks, rebound arcs, caution tape used sparingly, a clear central drag/play mat
extending beyond the visible board. Black ink on cream paper, strong
silhouettes, hard paper shadows, a few taped notes and stamps implying upgrades
without becoming menus.

Avoid literal polished game boards, busy rule diagrams, too many arrows,
realistic bananas, police or military authority vibes, bright yellow palette,
cramped panels, and unreadable handwritten paragraphs.
```

### Stampede Survival Page

```text
Mood frame for Stampede as a clean survival sketchbook page: large open paper
arena, small black ink swarm dots approaching from multiple directions, picnic
blanket landmark, XP ink drops, auto-attack doodle bursts, result stamp
language in the margins. Minimal chrome, wide readable playfield, soft hatching
only at edges, touch surface implied by smudged paper rather than boxes.
Energetic but airy.

Avoid bullet-hell visual noise, dense enemy fields near the player, dark horror
tone, flashy effects, full dashboard sidebars, oversized modal blocking the
arena, color-coded danger, and excessive impact bursts.
```

### Ridge / Overworld Page

```text
Mood frame for Ridge/Overworld as the default side-view notebook page: compact
ink ridge trail across cream paper, readable landmark silhouettes, relay spire,
hatch, picnic/stampede mark, Potassium warning sign, tiny Cicka perch and
paw-print stickers. Side-scroller composition with thick foreground contours,
thin background hatching, sparse funny-sad margin notes, memory stickers
layered after rewards. Feels like a playable sketchbook route, not a map screen.

Avoid reworking it into an arcade board, over-detailed comic panels, decorative
scenery competing with interactables, text-first affordances, generic platformer
UI, colorful stickers, and crowded landmark clusters.
```

## Guardrails

- Use notebook metaphor to explain layout, not to add decoration.
- Keep black/white/cream first; color is sparse material tint only.
- Never place decorative scraps inside the active danger/readability zone.
- Tabs are navigation, not general-purpose ornament.
- Each scene gets one primary status locus and one primary panel/action locus.
- Touch/control surfaces may be larger than the visible canvas, but UI buttons,
  panels, tabs, and menus always sit above and block gameplay input.
- Phone landscape is a required review mode, not an afterthought.
- Do not move this to Storybook until the shell language survives at least one
  runtime implementation slice.
