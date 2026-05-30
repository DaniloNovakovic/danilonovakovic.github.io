# Ridge Dialogue Conventions

> Status: accepted pre-production convention.
> Read [`README.md`](./README.md) first for Ridge source-of-truth routing.

This file defines how Ridge dialogue is documented during pre-production. It is
not the final runtime data format.

## Source Ownership

Keep dialogue colocated with the area that owns the scene:

- [`areas/01-bridge/dialogue.md`](./areas/01-bridge/dialogue.md)
- [`areas/02-concert/dialogue.md`](./areas/02-concert/dialogue.md)
- [`areas/03-dance-festival/dialogue.md`](./areas/03-dance-festival/dialogue.md)
- [`areas/04-relay-ending/dialogue.md`](./areas/04-relay-ending/dialogue.md)

Area dialogue files own local conversations, barks, prompts, and placeholder
lines. Cross-area story dependencies belong in
[`story-level-bible.md`](./story-level-bible.md), not duplicated in every
dialogue file.

## Pre-Production Format

Use Markdown as the human design source until the dialogue shape stabilizes.
Each conversation block should include:

- purpose: why this exchange exists in the route
- trigger: what starts it
- state: when it can appear
- lines: placeholder or draft lines with stable IDs
- outcomes: route flags, world changes, prompt unlocks, or handoffs
- open questions: local wording, staging, or branching details still unresolved

Recommended block shape:

```md
### bridge.draftsperson.missing_span

Purpose: Introduce the bridge problem and the missing toy car test.
Trigger: Player talks to the Bridge Draftsperson at the unfinished blueprint.
State: Before bridge completion.

| ID | Speaker | Line / Prompt | Notes |
| --- | --- | --- | --- |
| bridge.draftsperson.missing_span.01 | Bridge Draftsperson | Placeholder line. | Tone note. |

Outcome: Player understands the bridge needs a safe middle span and the toy car
test matters.
```

## Line IDs

Use stable, area-scoped IDs from the start:

```text
bridge.cicka.first_meet.01
concert.guitarist.practice_riff.01
dance.driver.one_step_practice.01
relay.cicka.threshold_meow.01
```

IDs should describe area, speaker or beat, conversation purpose, and line order.
Avoid final character names until names are accepted. Prefer role labels such as
`bridge.draftsperson`, `concert.guitarist`, `dance.driver`, or
`dance.operations_helper`.

For First Playable Route dialogue, use stable Role Names instead of provisional
proper names. Proper names can replace labels only after a naming/tone pass
accepts them and the affected IDs or data migration are deliberate.

The exact runtime pipeline is deferred. These IDs should be able to survive a
future migration into JSON, TypeScript dialogue data, a narrative scripting
format, or another type-safe import system.

## Placeholder Policy

First Playable Route dialogue should be functional placeholder prose with tone,
not final writing. A placeholder line is good enough when it proves:

- what the player learns
- what the character wants or feels
- what prompt or route state changes next
- whether the exchange feels kind, awkward, funny, quiet, or practical

Do not polish every line before the route is playable. Do not leave a line so
generic that implementation cannot tell what state, prompt, or emotional beat it
supports.

## Branching Scope

For the First Playable Route, prefer short, recoverable conversations over deep
branching trees. Choices may change pacing, flavor, or recovery, but they should
not permanently block the first ending.

Mark possible branches explicitly:

```md
- Option: Ask about the shuttle.
- Option: Ask why the driver keeps rereading the clipboard.
- Recovery: If the player asks too directly, locals redirect them toward
  listening or helping with setup.
```

## Runtime Boundary

Do not hardcode final user-facing dialogue in implementation while the route is
still in pre-production. When implementation begins, either import from an
external data source or mirror the accepted Markdown lines into a small typed
data layer with the same IDs.
