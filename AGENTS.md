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
- **Reference Document:** See [docs/design/STYLE_GUIDE.md](docs/design/STYLE_GUIDE.md) for detailed design rules.

## 🏗 Architecture

This is a hybrid application:

1. **Phaser World:** A 2D side-scrolling world (3000px wide street) where the player walks and jumps.
2. **React Overlays:** When the player interacts with a building (presses `E`), a React modal pops up. The mini-games themselves are mostly implemented as React components inside these modals.
3. **Communication / Bridge:** React and Phaser synchronize via `src/shared/bridge/store.ts` (`bridgeStore`, `bridgeActions`, `useBridgeSelector`). Pause state and touch one-shots (`jumpQueued`, `interactTap`) are derived and consumed there; avoid creating new ad-hoc globals.
4. **Kernel + Scene lifecycle:** `src/components/Game.tsx` boots Phaser, then delegates transitions to `src/core/kernel/GameKernel.ts` and `src/core/kernel/SceneManager.ts` through `src/infra/phaser/PhaserSceneAdapter.ts`.
5. **Phaser scene resume:** Resume positions are captured per `scene.scene.key` in `src/game/sceneResumeStore.ts` via adapter/scene-manager flow. New interior scenes should implement `getResumeCapturePosition()` (see `ResumeCaptureScene` in `src/game/sceneContracts.ts`) and use a registry key that matches their scene key.
6. **Folder ownership (transitional):** `src/game` is still the active scene/runtime home. `src/games` holds plugin/context wrappers and is the preferred location for new context modules during migration.

## 📱 Mobile / small screens

- The game canvas uses **Phaser `Scale.FIT`** inside a responsive **aspect-ratio** shell (`1000×600` logical size). A **ResizeObserver** calls `game.scale.refresh()` when the container size changes.
- **Touch row** (`Game.tsx`, hidden `md+`): writes through `bridgeActions` in `src/shared/bridge/store.ts`. Scenes read bridge touch state and consume one-shot flags via `consumeTouchOneShots()`.

## ⚠️ Important Implementation Gotchas

- **Input / React modals:** Phaser’s keyboard plugin can capture keys during gameplay. While a React overlay is open, kernel pause propagation calls scene `setPaused()`, and scenes disable the keyboard manager (`enabled = false`). Reuse `setSceneKeyboardPaused` from `src/game/sceneKeyboardPause.ts` for new pausable scenes.
- **Physics Collider Order:** Always initialize the physics collider *after* the player object is instantiated to avoid `ReferenceError` or falling through the floor.
- **Sprinting:** Hold `SHIFT` to move faster in the world.
- **Phaser 4 render constraints:** Dynamic textures buffer commands and require explicit `render()` flushes. Avoid high-frequency `SpriteGPULayer` mutations; prefer static-ish GPU layers and explicit render flush points.

## 🗺 Map Layout (Horizontal)

Overworld buildings are placed along the 3000px street (see `src/config/worldLayout.ts` / composed `PORTFOLIO_SECTIONS`):

- **400:** Profile
- **900:** Experiences
- **1400:** Projects
- **1900:** Abilities
- **2400:** Hobbies (Phaser interior)
- **2900:** Contact

Please maintain the sketchy, handwritten feel for all new features!