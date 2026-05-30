# Design Style Guide: "The Digital Sketchbook"

This document outlines the visual identity and interaction philosophy for Danilo Novakovic's gamified portfolio.

Status: source of truth for visual identity. It does not decide Ridge route
canon, level order, ending gates, or whether the future Ridge keeps the current
Phaser prototype topology. For active Ridge pre-production design, start from
[`../game-design/ridge/README.md`](../game-design/ridge/README.md).

Related provenance:
[`docs/research/provenance/visual/`](../research/provenance/visual/)
stores source research and background rationale. This file remains the current
visual spec.

## 🎨 Visual Identity

The aesthetic is a fusion of **Pablo Stanley’s Open Peeps** (modular, clean character design) and the **hand-drawn journal style** seen in *Life is Strange*. The world should feel like a living illustration on high-quality sketchbook paper.

### 1. Color Palette

- **Background:** Strict off-white/cream paper texture (`#fbfbf9` or `#f4f1ea`).
- **Ink:** High-contrast black (`#1a1a1a`).
- **Accents:** Strictly monochromatic (B&W). Any "color" should be represented via sketchy cross-hatching or varying line weights.

### 2. Character Design (The "Peeps" Library)

- **Style:** Bold, variable-width black ink outlines.
- **Perspective:** 2D Side-scroller (profile/side-view).
- **Animation:** "Stepped" animation feel (10–12 FPS) to emphasize the hand-drawn nature.
- **Silhouette:** Design from primary shape and secondary form before detail.
  Characters must remain readable on mobile through thick outer contours,
  lighter interior marks, and negative-space channels around overlapping parts.
- **Portfolio function:** Tiny-cast NPCs should communicate their portfolio role
  through silhouette and prop language before text explains it.
- **Micro-presence:** Prefer `passive`, `aware`, and small `reaction` states
  over schedules, dialogue trees, or large animation sheets until static
  characters already feel alive.
- **Cicka:** Treat Cicka as an autonomous resident with sleepy, curious, grooming,
  and inconveniently-placed behaviors, not as a mascot button or generic UI pet.

### 3. Environment & World-Building

- **Perspective:** The active Ridge route uses a Walkable Sketchbook Stage:
  side-view interaction composed like a shallow hand-built paper set. Use
  foreground frames, a readable playable lane, background set dressing, and
  authored composition rather than true 3D navigation or isometric map logic.
- **Layout:** A continuous, readable sketchbook route. Buildings, props,
  resting spots, and landmarks should serve the active route instead of
  defaulting to a portfolio street.
- **Stroke Style:**
  - *Foreground:* Sharp, dark ink with thicker outlines.
  - *Background:* Sketchy, lighter lines with cross-hatching for shadows.
- **Interaction:** Buildings, landmarks, props, and resting spots indicate
  interactivity with subtle wobble, paper lift, ink jitter, or a clear
  on-style prompt.

### 4. UI & Interaction

- **Font:** Handwritten/cursive fonts (e.g., *Comic Neue*, *Caveat*, or scribbled margin style) are for headings, prompts, stickers, and short labels. Dense modal copy, project descriptions, and long body text should use the most legible on-brand option.
- **Buttons/Modals:** Should look like paper cutouts with thick black borders and hard-offset shadows. The current convention is the arbitrary Tailwind class `shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]` applied inline in shared UI and surface components under [`src/shared/ui/`](../../src/shared/ui/), [`src/static/`](../../src/static/), and [`src/game/`](../../src/game/). If this changes, promote it to a shared utility (e.g. a Tailwind plugin or a CSS variable in [`src/index.css`](../../src/index.css)) instead of scattering the literal string across files.
- **Transitions:** Quick "ink-bleed" or "page-turn" feel, but non-essential wobble, page flips, parallax, and ink effects must have reduced-motion-safe behavior.
- **Focus:** Keyboard focus must remain visibly on-style across paper, ink, and overlay surfaces; do not rely on color alone.

### 5. Analog-Digital Fusion Rules

- **Modular stickers:** Treat characters, props, landmarks, and overlay accents as reusable paper cutouts with clear silhouettes, stable anchors, and small variant sets.
- **Manga composition, sketchbook cost:** Use bold framing, black shadow shapes, cross-hatching, and layered parallax instead of bespoke full-frame redraws.
- **Line-weight integrity:** Preserve thick outer contours and lighter interior marks when scaling, tweening, or reusing assets. Avoid transformations that visibly stretch ink lines.
- **Living paper motion:** Prefer stepped motion around 10-12 FPS, subtle wobble, low-frequency line jitter, or paper-grain displacement over smooth synthetic easing.
- **Memory language:** Denser hatching, high-contrast 1-bit/dither treatments, or harsher ink shadows are available for memories or special emotional beats only if readability stays strong.
- **First playable art target:** Use a Coherent Sketchbook Blockout: rough,
  replaceable art with clear paper layers, blockers, resident silhouettes,
  Cicka spots, and before/after world changes. Avoid gray-box placeholders, but
  do not require final animation sets, full interiors, or polished prop
  catalogs before the route is playable.
- **Implementation anchors:** For Phaser assets, define pivots/origins, baselines, and runtime scale before polishing. For scalable paper UI inside Phaser, consider nine-slice-style panels only when the rendering constraints fit the scene.
- **Scope boundary:** Do not adopt new styling systems, skeletal animation tools, or 3D-to-2D asset pipelines just because the research mentions them. Promote those only after a real production need.

---

## 🛠 Technical Implementation Details

Current implementation snapshot, not a future Ridge gameplay mandate:

- **Perspective:** Phaser 2D side-view.
- **Movement:** existing side-view scenes support walking, jumping, sprinting,
  and interaction; the active Ridge pre-production route should choose required
  traversal from route and area docs.
- **Overlay:** React-based overlays and scene-owned UI for Trail Cards,
  mini-games, results, and deeper content.
