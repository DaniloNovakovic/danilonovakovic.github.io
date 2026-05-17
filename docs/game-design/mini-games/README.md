# Mini-Games

This folder routes to mini-game-specific design docs. Mini-games own their
local rules, controls, run state, and scene feel. Ridge owns how a mini-game is
found, what durable reward it grants, and how the world changes on return.

Live PRDs, implementation issues, triage state, and agent briefs live in GitHub
Issues, not in this folder.

## Current Docs

| Mini-game | Status | Doc | Ridge contract |
| --- | --- | --- | --- |
| Potassium Slip | Shipped / existing flagship | [`potassium-slip.md`](./potassium-slip.md) | Circuit is one major Relay proof; Potassium owns ricochet. |
| Stampede Sketch | Current new prototype | [`stampede-sketch.md`](./stampede-sketch.md) | First clear grants `stampede-sketch` stamp plus one glide pip. |

## Future Docs

Create a dedicated mini-game doc before a future scene needs durable design
rules beyond the summary in [`../ridge/summit.md`](../ridge/summit.md).

Likely future docs:

- `telegraph-terrace.md`
- `domino-desk.md`
- `cicka-daydream.md`
- `margin-manual-hunt.md`

Each mini-game doc should include:

- core purpose
- player fantasy
- controls
- core loop
- Ridge anchor contract
- reward contract
- current status
- out-of-scope boundaries

Do not use this folder as a backlog. Once implementation is ready, publish
vertical slices to GitHub Issues through the normal issue workflow.
