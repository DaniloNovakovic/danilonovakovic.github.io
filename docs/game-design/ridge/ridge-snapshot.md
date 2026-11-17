# Ridge Snapshot

> Status: implemented/prototype snapshot.
> This is the current human-readable snapshot of Ridge's implemented/prototyped
> state, not the active future design target, shipped player documentation, or
> issue tracker. Update this when current runtime behavior or prototype
> capability changes.

## Ownership

- **Shipped behavior:** [`player-manual.md`](../player-manual.md).
- **Ridge source router:** [`README.md`](./README.md).
- **Active story/route canon:** [`story-level-bible.md`](./story-level-bible.md).
- **Active area design:** [`areas/`](./areas/README.md).
- **Runtime architecture ADR:** [`../../adr/0005-ridge-console-core-and-stick-visuals.md`](../../adr/0005-ridge-console-core-and-stick-visuals.md).
- **Product vision:** [`summit.md`](./summit.md).
- **Live implementation work:** GitHub Issues.

If this file disagrees with the current Ridge runtime code about implemented
behavior, the code wins. If this file disagrees with GitHub about active work
state, GitHub wins.
If this file disagrees with `story-level-bible.md` or the matching `areas/`
doc about future route intent, the active design docs win.

## Current Runtime Shape

Player-facing Ridge entry (secret side game):

```text
Overworld banana peel
  -> win Potassium Slip (earn Circuit)
  -> insert Circuit into the street CRT (between Projects and Abilities)
  -> Ridge
```

Dev direct boot:

```text
?mode=interactive&startScene=ridge
```

Headless / AI playtest:

```text
pnpm ridge:console
pnpm ridge:console --script "look; go right 3; interact; advance"
pnpm ridge:console --script "look" --json
```

Full-game headless (street → Circuit → Ridge) uses `pnpm game:console`; see
ADR-0006 and the player manual. `ridge:console` is `game:console --scene ridge`.

Current runtime characteristics:

- Gameplay authority lives in pure `src/game/core/ridge/` (`RidgeConsoleSession`).
- Phaser `RidgeScene` is a thin adapter: left/right (+ touch) walks progress,
  interact starts conversation, Scene UI owns the Persona-style talk panel.
- Default art is mathematical stick figures via `StickVisualProvider`
  (`src/game/scenes/ridge/art/`). Replace that provider later for iPad art
  without rewriting route logic.
- Bridge route beats still use bridge-store `firstPlayableRoute`
  (`intro` -> `needs_toy_car` -> `toy_car_shared` -> `bridge_complete` ->
  concert handoff).
- The Ridge Stage Debugger, Walk-Rail authoring commit plugin, and large PNG
  stage-plate pipeline were removed as disposable prototype tooling.
- **Stampede Sketch** remains a standalone optional scene; it is not on the
  active Bridge route.

## Active Runtime Route Read

