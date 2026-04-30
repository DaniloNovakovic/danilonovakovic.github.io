# Game Design Brainstorming: Interactive Mode Evolution

## 1. The Vision: "The Artist's Journey"
The game starts as a literal "blank canvas" or a "rough sketch." As the user explores, they find tools/artifacts that evolve the world visually and mechanically. This mirrors the professional journey: starting with raw ideas (sketches) and moving toward polished products (full-featured app).

### Core Concept: "The Lens of Perspective"
- **The Trigger:** The "Glasses" (or "Developer Console", "Designer's Eye", etc.).
- **Visual Shift (AI-Optimized):** 
    - **Initial (The Sketch):** Hand-drawn marker/pencil style. Rough edges, "boiling" animation (slight jitter between 2-3 AI-generated frames). Easy to generate with simple prompts.
    - **Enhanced (The Pixel):** Vibrant Pixel Art (e.g., 16-bit or 32-bit style). This style is extremely AI-friendly, maintains consistency easily, and allows for "retro-modern" effects.
- **Mechanical Shift:** The "Lens" reveals hidden objects. A wall that was just a pencil line in sketch mode might have a detailed pixel-art door in "Enhanced" mode.

---

## 2. World Progression & Secrets (Aesthetic focus)

### Level 1: The Blueprint (Overworld)
*   **Starting State:** Minimalist. No music, just a "pencil scratching" sound for footsteps.
*   **The First Secret:** Falling through a "unfinished" part of the floor into a "Developer's Basement."
*   **The Artifact:** Finding the **"Glasses"** in the basement.
*   **The Reveal:** Putting on the glasses triggers a "Style Transition." The white background fills with a pixel-art sunset gradient.

### Level 2: The Pixel City
*   **New Mechanics:** 
    - **Platforming through Layers:** Certain platforms are only solid when looking through the "Lens."
    - **Interactable Buildings:** Some buildings look like cardboard cutouts until the "Lens" is used; then they become detailed pixel-art structures you can enter.
*   **AI Art Workflow:** 
    - Generate a base image with AI.
    - Use a "Pixelate" shader or simple downscaling to maintain a consistent grid.
    - Animate using simple 2-4 frame loops for "living" elements (lights, plants).
*   **Secrets:**
    - **Graffiti:** Hidden messages on walls that only appear in "Sketch" mode, giving hints to passwords or hidden rooms.
    - **The "Broken" Glitch:** A flickering area that, when entered, transports the player to a "Mini-Game Graveyard" (unused or experimental mini-games).

### Level 3: The Hobby Room (Hobby Scene)
*   **Starting State:** A simple room with boxes.
*   **The Evolution:** 
    - Interacting with the **Guitar** initially just plays a single note.
    - Finding the **"Amp"** (Secret) turns the hobby room into a "Stage" with neon lights and a rhythm-based mini-game.
    - Interacting with the **Canvas** (Drawing) starts as a 1-color doodle. Finding the **"Palette"** unlocks full-featured drawing with physics-based paint.

---

## 3. Potential Mechanics for "Fun"
1.  **Style Phasing:** A button to toggle between "Sketch" and "Polished" modes. This is the core puzzle mechanic. 
    - *Example:* A bridge exists in Sketch mode but is "broken" in Polished mode. You have to jump in Sketch mode and toggle to Polished in mid-air to land on a platform that only exists there.
2.  **Collectibles as Upgrades:**
    - **"Coffee Mug":** Speeds up the player.
    - **"GitHub Star":** Gives a double jump (the "boost" of community support).
    - **"Lighthouse Bulb":** Illuminates dark/hidden areas.
3.  **NPCs (The "Stakeholders"):**
    - Small "Sketchy" NPCs that give cryptic advice or quests (e.g., "I lost my pixels, can you find them?").

---

## 4. Next Steps & Questions
- **Style Priority:** Which visual style should be the "primary" one? (Pixel art, Vector, Painterly?)
- **Narrative Depth:** Should there be a "story" or just pure mechanical discovery?
- **Technical Feasibility:** Style Phasing requires two sets of assets or shaders. Phaser 4's `DynamicTexture` and `SpriteBatch` are good for this.
