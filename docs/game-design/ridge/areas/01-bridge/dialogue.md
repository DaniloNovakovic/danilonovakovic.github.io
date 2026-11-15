# Bridge Dialogue

> Status: Bridge Tracer Slice placeholder IDs accepted / wording still
> tone-locked, not final.
> Parent: [`README.md`](./README.md). Format:
> [`../../dialogue-conventions.md`](../../dialogue-conventions.md).

This file owns Bridge Area conversations, prompts, barks, and placeholder lines.

## Conversation Sets

- `bridge.cicka.first_meet`: peaceful first Cicka encounter around the toy car /
  weight-test prop.
- `bridge.draftsperson.missing_span`: Bridge Draftsperson topic menu; asking
  about the test car moves the route to `needs_toy_car`.
- `bridge.cicka.parallel_play`: a tiny choice game where grabbing and asking
  bounce off and joining Cicka's game earns the car.
- `bridge.cicka.after_share`: short sunbathing visit while the player carries
  the car.
- `bridge.draftsperson.toy_car_test`: the player chooses when to hand the car
  over; opens the Blueprint Bridge Workbench.
- `bridge.draftsperson.bridge_built`: thanks after the toy car crosses.
- `bridge.builder.tip.*`: Draftsperson coaching shown on the workbench.
- `bridge.exit.opened_crossing`: smallest prompt or line set after the crossing
  opens.

## Choice Shape

Conversations are small menus, not cutscenes. Copy lives in
`src/shared/i18n/messages/en/scenes.ts` with these keys:

- lines: `<conversation>.<nn>`
- choice labels: `<conversation>.choice.<choiceId>`
- choice lines: `<conversation>.<choiceId>.<nn>`

A choice can end the talk, open nested follow-up choices, or return to the
topic menu (`then: 'menu'`). A topic choice applies its outcome immediately,
and `once` topics leave the menu after they are picked. Draftsperson topics
also set `bridge_asked_<topic>` so they stay asked on later visits. Flags
`bridge_cicka_met` and `bridge_cicka_guarded_car` (the player reached for the
car and got the paw) vary later Draftsperson lines.

## Conversations

### bridge.cicka.first_meet

State: `bridge:intro`. Lines `01`–`03` introduce Cicka testing the toy car.
Topic menu: **pet** (`mrrp`, a one-second lean), **watch** (the car loops
through the corn), **reach** (a paw lands on the car first; sets
`bridge_cicka_guarded_car`), **leave** (ends). Cicka never hands the car over
here: the toy only matters once the Draftsperson names it.

### bridge.draftsperson.missing_span

State: `bridge:intro` or `bridge:needs_toy_car`.

- `intro`: lines `01`–`02` (keeps erasing the middle span). Topics: **car**
  ("How will you know if it holds?": test car is missing; sets
  `needs_toy_car`; the last line is `car.03_cat` once the player has met Cicka),
  **who**, **why** (what if a cow crosses nervously?), **leave**.
- `needs_toy_car`: line `waiting`. Topics: **cicka** ("Cicka has it."; the hint
  that cats share a good game, opening with `cicka.01_guarded` if she guarded
  the car), any unasked **who**/**why**, **still_looking** (ends).

### bridge.cicka.parallel_play

State: `bridge:needs_toy_car`. Lines `01`–`02`: the car sits under one white
paw. Menu:

| Choice | Result |
| --- | --- |
| grab | Thwap, back to the menu (sets guarded flag). |
| ask (once) | A polite slow blink that means no; back to the menu. |
| leaf | Cicka pounces, the car rolls loose → follow-ups: |
| ↳ pocket | She is somehow already sitting on it; back to the menu. |
| ↳ roll | She bats it back → **roll_again** (earns the car: `toy_car_shared`, item `toy-car`) or **keep** (her tail puffs up; starts **Cicka's Standoff**). |
| rematch | Only after losing a standoff: "Crouch down, ready this time" starts it again. |
| leave | Ends; Cicka keeps the car. |

Glossary guardrail: **Cicka Parallel Play**, never taking the toy by force.
**Cicka's Standoff** keeps that rule: the player only dodges, never strikes,
and Cicka hands the car over herself.

### bridge.cicka.duel_won / bridge.cicka.duel_lost

Spoken right after **Cicka's Standoff** ends (`duel done`).

- `duel_won`: lines `01`–`04`. The last pounce lands on empty corn, she nudges
  the car over: `toy_car_shared`, item `toy-car`, and session flag
  `bridge_cicka_respect`.
- `duel_lost`: lines `01`–`03`. She pins the car and washes her face. Sets the
  guarded flag plus `bridge_cicka_duel_lost`, which adds **rematch** to
  `parallel_play`. The friendly roll path stays open.

### bridge.cicka.after_share

State: `bridge:toy_car_shared`. Line `01` (`01_respect` after winning the
standoff: "one champion to another"); choices **pet** / **promise** (to
bring it back). Both end.

### bridge.draftsperson.toy_car_test

State: `bridge:toy_car_shared`.

- First time: lines `01`–`02` ("Let me guess. The cat?"). Choices:
  **hand_over** (lines `hand_over.01`–`03`, the only tutorial copy, then the
  workbench opens), **story** (once: "She's never even made eye contact with
  me."), **not_yet** (ends; player keeps the car).
- Returning to an unfinished drawing: line `resume`. Choices: **resume**
  (opens the table), **advice** (once: triangles, plus Hint), **later**.

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

Workbench coaching keyed by `BridgeBuildTip`: `intro`, `drawing`, `wobbly`,
`steady`, `testing`, `no_road`, `bare_deck`, `loose_frame`, `hanging_joint`,
`snapped_middle`, `snapped_end`,
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
- bridge completion reaction polish after the Bridge Tracer Slice proves pacing
