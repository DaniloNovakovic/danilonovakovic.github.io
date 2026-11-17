# Concert Dialogue

> Status: implemented placeholder lines (2026-11-16); English copy lives in
> `src/shared/i18n/messages/en/scenes.ts` under `ridge.concert`.
> Parent: [`README.md`](./README.md). Format:
> [`../../dialogue-conventions.md`](../../dialogue-conventions.md).

This file owns Concert Area conversations, prompts, barks, and placeholder
lines.

Pre-Tracer scope: these planned conversation IDs are enough until Concert is
packaged as its own implementation slice. Add line-level Tone-Locked Placeholder
Dialogue after the Bridge Tracer Slice proves the dialogue data shape.

## Planned Conversation Sets

- `concert.crowd.delay_barks`: annoyed crowd or traffic chatter that makes the
  blocked crossing and late concert readable.
- `concert.guitarist.injury`: injured guitarist explains the failed show-off
  stunt without becoming joke-only.
- `concert.guitarist.practice_riff`: forgiving practice interaction that teaches
  the player the concert phrase.
- `concert.performance.auto_success`: minimal concert start and crowd-clearing
  line/prompt set.
- `concert.guitarist.guitar_handoff`: post-concert goodbye and guitar reward.
- `concert.cicka.band_resting_spot`: Cicka before/during/after concert flavor.

## Implemented Conversation Sets

- `concert.poster.read` — the argued-with gig poster (changes after the show).
- `concert.crowd.delay_barks` — Uncle/Grandma topic menu; a short "somebody's
  tuning!" variant once practiced.
- `concert.kid.board` / `concert.kid.hype_waiting` / `concert.kid.after` — the
  Skater Kid, the hype-man branch, and his after-show line.
- `concert.guitarist.injury` / `.practice_riff` / `.ready` — Steve's topic menus
  (topics stay asked across visits via `concert_asked_<topic>` flags).
- `concert.gig.practice_done` / `concert.gig.show_done` — reactions keyed by
  practice pass/assist and show grade, plus an encore variant.
- `concert.stage.look` / `concert.stage.encore`.
- `concert.guitarist.guitar_handoff` / `.farewell`, `concert.exit.dance_transition`.
- `concert.cicka.band_resting_spot` — before/practiced/after variants.

## Open Dialogue Slots

- confirm band name "Steve & the Late Show" and song title "Still Here" (`candidate`) or rename
- how many crowd barks are needed for discovery
- practice riff prompt wording
- guitar handoff line that makes the Relay use feel earned
