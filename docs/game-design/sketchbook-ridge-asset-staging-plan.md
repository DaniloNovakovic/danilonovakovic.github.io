# Sketchbook Ridge Asset Staging Plan

> Planning companion for active Ridge and mini-game asset work.
> This is an organization and adoption guide, not a final art bible and not a
> promise that every prepared asset will ship unchanged.

Active sources: `sketchbook-ridge-summit.md`,
`sketchbook-ridge-milestone-plan.md`, `sketchbook-ridge-m3-visual-pack.md`,
`sketchbook-ridge-m3-overlay-pack.md`, `sketchbook-ridge-m3-audio-pack.md`,
`docs/design/style-guide.md`, the current asset readmes under
`public/assets/**`, and raw source readmes under `asset-sources/**`.

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

## Mira Summary

Mira's producer read is:

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

Current home:

- `asset-sources/stampede-sketch/generated-concepts/`

Rules:

- keep the original generated PNGs
- keep raw generated concepts outside `public` so Vite does not deploy them
- do not point runtime code at these directly
- use them as source material for prep, comparison, or regeneration

### Lane 3: Prepared Runtime Candidates

Purpose: transparent, normalized, scene-specific art that is close to usable.

Current homes:

- `public/assets/characters/cicka/`
- `public/assets/potassium-slip/**`
- `public/assets/stampede-sketch/enemies/**`
- `public/assets/stampede-sketch/player-guardian/`
- `public/assets/stampede-sketch/calm-patch/`

Rules:

- each folder should carry a small readme or manifest contract
- frame sizing, origin, and runtime scale belong here
- these assets are **candidates**, not automatic commitments
- scene code may adopt them slice by slice

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

- `asset-sources/stampede-sketch/generated-concepts/` is clearly marked as raw
  concept source, not runtime input.
- `public/assets/stampede-sketch/enemies/README.md` documents prepared enemy
  sprites as runtime candidates, but also says they are not loaded yet.
- `public/assets/potassium-slip/README.md` documents prepared Potassium enemy
  and banana assets as runtime candidates, not wired defaults.
- `public/assets/characters/cicka/` now exists as a prepared prototype set,
  but it does not yet have folder-local readme language describing intended use
  or whether the scene currently loads it.

That means the repo is not in bad shape, but the character lane is less
documented than the Potassium and Stampede lanes.

## Recommended Adoption Order

Do not integrate assets by "finishing art." Integrate by the smallest useful
scene win.

### 1. Cicka Prototype Read

Reason:

- Cicka is one of the current milestone proofs
- Cicka improves Ridge warmth immediately
- adoption scope is local to Ridge and character presentation

Recommended slice:

- document `public/assets/characters/cicka/`
- decide whether it is a prepared prototype or active runtime source
- if integrated, keep it lightweight: perch, blink, loaf, suspicious turn, and
  one movement read are enough

### 2. Stampede Objective Visual Pass

Reason:

- Stampede is the current active mini-game milestone
- enemy silhouettes affect readability and tone directly
- scene-local integration is safer than a cross-game art push
- the current design now depends on a readable central calm patch plus a
  tethered guardian, not a player carrying the whole blanket

Recommended slice:

- finish M4d.5 responsive shell/input decisions first
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
- `public/assets/**/README.md` explains folder-local asset state and contract

Do not duplicate long prep instructions across all three layers.

## Shared-Seam Risk

Low if we stay disciplined.

Safe parallel work:

- asset prep inside `public/assets/**`
- scene-local visual experiments
- docs and readmes

Riskier work that should be serialized:

- changing shared preload assumptions
- changing shared scene runtime presentation policy
- changing bridge-owned reward state at the same time as art adoption

## Recommended Next 1-3 Tasks

1. Add folder-local documentation for `public/assets/characters/cicka/`.
2. Keep the long-term topology ideas doc as planning-only and out of milestone
   requirements.
3. Open a small implementation slice for either Cicka adoption in Ridge or the
   Stampede calm-patch / proximity-aggro pass, but not both plus Potassium at
   once.

## Decision Needed From Danilo

The highest-leverage taste/production call is:

- should the next asset integration slice be **Cicka in Ridge** or
  **Stampede calm patch + proximity aggro**

My recommendation is **Cicka first for warmth**, unless you want the current
active gameplay slice to stay purely on Stampede, in which case **Stampede calm
patch + proximity aggro** is the better follow-through.
