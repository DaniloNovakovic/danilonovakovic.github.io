# Game Design Proposal: The Sketchbook Archipelago

## Title
**The Sketchbook Archipelago**

## Pillars
- **Low-Cortisol Exploration:** Movement should feel joyful and non-punitive, prioritizing "the feel of the flap" over the threat of a fall.
- **Epiphany-Driven Progress:** Knowledge (via manual fragments) is the primary key. If you know the "code," you can skip the gate.
- **Tactile Minimalism:** Every mini-game centers on a single "crunchy" verb with high visual/auditory feedback (juice).

## Overworld Loop
The overworld is a compact, vertical island rendered in the "Digital Sketchbook" style. 
1. **Draw:** The player is drawn upward toward **"The Peak of About Me"** and downward toward **"The Project Pier."** Landmarks are visible from the start.
2. **Discovery:** Manual fragments (Tunic-inspired) flutter in hard-to-reach places. NPCs (Open Peeps) provide "Zany Quests" that are actually just prompts to view portfolio sections (e.g., "Find my lost glasses at the Experience Office").
3. **Return:** Completing a mini-game grants a "Sketchbook Sticker." These stickers appear on the overworld's background layer, slowly "coloring in" the monochrome world.
4. **Compactness:** The island uses a wrapping horizontal scroll and vertical layers. You can't get lost, but you can always find a new "behind the black" shortcut (perspective tricks).

## Progression
- **Stamina Feathers:** Collected by "interacting" with core portfolio sections (About, Experience). Each feather adds a mid-air flap or climb duration.
- **Manual Fragments:** 8 fragments total. Assembling them reveals the "Sketchbook Secret Codes" (D-pad/Gesture sequences) to unlock the Developer Basement or hidden mini-games.
- **Keepsakes:** Small 2D items (a "Circuit," a "Green Thumb," a "Vinyl") that sit in the Bridge-owned inventory and trigger different NPC dialogue.
- **Final Route:** Accessing the "Hire Me" summit requires 4/6 mini-game stickers.

## Mini-Game Concepts

### 1. The Hiker's Flap
- **Theme:** Nature / Hiking
- **Research inspiration:** A Short Hike / Hollow Knight
- **Core verb:** Glide
- **Session length:** 1-2 minutes
- **Win/loss or reset condition:** Reach the birdhouse at the top / No loss, just return to start.
- **Mobile control profile:** Tap to flap, hold to glide.
- **Reward:** Golden Feather (Stamina)
- **Out of scope:** Complex predators or combat.
- **Why it is fun:** The kinesthetic joy of soaring over the "Experience Forest" landmarks.

### 2. The Daily Standup (Ricochet)
- **Theme:** Work / Productivity
- **Research inspiration:** Ball x Pit / Potassium Slip
- **Core verb:** Bounce
- **Session length:** 30-45 seconds
- **Win/loss or reset condition:** Hit all 5 "Task Orbs" without the ball falling / Ball falls = Reset.
- **Mobile control profile:** Drag to aim the initial launch, tilt/swipe to nudge the paddle.
- **Reward:** "Efficiency Expert" Sticker
- **Out of scope:** Persistent upgrades (keep that for Potassium Slip).
- **Why it is fun:** High-speed physics satisfaction in a small, contained box.

### 3. Green Thumb (Elemental Chemistry)
- **Theme:** Gardening
- **Research inspiration:** Divinity: Original Sin 2
- **Core verb:** Mix (Elements)
- **Session length:** 2-3 minutes
- **Win/loss or reset condition:** Grow a "Legendary Bloom" by combining Water + Sun + Soil / Plant withers if ignored.
- **Mobile control profile:** Tap to select element, tap plant to apply.
- **Reward:** "Gardener" Sticker
- **Out of scope:** Real-time growth (stay session-based).
- **Why it is fun:** Systemic "toy" logic—seeing what happens when you "Electrify the Puddle" to kill weeds.

### 4. Vinyl Scratch (The Debug Parry)
- **Theme:** Music / Audio
- **Research inspiration:** Clair Obscur / Fighting Games
- **Core verb:** Parry
- **Session length:** 1 minute
- **Win/loss or reset condition:** Parry 10 "Static Pops" in time with the beat / Miss 3 = Record stops.
- **Mobile control profile:** Single tap anywhere on the screen (timing-based).
- **Reward:** "Rhythm Master" Sticker
- **Out of scope:** Complex combo strings.
- **Why it is fun:** Pure rhythmic mastery and high-juice "Cling!" sounds.

### 5. Scope Creep Survivors
- **Theme:** Programming / Tech
- **Research inspiration:** Vampire Survivors
- **Core verb:** Position
- **Session length:** 3 minutes (max)
- **Win/loss or reset condition:** Survive until the "Deadline" timer hits zero / Health hits zero = Reset.
- **Mobile control profile:** Virtual Joystick (auto-attacks enabled).
- **Reward:** "Survivor" Sticker
- **Out of scope:** Meta-progression (keep it to a single-session spiral).
- **Why it is fun:** The "Power Spiral" of seeing your "Auto-Linter" weapon clear a screen of "Bug" mobs.

### 6. The Manual Decipherer
- **Theme:** Reading / History
- **Research inspiration:** Tunic
- **Core verb:** Observe
- **Session length:** Variable (Discovery-based)
- **Win/loss or reset condition:** Input the correct "Holy Cross" gesture shown in the sketch / Incorrect code = No effect.
- **Mobile control profile:** Swipe gestures in cardinal directions.
- **Reward:** "Archivist" Sticker + Secret Area Access
- **Out of scope:** Full custom language (use symbols/visual icons).
- **Why it is fun:** The "Aha!" moment when you realize the "About Section" layout is actually a map.

## Mobile Controls
- **Overworld:** Left-side virtual joystick for movement. Right-side "Action Circle" for Jump/Interact.
- **Arcade Modes (Standup, Flap, Scratch):** Screen-wide gesture area. No tiny buttons.
- **Menu/Manual Overlays:** Large, high-contrast "Paper Cutout" buttons with 8px hard shadows for easy thumb-tapping.

## Implementation Scope
- **Phaser Scenes:** SceneOverworld, SceneHiker, SceneStandup, SceneGarden, SceneScratch, SceneSurvivors.
- **React Overlays:** ManualOverlay, StickerBookOverlay, SessionResultsOverlay.
- **Vertical Slice 1:** SceneOverworld (movement + 1 landmark) -> SceneHiker (the flap verb) -> ManualOverlay.
- **Shared Runtime:** Use SideViewPlayerRuntime for the overworld; create a SingleVerbArcadeRuntime for the mini-games.

## Risks
- **Performance:** Multiple Phaser scenes loaded in one session. Mitigation: Use SceneManager to destroy/re-create scenes on transition, preserving only the Bridge state.
- **Scope Creep:** 6 mini-games is a lot. Mitigation: Focus on the "Hiker" and "Standup" games first as they reuse the most existing overworld/Potassium code.
- **Visual Noise:** The Sketchbook style can become cluttered. Mitigation: Use strict B&W with high-contrast outlines (Open Peeps style) to keep the "Playable" layers distinct from the "Background" layers.

## Fun Thesis
"The Sketchbook Archipelago" turns the static anxiety of a resume into the joyful curiosity of a weekend hike. It’s a portfolio that doesn't just show what you did, but invites the user to play with who you are.
