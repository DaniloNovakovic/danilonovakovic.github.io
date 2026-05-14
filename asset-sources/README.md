# Asset Sources

`asset-sources/` is the local, non-runtime workbench for generated images,
reference art, prompts, exports, and sprite experiments.

Most of this folder is ignored by Git. It can contain whatever is useful during
asset work, as long as runtime code does not depend on it.

## Tracked

Only these files are normally tracked:

- `README.md` - this contract.
- `*.example.*` - templates, such as `settings.local.example.json`.

Everything else should stay local or live in the external asset archive until a
runtime adoption slice promotes final outputs into `public/assets/**`.

## Lifecycle

Default flow:

1. Generate or collect exploratory art in ignored `asset-sources/inbox/**`,
   another ignored folder under `asset-sources/**`, or the external archive.
2. When a candidate is worth keeping, back it up in Google Drive or another
   external archive. Mirror it locally only while reviewing or preparing it.
3. Prepare and QA selected candidates in ignored `asset-sources/prepared/**` or
   an equivalent task-specific folder.
4. When product code actually uses the asset, copy only optimized runtime files
   into `public/assets/**`. Starting there, the asset is tracked in Git.
5. After adoption, remove duplicate runtime outputs from the local workbench.
   Keep bulky source/history externally only while it supports rework,
   comparison, audit, or regeneration.

## Local Settings

Copy `settings.local.example.json` to `settings.local.json` and fill in your
private Google Drive/archive links. `settings.local.json` is ignored.

Do not store credentials, access tokens, or private keys here. Folder links and
human-readable notes are enough.

Current archive keys:

- `project-main` - main project asset archive.
- `prepared-assets` - likely source for future sprite adoption.
- `generated-concepts` - reference-only archive for raw concept sheets.

## Suggested Shape

This shape is a convention, not a requirement:

```text
asset-sources/
├── README.md
├── settings.local.example.json
├── settings.local.json          # ignored
├── inbox/                       # ignored temporary handoff
├── prepared/                    # ignored local mirror of prepared assets
└── <task-specific>/             # ignored, optional
```

Use `inbox/` for temporary handoff files. Use `prepared/` when working from an
external prepared asset folder. Other folders are fine if a task needs them.

## Promotion Rule

`asset-sources/**` is not a shipping location. When an asset is adopted:

1. Put only runtime-loaded files in `public/assets/**`.
2. Record external provenance in the runtime asset README or manifest when it
   matters.
3. Keep bulky source/history in Google Drive or another external archive.
