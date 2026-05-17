# Current Ridge Level

> Current human-readable Ridge level snapshot. This is not shipped player
> documentation and not the issue tracker. Update this when the playable Ridge
> route, runtime blockout, reward contract, or current level target changes.

## Ownership

- **Shipped behavior:** [`player-manual.md`](../player-manual.md).
- **Runtime spatial data:** [`folded-desk-ridge.blockout.txt`](../../../src/game/scenes/ridge/blockout/maps/folded-desk-ridge.blockout.txt).
- **Blockout language contract:** [`map-language.md`](./map-language.md).
- **Current map target:** [`proper-map-plan.md`](./map-plans/proper-map-plan.md).
- **Product vision:** [`summit.md`](./summit.md).
- **Live implementation work:** GitHub Issues.

If this file disagrees with the folded desk Ridge blockout about room layout,
route order, anchors, shortcuts, or progress-gated geometry, the blockout wins.
If this file disagrees with GitHub about active work state, GitHub wins.

## Current Runtime Shape

Ridge is a separate Phaser scene that can boot directly in development with:

```text
?mode=interactive&startScene=ridge
```

Current runtime characteristics:

- Ridge uses shared side-view movement and camera/runtime support.
- The scene parses the Ridge Map Language source, derives geometry, compiles
  typed facts, and hands those facts to scene-owned presentation, traversal,
  interaction, and Cicka Home mutation modules.
- The runtime source is the folded Ridge blockout, not a separate hand-coded
  room catalog.
- Stampede can be reached from the Ridge Trail Card path.
- Telegraph, Domino, high ledge, underpath, and other future beats are present
  as route promises or disabled/teased anchors until their implementation
  slices exist.

## Current Route Read

The current blockout route is the folded desk Ridge:

```text
Outskirts
  -> Cicka Home
  -> Work Artifact Ledge
  -> Stampede Blanket
  -> Switchback Shelf
  -> Telegraph Terrace
  -> Guide Overlook
  -> Relay Gate
  -> Domino Desk
```

Future or optional promises in the blockout include:

- Paw Underpath from Outskirts/Cicka Home.
- Lucky Luna Drop Pocket from Guide Overlook toward Stampede Blanket.
- High Ledge above Domino Desk.
- Telegraph cord drop back to Cicka Home.
- Domino lift back to Cicka Home.

The level-design goal is that the player learns a compact vertical route, sees
Relay early, returns to Cicka Home through earned folds or drops, and learns
Danilo through artifacts rather than static portfolio buildings.

## Current Landmarks

- **Outskirts:** old city edge / future Overworld absorption point, Basement
  hatch promise, Potassium hint space, early Relay sightline.
- **Cicka Home:** emotional return anchor, Cicka perch, memento/home mutation
  space, future underpath clue.
- **Work Artifact Ledge:** first obvious work/project artifact area with a
  side-shelf skill scrap promise.
- **Stampede Blanket:** first new opt-in mini-game anchor and first earned
  Ridge memory source.
- **Switchback Shelf:** first spatial fold above Cicka Home and Stampede
  shortcut promise.
- **Telegraph Terrace:** future one-button parry/timing lane landmark.
- **Guide Overlook:** reorientation point and Relay sightline.
- **Relay Gate:** first-ending promise and proof-slot destination.
- **Domino Desk:** future deterministic puzzle/lift promise.

## Current Rewards And Memory

Durable Ridge progress is intentionally small:

- stamps
- manual pages
- glide pips
- shortcuts

Current accepted behavior:

- First Stampede clear awards the `stampede-sketch` Ridge stamp.
- First Stampede clear awards one glide pip.
- Repeat Stampede clears do not duplicate those rewards.
- Ridge derives visible Stampede blanket memory from the stamp instead of
  storing sticker ids.
- Cicka Home mutation facts are compiled from the blockout and become active
  only when a real durable progress source exists.
- Cicka can provide early pre-translator presence and Stampede-gated memory
  flavor without becoming a quest board, vendor, or inventory checklist.

## Current Target

The current map target is the **Vertical Folded Ridge With Cicka Switchback**
from [`proper-map-plan.md`](./map-plans/proper-map-plan.md).

The target asks for:

- no long hallway row
- vertical shelves and switchbacks
- Cicka Home near the lower-middle as an emotional return anchor
- main route traversal that stays mobile-safe
- first-walk route mastery before dexterity
- Cicka-return shortcuts after mini-game clears
- artifacts as physical learning objects, not resume modal replacements

## Not Current Scope

- Replacing the old Overworld as the default scene.
- Adding a minimap.
- Adding a generic mini-game framework.
- Adding stored sticker state.
- Making Cicka Home a checklist hub, shop, or quest board.
- Requiring wall jump, double jump, or precision platforming for the first
  farewell route.
- Moving the runtime blockout source again without an explicit migration issue
  that updates imports and documentation together.

## Update Rule

Update this file when:

- the current blockout route changes meaningfully
- a room or landmark becomes active/inactive in the runtime
- a reward changes durable state shape
- the current map target changes
- a prior topology/design spike is superseded

Do not update this file just to record every implementation issue. Use GitHub
Issues for live planning and agent-ready briefs.
