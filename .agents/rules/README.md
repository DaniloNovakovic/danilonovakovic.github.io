# Agent Rules

Tool-agnostic rules for AI coding agents working in this repo. These files are the canonical source.

Rules should describe stable seams, decision process, and things that would be expensive to get wrong. Avoid copying implementation walkthroughs from developer docs; link to those docs instead.

`AGENTS.md` should stay a thin entrypoint and should not restate these scoped rules.

## Documentation Freshness Policy

- Global docs explain stable concepts, policies, cross-folder flows, and canonical entrypoints.
- JSDoc explains volatile symbol behavior, side effects, lifecycle order, and misuse risks near the code that changes.
- Local READMEs map complex folders only; avoid per-file inventories unless the files are stable landmarks.
- Exact file links are useful for canonical anchors, but avoid implementation walkthroughs that must be manually synchronized across docs and code.
- Archive, staging, and generated-source folders must have a lifecycle state,
  owner/source-of-truth pointer, and deletion trigger. Do not keep bulky files
  or old docs only because they might be useful someday; summarize the durable
  decision and delete or prune the bulk when it no longer serves active
  provenance, regeneration, audit, or comparison work.
- For asset intake, use `asset-sources/` as the single non-runtime asset
  workbench. Check `asset-sources/settings.local.json` when it exists. It is
  machine-local and gitignored, used for private Google Drive/archive locations
  and local inbox paths. Do not commit credentials, personal Drive shortcuts, or
  temporary asset dumps.

## Rule Files

- [`00-philosophy.md`](00-philosophy.md) — repo-wide constraints for abstractions and shared state.
- [`10-architecture.md`](10-architecture.md) — core, ECS, adapters, scene lifecycle, scene context, overlays, and bridge seams.
- [`20-game-runtime.md`](20-game-runtime.md) — Phaser runtime, scene lifecycle, pause/input, resume, and shared scene runtime modules.
- [`30-react-overlays.md`](30-react-overlays.md) — React overlay rules and bridge-only UI/engine communication.

## Tooling Policy

Do not duplicate these rules into IDE-specific files. If a future tool needs its own entrypoint, make it a thin pointer to `AGENTS.md` and this directory.
