# Fallow baselines

Committed snapshots for incremental adoption. CI compares PR changes against these files so existing cleanup debt does not block merges.

| File | Produced by |
| --- | --- |
| `dead-code.json` | `fallow dead-code --save-baseline` |
| `health.json` | `fallow health --save-baseline` |
| `dupes.json` | `fallow dupes --save-baseline` |

Paths are referenced from [`.fallowrc.jsonc`](../.fallowrc.jsonc) under `audit.*Baseline`.

Regenerate all three after intentional cleanup:

```bash
pnpm fallow:baseline
```

See [`docs/agents/fallow.md`](../docs/agents/fallow.md) for the full workflow.
