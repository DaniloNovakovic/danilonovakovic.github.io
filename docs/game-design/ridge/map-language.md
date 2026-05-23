# Ridge Blockout Source

Status: active runtime source and design tool.

The Ridge Blockout Source is a typed TypeScript authoring contract for
designing Ridge room beats before final assets exist. It should be readable by
Danilo, easy for agents to edit, and strict enough that TypeScript plus the
source generator can produce a Phaser greybox, typed facts, traversal
connectors, numeric tile rows, and progress-gated presentation inputs.

## Decision

`folded-desk-ridge.source.ts` is the authoring source for Ridge greybox
generation. It is not design prose. Runtime imports the committed generated
artifact next to it.

The first full skeleton lives in
[`src/game/scenes/ridge/blockout/sources/folded-desk-ridge.source.ts`](../../../src/game/scenes/ridge/blockout/sources/folded-desk-ridge.source.ts).
Source-contract work should use that file, not a toy example, so the language
evolves against the real Ridge topology.

Location note: the blockout used to live under `docs/game-design/` and then as
a raw `.blockout.txt` runtime import because the language started as a design
artifact. It now lives beside the generated Ridge source artifact because the
build checks it as typed source data. If it moves again, update the generator,
runtime import, this document, and ADR-0001 in the same migration.

The default grid cell size is **48px**, declared at the source level instead of
hard-coded into the runtime:

```ts
export const FOLDED_DESK_RIDGE_SOURCE = {
  language: 'ridge-v0',
  cell: 48
};
```

The source compiler reads the declared `cell` value and downstream runtime code
converts grid coordinates into world pixels from that value. A future map can
change the cell size without rewriting every room.

`place x y` uses grid cells, not raw pixels:

```ts
{
  cell: 48,
  rooms: [{
    id: 'cicka_home',
    place: { x: 18, y: 42 }
  }]
}
```

The runtime converts this to `worldX = 18 * 48` and `worldY = 42 * 48`.

Room blockouts use a **hybrid, grid-first** model:

- ASCII grids describe the visible playable layout.
- Grid cells are **single-character only**.
- Anchors below the grid give single-character symbols their semantic meaning.
  Anchors are scoped to one room beat.
- Room beats are placed into one **seamless connected world** with `place`
  coordinates measured in grid cells. Exits describe route logic, but do not
  teleport by default.
- Optional named rectangles describe invisible or awkward-to-draw regions such
  as wind zones, camera hints, trigger areas, elevator travel ranges, and
  shortcut gates.

First supported output is primitive:

- solid ground
- platforms
- exits
- NPC anchors
- mini-game anchors
- elevators
- shortcut gates
- prop markers
- environment tags

The generated v0 runtime artifact feeds the whole seamless world into a Phaser
greybox. The geometry layer groups `#` and `_` cells into horizontal collider
runs, generates first-walk connectors from route exit anchors, and only adds
shortcut colliders when the matching Ridge progress exists. Final art, sprite
placement polish, particles, sound, one-way platform behavior, and bespoke
encounter logic stay outside v0.

## Design Goals

- **Readable first:** a human should understand one room beat in seconds.
- **Validatable second:** agents should be able to generate tests and Phaser
  greybox geometry from the same file.
- **Fast to change:** moving a platform or exit should be a text edit.
- **Layered:** topology, blockout geometry, and environment intent should be
  separate enough that one can change without rewriting all three.
- **Asset-light:** symbols reserve intent before final art exists.

Agents should edit `.source.ts` files and then run `pnpm ridge:source`.
`pnpm ridge:source:check` and the standard `pnpm check` command fail when a
generated artifact is stale or when source validation rejects the contract.

## Read-Only Viewer

In development, `?mode=ridge-blockout` opens a read-only Ridge Blockout Viewer
over the committed generated artifact. It renders the compiled map, tile
interpretation, room labels, anchors, active and future routes, shortcuts,
colliders, assist zones, rects, and validation status. The viewer is an
inspection surface only; source edits still happen in `.source.ts` followed by
`pnpm ridge:source`.

## Core Shape

Each blockout source can declare global route logic before room beats:

```ts
{
  language: 'ridge-v0',
  cell: 48,
  worldId: 'folded_desk_ridge',
  title: 'Folded Desk Ridge',
  spawn: { roomId: 'outskirts', anchorSymbol: '1' },
  routes: [{ id: 'first_walk', roomIds: ['outskirts', 'cicka_home', 'work_artifact'] }],
  optionalPockets: [{ id: 'early_skill_scrap', roomId: 'work_artifact', kind: 'side_shelf' }],
  shortcuts: [{ id: 'stampede_sketch', fromRoomId: 'switchback_shelf', toRoomId: 'cicka_home', kind: 'fall_steer_fold_drop' }],
  homeMutations: [{ id: 'stampede_sketch', attrs: { adds: 'stampede_note', opens: 'fold_drop_landing' } }],
  futureRoutes: [{ id: 'cicka_underpath', roomIds: ['outskirts', 'underpath', 'cicka_home'] }]
}
```

Global declarations:

| Declaration | Meaning |
| --- | --- |
| `spawn` | default player start |
| `route` | named intended traversal route |
| `shortcut` | route opened by progress |
| `future_route` | teased or not-yet-runtime route |
| `optionalPockets` | parsed small curiosity branch; currently design data |
| `home_mutation` | Cicka Home change declaration resolved against progress |

