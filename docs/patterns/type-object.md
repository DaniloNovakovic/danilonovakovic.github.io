# Type Object

> Stub — expand as you read the chapter.

## Intent

*(From the book: represent "kinds" of things as data — instances of a `Type` class — rather than as separate subclasses. Each game object carries a reference to its type object.)*

## In JS/TS + Phaser (notes to verify)

- Extremely natural fit in TS: a `BuildingKind` / `NpcKind` is a plain data object; each instance holds a reference to one.
- Avoids a subclass explosion when you want many small variants.

## In this repo

Candidate usage:

- Buildings along the street are currently composed via config (see `[src/config/featurePlugins.ts](../../src/config/featurePlugins.ts)`, `[src/config/worldLayout.ts](../../src/config/worldLayout.ts)`, `[src/config/portfolioCompose.ts](../../src/config/portfolioCompose.ts)`). This is already Type-Object-shaped: the "type" lives in config, instances are positioned on the map.
- Any future NPC/enemy variants in mini-games should go the same way (data, not subclasses).

## Status

`planned`

## See also

- Book chapter: [Type Object](https://gameprogrammingpatterns.com/type-object.html)
- Related: [Flyweight](./flyweight.md), [Prototype](./prototype.md), [Component](./component.md)