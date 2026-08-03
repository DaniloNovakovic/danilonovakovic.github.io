# Asset Layout And Adoption

Folder trees, gitignore policy, and promotion rules for the Sketchbook sprite
pipeline. The step list and QA commands stay in `SKILL.md`.

## Path Conventions

All paths are repository-relative. Run commands from the repo root (or prefix
with the checkout path). Do not depend on a tool-specific home directory.

## Intake And Prepared Layout

Keep raw generated concepts and bulky source ideation outside Vite's deployable
`public` tree.

Private experimental intake (gitignored):

```text
asset-sources/
├── settings.local.json
└── inbox/<date-slug>/
    ├── source.png
    ├── prompt.md
    └── notes.md
```

Prepared runtime candidates (gitignored local mirror and/or external archive):

```text
asset-sources/prepared/<scene-or-domain>/<slug>/
├── source-keyed.png            # if chroma-keyed
├── source.png                  # transparent source sheet or still
├── source-frames/*.png         # larger rough transparent crops
├── frames/*.png                # normalized runtime frames
├── <slug>-spritesheet.png
├── <slug>-debug-contact.png
└── manifest.json
```

- `asset-sources/inbox/**` — quick concepts and not-yet-adopted source.
- External archive from `asset-sources/settings.local.json` — large rejected
  variants, raw AI batches, layered sources, prompt experiments.
- `public/assets/**` — only assets that are runtime-wired.

When a source becomes durable project provenance, prefer a stable external
source pointer in the adopting folder README/manifest. Do not add
`asset-sources/**` to Git unless Danilo explicitly asks; default keeps source
and prepared work out of normal Git until runtime adoption.

Prefer the prepared candidate archive for adoption work; treat raw concept
archives as reference-only.

## Manifest Minimum

Include:

- `slug`, `source`, `spritesheet`
- `frameWidth`, `frameHeight`, `frameCount`
- `origin`
- `runtimeScale`
- `frames[]` with `state`, `file`, and optional `sourceFile`
- `hitboxCompatibility` or `body` when Phaser physics will use it
- `debugContact`

## Adoption

Adopt the smallest runtime proof first:

- Character → display-only idle NPC before physics actor
- Enemy → one family before a whole pack
- Prop → one static readable object before an animated set

Promote into `public/assets/<scene-or-domain>/<slug>/` only when:

1. Scene code preloads the asset
2. A folder-local README explains ownership, source, frame contract, and runtime
   use

After promotion, remove duplicate runtime outputs from `asset-sources/**` and
leave a deletion trigger for any source/prepared files that remain in the
external archive or local ignored mirror.
