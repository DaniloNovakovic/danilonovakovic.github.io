# Adopt A Validated Ridge Blockout Source Contract

Status: accepted.

Ridge blockout authoring will move from the current custom ASCII-first DSL toward
an AI-readable typed TypeScript Ridge Blockout Source with a build-time Ridge
Source Contract. The source remains optimized for Danilo and AI level-design
agents to read and edit, while a generator validates the source and emits a
committed typed TypeScript artifact for runtime and future editor imports.

## Considered Options

- Keep the current custom `.blockout.txt` parser and deepen validation in place.
- Store dense grid cells as raw numeric tile IDs, matching common tilemap
  runtime formats.
- Use external editor formats such as Tiled or LDtk as the primary source.
- Use typed TypeScript authoring source with readable grid symbols, an explicit
  tile registry, build-time validation, and committed generated TypeScript
  output.

We chose typed TypeScript authoring plus generated TypeScript because Ridge
needs source files that are easy for AI agents to modify directly, while source
imports should still fail type-safely when the contract changes. Runtime code
should depend on typed compiled data rather than loose strings or runtime-only
parser conventions. Numeric Runtime Tile IDs remain part of the compiled layer,
not the primary authoring surface.

## Consequences

- Danilo and AI level-design agents edit the Ridge Blockout Source, not generated
  TypeScript.
- The generator owns the committed `.generated.ts` artifact, and runtime/editor
  code imports that typed artifact.
- Build, typecheck, or check workflows should fail when the source is structurally
  or semantically invalid.
- A migration may temporarily keep the old DSL and new JSONC source side by side
  inside one PR for parity checks, but the project should not keep two permanent
  Ridge source formats.
- The first Ridge Blockout Editor should be a read-only visual QA surface over
  the validated/compiled data. Source-writing tools can come after the viewer
  proves the source, compiler, and renderer agree.
