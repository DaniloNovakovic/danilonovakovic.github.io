# Bridge Dialogue

> Status: Bridge Tracer Slice placeholder IDs accepted / wording still
> tone-locked, not final.
> Parent: [`README.md`](./README.md). Format:
> [`../../dialogue-conventions.md`](../../dialogue-conventions.md).

This file owns Bridge Area conversations, prompts, barks, and placeholder lines.

## Planned Conversation Sets

- `bridge.cicka.first_meet`: peaceful first Cicka encounter around the toy car /
  weight-test prop.
- `bridge.draftsperson.missing_span`: Bridge Draftsperson introduces the
  unfinished blueprint and missing middle span.
- `bridge.cicka.parallel_play`: player joins Cicka's toy-car play until she
  chooses to share the test car.
- `bridge.draftsperson.toy_car_test`: Draftsperson asks the player to draw the
  span; opens the Blueprint Bridge Workbench.
- `bridge.draftsperson.bridge_built`: thanks after the toy car crosses.
- `bridge.builder.tip.*`: Draftsperson coaching shown on the workbench.
- `bridge.exit.opened_crossing`: smallest prompt or line set after the crossing
  opens.

## Tone-Locked Placeholder Lines

### bridge.cicka.first_meet

Purpose: Establish Cicka as a calm field presence before the toy car becomes a
route object.
Trigger: Player approaches Cicka at the toy car / weight-test prop.
State: `bridge:intro`.

| ID | Speaker | Line / Prompt | Notes |
| --- | --- | --- | --- |
| bridge.cicka.first_meet.01 | Prompt | Sit near Cicka | Gentle optional-feeling first contact. |
| bridge.cicka.first_meet.02 | Cicka | Small chirp. | Audio/event placeholder, not written speech. |
| bridge.cicka.first_meet.03 | Prompt | Cicka bats the tiny car back into place. | Recontextualizes the toy as shared play. |

Outcome: Player has seen Cicka with the toy car before the Bridge Draftsperson
names it as the missing bridge test prop.

### bridge.draftsperson.missing_span

Purpose: Introduce the blocked crossing, unfinished blueprint, and missing toy
car test.
Trigger: Player talks to the Bridge Draftsperson at the unfinished blueprint.
State: `bridge:intro` or `bridge:needs_toy_car`.

| ID | Speaker | Line / Prompt | Notes |
| --- | --- | --- | --- |
| bridge.draftsperson.missing_span.01 | Bridge Draftsperson | The middle span keeps looking brave until I imagine someone crossing it. | Nervous practical worry, not magic exposition. |
| bridge.draftsperson.missing_span.02 | Bridge Draftsperson | I had a tiny test car for this. It was here a minute ago. | Points back to Cicka without making her a quest giver. |
| bridge.draftsperson.missing_span.03 | Prompt | Look for the tiny test car | Updates player intent without quest-log UI. |

Outcome: Route state can move to `bridge:needs_toy_car`; player understands the
toy car matters for the bridge test.

### bridge.cicka.parallel_play

Purpose: Retrieve the test car through gentle parallel play rather than taking
it from Cicka.
Trigger: Player returns to Cicka after learning the test car matters.
State: `bridge:needs_toy_car`.

| ID | Speaker | Line / Prompt | Notes |
| --- | --- | --- | --- |
| bridge.cicka.parallel_play.01 | Prompt | Sit with Cicka | Uses the shared sit/play vocabulary. |
| bridge.cicka.parallel_play.02 | Prompt | Roll the car back gently | Lets the player join the game, not snatch the prop. |
| bridge.cicka.parallel_play.03 | Cicka | Quiet purr. | Audio/event placeholder for permission and trust. |
| bridge.cicka.parallel_play.04 | Prompt | Cicka leaves the tiny car beside you. | Handoff result without making Cicka obedient. |

Outcome: Player receives or can carry the toy car test prop; route remains kind
and local.

### bridge.draftsperson.toy_car_test

Purpose: Hand the missing span to the player and open the Blueprint Bridge
Workbench.
Trigger: Player returns to the blueprint with the toy car.
State: `bridge:toy_car_shared`.

| ID | Speaker | Line / Prompt | Notes |
| --- | --- | --- | --- |
| bridge.draftsperson.toy_car_test.01 | Prompt | You set the tiny test car on the blueprint table. | Narration. |
| bridge.draftsperson.toy_car_test.02 | Bridge Draftsperson | Every time I draw the middle span, I erase it. | Thoughtful; the overthinking problem. |
| bridge.draftsperson.toy_car_test.03 | Bridge Draftsperson | Would you draw it with me? The little car will tell us if it holds. | Curious; invitation. |
| bridge.draftsperson.toy_car_test.04 | Prompt | Road carries the car, wood holds it up. Triangles are your friend. | The only tutorial text. |
| bridge.draftsperson.toy_car_test.resume | Bridge Draftsperson | Back to the drawing board! | Returning to an unfinished drawing. |

Outcome: Workbench opens. Copy in `src/shared/i18n/messages/en/scenes.ts`.

### bridge.draftsperson.bridge_built

Purpose: Thank the player and land the visible route change.
Trigger: The toy car crosses the player's span.
State: `bridge:bridge_complete`.

| ID | Speaker | Line / Prompt | Notes |
| --- | --- | --- | --- |
| bridge.draftsperson.bridge_built.01 | Prompt | Vroom! The toy car rattles across your span. | Narration. |
| bridge.draftsperson.bridge_built.02 | Bridge Draftsperson | It held?! It HELD! | Surprised. |
| bridge.draftsperson.bridge_built.03 | Bridge Draftsperson | You didn't overthink it, you just drew it. Thank you, partner. | Playful; emotional payoff of the area. |
| bridge.draftsperson.bridge_built.04 | Prompt | The pencil lines darken into real timber. | Visible world change. |

### bridge.builder.tip.*

Workbench coaching keyed by `BridgeBuildTip`: `intro`, `drawing`, `testing`,
`no_road`, `bare_deck`, `loose_frame`, `snapped_middle`, `snapped_end`,
`stuck`, `sketch_shown`, `out_of_ink`, `passed`.

Failure remarks react to *how* the bridge failed, in the Draftsperson's voice
(a small wince, then one concrete thing to try), never as a manual. A remark
may have alternates at `<id>.2`, `<id>.3`; retries rotate through them.
After two failed tests `bridge.builder.tip.sketch_nudge` is tacked onto the
remark instead of replacing it, so the player still hears what went wrong.

### bridge.exit.opened_crossing

Purpose: Let the player leave Bridge Area after the visible world change.
Trigger: Player approaches the completed crossing / exit side.
State: `bridge:bridge_complete`.

| ID | Speaker | Line / Prompt | Notes |
| --- | --- | --- | --- |
| bridge.exit.opened_crossing.01 | Prompt | Cross the finished bridge | Exit prompt after world change. |
| bridge.exit.opened_crossing.02 | Bridge Draftsperson | Thank you. I think I can leave this line alone now. | Short gratitude; avoids over-explaining. |
| bridge.exit.opened_crossing.03 | Prompt | The page turns toward evening music. | Bridge-to-Concert transition cue. |

Outcome: Bridge-to-Concert Compact Area Transition can fire.

## Open Dialogue Slots

- exact Bridge Draftsperson voice and role label
- final wording for Cicka prompts and nonverbal audio labels
- Cicka Parallel Play recovery beats if the player walks away mid-interaction
- bridge completion reaction polish after the Bridge Tracer Slice proves pacing
