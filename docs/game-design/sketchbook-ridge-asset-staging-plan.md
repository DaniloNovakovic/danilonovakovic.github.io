# Sketchbook Ridge Asset Staging Plan

> Planning companion for active Ridge and mini-game asset work.
> This is an organization and adoption guide, not a final art bible and not a
> promise that every prepared asset will ship unchanged.

Active sources: `sketchbook-ridge-summit.md`,
`sketchbook-ridge-milestone-plan.md`, `sketchbook-ridge-m3-visual-pack.md`,
`sketchbook-ridge-m3-overlay-pack.md`, `sketchbook-ridge-m3-audio-pack.md`,
`docs/design/style-guide.md`, local generated/prepared asset readmes under
ignored `asset-sources/**` when present,
and runtime asset readmes under `public/assets/**` when assets are promoted.

## Why This Exists

The repo now has several kinds of asset work happening at once:

- prompt/design direction docs
- raw generated concept sheets
- prepared transparent spritesheets and manifests
- runtime-integrated placeholders and production assets

That is healthy, but only if we keep the lanes explicit. Without a small plan,
it becomes easy to confuse:

- concept art with milestone commitment
- prepared spritesheets with runtime-ready integration
- scene-specific experiments with a repo-wide asset pipeline decision

This document keeps the Summit milestone moving while giving the newer POC
assets a clear home.

## Producer Summary

Producer read:

- the **long-term Ridge topology ideas do not mess up the current plan**
  if they stay planning-only
- the **asset work needs clearer staging language**
  so POC art does not accidentally become unscoped implementation pressure
- the right move is **small scene-owned adoption**
  rather than a broad asset overhaul

## Current Milestone Guardrail

The active milestone still proves:

1. a compact Ridge route exists
2. Relay Spire is visible early
3. Potassium Slip remains the existing arcade anchor
4. Stampede Sketch is the first new opt-in mini-game
5. rewards visibly change the Ridge
6. Cicka and one NPC make the world feel inhabited

Anything that does not directly support those proofs is secondary unless a
specific slice pulls it in.

## Asset Lanes

Treat assets in four lanes.

### Lane 1: Design Direction

Purpose: visual prompts, style constraints, and taste guidance.

Current homes:

- `docs/design/style-guide.md`
- `docs/design/README.md`
- `docs/game-design/sketchbook-ridge-m3-visual-pack.md`
- related research/design docs

These files answer "what should this feel like?" They do not by themselves mean
an asset is ready to load in Phaser.

### Lane 2: Raw Generated Concepts

Purpose: preserve source ideation before prep.

Current local mirror home:

- `asset-sources/stampede-sketch/generated-concepts/`

External archive key: `generated-concepts` in
`asset-sources/settings.local.json`.

Rules:

- keep the original generated PNGs in the external archive and local ignored
  mirror
- keep raw generated concepts outside `public` so Vite does not deploy them
- do not point runtime code at these directly
- treat them as reference-only once a prepared candidate exists
- prefer `prepared-assets/stampede-sketch/**` for Stampede adoption work
- do not commit raw generated concept batches by default

### Lane 3: Prepared Runtime Candidates

Purpose: transparent, normalized, scene-specific art that is close to usable.

Current local mirror homes:

- `asset-sources/prepared/characters/cicka/`
- `asset-sources/prepared/potassium-slip/**`
- `asset-sources/prepared/stampede-sketch/enemies/**`
- `asset-sources/prepared/stampede-sketch/player-guardian/`
- `asset-sources/prepared/stampede-sketch/calm-patch/`

External archive key: `prepared-assets` in
`asset-sources/settings.local.json`.

Rules:

- each folder should carry a small readme or manifest contract
- frame sizing, origin, and runtime scale belong here
- these assets are **candidates**, not automatic commitments
- scene code may adopt them slice by slice
- do not keep candidates in `public/assets/**` unless runtime code loads them
- do not commit prepared candidates by default; keep them in the external
  archive and local ignored mirror

### Lane 4: Runtime-Wired Assets

Purpose: assets the live scene preload path actually depends on.

These belong to the existing runtime behavior and should only change through a
deliberate implementation slice with verification.

Rules:

- wire them scene-by-scene
- avoid wide preload churn across unrelated scenes
- keep runtime key naming local and explicit

## Current Repo Read

As of this planning pass:

- `asset-sources/stampede-sketch/generated-concepts/` is raw concept source,
  not runtime input. This is now local mirror content backed by
  `generated-concepts`, and is reference-only because prepared Stampede assets
  are the more likely adoption path.
