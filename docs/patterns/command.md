# Command

## Intent

Represent an action as data so it can be stored, queued, remapped, replayed, or consumed by code that does not know where the action came from.

## In JS/TS + Phaser

- Treat command objects as input intents, not necessarily class instances. A plain object like `{ moveAxis, jump, interact }` is enough when you do not need undo or serialization.
- Keep physical input mapping near Phaser scenes; keep the command shape in core so systems can consume input without knowing whether it came from keyboard, touch, or another source.

## In this repo

Small current usage:

- `[src/game/core/input/commands.ts](../../src/game/core/input/commands.ts)` defines `InputCommandFrame`, the shared intent frame for movement, jump, interact, sprint, and exit.
- `[src/game/runtime/input/readSceneInputCommands.ts](../../src/game/runtime/input/readSceneInputCommands.ts)` maps Phaser keyboard state plus bridge touch one-shots into that command frame.
- `[src/features/overworld/runtime/OverworldScene.ts](../../src/features/overworld/runtime/OverworldScene.ts)` and `[src/features/hobbies/runtime/HobbiesScene.ts](../../src/features/hobbies/runtime/HobbiesScene.ts)` now feed commands into `PlayerController` instead of rebuilding raw booleans independently.

Future candidates:

- Input remapping for `[src/game/runtime](../../src/game/runtime)` scenes.
- Undo/redo in any mini-game that edits state (e.g. a terminal or sketching mini-game).
- Replay or record-and-playback for a guitar/rhythm mini-game.

## Status

`in use` (small) — input is represented as intent frames. Full undo/redo or replay commands are not needed yet.

## See also

- Book chapter: [Command](https://gameprogrammingpatterns.com/command.html)
- Related: [Event Queue](./event-queue.md), [State](./state.md), [Bytecode](./bytecode.md)