```text
Bridge
  Nature / hill entry
  -> Cicka + toy car play spot (pet / watch / reach topic menu)
  -> blocked bridge + unfinished blueprint
  -> Bridge Draftsperson (topic menu; asking about the car opens the hunt)
  -> Cicka Parallel Play (grab/ask bounce off; leaf -> roll -> roll again
     earns the toy car, or "keep it" -> Cicka's Standoff: dodge her paw,
     outlast her, earn her respect and the car; lose and she keeps it)
  -> Draftsperson: hand over the car, chat, or "Not yet"
  -> Blueprint Bridge Workbench (draw road/wood beams, physics toy-car test,
     forgiving retries + traceable sketch)
  -> Draftsperson thanks you; your drawn bridge becomes the crossing
  -> Bridge-to-Concert handoff

Concert
  -> night block: kafana + Skater Kid, gig poster, crowd on the crossing
  -> backstage nook (Steve on his amp, Cicka behind the amps); topic menus
  -> optional: talk the kid into being the hype man (warmer crowd)
  -> Concert Gig practice riff (three-lane rhythm, passes after 3 tries anyway)
  -> Concert Gig show (never fails; grade colours the reactions; encore later)
  -> crowd clears; Steve's goodbye at the corner hands over the guitar
  -> Dance transition exit

Dance Festival
  -> Last-Stop Plaza: van drop-off, traveler on his suitcase, shuttle shelter
     (driver + clipboard), dance floor (the Profe), lantern crates (Cicka),
     chair stacks (a shy dark cat), operations table, steward, service gate
  -> topic menus; the romance is read from residents, never announced
  -> One-Step Practice = Bachata Lesson behind the shelter (driver mirrors you;
     never fails; "Just count it for him")
  -> Operations Handoff Check: checklist -> "who keeps watch?" -> the Profe
  -> Folded Song Request: driver writes it, you drop it in her jar, radio reply
  -> Setup Clearance at the gate: lantern line, cable ramp, shuttle sign (each
     visible), sky goes to sunset, gate opens
  -> optional Cat Serenade on Steve's guitar (dark cat joins Cicka)
  -> last daylight shuttle -> Relay

Relay Ending
  -> tiny sunset overlook linger
  -> Sit and Play beside Cicka
  -> Route Memory Montage (3 flashes) + Let the song end
  -> Cicka Threshold Farewell + Dedication Card
  -> return to Overworld (CRT story ends; Circuit kept)
```

After the dedication, v0 returns to the Overworld street rather than an in-Ridge
Bridge replay. Route progress resets so the next CRT entry starts Bridge fresh.
Long-term Open Ridge Return / post-game can replace this eject later.

Full route is playable in `pnpm ridge:console` and covered by
`src/game/core/ridge/session.test.ts`. Stick visuals swap backgrounds/cast per
area via `StickVisualProvider`.

## Console Contract (for AI agents)

Useful commands:

| Command | Meaning |
| --- | --- |
| `look` / `status` | Surroundings, nearby distances, beat, progress |
| `go left\|right [n]` | Walk the progress line |
| `interact [name]` | Start nearest/named conversation |
| `advance` | Continue halted conversation |
| `choose <n\|id>` | Persona-style reply |
| `leave` | Exit conversation early (or step away from the drawing table) |
| `build road\|wood X,Y X,Y` | Blueprint Bridge: draw a beam (bolts 0,0 8,0 0,2 8,2) |
| `build test` / `edit` / `done` | Run the toy car, return to drawing, accept a held bridge |
| `build sketch` / `hint` / `undo` / `erase n` / `show` | Workbench helpers |
| `duel dodge` / `duel wait [n]` / `duel done` | Cicka's Standoff |
| `gig hit [0\|1\|2]` / `gig wait [ms]` / `gig auto` / `gig skip` / `gig done` | Concert Gig (practice, show, or the Dance Festival cat serenade) |
| `dance step` / `dance left\|tap\|right` / `dance wait [ms]` / `dance auto` / `dance skip` / `dance done` | Bachata Lesson (Dance Festival) |
| `skip` / `next` | Playtest: jump to next area start |
| `warp bridge\|concert\|dance\|relay` | Playtest: warp to an area |
| `help` | Command list |

Browser DEV only: `]` skips to the next area; `1`–`4` warp Bridge / Concert / Dance / Relay.

Observation JSON (`--json`) includes `nearby[].distance`, actors, inventory,
conversation state, and hints.

## What Remains Disposable

- Stick art itself (replace via VisualProvider)
- Exact progress numbers / interact radii
- Bridge conversation copy (topic menus are the shape; wording is placeholder)

## What Should Survive Area Blueprints

1. Pure console session + scripted playthrough tests
2. Progress-based Compact Ridge Stage spots
3. Conversation halt + React Scene UI panel
4. VisualProvider seam between gameplay and art
5. Bridge-store `firstPlayableRoute` for durable route beats
