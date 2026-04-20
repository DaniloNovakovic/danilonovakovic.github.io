# Flyweight

> Stub — expand as you read the chapter.

## Intent

*(From the book: share common, intrinsic data across many instances so each instance only carries its unique, extrinsic data.)*

## In JS/TS + Phaser (notes to verify)

- Phaser's `Texture` / `Frame` / `Tileset` already behave like flyweights — the pixel data is shared, instances just reference it.
- The equivalent JS mistake is allocating duplicate config objects in a hot loop; keep shared config hoisted.

## In this repo

No current explicit flyweight. Candidate fits later:

- Building / NPC "kind" data if we grow more locations along the street.
- Tile definitions if any mini-game uses a tilemap.

## Status

`not yet read`

## See also

- Book chapter: [Flyweight](https://gameprogrammingpatterns.com/flyweight.html)
- Related: [Type Object](./type-object.md)