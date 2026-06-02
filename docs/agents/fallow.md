# Fallow workflow

Fallow is the repo's codebase-intelligence gate: dead code, duplication, complexity, and architecture boundaries. Config lives in [`.fallowrc.jsonc`](../../.fallowrc.jsonc). Agent commands and JSON contracts live in [`.agents/skills/fallow/SKILL.md`](../../.agents/skills/fallow/SKILL.md).

## Daily commands

| Command | When |
| --- | --- |
| `pnpm fallow:audit` | Before pushing a branch; scopes to files changed since `main` |
| `pnpm fallow:health` | Periodic review of complexity hotspots and duplication rate |
| `pnpm fallow` | Full-repo snapshot when planning cleanup or refactors |
| `pnpm check` | Local parity with CI (includes `fallow:audit`) |

CI runs `pnpm fallow:ci`, which is the same audit gate with baselines and `origin/main` as the diff base.

## What CI enforces

- **Gate:** `new-only` — PRs fail only on findings **introduced** in changed files.
- **Baselines:** committed under [`fallow-baselines/`](../../fallow-baselines/) so existing debt does not block merges.
- **Severity:** `boundary-violation` is **error**; unused code and duplication are **warn** until debt is reduced.

## Architecture boundaries

Fallow enforces the hardest rules from [`.agents/rules/10-architecture.md`](../../.agents/rules/10-architecture.md):

- `src/game/core/**` may import only from `core` and `shared`
- `src/shared/**` may import only from `shared`

Add more zones/rules one at a time after fixing any violations they surface.

## Baseline maintenance

Regenerate baselines after intentional cleanup (not after every PR):

```bash
pnpm fallow:baseline
git add fallow-baselines/
```

Commit the updated JSON when issue counts drop on purpose.

## Known warn-tier debt (actionable, not suppressed)

Fallow currently warns on:

- **Scene `index.ts` barrels** that nothing imports yet. Either route cross-folder imports through those barrels (preferred by folder-ownership rules) or delete the dead barrels.
- **Public tuning/constants exports** used mainly in tests or reserved for future gameplay tuning.
- **Test duplication** in large integration tests such as `InteractiveApp.test.tsx`.

Do not add blanket ignores for these unless the finding is a proven false positive. Prefer `// fallow-ignore-next-line <issue-type>` on stable, intentional exceptions.

## Agent usage

When analyzing or cleaning code:

1. Read [`.agents/skills/fallow/SKILL.md`](../../.agents/skills/fallow/SKILL.md).
2. Use `--format json --quiet 2>/dev/null` and append `|| true` for shell calls.
3. Run `fallow fix --dry-run` before any auto-fix.
4. Never enable Fallow telemetry on the user's behalf.
