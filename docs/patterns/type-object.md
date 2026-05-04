# Type Object

## Intent

Represent "kinds" of things as data instead of subclasses. In TypeScript this is usually a discriminated union or a plain config object with a stable `kind` / `id`.

## In JS/TS + Phaser

- Extremely natural fit in TS: a `BuildingKind` / `NpcKind` is a plain data object; each instance holds a reference to one.
- Avoids a subclass explosion when you want many small variants.
- Pairs well with runtime catalogs: config owns static facts, while runtime Modules resolve behavior through typed variants.

## In this repo

Current usage:

- Feature definitions are type-object-shaped catalog entries composed into the runtime feature catalog (see `[src/features/catalog.ts](../../src/features/catalog.ts)`, compatibility exports in `[src/config/featureRuntimeBindings.ts](../../src/config/featureRuntimeBindings.ts)`, and `[src/runtime/miniGameRegistry.ts](../../src/runtime/miniGameRegistry.ts)`).
- `[src/runtime/types.ts](../../src/runtime/types.ts)` models React overlays and Phaser scenes as discriminated feature variants with required fields per kind.
- `[src/features/hobbies/roomLayout.ts](../../src/features/hobbies/roomLayout.ts)` and `[src/features/basement/roomLayout.ts](../../src/features/basement/roomLayout.ts)` model room interactables as explicit variants consumed by runtime interaction Modules, with compatibility exports from `src/config`.
- Any future NPC/enemy variants in mini-games should go the same way (data, not subclasses).

## Status

`in use` (small) — current feature and interactable kinds are represented as data variants, not subclasses.

## See also

- Book chapter: [Type Object](https://gameprogrammingpatterns.com/type-object.html)
- Related: [Flyweight](./flyweight.md), [Prototype](./prototype.md), [Component](./component.md)
