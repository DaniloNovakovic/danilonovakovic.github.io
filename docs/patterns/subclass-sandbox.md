# Subclass Sandbox

> Stub — expand as you read the chapter.

## Intent

*(From the book: a base class exposes a small, safe palette of `protected` operations; subclasses implement concrete behavior by composing those operations only.)*

## In this repo

No current usage. Candidate fits later:

- A `MiniGameBase` that exposes a vetted API (play sound, open overlay, emit bridge event) so each mini-game can only touch the engine through that surface.
- Plugin authors (if we ever invite contributions) implementing a new building/mini-game through a restricted base.

## Status

`deferred`

## See also

- Book chapter: [Subclass Sandbox](https://gameprogrammingpatterns.com/subclass-sandbox.html)
- Related: [Bytecode](./bytecode.md), [Component](./component.md), [Type Object](./type-object.md)