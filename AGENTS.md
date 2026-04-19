# Agent Instructions & Project Context

Welcome, fellow agent! This file is designed to help you quickly understand the current state of Danilo Novakovic's gamified portfolio and the specific constraints of this project.

## 🚀 Tech Stack

- **Frontend Framework:** React (Vite)
- **Game Engine:** Phaser 4 (Arcade Physics; npm package `phaser`)
- **Styling:** TailwindCSS v4
- **Icons:** Lucide-React
- **Audio:** Web Audio API (for interactive soundscapes)

## 🎨 Visual Identity & "The Vibe"

**Crucial:** This project follows a strict **"Digital Sketchbook"** aesthetic.

- High-contrast **Monochromatic (B&W)** palette.
- Hand-drawn, sketchy ink style inspired by **Open Peeps** and **Life is Strange** journal pages.
- **Reference Document:** See [design/STYLE_GUIDE.md](design/STYLE_GUIDE.md) for detailed design rules.

## 🏗 Architecture

This is a hybrid application:

1. **Phaser World:** A 2D side-scrolling world (3000px wide street) where the player walks and jumps.
2. **React Overlays:** When the player interacts with a building (presses `E`), a React modal pops up. The mini-games themselves are mostly implemented as React components inside these modals.
3. **Communication:** React passes an `isPaused` prop to Phaser. When `isPaused` is true, gameplay scenes call `setPaused(true)`, which sets `scene.input.keyboard.enabled = false`, stops movement, and (in **HobbiesScene**) pauses the arcade physics world so keys do not leak into the game while the user types in React inputs. When unpausing, scenes re-enable the keyboard plugin and call `addCapture` with the gameplay keycodes (see `GAMEPLAY_KEYBOARD_CAPTURES` in `src/game/config.ts` and `setSceneKeyboardPaused` in `src/game/sceneKeyboardPause.ts`).

## 📱 Mobile / small screens

- The game canvas uses **Phaser `Scale.FIT`** inside a responsive **aspect-ratio** shell (`1000×600` logical size). A **ResizeObserver** calls `game.scale.refresh()` when the container size changes.
- **Touch row** (`Game.tsx`, hidden `md+`): writes to `**mobileTouchBridge.ts`** (`mobileTouch.left` / `right`, `jumpQueued`, `interactTap`). **OverworldScene** and **HobbiesScene** merge those flags in `update()` — synthetic `KeyboardEvent`s do not work with Phaser’s keyboard plugin in most browsers.

## ⚠️ Important Implementation Gotchas

- **Input / React modals:** Phaser’s keyboard plugin can capture keys during gameplay. While a React overlay is open, scenes disable the keyboard manager (`enabled = false`) rather than relying on DOM-only fixes. If you add new scenes, reuse `setSceneKeyboardPaused` from `src/game/sceneKeyboardPause.ts` so behavior stays consistent with **OverworldScene** and **HobbiesScene**.
- **Physics Collider Order:** Always initialize the physics collider *after* the player object is instantiated to avoid `ReferenceError` or falling through the floor.
- **Sprinting:** Hold `SHIFT` to move faster in the world.

## 🗺 Map Layout (Horizontal)

Overworld buildings are placed along the 3000px street (see `src/config/worldLayout.ts` / composed `PORTFOLIO_SECTIONS`):

- **400:** Profile
- **900:** Experiences
- **1400:** Projects
- **1900:** Abilities
- **2400:** Hobbies (Phaser interior)
- **2900:** Contact

Please maintain the sketchy, handwritten feel for all new features!