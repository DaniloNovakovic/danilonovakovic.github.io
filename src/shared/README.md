# Shared Folder

`shared/` hosts code reused by both the static portfolio and playable game surfaces.

## Owns

- UI primitives under `ui/`, grouped as `Component/Component.tsx`, optional tests/stories, and `Component/index.ts`.
- Generic hooks under `hooks/`.
- Shared authored content under `content/`.
- Shared config under `config/`.
- Pure audio DSP under `audio/` (e.g. Karplus-Strong plucks), used by Hobbies music and the Ridge concert.

## Depends on

- React and generic browser APIs where needed.

## Does not own

- Game bridge state, scene transition orchestration, Phaser runtime code, or game registry facts.
- Static-only portfolio presentation.

## Common entrypoints

- `ui/index.ts`
- `hooks/*`
- `content/*`
- `config/*`
