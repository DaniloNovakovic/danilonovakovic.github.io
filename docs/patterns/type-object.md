# Type Object

> Stub — expand as you read the chapter.

## Intent

*(From the book: represent "kinds" of things as data — instances of a `Type` class — rather than as separate subclasses. Each game object carries a reference to its type object.)*

## In JS/TS + Phaser (notes to verify)

- Extremely natural fit in TS: a `BuildingKind` / `NpcKind` is a plain data object; each instance holds a reference to one.
- Avoids a subclass explosion when you want many small variants.

## In this repo

Current usage:

- Buildings along the street are composed via type-object-shaped config (see `[src/config/featurePlugins.ts](../../src/config/featurePlugins.ts)`, `[src/config/worldLayout.ts](../../src/config/worldLayout.ts)`, `[src/config/portfolioCompose.ts](../../src/config/portfolioCompose.ts)`). The "type" lives in config, and world placement supplies instance data.
- `[src/runtime/types.ts](../../src/runtime/types.ts)` models React overlays and Phaser scenes as discriminated feature variants with required fields per kind.
- `[src/config/hobbiesRoomLayout.ts](../../src/config/hobbiesRoomLayout.ts)` models hobby stations and exits as explicit room interactable variants.
- Any future NPC/enemy variants in mini-games should go the same way (data, not subclasses).

## Status

`in use` (small) — current feature and interactable kinds are represented as data variants, not subclasses.

## See also

- Book chapter: [Type Object](https://gameprogrammingpatterns.com/type-object.html)
- Related: [Flyweight](./flyweight.md), [Prototype](./prototype.md), [Component](./component.md)