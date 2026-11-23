# Dance Festival Area

> Status: accepted final-area direction / split local source; first polish
> pass implemented 2026-11-17 (cast, topic menus, Bachata Lesson, Cat
> Serenade). See [Implemented Polish Pass](#implemented-polish-pass).
> Read [`../../README.md`](../../README.md) and
> [`../README.md`](../README.md) before editing this folder.

This folder owns local design detail for **Dance Festival Area / Opening Dance
Shuttle Beat**. The route-level role lives in
[`../../story-level-bible.md`](../../story-level-bible.md).

## Route Role

Dance Festival Area is the final required Ridge Area before Relay Spire.

The emotional idea is: **Life can keep moving with someone new.**

The player arrives during daytime setup for a real night dance festival, then
the area progresses toward the late-afternoon last daylight shuttle. The
player leaves before the festival fully begins. The beat is romantic, warm, and
different from the Guitar Farewell: two fictional residents like each other but
are too nervous to step onto the dance floor or talk directly. The player helps
the place become ready and gives both residents enough dignity to meet later
without turning the scene into public matchmaking.

## Local Source Map

| File                                           | Owns                                                                                                                    |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| [`layout.md`](./layout.md)                     | Last-Stop Plaza, service-road blocker, shuttle lane, staging, art/audio open slots                                      |
| [`characters.md`](./characters.md)             | Hill-shuttle driver, Last-Stop Operations Helper, Dance Teacher, supporting residents, Cicka, Unnamed Counterpart Cat   |
| [`interaction-flow.md`](./interaction-flow.md) | Practical Wayfinding Loop, Readiness Favors, Folded Song Request, Setup Clearance, Relay transition, conversation rules |
| [`bachata-lesson.md`](./bachata-lesson.md)     | Bachata Lesson (One-Step Practice) and Cat Serenade mechanics, audio, presentation, console verbs                       |

## Accepted Local Contract

- Accepted arrival premise: **Opening Dance Setup + Last Daylight Shuttle**.
- Last-Stop Plaza sits at the foot of the Relay hill.
- The player may arrive in daytime; the local beat can progress through
  setup toward the late-afternoon shuttle window.
- Festival setup blocks the service road with barriers, lantern lines, chair
  stacks, stage/speaker cables, and a locked gate.
- The last daylight hill shuttle can leave only after the setup lane is safe.
- The route question stays practical first: "How do I get to Relay?"
- The player helps the **hill-shuttle driver** and **Last-Stop Operations
  Helper** through dignity-preserving Readiness Favors.
- The romantic connector is a small **Folded Song Request**, not a public
  confession.
- Setup clears through a short **Prompt-Driven Playable Montage**, not a chore
  list or pure cutscene.
- The player catches a **Short Threshold Transition** to Relay under sunset.
- The night dance is shown during the Guitar Farewell, in the Relay ending's
  **Route Memory Cinematic** (see the Relay area doc).

## Implemented Polish Pass

> Status: implemented (2026-11-17). Mechanics: [`bachata-lesson.md`](./bachata-lesson.md).
> Danilo's direction for this pass: dancing is bachata-inspired, and Steve's
> guitar gets an optional use here.

Stage, left to right: van drop-off → traveler on her suitcase → shuttle shelter
with the last-daylight timetable (driver, clipboard) → dance floor under a
lantern line (the Profe with her güira) → lantern crates (Cicka) beside the
chair stacks (a shy dark cat's eyes underneath) → operations table (radio,
checklist, SONG REQUESTS jar) → steward → service gate (boom, CLOSED sign,
sagging lantern line, loose cables) → hill road and the shuttle. A tiny Relay
Spire sits on the far crest.

- **Traveler** (`candidate` flavor): first time here, writing postcards on her
  suitcase. She is retracing her grandma's trip up to the Relay view (her
  grandma "said the plaza was the best part"). After the gate opens she works
  out what that meant and stays for the dance instead.
- **Hill-Shuttle Driver**: "Driving's like dancing with a road." Two left feet;
  would learn one step, but only behind the shelter. Encouraging him first
  steadies his nerve for the lesson.
- **The Profe** (Dance Teacher; "Profe" is a nickname, not a proper name):
  dances alone on the empty floor, counts in Spanish, scrapes a güira on the
  four. Comes to the driver ("the shy ones always pick the bus stop") and
  agrees to keep the plaza watch tonight.
