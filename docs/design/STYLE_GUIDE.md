# Design Style Guide: "The Digital Sketchbook"

This document outlines the visual identity and interaction philosophy for Danilo Novakovic's gamified portfolio.

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

### 3. Environment & World-Building

- **Perspective:** 2D Side-scroller with horizontal parallax layering.
- **Layout:** A continuous, seamless horizontal street of buildings.
- **Stroke Style:** 
  - *Foreground:* Sharp, dark ink with thicker outlines.
  - *Background:* Sketchy, lighter lines with cross-hatching for shadows.
- **Interaction:** Buildings indicate interactivity with a subtle "wobble" animation or a scribbled `[E] ENTER` prompt.

### 4. UI & Interaction

- **Font:** Handwritten/cursive fonts (e.g., *Comic Neue*, *Caveat*, or scribbled margin style).
- **Buttons/Modals:** Should look like paper cutouts with thick black borders and hard-offset shadows. The current convention is the arbitrary Tailwind class `shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]` applied inline in overlay components under [`src/components/`](../../src/components/). If this changes, promote it to a shared utility (e.g. a Tailwind plugin or a CSS variable in [`src/index.css`](../../src/index.css)) instead of scattering the literal string across files.
- **Transitions:** Quick "ink-bleed" or "page-turn" feel.

---

## 🛠 Technical Implementation Details

- **Perspective:** Phaser 2D Side-scroller.
- **Gravity:** Enabled for walking and jumping.
- **Movement:** `A/D` or `Arrows` to Walk, `Shift` to Sprint, `E` to Interact.
- **Overlay:** React-based modals for mini-games and deeper content.