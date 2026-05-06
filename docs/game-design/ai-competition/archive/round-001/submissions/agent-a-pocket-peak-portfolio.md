# Agent A Proposal: Pocket Peak Portfolio

## Pillars

- **Tiny world, dense joy**: a compact A Short Hike-inspired overworld with strong landmarks.
- **Movement is the main reward**: upgrades should make traversal feel better first and unlock content second.
- **Mini-games as personality postcards**: each game is a playable joke, memory, or hobby ritual.
- **Fun over fidelity**: invest in input feel, feedback, retries, and progression before visuals.
- **Architecture-native**: playable areas are Phaser scenes, React overlays handle readable UI, and durable unlocks live in bridge state.

## Overworld Loop

The overworld becomes a cozy vertical street-hill hybrid. The player sees Contact Peak or a Summit Tower early, then learns routes upward through landmarks like Studio Roof, Hobbies Room, Basement Hatch, Signal Tower, and Sketch Garden.

The loop is: wander toward a visible landmark, meet a character or inspect a strange object, play a short mini-game or solve a traversal secret, earn a movement sticker or clue, return with one more route reachable, and eventually climb to Contact Peak.

## Progression

- **Glasses** reveal sketch glitches and secret entrances.
- **Coffee Sprint** improves horizontal movement.
- **Sticker Jump** adds one mid-air hop.
- **Receipt Glider** lets the player drift while falling.
- **Ink Lens** reveals hidden platforms and secret trigger outlines.
- **Circuit** from Potassium Slip powers a basement console feature and a late-world elevator.
- **Friend Notes** unlock the final route after enough mini-games are completed.

The final route should not require perfect completion. Suggested requirement: collect Glasses, finish or milestone Potassium Slip, complete any four hobby mini-games, then climb to Contact Peak.

## Mini-Game Concepts

- **Potassium Slip**: existing Ball x Pit-inspired anchor with ricochet banana, waves, drafts, boss, Circuit reward, and endless mode.
- **Muay Thai Meter**: reactive turn-based heavy-bag duel inspired by Clair Obscur and fighting games. Choose Jab, Kick, Guard, or Breathe; defend on timing beats; spend Focus on a knee strike.
- **Doodle Alchemy Canvas**: tiny Divinity-like surface puzzle using ink, water, charcoal, and paper cutouts.
- **Basement Survivor Standup**: 3-minute Vampire Survivors-like auto-shooter against developer-life stressors.
- **Guitar Loop Garden**: rhythm-memory call-and-response with four big note buttons.
- **Dance Dash Rooftop**: movement challenge with jump, sprint, glide, ghost paths, and quick retries.
- **Secret Manual Pages**: Tunic-inspired scraps that reveal hidden rules the player technically already had.

## Mobile Controls

The overworld uses drag or edge-hold movement, swipe-up jump, hold-to-glide, and tap-to-interact. Each mini-game must pass a "thumb test": one thumb for cozy games, two thumbs for action games, and no tiny active-play UI.

## Implementation Scope

Build order:

1. Add an overworld upgrade model to bridge progress state.
2. Add 2-3 landmarks and shortcut routes.
3. Build one new small mini-game first: Guitar Loop or Muay Thai Meter.
4. Add manual-page secrets as lightweight overlay/content rewards.
5. Expand to Doodle Alchemy and Basement Survivor.
6. Tie Contact Peak to flexible milestones.

## Risks

- Too many mini-games: prototype each as a one-minute toy first.
- Progression sprawl: keep 4-6 durable upgrades.
- Mobile friction: prototype touch controls before content depth.
- Overworld size creep: use vertical layering and shortcuts instead of more street.

## Fun Thesis

This version feels like a sketchbook hike through personality: cozy wandering on the surface, juicy arcade toys underneath, and enough secrets to make the player ask whether a clue was always there.
