# Relay Ending Area

> Status: active ending direction / needs staging pass.
> Read [`../../README.md`](../../README.md) and
> [`../README.md`](../README.md) before editing this file.

This file owns local design detail for **Relay Spire / Guitar Farewell / Cicka
Threshold Farewell**. The route-level ending order and fixed area chain live
in [`../../story-level-bible.md`](../../story-level-bible.md).

## Route Role

Relay Ending Area is the final threshold after the player clears the fixed
Bridge, Concert, and Dance Festival area barricades.

The emotional idea is: **I am ready for Cicka's threshold farewell.**

## Accepted Local Contract

- In the current first-ending route, the Dance Festival clear is the practical
  route action that brings the player to Relay; do not add a separate pre-ready
  Relay access state for v0.
- Cicka appears in her final field-presence spot, calm and familiar.
- The player uses **Sit and Play** near Cicka to share the **Guitar Farewell**.
  The first playable version should be mostly quiet, player-triggered, and
  short: sit beside Cicka, play the familiar Concert guitar phrase, and avoid
  any pass/fail challenge.
- For the **First Playable Route**, lock the Relay ending as one short
  player-triggered sequence: Dance Festival transition into Relay, brief
  playable linger, **Sit and Play**, **Guitar Farewell**, **Cicka Threshold
  Farewell**, **Dedication Card**, then **First Playable Reset Return**.
- Do not add a separate "send Cicka" prompt, final choice, or Relay readiness
  gate in the first playable version.
- Keep the first-playable Relay linger minimal: a tiny overlook space where the
  player can take a few steps, read the Relay/threshold framing, optionally
  inspect one quiet overlook detail, and then use **Sit and Play** near Cicka.
- Do not add NPCs, collectibles, extra comfort menus, or a separate Cicka pet
  prompt to the first-playable Relay linger. Later polish may add a few quiet
  texture details if they preserve the simple final-scene shape.
- After the player chooses **Sit and Play**, hand off fully into a short
  authored sequence until **First Playable Reset Return**. Remove movement and
  route input during the farewell. The one allowed agency beat is musical
  pacing: after the montage and a short delay, reveal a soft prompt such as
  **Let the song end**. If the player does not press it, the guitar phrase
  resolves on its own.
- The authored sequence should hold the moment in order: sit, camera settles,
  guitar phrase begins, the three montage flashes play, return to Relay at
  sunset while Danilo keeps playing as the sun lowers, the delayed soft prompt
  appears, the player either lets the song end or the phrase resolves naturally,
  a small silence lands, Cicka moves to the threshold, turns back toward the
  seated player, gives one small raw meow, departs beyond the player's path,
  the scene holds on the empty sunset spot, a restrained non-diegetic dedication
  card appears, the card holds briefly without a button prompt, then auto-fades
  into the clean Bridge Area reset.
- Include a tiny first-playable **Route Memory Montage** during the guitar:
  exactly three soft flashes, no interaction, and no captions. Use the changed
  world states that prove the route: completed Bridge crossing, opened Concert
  crossing / guitar handoff echo, and Dance Festival night beginning after the
  player leaves.
- Cicka Resting Spot echoes are later polish unless one is visually cheap and
  already established before the ending.
- **Sit and Play** is the final completion trigger for v0. Do not add **Send the
  Sketchbook Prompt** unless the sketchbook becomes a seeded object or
  interaction across the route first.
- After the final guitar phrase, Cicka moves toward the threshold, pauses,
  turns back toward the seated player, gives one small raw meow, then slips into
  a warm sketchbook-threshold artifact beyond the player's path. It should read
  like a small place in the page that opens for Cicka, not necessarily a literal
  fold at a paper edge: possible reads include warm light, a scratch-like seam,
  a paper hole, or a gentle glitch-portal-like artifact. The player cannot
  follow into that threshold. Art direction should refine the exact threshold
  presentation while preserving this v0 read.
- Any final Relay trace or Concert Resting Spot echo should read as optional
  visual staging only if earlier route art has taught that language; do not make
  paw/page marks a mechanic or required symbol in v0.
- After Cicka disappears, hold on the empty sunset spot for a short silent beat,
  then fade to a restrained non-diegetic dedication card:
  **For Cicka.** / **Thank you for playing.** Do not present this card as Cicka
  writing, speaking, or explaining the farewell. The card should hold briefly,
  then auto-fade into the clean Bridge Area reset without a button prompt. Do
  not add a separate credits card or "The End" card in v0.
- For v0, the player enters **First Playable Reset Return** after the
  **Dedication Card**: cleanly reset route progress and return directly to the
  beginning of Bridge Area instead of opening a post-game free-travel Ridge or
  title/menu return. Long-term, this can become an **Open Ridge Return State**
  where the completed areas remain freely revisitable after the farewell, once
  optional mini-games, return content, and completed-area revisits exist.
- Keep the v0 reset clean: do not show Micka, a changed post-ending world, a
  special ending-seen marker, or a new objective after reset. If an internal
  ending-seen flag is ever needed, keep it invisible until the long-term
  post-game design exists.

## Tone Boundaries

- no literal death scene
- no grief monologue
- no credits-only ending
- no separate credits card or "The End" card in v0; the **Dedication Card** is
  the full end card
- no arcade pass/fail challenge during the Guitar Farewell
- no explanatory departure speech and no written goodbye in the initial version
- no translated farewell line; Cicka's only farewell sound is one tiny raw meow
  before she crosses the threshold
- dedication card must be non-diegetic, not a message from Cicka
- no immediate replacement reveal; Micka remains delayed
- no scattering sad traces everywhere in the initial return state

## Route Readiness Feedback

The current first-ending route does not require a separate Living Proof
checklist, optional-area readiness system, final choice, post-song send prompt,
NPC, collectible, comfort menu, or Cicka pet prompt. The main feedback need is
the transition from Dance Festival clearance to Relay arrival, the brief
playable linger before **Sit and Play**, then the handoff from sunset **Guitar
Farewell** into Cicka's threshold departure, **Dedication Card**, and route
reset.

## Cicka Threshold Staging

Unresolved. This area still needs exact decisions for camera behavior, input
handoff, animation beats, silence, audio, visual trace placement if any,
threshold geometry, and post-ending interactability. Exact timing values for
holds, fades, prompt delay, montage flashes, and silence are prototype-tuned
rather than pre-production canon; implementation agents should choose tasteful
recommended defaults and validate them through playtesting.

## Open Local Slots

- physical Relay topology and warm sketchbook-threshold geometry
- final Cicka field-presence spot
- exact camera framing for the authored Sit and Play handoff
- exact guitar audio texture and delayed soft prompt wording
- prototype-tuned timing defaults for the delayed soft prompt, silence, Route
  Memory Montage flashes, empty-sunset hold, dedication-card hold, and auto-fade
- exact warm threshold artifact presentation after Sit and Play
- First Playable Reset Return Bridge-start reset behavior
- whether any invisible ending-seen flag is needed for future unlocks
- long-term Open Ridge Return State interactions
- delayed Micka trigger
- later optional Relay texture details after the minimal first-playable linger
  works
