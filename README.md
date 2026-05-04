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

Runtime layering follows a micro-kernel + bridge pattern. Feature runtime lookup lives in [`src/runtime/miniGameRegistry.ts`](src/runtime/miniGameRegistry.ts), with source facts owned by [`src/features`](src/features) and composed through the feature catalog and registry helpers.

Full runtime layering and Module seams are in [`docs/ARCHITECTURE_RUNTIME.md`](docs/ARCHITECTURE_RUNTIME.md). Agent rules live in [`.agents/rules/`](.agents/rules/). Architectural patterns are decision aids, not an implementation checklist; per-pattern notes and adoption status live in [`docs/patterns/`](docs/patterns/README.md).

## Deploy (GitHub Pages)

Production build outputs to `dist/`. [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs lint, tests, and build on `push` / `pull_request` against `main`/`master`. [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) runs the same quality gates and deploys GitHub Pages from `master`.

## Credits & License

- **Code:** Licensed under the [MIT License](LICENSE).
- **Character Art:** This project uses "Punpun" from *Oyasumi Punpun* by Inio Asano as a placeholder/mascot for non-commercial, personal portfolio purposes (Fair Use). All rights belong to the original copyright owners.
