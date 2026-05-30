# Relay Ending Dialogue

> Status: accepted pre-production home / needs tone-locked placeholder line pass.
> Parent: [`README.md`](./README.md). Format:
> [`../../dialogue-conventions.md`](../../dialogue-conventions.md).

This file owns Relay Ending prompts, minimal inspect text, dedication-card text,
and any placeholder lines. The first playable ending should remain mostly quiet.

Pre-Tracer scope: keep Relay mostly at planned prompt IDs plus the already
accepted dedication-card text until Relay is packaged as its own implementation
slice. Add any remaining line-level Tone-Locked Placeholder Dialogue after the
Bridge Tracer Slice proves the dialogue data shape.

## Planned Conversation Sets

- `relay.overlook.inspect`: optional single quiet overlook inspect detail, if
  kept in the minimal linger.
- `relay.sit_and_play.prompt`: final player-triggered Sit and Play prompt.
- `relay.guitar.let_song_end`: delayed soft prompt after the montage and sunset
  playing beat.
- `relay.cicka.threshold_meow`: one tiny raw meow before Cicka crosses the
  threshold.
- `relay.dedication.card`: non-diegetic dedication card text.

## Accepted Text

| ID | Speaker | Line / Prompt | Notes |
| --- | --- | --- | --- |
| relay.dedication.card.01 | Non-diegetic card | For Cicka. | First line of dedication card. |
| relay.dedication.card.02 | Non-diegetic card | Thank you for playing. | Second line of dedication card. |

## Open Dialogue Slots

- exact Sit and Play prompt wording
- exact delayed soft prompt wording
- whether the optional overlook inspect line is needed
- how to represent Cicka's final raw meow in implementation data
