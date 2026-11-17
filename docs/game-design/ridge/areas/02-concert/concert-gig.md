# Concert Gig

> Status: implemented.
> Parent: [`README.md`](./README.md).

The Concert Crossing rhythm mini-game: three-lane note highway, guitar-hero
style, with the Forgiving Practice Riff as its tutorial.

- Entry: Steve's "Could I play instead?" → "Teach me the phrase." opens the
  **practice riff**. Once practiced, Steve (or the stage, "Take the stage")
  offers "Let's play the show." After the crossing clears, the stage offers an
  **encore** for replay.
- Lanes: low / middle / high, shown as circle / diamond / square glyphs so they
  read without colour. Keys `A S D`, arrows `← ↓ →`, `J K L`, or `1 2 3`; on
  touch, three big buttons under the highway, or tap a lane on the highway card
  itself (the gig panel captures scene pointers, so the walk mat steps aside).
  Key letters sit inside the targets on pointer-fine screens. Keys judge at the
  key event's own timestamp, not the frame it is read on.
- Song data: `src/game/core/ridge/concertGig/song.ts`. Bars are eight eighth-note
  slots (`.` rest, `0-2` lane, `x y z` two-lane chords). Lanes are chord tones
  of the bar's chord, so every hit is in key. The show ("Still Here", 116 BPM,
  about a minute): intro (Steve's phrase), verse, chorus, crowd-sing breakdown,
  finale.
- Judging (`concertGig/gig.ts`): perfect within 55 ms, good within 135 ms, past
  that the note is missed. Hits raise crowd hype and the combo (score multiplier
  every 10, up to ×4); misses drain hype. A stray strum (no note there) breaks
  the combo and weighs half a note against accuracy, but never drains hype:
  mashing every lane grades Rough.
- Never fails: the show always plays to the end and always clears the crossing.
  Non-arcade fallback: "Let the band finish" under the strum buttons plays the
  rest out without you (unplayed notes count as missed) and still clears it;
  practice already lets you through after its last pass.
  The grade (Legendary ≥ 90% / Great ≥ 72% / Good ≥ 45% / Rough) changes the
  crowd's and Steve's reaction, and a Great+ show coaxes Cicka to the stage edge
  if you sat with her first.
- Practice: up to three passes of the seven-note phrase at 96 BPM. Landing 5 of
  7 in a pass ends practice; running out of passes lets you through anyway and
  Steve says so ("you kept coming back to it"). "Step away" leaves practice.
- Kid hype man: talk the Skater Kid into it (sticker → "Get the crowd going")
  and the show starts with the crowd warmer (hype 0.68 instead of 0.5) and a
  front-row clap: claps on two and four from the count-in through the intro,
  with the kid bouncing on the beat.
- Presentation: the highway is a paper card pinned in screen space, clear of the
  panel chrome on any screen (the frame expands on phones, like the workbench).
  Stage spotlights warm with hype, notes float off the guitar on hits, lighters
  come up over the crowd when it is really with you, confetti on a warm finish.
- Audio (`runtime/concertGigAudio.ts`): Phaser's Web Audio context and master
  bus. A synthesized street band (kit, bass, a humming crowd in the breakdown)
  is booked a short lookahead ahead on the audio clock, and the playhead is read
  back from that clock. The lead is a Karplus-Strong pluck voiced by your hits.
  Locked or missing audio runs silently on the frame clock; every cue has a
  visual twin. Overlay pause mutes the band and freezes the song clock.
- Scene UI actions (strums, "Let the band finish") reach the scene through the
  bridge's pending-action FIFO (capped at 16, oldest dropped), drained every
  frame so a two-finger chord lands both lanes.
- Console: `gig hit` (next note, on time), `gig hit 0|1|2`, `gig wait [ms]`,
  `gig auto`, `gig skip`, `gig done`.
