# Final Global Synthesis: Sketchbook Ridge Summit

## Verdict

The global champion is **Sketchbook Ridge**.

The final direction should use Ridge as the playable spine, Summit as the architecture doctrine, and Archipelago as the visual reward layer.

## One-Sentence Game

The portfolio becomes a compact side-view sketchbook ridge: a single readable trail toward a Relay Spire, where hobby props open short mobile-friendly mini-games, earned stickers visibly color the world, and Potassium Slip remains the flagship arcade secret.

## Final Pillars

1. **One Ridge, Many Returns**: the overworld is one compact clockwise trail with shortcuts, not a growing map.
2. **Playable First Minute**: the first new mini-game should be understandable and replayable within 60 seconds.
3. **Potassium Owns Ricochet**: do not add another ricochet mini-game near the existing flagship.
4. **Stickers Change The World**: rewards should visibly alter routes, signs, background details, or traversal feel.
5. **Scene-Owned Toys**: every mini-game is a Phaser scene with one core verb; overlays handle Trail Cards, manuals, results, and readable UI.

## Overworld Spine

Use Ridge's **single clockwise trail** and **Relay Spire** as the global destination. Keep Summit's three-zone discipline:

- **Outskirts / trailhead**: current street, basement hatch, Potassium hook, Glasses reveal.
- **Hobby ridge**: one side-view strip with hobby glades, Trail Cards, shortcuts, and readable landmarks.
- **Relay Spire / Contact Peak**: final contact/credits route.

The player sees the destination early. Completing scenes opens shortcuts, adds glide pips, changes signage, or colors in background stickers.

## Progression

Bridge-owned progress should stay small:

- `stamps[]`: completed hobby scenes.
- `manualPages[]`: glossary/manual entries unlocked by play.
- `mobility.glidePips`: 0-3, adds hold-to-glide or brush-flap duration.
- `shortcuts`: booleans for ridge ladders, ropes, planks, or service elevator.
- `potassium.circuitOwned`: existing reward; can act as an alternate finale key.

Final gate:

- any three stamps **or** Circuit owned
- plus one decoded manual page for the Relay sign

This supports both normal exploration and a speedrun-ish Potassium path.

## First Mini-Game To Build

**Stampede Sketch** should be the first new mini-game.

Why:

- strongest fun immediacy
- mobile-friendly drag-to-move controls
- low implementation risk compared with fighting, pogo, or systemic puzzles
- balances Potassium's skill-heavy ricochet with low-input swarm play

First-slice scope:

- 3-minute run
- one board
- capped enemy count
- 3 auto-attacks
- 3 upgrade choices
- one first-clear glide pip reward
- simple results overlay

## Next Candidates

After Ridge + Stampede + Potassium integration:

1. **Telegraph Terrace**: one-button parry/rhythm scene, if the project wants Muay Thai/reactive timing next.
2. **Margin Manual Hunt**: manual pages as a glossary overlay, but only after there are enough real mechanics worth reinterpreting.
3. **Domino Desk**: small deterministic grid puzzle, only after action scenes prove the mini-game pipeline.

## Deferred

- Neutral Notebook.
- Shaft of Scratches.
- Daily Standup Ricochet.
- Full manual cipher systems.
- Shared arcade runtime.
- Full mini-game launcher/archive surfaces.

## Implementation Path

1. Document Potassium as the done mini-game benchmark.
2. Add minimal bridge progress for stamps, manual pages, glide pips, shortcuts, and Circuit references.
3. Build Ridge shell with three Trail Card triggers and one visible Relay Spire destination.
4. Ship Stampede Sketch as the first new mini-game and reward one glide pip.
5. Make earned stickers color or annotate the ridge background.
6. Add final Relay Spire gate after the first few rewards exist.

## Final Thesis

The winning direction is not the biggest idea. It is the most playable one: a small ridge, a visible goal, one great existing arcade secret, one new low-input toy, and rewards that make the sketchbook visibly remember what the player did.