- **Last-Stop Operations Helper**: re-counting forty-eight lanterns. Her
  checklist (tug the lantern line, stamp the cable tape, count the chairs)
  proves it's all fine, which is the problem: tonight she'd just be someone
  waiting by the floor. Her glance at the shuttle shelter is the first tell
  of her side of the crush; "You could ask the driver to dance" is then a
  recoverable awkward branch. The Profe taking the watch is her Readiness Favor.
  The Profe's and steward's "those two" topics wait until you have met both.
- **Folded Song Request**: written on a torn corner of the driver's route sheet
  ("SONG: something slow. ONE DANCE, LATER? ☐ yes ☐ maybe"), dropped in her jar,
  not handed over. She knows the handwriting ("'shuttle' with three t's") and
  answers over the radio: "Request received... Tick: yes." "Copy that."
- **Setup Clearance** (reworked 2026-11-17 after Danilo's playtest: the old
  three-click menu chain was unclear and on rails): the steward waits at the
  gate with the key and briefs two jobs on the lane, each its own spot with an
  ink to-do tag. **Lantern line**: a pole with three hooks; only the top one
  clears a shuttle with lantern crates on its roof (the low and middle hooks
  get visible, funny pushback, and the line visibly hangs at the middle hook).
  **Cable run**: tape and unplugging fail with a joke, a cable ramp works. Do
  them in any order; then the steward has you flip the sign (the
  DANCE TONIGHT side is a joke answer) and opens the gate. The sky moves from
  afternoon to late light to sunset.
- **Cicka and the Unnamed Counterpart Cat**: Cicka stares at the chair stacks;
  the dark cat only comes out for a song (the optional **Cat Serenade** on
  Steve's guitar), then loafs one paw apart from her. Unserenaded, he still
  turns up near her by the open gate. Unnamed; no parentage.
- **Last ride**: Ops on the radio, "Come back down after. I'm saving you the
  slow one." "Copy that."

## Boundaries

- Do not make the player ask "How do I fix the romance?" as the first-read goal.
- Do not solve the beat by forcing two shy people into an instant confession.
- Do not use a purely magical or abstract dance crossing.
- Do not require arcade dance/rhythm performance for the first ending path.
- Do not make the couple literal stand-ins for Danilo and Milena.
- Do not name the Unnamed Counterpart Cat, label him as Micka's father, or
  confirm parentage before the post-ending return.

## Cicka Resting Spot

Use **Dance Festival Resting Spot** as the practical label.

- Before resolution: Cicka loafs near the operations table, shuttle step,
  lantern crates, or service gate.
- After resolution: Cicka settles near the cleared service gate or finished
  shuttle sign, optionally beside the Unnamed Counterpart Cat.

Cicka is an observer, not an explainer. The resting spot is readable flavor, not
a route gate.

## Rough Stage Composition

Stage-order sketch:

```text
Concert rest / van arrival entry
  -> Last-Stop Plaza setup
  -> shuttle sign + operations table
  -> service-road blocker
  -> readiness favors + folded song request
  -> cleared shuttle lane / Cicka settles
  -> Relay sunset transition exit
```

Framing intent: make the shuttle, operations table, and blocked service road
read as one practical plaza problem. Keep the promised night dance visible in
lanterns, chair stacks, and dance-floor edges without turning the first-playable
route into a full festival simulation.

## Paper-Level Acceptance Checks

- The service-road blocker is visible before the player understands the
  romantic folded-song-request layer.
- The shuttle, last-daylight sign, operations table, and service gate are named
  as one readable plaza problem.
- Cicka has before/after placement near the operations table, shuttle step,
  lantern crates, service gate, or cleared shuttle sign.
- Minimum Route Cast roles are named: Hill-Shuttle Driver, Last-Stop Operations
  Helper, Dance Teacher, Festival Steward, and Unnamed Counterpart Cat.
- Planned prompt/dialogue IDs cover wayfinding, shuttle delay, operations
  handoff, local triangulation, one-step practice, folded song request, setup
  clearance, and final shuttle ride.
- The visible world change is that setup clears enough for the last daylight
  shuttle lane.
- The Relay sunset transition exit condition is named.
- First Playable Audio Floor needs are clear: daytime setup ambience,
  setup-clearance cue, Cicka cue if used, and shuttle/transition stinger.

## Open Local Slots

- [`layout.md`](./layout.md): Rough Stage Composition first, then exact room
  topology, prop placement, palette, signage, music texture, and crowd ambience.
- [`characters.md`](./characters.md): silhouettes, movement, dialogue style, and
  eventual names for local residents.
- [`interaction-flow.md`](./interaction-flow.md): concrete prompts, object
  interactions, recovery paths, readiness order flexibility, and the smallest
  prompt set that proves the accepted Opening Dance Shuttle beat.
