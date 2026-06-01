# Adopt Ridge Stage Composition Source For Experimental Ridge Exploration

Status: accepted for experimental Ridge exploration and the First Playable Route.

Ridge exploration will use a typed Ridge Stage Composition Source as the primary authoring surface for Walkable Sketchbook Stages. The source owns Walk Rails, Stage Spots, Stage Plates, Stage Objects, Stage Occluders, camera framing, and beat-state-driven presentation, while route/story logic remains in the route state and interaction systems.

For the First Playable Route, Walk Rails are the movement authority instead of free side-view platform colliders. This keeps Procreate exports as visual Stage Plates rather than gameplay source, preserves AI-editable and git-reviewable staging data, and avoids introducing Tiled, LDtk, or scattered runtime constants before the Ridge art and traversal language settles.

## Considered Options

- Continue the current Bridge tracer approach with Phaser side-view physics, flat floor colliders, and scattered placement constants.
- Use Tiled or LDtk as the primary source for paths, objects, and occlusion.
- Treat Procreate foreground art as the implicit gameplay path and manually sync invisible runtime shapes to it.
- Use a typed Ridge Stage Composition Source with Walk Rails and rail-relative Stage Spots/Objects.

## Consequences

- Ridge internals may make breaking changes while Overworld, Hobbies, Basement, and other deployed player-facing surfaces stay protected.
- Future Ridge areas should put major spatial staging in the Stage Composition Source instead of burying it in Phaser scene code.
- The first implementation should stay Ridge-owned until Bridge and at least one later area prove which parts are genuinely reusable.
- Stage Composition Sources should be colocated with their owning Ridge Area or Compact Ridge Stage instead of collected into one monolithic First Playable Route source.
- Visual editors can be added later, but the canonical source stays typed and reviewable until a stronger workflow proves itself.
