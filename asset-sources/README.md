# Asset Sources

`asset-sources/` is the single non-runtime asset workbench for generated images,
reference art, prompts, source exports, and pre-adoption sprite experiments.

The folder is intentionally gitignored by default. Only this README and
`*.example.*` files are tracked unless an asset is deliberately force-added as a
short-lived exception.

## Tracked Files

- `README.md` - the source-workbench contract.
- `settings.local.example.json` - the private settings template.

Everything else belongs to your local machine or external storage until an asset
is adopted into runtime.

## Local Shape

Copy `settings.local.example.json` to `settings.local.json`, then fill in your
Google Drive or cloud archive location.

```text
asset-sources/
├── README.md
├── settings.local.example.json
├── settings.local.json          # ignored
├── inbox/                       # ignored temporary handoff
│   └── 2026-05-14-cicka-perch/
│       ├── source.png
│       ├── prompt.md
│       └── notes.md
├── stampede-sketch/
│   └── generated-concepts/      # ignored raw concept mirror
├── prepared/                    # ignored local candidates
└── archive-mirror/              # ignored optional Drive/cloud downloads
```

Do not store credentials, access tokens, or private keys here. A normal Drive
folder link or human-readable path is enough for agent context.

Use these archive keys in local settings and tracked provenance:

- `project-main` - main project asset archive.
- `generated-concepts` - reference-only external archive for raw generated
  concept sheets.
- `prepared-assets` - external mirror for `asset-sources/prepared/**`.

## Storage Roles

| Location | Git status | Purpose |
| --- | --- | --- |
| `asset-sources/settings.local.json` | ignored | Machine-local archive settings and inbox paths. |
| `asset-sources/inbox/**` | ignored | Temporary handoff for images, prompts, notes, and Drive downloads. |
| `asset-sources/**/generated-concepts/**` | ignored by default | Local raw concept mirror for reference only. |
| `asset-sources/prepared/**` | ignored by default | Local normalized candidates before adoption. |
| Google Drive or cloud archive | external | Bulk raw generations, rejected variants, source files, prompt experiments, and large batches. |
| `public/assets/**` | tracked | Runtime-wired assets loaded by the game. |

## Adoption Flow

1. Put raw experiments in Google Drive/cloud storage and optionally mirror the
   current working copy into `asset-sources/inbox/`.
2. Ask for review, conversion, or QA using the local path or Drive link.
3. If the asset is rejected, delete the inbox copy and keep only the external
   archive if it is still useful.
4. If the asset becomes a candidate, keep it in `asset-sources/prepared/**`
   locally or record a stable external source pointer in the adopting asset's
   README/manifest.
5. If the asset is adopted at runtime, promote only the runtime-loaded outputs
   into `public/assets/**`.
6. After promotion, delete duplicate prepared outputs and keep only source or
   rework material with a clear reason.

## Tracked Provenance

When an external source matters to the project, record a stable pointer in the
tracked runtime asset README or manifest:

```json
{
  "externalSourceWebUrl": "https://drive.google.com/...",
  "externalArchiveKey": "prepared-assets",
  "externalArchivePath": "characters/cicka/",
  "status": "adopted runtime asset",
  "adoptedAssetPath": "public/assets/ridge/cicka/cicka-spritesheet.png",
  "deleteAfter": "Delete local prepared copies after runtime adoption is verified."
}
```

Avoid keeping files only because they might be useful someday. If that is the
only reason, keep a short note or external archive pointer instead of committing
the bulk asset files.

## Legacy Note

Older branches may still have tracked files under `asset-sources/**`. Treat
those as a migration backlog: move durable bulk to the external archive, promote
runtime outputs to `public/assets/**`, and untrack or delete the rest in a
separate cleanup slice.
