# Concert Area

> Status: accepted middle-area direction / needs focused area pass.
> Read [`../../README.md`](../../README.md) and
> [`../README.md`](../README.md) before editing this file.

This file owns local design detail for **Concert Area / Concert Crossing Beat**.
The route-level role lives in
[`../../story-level-bible.md`](../../story-level-bible.md).

## Route Role

Concert Area is the middle required Ridge Area. It turns the route from "making
something" toward "carrying comfort forward."

The emotional idea is: **I can turn memory into comfort.**

The area identity is a compact small-town / varos-like concert block at evening
or night: small buildings, bars, stage-adjacent storefronts, alleys, street
lights, and lived-in festival details around the blocked crossing. The concert
should feel like a memorable local night event rather than a nightclub gig. The
first prototype can keep most buildings as facade atmosphere, while later passes
may add enterable bars/building interiors, extra residents, and optional hangout
spaces to make the block feel more alive.

## Accepted Local Contract

- A blocked concert/traffic crossing halts the route.
- The crossing is blocked by a crowd, traffic line, or gathering waiting for the
  concert to start.
- The player discovers the delay through compact-area exploration: annoyed
  crowd members can mention that the concert is late, but the player can also
  simply wander the small area and find the musician-side space naturally.
- The local guitarist cannot play because of a clumsy show-off mishap: after a
  kid teased him about being old, he tried to prove he was still young by doing an
  absurd concert stunt, such as playing guitar while riding a skateboard on one
  leg, and hurt his hand or wrist.
- The player helps by learning one **Forgiving Practice Riff** from the injured
  guitarist, then taking over the concert.
- In v0, the concert performance can be auto-success or highly forgiving so the
  main route is not blocked by rhythm-game production.
- After the first playable route lands, a Guitar-Hero-like or Baka Mitai-style
  button-rhythm guitar mini-game can become the richer expression. It may later
  use Danilo's real guitar/song material and dynamically generate button prompts
  from authored song data.
- Once the performance begins, the crowd or traffic clears the crossing.
- After the concert, the area clears up: the crowd leaves or moves aside, the
  crossing opens, and the musician or band waits near the exit for a short
  goodbye/reward beat.
- During that exit beat, the guitarist entrusts the guitar to the player as a
  meaningful comfort item and reward.
- This is the same physical guitar the player carries for the rest of the game
  and uses at Relay for the **Guitar Farewell**.
- The only required guitar uses in the first-ending route are the Concert
  performance and the Relay **Sit and Play** interaction.
- The beat must make the later **Guitar Farewell** feel earned.

## Prototype Floor

The first blockout only needs:

- blocked crowd/traffic crossing
- 2-3 annoyed crowd barks or silhouettes
- hidden musician-side nook
- injured guitarist
- one forgiving practice interaction
- auto-success concert start
- crowd clears
- goodbye/reward beat at the opened exit, with a band member only if needed for
  staging
- guitar received
- Cicka hidden before resolution and chilling with the band after resolution

Small-city facades, bars, and building silhouettes should frame the area even in
the prototype, but enterable buildings and extra residents are later liveliness
scope.

## Cicka Resting Spot

Use **Concert Resting Spot** as the practical label.

- Before resolution: Cicka avoids the crowd and watches from a hidden or
  musician-side place, such as behind stage props, near the guitar case, or
  close to where the injured guitarist/band is waiting.
- During the concert: Cicka stays off to the side rather than entering the
  crowd, reading as curious but crowd-shy.
- After resolution: Cicka chills with the musicians near the opened exit; the
  injured guitarist or another band member may quietly pet her.

This can later become the post-ending echo spot. If used, the echo should be a
small visual absence cue at Cicka's usual spot, not the player's guitar left
behind and not an unseeded paw/page mark mechanic.

## Rough Stage Composition

Stage-order sketch:

```text
Bridge transition entry
  -> crowd / traffic crossing blocker
  -> crowd barks + facade atmosphere
  -> musician-side nook with hidden Cicka
  -> Injured Guitarist practice riff
  -> auto-success concert start
  -> opened crossing + goodbye / guitar handoff
  -> Dance transition exit
```

Framing intent: present the Concert Area as a compact night block with the
blocked crossing readable early, then pull the player sideways into the quieter
musician nook. Foreground crowd silhouettes and storefront facades can sell
depth while the playable lane stays mostly left/right.

## Paper-Level Acceptance Checks

- The blocked crowd/traffic crossing is visible before dialogue explains the
  concert delay.
- Cicka has a before-resolution hiding spot near the musician-side nook and an
  after-resolution resting spot with or near the band.
- The Injured Guitarist role, practice-riff beat, and non-arcade fallback are
  named.
- Planned prompt/dialogue IDs cover crowd barks, injury setup, practice riff,
  performance start, guitar handoff, and Cicka flavor.
- The visible world change is that the crowd or traffic clears and the crossing
  opens.
- The guitar handoff is named as the reward that sets up Relay.
- The Dance transition exit condition is named.
- First Playable Audio Floor needs are clear: night ambience, guitar phrase,
  crowd-clearing cue, Cicka cue if used, and transition stinger.

## Boundaries

- A Guitar-Hero-like performance mini-game is allowed as an ideal or optional
  expression.
- The required route must have a non-arcade fallback.
- Do not block the first route MVP on building the full rhythm mini-game.
- Do not over-breadcrumb the injured guitarist in v0; compact exploration and
  believable crowd chatter should be enough unless playtests prove otherwise.
- Avoid making the guitarist a joke-only drunk if it undercuts the tribute.
- Gentle comedy is welcome if the guitar's emotional role still has room to
  breathe.

## Open Local Slots

- exact crossing geometry, collision behavior, and why it blocks progress
- small-city block layout, bars, building facades, and possible later Area
  Interior Pockets
- how many annoyed crowd/band flavor lines are enough for discovery
- exact post-concert goodbye staging near the opened exit
- guitarist/resident role, silhouette, simplified staging for the skateboard
  stunt, and eventual name
- exact Forgiving Practice Riff prompts and auto-success performance beat
- future rhythm mini-game song-data format and generated button prompt rules
- first playable guitar interaction, if any, before Relay
- visual/audio distinction from Dance Festival and Relay sunset
