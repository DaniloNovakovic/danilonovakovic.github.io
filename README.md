# Personal website

## Brief

The goal is to create a place where I can easily surface interesting personal open-source projects and exercises, share a bit about myself, and maybe attract and connect with like-minded people.

**This repository (v3)** is a gamified portfolio: a **Phaser** overworld plus **React** overlays for sections and mini-games. Stack: **Vite**, **React 19**, **TypeScript**, **Tailwind CSS v4**. Design direction lives in [`docs/design/STYLE_GUIDE.md`](docs/design/STYLE_GUIDE.md); agent-oriented notes in [`AGENTS.md`](AGENTS.md).

**Personal log / opinions by version:** see [`CHANGELOG.md`](CHANGELOG.md) (v1 → v2 → current v3).

## Development

```bash
npm install
npm run dev
```

## Quality checks

```bash
npm run lint
npm run test
npm run build
```

## Architecture (short)

Feature list and world positions are composed from [`src/config/featurePlugins.ts`](src/config/featurePlugins.ts), [`src/config/worldLayout.ts`](src/config/worldLayout.ts), and [`src/config/portfolioCompose.ts`](src/config/portfolioCompose.ts) into [`src/config/portfolioRegistry.ts`](src/config/portfolioRegistry.ts).

Runtime architecture now follows a micro-kernel + bridge pattern:
- Shared UI/engine state bridge: [`src/shared/bridge/store.ts`](src/shared/bridge/store.ts)
- Kernel lifecycle + event flow: [`src/core/kernel/GameKernel.ts`](src/core/kernel/GameKernel.ts)
- Scene lifecycle orchestration: [`src/core/kernel/SceneManager.ts`](src/core/kernel/SceneManager.ts)
- Phaser adapter boundary: [`src/infra/phaser/PhaserSceneAdapter.ts`](src/infra/phaser/PhaserSceneAdapter.ts)
- Context plugins (street + hobbies): [`src/games/plugins/StreetPlugin.ts`](src/games/plugins/StreetPlugin.ts), [`src/games/plugins/HobbiesPlugin.ts`](src/games/plugins/HobbiesPlugin.ts)
- ECS primitives and player systems (initial migration): [`src/core/ecs`](src/core/ecs)

Folder ownership note:
- [`src/game`](src/game) currently contains active scene/runtime implementation.
- [`src/games`](src/games) contains plugin/context wrappers and is the target location for future feature-module migration.

Architectural patterns used here are anchored to Robert Nystrom's [*Game Programming Patterns*](https://gameprogrammingpatterns.com/); per-pattern notes and adoption status live in [`docs/patterns/`](docs/patterns/README.md).

## Deploy (GitHub Pages)

Production build outputs to `dist/`. CI runs lint, tests, and build via [`.github/workflows/ci.yml`](.github/workflows/ci.yml). Wire a Pages deploy step there if you want the live site to track `main` automatically.
