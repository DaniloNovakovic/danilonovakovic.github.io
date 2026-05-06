# Personal website

## Brief

The goal is to create a place where I can easily surface interesting personal open-source projects and exercises, share a bit about myself, and maybe attract and connect with like-minded people.

**This repository (v3)** is a gamified portfolio: a **Phaser** overworld plus **React** overlays for sections and mini-games. Stack: **Vite**, **React 19**, **TypeScript**, **Tailwind CSS v4**. Design direction lives in [`docs/design/style-guide.md`](docs/design/style-guide.md); agent-oriented notes in [`AGENTS.md`](AGENTS.md).

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

Runtime layering follows a micro-kernel + bridge pattern. Game runtime lookup lives in [`src/game/runtime/miniGameRegistry.ts`](src/game/runtime/miniGameRegistry.ts), with source facts owned by [`src/game/scenes`](src/game/scenes), [`src/game/portfolio`](src/game/portfolio), and composed through the game registry helpers.

User-facing copy is centralized in the typed i18n catalog under [`src/shared/i18n/messages/en`](src/shared/i18n/messages/en). React surfaces read it through `useMessages()` for live locale updates, while Phaser/runtime code reads the active catalog with `getMessages()` and refreshes on scene restart or re-entry. Non-copy portfolio facts live in [`src/shared/portfolio`](src/shared/portfolio) and are combined with localized messages by selectors.

Full runtime layering and Module seams are in [`docs/runtime-architecture.md`](docs/runtime-architecture.md). Agent rules live in [`.agents/rules/`](.agents/rules/).

## Deploy (GitHub Pages)

Production build outputs to `dist/`. [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs lint, tests, and build on `push` / `pull_request` against `main`/`master`. [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) runs the same quality gates and deploys GitHub Pages from `master`.

## Credits & License

- **Code:** Licensed under the [MIT License](LICENSE).
- **Character Art:** This project uses "Punpun" from *Oyasumi Punpun* by Inio Asano as a placeholder/mascot for non-commercial, personal portfolio purposes (Fair Use). All rights belong to the original copyright owners.
