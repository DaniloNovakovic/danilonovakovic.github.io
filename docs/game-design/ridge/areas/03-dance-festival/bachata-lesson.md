# Bachata Lesson And Cat Serenade

> Status: implemented.
> Parent: [`README.md`](./README.md).

The Dance Festival's two music moments. Both run on the Concert Gig's rhythm
judge (pure, clock-free, never fails); see
[`../02-concert/concert-gig.md`](../02-concert/concert-gig.md) for judging windows.

## Bachata Lesson (One-Step Practice)

- Entry: the driver's "Are you dancing tonight?" → "What if you learned just
  one step?" asks for the Profe; her "The driver wants one step. Privately." →
  "Let's go" opens the lesson behind the shuttle shelter. After he has his
  step, the Profe offers "Can we run the step again?" as a replay.
- Feet, not strings: lane 0 is step left, 1 the hip tap, 2 step right. Keys
  `← ↓ →`, `A S D`, `J K L`, or `1 2 3`, and `Space` is also the tap; on touch
  three big buttons (◀ Step, ★ Tap, Step ▶). On keyboard screens the panel
  shows one legend chip per step, using the strip's glyph and that step's
  keys (playtest: the tap key was not obvious).
- Chart (`src/game/core/ridge/bachata/lesson.ts`), 112 BPM, about half a
  minute: the Profe's count-in "5, 6, 7, 8", then `count` (two eights, claps
  and a güira scrape only), `basic` (güira, bongó martillo, bass), `together`
  (the driver joins, the requinto answers), `flourish` (one last eight).
  Each eight is "1, 2, 3, tap; 5, 6, 7, tap": step, close, step, and the free
  foot taps while the hip pops.
- The driver's **nerve** is the crowd meter: it starts at 0.3 (0.45 if you
  encouraged him first) and climbs as you keep the count. Facing you, he mirrors
  you, lagging the count until his nerve steadies; your misses make him stumble.
- You move when you step: a landed step glides you to its footwork and prints
  ink footprints on the boards; a missed one lands late with an "oops".
- Never fails. "Just count it for him" plays the rest out (unplayed steps count
  as missed) and he still gets his step; "Step away" leaves without it. The
  grade (`dance_grade_*`) picks the Profe's and driver's reactions.
- The first-ending path needs no rhythm skill: starting the lesson is required
  (it is how the driver gets his step), but the skip button satisfies it.
- Presentation: a paper step strip pinned above the panel (steps slide toward
  the mark with the count under each), the Profe's call shown big over it, the
  camera framing the three dancers; foreground grass fades out of the way.

## Cat Serenade (optional guitar)

- Entry: "Look under the chairs" → "Play him something soft on Steve's guitar."
  Replay later from the cats: "Play them the song again."
- A gig in `serenade` mode: the three-lane highway (docked right so the cats
  stay in view), a 104 BPM requinto line in A minor (`CAT_SERENADE_SPEC`), a
  quiet bachata trio underneath. The meter is the cat's **curiosity**; as it
  warms, he edges out from under the chairs toward Cicka.
- Always ends with him out and sitting beside Cicka (`dance_cat_serenaded`);
  a rough take just changes the line. "Stop playing" leaves him hiding.

## Audio

`src/game/scenes/ridge/runtime/bandScore.ts` holds what the band plays (street
kit for the Concert, bachata trio for Last-Stop Plaza); `concertGigAudio.ts`
holds the voices: güira (filtered noise scrapes), bongó (pitch-dropped sine plus
skin noise), bass, requinto (Karplus-Strong pluck). Danced steps scuff the
boards; the hip tap is answered by a bongó slap. Every cue has a visual twin.

## Console

`dance step` (next step on the count), `dance left|tap|right`,
`dance wait [ms]`, `dance auto`, `dance skip`, `dance done`. The serenade
uses the gig verbs (`gig hit`, `gig auto`, `gig done`).
