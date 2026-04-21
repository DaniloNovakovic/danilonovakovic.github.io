# Context Plugins Folder

`contextPlugins/` defines kernel context modules used by `SceneManager`.

## Owns

- Context plugin definitions (`ContextPluginDefinition`)
- Context start-data composition for scene entry
- Context lifecycle-level wiring (enter/exit/pause/resume hooks when needed)

## Depends on

- `core/kernel/types.ts` and `config/featureIds.ts`
- Runtime data passed in from callers (for example resume getters) instead of directly importing runtime internals

## Lint boundary

ESLint (`no-restricted-imports` in `eslint.config.js`) forbids importing from `runtime/` under `src/contextPlugins/**`. Pass runtime-derived values through plugin factory options instead.

## Does not own

- Phaser scene implementation details (`runtime/`)
- Engine adapter logic (`infra/`)
- Global cross-boundary state store (`shared/`)

## Common entrypoints

- `plugins/StreetPlugin.ts`
- `plugins/HobbiesPlugin.ts`
