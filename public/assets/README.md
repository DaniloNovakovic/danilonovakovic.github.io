# Runtime Assets

This directory is Vite's browser-addressable asset surface. Anything placed
here is copied into production builds and can be requested as `/assets/...`.

Generated concepts and prepared-but-unwired sprite candidates belong under
`asset-sources/**`, not here.

Only move assets into this directory when scene code actually preloads them or a
runtime integration slice intentionally makes them deployable.

## Folder Expectations

Runtime asset folders should answer:

1. who owns this asset family
2. which runtime code loads it
3. which manifest/readme defines frame sizing and usage
4. what source folder under `asset-sources/**` it was promoted from

If that information is missing, add a small folder-local `README.md`.
