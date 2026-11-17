# Dance Festival Dialogue

> Status: accepted pre-production home / needs tone-locked placeholder line pass.
> Parent: [`README.md`](./README.md). Format:
> [`../../dialogue-conventions.md`](../../dialogue-conventions.md).

This file owns Dance Festival conversations, prompts, barks, and placeholder
lines. Flow details live in [`interaction-flow.md`](./interaction-flow.md).

Pre-Tracer scope: these planned conversation IDs are enough until Dance Festival
is packaged as its own implementation slice. Add line-level Tone-Locked
Placeholder Dialogue after the Bridge Tracer Slice proves the dialogue data
shape.

## Planned Conversation Sets

- `dance.traveler.relay_wayfinding`: practical first read that Relay requires
  the last daylight hill shuttle.
- `dance.driver.shuttle_delay`: driver explains the setup/lane blocker without
  revealing the whole romantic beat.
- `dance.operations_helper.handoff_check`: Last-Stop Operations Helper's setup
  concern and readiness favor.
- `dance.locals.triangulated_read`: traveler, steward, or Dance Teacher flavor
  that helps the player infer what is happening.
- `dance.driver.one_step_practice`: private one-step practice with the Dance
  Teacher.
- `dance.driver.folded_song_request`: small folded request that preserves
  dignity instead of forcing confession.
- `dance.setup_clearance`: prompt-driven playable montage lines and prompts.
- `dance.shuttle.last_daylight_ride`: short threshold transition to Relay.

## Implemented Conversation IDs (2026-11-17)

Copy lives in `src/shared/i18n/messages/en/scenes.ts` under `ridge.dance`;
routing in `src/game/core/ridge/content/danceStage.ts`.

- `dance.traveler.wayfinding` / `dance.traveler.staying`
- `dance.driver.clipboard` (topic menu; "Are you dancing tonight?" opens the
  lesson ask), `.waiting_lesson`, `.practiced`, `.request` (the Folded Song
  Request), `.request_pending`, `.after_request`
- `dance.teacher.floor` (lesson, watch, topics, replay), `dance.lesson.done`
  (grade lines for the Profe and the driver)
- `dance.operations.table` (checklist chain, watch, drop the request),
  `dance.operations.after`
- `dance.steward.gate`, `dance.gate.look`, `dance.steward.clearance` (three
  snaps), `dance.steward.after`
- `dance.cicka.crates`, `dance.cats.chairs`, `dance.cats.serenade_done`,
  `dance.cats.together`, `dance.cats.gate`
- `dance.shuttle.last_daylight_ride`

Radio voices use the `shuttleRadio` / `opsRadio` speakers (a portrait, no
mouth moving on stage).

## Open Dialogue Slots

- exact driver, operations helper, steward, and Dance Teacher voices
- recoverable conversation choices and awkward recovery lines
- setup clearance prompt wording
- final shuttle departure line