- `asset-sources/prepared/stampede-sketch/enemies/README.md` documents
  prepared enemy sprites as runtime candidates, but also says they are not
  loaded yet. This is now local mirror content backed by `prepared-assets`.
- `asset-sources/prepared/potassium-slip/README.md` documents prepared
  Potassium enemy and banana assets as runtime candidates, not wired defaults.
  This is now local mirror content backed by `prepared-assets`.
- `asset-sources/prepared/characters/cicka/` documents the prepared Cicka
  prototype set and its first-use reads. The adopted runtime copy now lives
  under `public/assets/ridge/cicka/`, where Ridge loads it as Cicka's
  display-only perch NPC sprite. This source folder is now provenance/source
  material in the local ignored mirror backed by `prepared-assets`, not a
  pending runtime adoption target.

That means the external archive keeps source/prepared art available without
shipping it. Runtime ownership starts only when a scene-owned adoption slice
promotes selected files into tracked `public/assets/**`, as Cicka now does.

## Recommended Adoption Order

Do not integrate assets by "finishing art." Integrate by the smallest useful
scene win.

### 1. Cicka Prototype Read

Reason:

- Cicka is one of the current milestone proofs
- Cicka improves Ridge warmth immediately
- adoption scope is local to Ridge and character presentation

Recommended slice:

- review `asset-sources/prepared/characters/cicka/` **(done for the first
  perch proof)**
- promote only the chosen Cicka frames into runtime-wired Ridge assets **(done
  through `public/assets/ridge/cicka/`)**
- use the slice to establish the first scene-owned asset adoption pattern:
  runtime asset location, manifest/key naming, preload ownership, and local
  README expectations **(done through the Cicka audit and sprite-pipeline skill
  refinement)**
- if integrated, keep it lightweight: perch, blink, loaf, suspicious turn, and
  one movement read are enough
- do not build a global asset framework from the first adoption slice

### 2. Stampede Objective Visual Pass

Reason:

- Stampede is the current active mini-game milestone
- enemy silhouettes affect readability and tone directly
- scene-local integration is safer than a cross-game art push
- the current design now depends on a readable central calm patch plus a
  tethered guardian, not a player carrying the whole blanket

Recommended slice:

- continue from the accepted M4d.5 responsive shell/input direction
- wire the `calm-patch` prop as a central or near-central objective
- wire the `player-guardian` sprite with `tether-guard` as its objective-link
  feedback state
- add the proximity aggro rule before adopting the full enemy art set
- then pick one default enemy presentation tier for the prototype:
  minimal, body, or body-plus-fx
- wire one enemy family cleanly before adopting the full set

### 3. Potassium Visual Upgrade Pass

Reason:

- Potassium already works as the anchor toy
- it has prepared assets, but it is not the current first-fun risk
- visual swap work should not destabilize Ridge and Stampede progress

Recommended slice:

- do a separate Potassium-only pass after the current Stampede shell choice is
  stable
- start with banana/projectile and one enemy texture replacement before
  animation richness

## Organization Rules

### Scene Ownership

- Ridge-owned art docs and placeholders stay aligned with
  `src/game/scenes/ridge/**`
- Stampede-owned prepared assets stay aligned with
  `src/game/scenes/stampedeSketch/**`
- Potassium-owned prepared assets stay aligned with Potassium runtime callers
- avoid introducing a global shared asset framework unless repeated pain proves
  it is necessary

### Folder Contracts

Each prepared asset family should have enough local documentation to answer:

1. Is this raw concept source, prepared candidate, or runtime-wired?
2. Which scene/domain owns it?
3. What manifest or readme defines frame sizes and usage?
4. Is the runtime currently loading it?

### Doc Freshness

- `docs/design/**` explains style and prompting direction
- `docs/game-design/**` explains milestone relevance and adoption order
- `asset-sources/README.md` explains the local workbench contract
- optional ignored `asset-sources/**/README.md` files explain temporary or
  prepared asset state when useful
- `public/assets/**/README.md` explains runtime-wired asset state after
  promotion

Do not duplicate long prep instructions across all three layers.

## Shared-Seam Risk

Low if we stay disciplined.

Safe parallel work:

- asset prep inside `asset-sources/**`
- scene-local visual experiments
- docs and readmes

Riskier work that should be serialized:

- changing shared preload assumptions
- changing shared scene runtime presentation policy
- changing bridge-owned reward state at the same time as art adoption
