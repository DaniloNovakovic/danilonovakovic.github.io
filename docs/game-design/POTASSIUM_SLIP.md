# Potassium Slip: Mini-Game Manual

## Overview
**Potassium Slip** is a chaotic, top-down physics "slip-em-up" mini-game. It serves as a silly, mobile-friendly homage to classic arcade survival games, themed around the project's "Potassium" (Banana) secret.

## The Goal
Control a **Banana Peel** to intercept and "slip" incoming corporate stakeholders and project bugs. Prevent them from reaching the bottom of the screen (the "Deadline") to survive as long as possible and achieve a high score.

## Controls
- **Desktop:** Click and drag with your mouse. The Banana Peel will slide toward your cursor with slippery physics momentum.
- **Mobile:** Touch and drag your thumb. The game is optimized for tactile, slide-based movement.
- **Start/Restart:** Click or Tap the screen to begin a run or exit from the Game Over screen.

## Ripeness States
The Banana Peel's physics and appearance cycle every 10 seconds, changing the "game feel":

1. **Green (Unripe):** High friction and grip. Slower top speed, but very precise control.
2. **Yellow (Ripe):** Standard arcade physics. Balanced speed and drift.
3. **Brown (Overripe):** Extreme speed and very low friction. The peel becomes very slippery and chaotic, requiring wide "drifting" motions to control.

## The Enemies
- **The Deadline:** A red calendar monster. Moves fast and straight down. 
- **The Scope Creeper:** A purple amorphous blob with tentacles. Moves slower but zig-zags horizontally, taking up more space.
- **The Bug:** A green segmented insect. Moves erratically, jumping and changing direction frequently.

## Gameplay Mechanics
- **Slipping:** Colliding with an enemy causes them to spin out wildly and explode into points.
- **Lives:** You start with 3 lives. If an enemy reaches the bottom of the screen, you lose a life.
- **Difficulty Scaling:** The game speeds up and spawns enemies more frequently as your score increases.
- **Visual Style:** High-fidelity SVG vector sprites with a vibrant, neon-arcade color palette (revealed only when wearing the **Glasses**).
