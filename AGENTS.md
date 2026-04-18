# Agent Instructions & Project Context

Welcome, fellow agent! This file is designed to help you quickly understand the current state of Danilo Novakovic's gamified portfolio and the specific constraints of this project.

## 🚀 Tech Stack
- **Frontend Framework:** React (Vite)
- **Game Engine:** Phaser 3 (Arcade Physics)
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
3. **Communication:** React passes a `isPaused` prop to Phaser. When `isPaused` is true, Phaser must stop processing movement and **release the keyboard capture** so the user can type in React inputs.

## ⚠️ Important Implementation Gotchas
- **Input Capture:** Phaser 3's Keyboard Manager captures keys globally by default. To allow typing in React fields (like the Coding Terminal), you **must** call `scene.input.keyboard.clearCaptures()` and set `scene.input.keyboard.enabled = false` when a modal is open.
- **Physics Collider Order:** Always initialize the physics collider *after* the player object is instantiated to avoid `ReferenceError` or falling through the floor.
- **Sprinting:** Hold `SHIFT` to move faster in the world.

## 🗺 Map Layout (Horizontal)
Buildings are placed at 400px intervals along the 3000px street:
- 400: Drawing
- 800: Guitar
- 1200: Games
- 1600: Muay Thai
- 2000: Dancing
- 2400: Coding

Please maintain the sketchy, handwritten feel for all new features!
