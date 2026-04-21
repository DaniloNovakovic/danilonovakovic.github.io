# Shared Folder

`shared/` hosts cross-boundary primitives used by both React UI and Phaser runtime.

## Owns

- Bridge state store and actions (`bridge/store.ts`)
- Bridge tests and synchronization contracts

## Depends on

- Stable domain/config enums and IDs

## Does not own

- Scene transition orchestration (kernel)
- Direct scene object manipulation
- React presentation components

## Common entrypoints

- `bridge/store.ts`
- `bridge/store.test.ts`
