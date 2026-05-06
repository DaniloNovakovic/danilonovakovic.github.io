# Mini-Game Design Template

Use this when a synthesized concept is ready to become a candidate implementation slice.

## Name

## Fantasy

What playful hobby, personality trait, or portfolio idea is being turned into a game?

## Fun Core

What is the one action or decision that should feel good after 60 seconds?

## Research Inspiration

Name the relevant research docs and the specific fun core being borrowed.

## Session Shape

- target length
- restart flow
- win condition
- loss/reset condition
- optional mastery goal

## Controls

- desktop actions
- mobile control profile
- minimum touch targets
- input accessibility notes

## Progress Reward

What changes in the overworld, Hobbies room, Basement, or bridge-owned progress after completion?

## Runtime Shape

Expected folder:

```txt
src/game/scenes/<miniGame>/
  README.md
  index.ts
  sceneContext.ts
  runtime/
```

Add only the files the scene earns. Prefer scene-local runtime first.

## Out Of Scope

List the tempting features this slice should not build yet.

## Fun Test

Before expanding content, define how to tell whether the prototype is fun. Example: "A player should voluntarily retry after losing a 60-second run."
