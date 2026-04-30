# Core Gameplay Mechanics

## 1. Style Phasing (The "Lens")
- **Implementation:** 
    - Two Phaser `Containers` or `Layers` per scene. 
    - `SketchLayer`: Hand-drawn assets.
    - `PolishedLayer`: Full assets.
    - The "Lens" acts as a mask or a global toggle.
- **Input:** Toggle key (e.g., 'E' or 'Shift') or a persistent area-of-effect around the player.

## 2. Interaction System
- **Contextual Actions:** Instead of just opening a modal, interaction triggers a "Mini-Scene" or an animation.
- **Proximity Triggers:** Buildings react when the player is near (e.g., a "Sketch" building might start "coloring itself in" as you approach).

## 3. Secret Triggers
- **Hidden Flags:** Certain actions (e.g., jumping 3 times on a specific spot) trigger a "Secret Found" event.
- **Persistence:** Secrets found are saved in the `gameState.ts` (currently exists) so they persist across sessions.

## 4. Movement Upgrades
- **Dash:** Unlocked after finding the "Energy Drink."
- **High Jump:** Unlocked after finding the "Spring."
- **Phase Shift:** The ability to walk through "Sketch" walls while in "Polished" mode.

## 6. AI-Friendly Animation & Assets
- **The "2-Frame Jitter":** For the "Sketch" style, generate two versions of an asset with slight variations and flip between them. It creates a "hand-drawn" feel without complex animation.
- **Pixel-Art Shaders:** Instead of hand-drawing every pixel, use Phaser shaders to "pixelate" high-res AI generations at runtime. This ensures consistency even if different AI models are used.
- **Procedural Clouds/Decor:** Use simple AI-generated "stamps" (e.g., 3-4 different pixel-art trees) and randomize their scale/flip to create a "dense" city without manual layout effort.
- **Palette Swapping:** Use a single set of pixel-art assets and swap color palettes in real-time to represent different "moods" or "secret" versions of levels.
