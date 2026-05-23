# Ridge Blockout Fun Review

Status: design review of
[`folded-desk-ridge.source.ts`](../../../../../src/game/scenes/ridge/blockout/sources/folded-desk-ridge.source.ts).

This review scores the first text skeleton against the current research notes on
2D map design, Lucky Luna, and Nine Sols.

## Verdict

Initial projected fun: **7.2 / 10**.

After Blockout Pass 2: **8.0 / 10**.

Potential after parser playtest and tuning: **8.5 / 10**.

The current blockout is a strong topology skeleton: it has vertical climb,
Cicka as a return anchor, visible long-term destination, and multiple future
loops. It is not yet a strong playable map because the movement texture is
still mostly generic platforms, and the Lucky Luna-style descent is isolated in
a future optional pocket instead of being part of the first-route joy.

Do one map-quality pass before source compiler/runtime implementation.

Update: Blockout Pass 2 resolved the first hard blockers:

- no non-empty cell overlaps across the seamless world
- Stampede now opens a real fall/steer fold-drop shortcut via Switchback
- Work Artifact has an early optional skill-scrap pocket
- Cicka Home has a mutation ledger for Work, Stampede, Telegraph, Relay, and
  Domino progress
- key sightline rectangles are named for future debug overlay work

## Scorecard

| Criterion | Score | Notes |
| --- | ---: | --- |
| Cognitive topology / grokking | 17 / 20 | Good vertical route and "above Cicka" promise. Relay works as destination. |
| Cicka return anchor | 16 / 20 | Strong hub placement, but return routes need to feel physical and immediate after mini-games. |
| Movement fun | 11 / 20 | Too much generic platforming. Needs named traversal toys: chute, cord, lift, broad jump, drop steer. |
| Rhythm and density | 12 / 15 | Safe/tense/reorient beats are clear. Some rooms still have empty rows without a purpose. |
| World-first identity | 13 / 15 | Desk/paper/cord/domino language is strong. Need stronger environmental logic per gap. |
| Backtracking transformation | 11 / 15 | Shortcuts exist, but Cicka Home should visibly change after more than Stampede. |
| Technical blockout health | 6 / 15 | Grid dimensions pass, but seamless room placements currently create overlapping non-empty cells. |

Initial total: **76 / 100**.

Post-pass design estimate: **80 / 100**. Movement feel remains unverified until
the runtime renders the whole world and we can actually traverse it.

## What Works

- **Vertical Folded Ridge reads clearly.** The route climbs from Outskirts to
  Relay while switching left/right instead of becoming a hallway row.
- **Cicka Home is correctly central.** It sits low enough to be a home base and
  high enough to be seen from above.
- **Relay Gate is a good weenie.** It gives the map a destination before the
  player understands every route.
- **Nine Sols hub lesson is present.** Cicka Home can become this game's Four
  Seasons Pavilion: safe, emotional, and mechanically useful.
- **World-first props are promising.** Saturn sticker, Hummingbird feather,
  heavy bag, signal wire, coffee rings, and domino lift are better than generic
  "portfolio buildings."

## Main Risks

1. **Movement joy is not proven.**
   The map has topology, but not enough distinctive traversal. The player
   should remember "the cord drop," "the paper fold," and "the desk lift," not
   only room names.

2. **Lucky Luna influence is too late.**
   `drop_pocket` is future optional. The first playable loop should already
   include a safe fall/steer moment, probably the Stampede or Telegraph return
   to Cicka.

3. **The first walk is still a trunk.**
   It is a good trunk, but optional choices are mostly future. Add one low-risk
   optional shelf or scrap pocket before Relay so the player learns that Ridge
   rewards curiosity early.

4. **Cicka Home evolution is under-specified.**
   `stampede_sketch` adds one memento. Each major beat should mutate Cicka Home:
   Work artifact display, Stampede note, Telegraph cord/signal, Relay proof
   glow, Domino lift switch.

5. **Seamless placement has collider conflicts.**
   Current `place` coordinates cause non-empty grid cells from different rooms
   to overlap. That may be fine for a drawing, but not for runtime output.

## Required Pre-Parser Fixes

1. **Resolve room placement overlaps.**
   Either move room beats so non-empty cells do not conflict, or add explicit
   merge rules. Recommended: no conflicting non-empty overlap in v0.

2. **Promote one descent shortcut into v0.**
   The first clear after Stampede should unlock a visible, playable fold/drop
   chute to Cicka Home. It can be forgiving and mobile-safe.

3. **Add one optional curiosity pocket before Relay.**
   Best candidate: a small Work Artifact side shelf with a minor skill scrap.
   It should not require hard movement.

4. **Add Cicka Home mutation ledger.**
   Each route beat should declare whether it changes Cicka Home.

5. **Add sightline metadata.**
   Use rectangles such as `rect sightline_to_relay` and
   `rect cicka_visible_below` so a debug overlay can confirm the map's
   mental-model promises.

## Recommended Next Move

Blockout Pass 2 is done. The next move is source compiler/runtime v0:

- validate and compile the folded desk Ridge blockout source
- validate grid dimensions and non-empty overlaps
- render whole-world greybox
- expose debug overlay for room bounds, anchors, shortcuts, and sightlines
- run the first traversal playtest from Outskirts to Relay and back to Cicka