Each room beat should have metadata plus a grid:

```ts
{
  id: 'cicka_home',
  title: 'Cicka Home',
  place: { x: 18, y: 42 },
  size: { width: 32, height: 14 },
  theme: 'desk_nest',
  mood: 'safe',
  links: ['left:outskirts', 'up:work_artifact', 'secret:underpath'],
  props: ['desk', 'pinboard', 'memento_slots', 'paw_marks'],
  declarations: ['after stampede_sketch unlocks fold_drop_from:switchback'],
  grid: [
    '................................',
    '...............1................',
    '................................',
    '.......M........................',
    '............C...................',
    '.............____...............',
    '.....######################.....',
    '.....#....................#.....',
    '.....#....?...............#.....',
    '############################....'
  ],
  anchors: [
    { symbol: '1', kind: 'exit', attrs: { to: 'work_artifact', label: 'up' } },
    { symbol: 'C', kind: 'npc', attrs: { id: 'cicka' } },
    { symbol: '?', kind: 'secret', attrs: { to: 'underpath' } }
  ],
  rects: [
    { id: 'camera_hint', x: 0, y: 0, width: 32, height: 14 },
    { id: 'cicka_safe_zone', x: 8, y: 3, width: 14, height: 7 }
  ]
}
```

Discrete room transitions can still be used later for interiors, mini-games,
basement pockets, or scenes that intentionally leave the Ridge world.

## Compiled Facts

The runtime compiles generated map output into typed facts before callers use it.
Current fact groups are:

| Fact | Runtime role |
| --- | --- |
| Room beats | room id, title, theme/mood, links, props, declarations, bounds, and anchors |
| Anchors | world-space anchor points with typed common attrs such as `id`, `to`, `requires`, `movement`, and `reward` |
| Routes | ordered room links for active first-walk topology |
| Future routes | route promises drawn as inactive future topology |
| Shortcuts | progress-gated route facts with availability, movement, source anchor, and target landing |
| Home mutations | Cicka Home mutation facts with `adds`, `opens`, and raw attrs preserved |

Shortcut availability is derived from durable Ridge progress, not stored in the
blockout. The current Stampede shortcut maps `stampede_sketch` to the durable
`stampede-sketch` stamp. Locked shortcuts remain visible promises without
active colliders or assist zones.

Home mutations follow the same data-first rule. `stampede_sketch` currently
activates the `stampede_note` addition and `fold_drop_landing` opening when the
durable Stampede stamp exists. Other declarations, such as `work_artifact`,
remain typed future promises until a real progress source exists.

## Symbol Draft

The symbol table is versioned. v0 should stay small enough to parse quickly, but
the format should allow new symbols and anchor types without rewriting existing
maps.

| Symbol | Meaning | Runtime intent |
| --- | --- | --- |
| `.` | empty air | no collider |
| `#` | solid ground/wall | solid collider |
| `_` | platform | solid top surface |
| `1-9` | numbered anchor | details defined by `anchor` lines |
| `C` | Cicka anchor | NPC/interact anchor |
| `A` | artifact marker | collectible/inspectable anchor |
| `*` | mini-game anchor | launch point |
| `^` | elevator/lift | moving platform anchor |
| `?` | secret/gated route | hidden or locked anchor |

Runtime-active v0 symbols:

| Symbol | Meaning |
| --- | --- |
| `.` | empty air |
| `#` | solid collider |
| `_` | platform collider |
| `1-9` | numbered anchors |
| `C` | Cicka spawn/interact anchor |
| `A` | artifact marker |
| `*` | mini-game marker |
| `^` | lift marker |
| `?` | locked/secret marker |

Design-only v0 symbols:

| Symbol | Meaning |
| --- | --- |
| `=` | one-way platform |
| `~` | wind/drop texture |
| `N` | generic NPC |
| `M` | memento board | Cicka Home memory anchor |

Source compiler rule: unknown symbols should fail with a clear error unless the
room opts into a newer language version.

Exit anchors may include `movement=` to choose the generated traversal
connector. v0 supports `ramp`, `jump`, `climb`, and `drop`; unknown movement
values fail validation. These are blockout semantics, not final ability names.
`ramp` is a legacy/internal connector label for assisted walking strips; the v0
Ridge design should describe main-path terrain as chunky stairs, shelves,
bridges, cords, lifts, and soft drops rather than visual slope traversal. Jump
connectors remain available for legacy or optional blockouts but are not the v0
main-route target. Climb connectors create cord/lift assist zones, and drops
create safe return zones when unlocked.

Seamless-world QA rule: runtime-active, non-empty cells from different room
beats should not overlap unless the map explicitly declares a merge rule. v0
should avoid merge rules and treat conflicting non-empty overlap as a validation
error.

## Current Runtime Output

`src/game/scenes/ridge/blockout/` generates a committed `.generated.ts`
artifact from the typed `.source.ts` file. `RidgeScene` renders every room into
one whole-world greybox by default, derives typed traversal connectors from
`movement` metadata, compiles typed facts for presentation/interaction modules,
resolves shortcuts from durable Ridge progress, and keeps future routes, locked
shortcuts, and future Cicka Home mutations as inactive promises until their
progress source exists.
