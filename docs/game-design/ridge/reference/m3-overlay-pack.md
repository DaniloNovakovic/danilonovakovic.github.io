# Sketchbook Ridge M3 Overlay Pack

> Overlay Readability Designer's overlay and manual-page visual readability
> reference pack. The `M3` name is historical.
> This is a practical spec for Trail Cards, Manual Pages, and monochrome
> reward/locked language. It should guide implementation without creating final
> art pressure.

## Scope

Use this pack with:

- `docs/game-design/ridge/README.md`
- the active route/area doc for the task
- `docs/game-design/ridge/summit.md`
- `docs/game-design/ridge/milestone-plan.md`
- `docs/design/style-guide.md`
- `.agents/rules/30-react-overlays.md`
- the current `OverlayDialogFrame`, `DialogCard`, `TrailCardOverlay`, and
  `ManualPageOverlay` implementation

Do not use legacy/prototype docs as active source of truth unless the Ridge
router or active task sends you there.

## Overlay Thesis

- Overlays are pause-breath moments from the Ridge, not separate app screens.
- Every overlay must read in black and white at phone distance before it earns
  extra personality.
- Trail Cards answer one opt-in question: what is this, how long is it, what
  might I get, and can I enter now?
- Manual Pages are one-screen "re-see" clues: one idea, one little margin
  human moment, no lore dump.
- Paper texture, ink weight, dashed borders, hatching, stamps, and negative
  space carry state. Color must not carry meaning.

## Implementation Anchors

- React owns overlays through `OverlayHost` and `overlayRegistry`.
- Phaser scenes own triggers and return behavior.
- Overlay state must move through the bridge. Do not add Phaser imports,
  window backdoors, local overlay maps, or polling.
- The outer frame is `OverlayDialogFrame` -> `DialogCard`: thick black border,
  off-white paper, hard offset shadow, `max-width: 600px`, and
  `max-height: 92dvh`.
- Inner overlay sections should be lightweight paper scraps, not nested shared
  `Card` or `DialogCard` components.

## Trail Card Visual Spec

### Current Disabled State

Purpose: make the mini-game invitation feel real while honestly saying the
scene is not wired yet.

- Composition: title in the `DialogCard` heading, then four flat scraps:
  mood, time, reward, unavailable.
- Mood: full width, normal sentence case, one sentence.
- Time and reward: two columns on desktop, stacked on mobile.
- Unavailable: full width, dashed border, light paper fill, no warning color.
- Actions: `Back to Ridge` remains secondary. `Enter` remains present but
  disabled so the future action is visible without being fake.
- Disabled affordance: use opacity, dashed outline, and/or hatching. Do not use
  red, yellow, blur, or low-contrast gray text.
- Tone: copy should feel like a trail sign, not a ticket blocker.

Recommended disabled visual order:

1. Mood scrap.
2. Time and reward scraps.
3. Dashed unavailable scrap.
4. Back and disabled Enter buttons.

### Future Enabled State

Purpose: once a mini-game is wired, the same card becomes a clean opt-in
launcher.

- Replace the unavailable scrap with a readiness scrap only when useful:
  `Ready`, `New`, `Replay`, or `Cleared`.
- Make `Enter` the only filled-ink primary button. `Back to Ridge` stays
  secondary.
- If icons are added, use the existing button `icon` prop with a small Lucide
  icon such as play/door/arrow. Keep the text label for clarity.
- Completion should not turn the card colorful. Use a stamped mark, filled pip,
  check stroke, or small tilted paper tab.
- Replays should still show the reward state: `Stamp owned`, `Glide pip owned`,
  or `Manual page found`.
- If a requirement is missing, keep the enabled layout but change the action
  state to locked rather than inventing a second card layout.

## Manual Page Visual Spec

Manual Pages are not encyclopedia entries. They are evidence that the world can
be re-read.

### Clue Panel

- The clue panel is the primary reading surface and should occupy most of the
  overlay body.
- Use one strong paper area with a thin ink border, notebook rule lines,
  binder holes, torn-edge marks, or a dog-eared corner.
- Keep the clue in one or two short sentences. The player should understand the
  hint without scrolling or parsing a paragraph.
- Use high-contrast ink. Any existing colored notebook rule should become black
  ink at reduced opacity before final polish.
- The clue can be poetic, but it must still point at one route, sign, mechanic,
  or reward condition.

### Margin Note

- The margin note is flavor, not required instruction.
- It can sit below the clue on mobile and to the side only if desktop space
  makes that cleaner.
- Treat it as handwriting: smaller, looser, funny-sad, and disposable.
- Do not put critical puzzle information only in the margin note.
- Use dashed border, tape marks, paw print, or a folded scrap edge instead of a
  nested card.

### One-Screen Readability

- Default Manual Pages should fit without scrolling at 360 x 640 CSS pixels.
- Scrolling is acceptable only as an emergency fallback for localization or
  browser chrome, not as the designed reading mode.
