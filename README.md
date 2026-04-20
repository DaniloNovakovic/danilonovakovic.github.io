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

## Architecture

Runtime layering follows a micro-kernel + bridge pattern. Feature list and world positions are composed from [`src/config/featurePlugins.ts`](src/config/featurePlugins.ts), [`src/config/worldLayout.ts`](src/config/worldLayout.ts), and [`src/config/portfolioCompose.ts`](src/config/portfolioCompose.ts) into [`src/config/portfolioRegistry.ts`](src/config/portfolioRegistry.ts).

Full runtime layering and module boundaries are in [`docs/ARCHITECTURE_RUNTIME.md`](docs/ARCHITECTURE_RUNTIME.md). Architectural patterns used here are anchored to Robert Nystrom's *[Game Programming Patterns](https://gameprogrammingpatterns.com/)*; per-pattern notes and adoption status live in [`docs/patterns/`](docs/patterns/README.md).

## Deploy (GitHub Pages)

Production build outputs to `dist/`. [`.github/workflows/ci.yml`](.github/workflows/ci.yml) currently runs lint, tests, and build on `push` / `pull_request` against `main`/`master` — **it does not deploy yet**. To track `main` automatically on GitHub Pages, add an `actions/deploy-pages` step to that workflow (TODO).