- The title, clue, margin note, and close button must all be visible together
  on common phone sizes.
- The close button must never overlap the title text. Long titles should wrap
  under the reserved close-button space.

## Mobile Readability And Copy Budgets

Design against 360 x 640, 390 x 844, 768 x 1024, and 1280 x 720.

Trail Card budgets:

- Title: 28 characters target, 36 maximum.
- Mood: 70 characters target, 95 maximum.
- Time: 18 characters target, 24 maximum.
- Reward: 24 characters target, 32 maximum.
- Unavailable or locked reason: 64 characters target, 88 maximum.
- Button labels: 14 characters target.

Manual Page budgets:

- Title: 32 characters target, 42 maximum.
- Clue panel: 110 characters target, 150 maximum.
- Margin note: 64 characters target, 90 maximum.
- Labels: 12 characters target.

Typography constraints:

- Do not scale font size with viewport width.
- Avoid uppercase for multi-sentence reading text.
- Use handwriting-style text for titles, labels, and margin flavor only. Dense
  clue reading needs clean, bold, high-contrast text.
- Preserve `overflow-wrap: anywhere` or equivalent protection for user-visible
  copy.
- Minimum touch target for primary actions: 44 x 44 CSS pixels.

## Paper-Cut Component Rules

- Only the outer overlay is a `DialogCard`.
- Do not place `Card`, `DialogCard`, or a second shadowed surface inside the
  overlay body.
- Inner sections are scraps: `section`, `aside`, `dl`, or `div` with a thin
  border, dashed border, notebook line, tape mark, or simple paper fill.
- Inner scraps should use small radius only, roughly 4px to 8px. The outer
  `DialogCard` may keep its current larger radius.
- Keep the hard offset shadow on the outer frame only. Inner shadows make the
  overlay feel like cards inside cards.
- Use `#1a1a1a`, `#fbfbf9`, `#f4f1ea`, `#e8e5df`, white transparency, and ink
  opacity before introducing any new values.
- If a repeated shadow, border, or paper value spreads, promote it to shared UI
  tokens rather than scattering arbitrary classes.
- Hatching can be CSS, but it must stay subtle and monochrome.
- A scrap can overlap the clue panel by a few pixels only if it never covers
  text or controls on mobile.

## Reward And Locked Vocabulary

Use monochrome only. State should survive grayscale, low saturation, and quick
phone glances.

Rewards:

- Stamp: tilted rubber-stamp outline, heavy ink border, label such as `STAMPED`
  or the hobby name.
- Sticker: cut-paper silhouette with thick ink outline, white fill, tiny lifted
  corner, and no colored fill.
- Manual Page: dog-eared page, binder holes, notebook lines, or torn strip.
- Glide Pip: small feather/pip mark. Empty outline means unearned, filled ink
  means owned.
- Shortcut: dashed blocked route becomes patched tape, solid arrow, or opened
  seam.
- Circuit: black circuit trace with white negative-space spark or banana shape.
- Cicka Note: paw print, scratch tick, or tiny `meow` bubble near the relevant
  clue.

Locked or unavailable:

- Dashed border, cross-hatching, hollow stamp, or taped-over action area.
- Plain copy: `Not wired yet`, `Needs a stamp`, `Find the page first`.
- Keep text contrast high. Do not use disabled opacity so aggressively that the
  reason becomes hard to read.
- No padlock color coding. If a lock icon appears, pair it with text.

## QA Checklist

- Open Ridge with a fast dev route such as `?startScene=ridge`.
- Open each Trail Card target: Stampede Sketch, Telegraph Terrace, Domino Desk.
- Open at least one Manual Page fixture or trigger once available.
- Review 360 x 640, 390 x 844, 768 x 1024, and 1280 x 720 viewports.
- Confirm there is no horizontal scroll.
- Confirm normal-budget copy fits without overlay body scrolling.
- Confirm long title and long locked reason wrap without covering the close
  button, action buttons, or following scraps.
- Confirm touch targets are at least 44 x 44 CSS pixels.
- Confirm the disabled Enter state is visible, understandable, and clearly not
  clickable.
- Confirm keyboard focus, Escape/back behavior, and close return to the Ridge.
- Confirm opening an overlay pauses scene input through the bridge/lifecycle
  path.
- Confirm screenshots still communicate reward/locked state in grayscale.
- Confirm no nested `Card` or `DialogCard` was introduced inside overlay bodies.
- Confirm no overlay imports Phaser or bypasses the bridge.

## Open Taste Questions For Danilo

- Should Manual Pages feel cleaner, like a field guide, or messier, like a page
  torn from a private notebook?
- Should stamps feel official and bureaucratic, or affectionate and doodled?
- How direct should reward previews be: exact reward names or poetic hints?
- How silly can margin notes get before they start weakening the clue?
- Should Cicka marks be rare special tells, or a common clue-language across the
  Ridge?
