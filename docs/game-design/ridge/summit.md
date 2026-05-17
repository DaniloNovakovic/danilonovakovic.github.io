# Sketchbook Ridge Summit

> Concept / production vision. This is the post-competition direction for the
> playable portfolio game. Shipped behavior still belongs in
> [`player-manual.md`](../player-manual.md).

## Team Frame

- **Level Designer**: owns the playable world, pacing, and scope.
- **Story / Tone Designer**: protects warmth, manga sketchbook tone, and the feeling that the world remembers Danilo.
- **Systems / Production Designer**: protects input simplicity, Phaser/React boundaries, and build order.
- **Character Designer**: protects NPC silhouettes, interaction charm, and the feeling that the ridge is inhabited.

The competition winner remains **Sketchbook Ridge**. The production direction is:

> Use Ridge as the playable spine, Summit as the architecture discipline, and
> Archipelago's stickers as the visible reward language.

## Target Player

The primary audience is **Danilo on laptop and mobile phone**.

Other people may play it, but the game should be tuned for Danilo's taste first:

- compact exploration like *A Short Hike*
- readable secrets and manual-page epiphanies like *Tunic*
- ricochet/run synergy like *Ball x Pit*, already represented by Potassium Slip
- active timing and parry joy like *Clair Obscur*
- deterministic toy-system cleverness like *Divinity: Original Sin 2*
- optional movement mastery like *Hollow Knight*
- neutral/spacing mind games from fighting games
- silly substory seriousness like *Yakuza: Like a Dragon*
- hand-drawn manga intimacy, with *Oyasumi Punpun* as a taste signal for personal, sketchy, funny-sad honesty

## One-Sentence Game

Danilo explores a compact hand-drawn ridge inside his own sketchbook, climbing toward the Relay Spire by playing short hobby mini-games, earning stamps and stickers that visibly change the world, while Potassium Slip remains the flagship arcade secret.

## Core Fantasy

This is **Danilo's tiny private mountain**, not a portfolio theme park.

The goal is to reach the **Relay Spire** and "send the sketchbook." On paper, that means shipping the portfolio. Emotionally, it means noticing that the unfinished jokes, hobbies, game tastes, tools, and half-serious obsessions already form a coherent world. Cicka is the emotional spine of that realization: she starts as a tiny resident, becomes the guide who teaches the player how to notice the Ridge, and makes the first ending a quiet farewell and tribute rather than only a contact/credits beat.

The current static portfolio-building model is not the long-term fantasy. The
better version is a **scrambled sketchbook**: Danilo's pages, tools, memories,
and proofs are out of order. The player learns Danilo by restoring meaning
through play, not by opening resume modals. Basement, Potassium Slip, and the
Glasses re-read effect are strong anchors; generic information buildings should
eventually be absorbed into artifacts, mini-games, Cicka notes, manual pages,
and visible Cicka Home changes.

The ending should not say "you became perfect." It should say:

> You shipped something alive.

It should also say, softly:

> Thank you for walking with me.

## Fun Pillars

1. **One Ridge, Many Returns**  
   The overworld is one compact side-view route with shortcuts and changed landmarks, not a huge map.

2. **Opt-In Toys**  
   Mini-games are entered from clear hobby props. The player always knows what they are opting into, how long it takes, and what it might reward.

3. **Potassium Owns Ricochet**  
   Potassium Slip is the Ball x Pit lane. Do not build a second ricochet scene near it.

4. **Stickers Change The World**  
   Rewards are visible on return: patched planks, inked-in signs, doodled arrows, new margin jokes, background characters, and route readability.

5. **Low-Cortisol Overworld, High-Spice Mini-Games**  
   The ridge is calm, curious, and forgiving. Mini-games can be intense, but they are short and replayable.

6. **Mobile Is Real**  
   No required input pattern should depend on keyboard-only dexterity. Every scene needs a touch-first control plan.

7. **Never Hike Alone**  
   The ridge should have a small cast of memorable NPCs and one very important cat presence, so exploration feels companionable instead of empty.

8. **Learn Danilo By Restoring The Sketchbook**  
   Portfolio facts should be discovered as objects, mementos, skills, jokes,
   manual insights, and lived scenes. Avoid turning the Ridge into buildings
   that open static information modals.

## Overworld Plan

The overworld is a side-view ridge that can be crossed quickly once learned.
Long-term, it should use **Hollow Knight topology, A Short Hike mood, and
Tunic re-reading**: connected 2D side-view rooms/screens, vertical shafts,
shortcut relief, gentle movement rewards, and old props becoming newly legible.
The player sees the Relay Spire early, like a destination silhouette.

Do not pivot the main world toward top-down, isometric, or 3D-like exploration
without a deliberate future spike. Phaser's 2D strengths fit a layered
side-view Ridge better, and the current Ridge shell should grow into that
direction rather than being discarded.

### Zone 1: Outskirts / Trailhead

Purpose: orient the player and connect to existing shipped content.

Landmarks:

- current street / city edge
- Developer Basement hatch
- Glasses pickup and "re-read the world" moment
- Potassium hint object
- early scrambled-sketchbook artifacts that replace generic portfolio buildings
- Cicka's first perch
- first distant view of Relay Spire

Design beat:

The current street should become the **Outskirts** rather than being replaced immediately. Before Glasses, the ridge feels like a rough sketch with a few obvious prompts. After Glasses, certain props jitter, margin notes appear, and the banana/Potassium path becomes legible.

The current building/modal portfolio pattern should be treated as transitional.
Outskirts should eventually teach Danilo through found objects and playable
memory beats: tools on the ground, half-labeled project artifacts, Cicka
reactions, and manual scraps that make old props readable after a return.

### Zone 2: Hobby Ridge

Purpose: the main opt-in mini-game strip.

Landmarks:

- picnic blanket / ink swarm entrance for **Stampede Sketch**
- cliffside bag or terrace for **Telegraph Terrace**
- messy desk / service elevator for **Domino Desk**
- manual scraps tucked into signs, nests, vending machines, or printer jams
- low crawlspaces and scent marks that only make sense after Cicka teaches the player how to notice them
- optional sparring notebook and scratch shaft entrances later

Level shape:

- 3 to 5 screens wide at first
- one main clockwise trail
- one late vertical shortcut shaft
- no separate biomes in v1
- palette shifts through ink density, paper texture, and stickers rather than new tile sets
- future expansion can add double-jump / wall-cling style mobility, but the
  main path should stay low-cortisol and mobile-feasible
- the first Cicka farewell ending should not require wall cling or double jump;
  save those as optional or later topology payoffs unless a mobile control
  spike proves they are effortless

### Zone 3: Relay Spire / Farewell Peak

Purpose: final shipping/contact/credits route, and the first Cicka farewell.

Gate:

- at least three major clears / proofs, with Potassium Circuit counting as one
  proof rather than a solo bypass
- plus one Cicka / translator / manual insight that decodes the Relay sign

The gate should feel earned but not tedious. It should not require every
mini-game or every optional mastery scene, but it should ask the player to spend
real time with the Ridge before the farewell.

Ending beat:

- Cicka is present at the Relay Spire as a guide to a threshold.
- The player understands she is going somewhere the player cannot follow.
- The farewell is tender but not literal-heavy: no on-screen death scene, no long grief speech.
- Cicka leaves a final paw mark or page mark, and the Ridge remains replayable after the ending.
- Micka, a small kitten/child presence, appears only after the player returns
  to the normal Ridge and completes or replays one mini-game post-ending, not
  during the ending sequence.

## Main Loop

1. Walk the ridge.
2. Notice a landmark.
3. Find an artifact, prop, or scrambled memory.
4. Read a **Trail Card** overlay when the prop leads to an opt-in scene.
5. Enter the mini-game, inspect the artifact, or keep hiking.
6. Clear, fail, or quit back to ridge.
7. Receive a stamp, manual page, sticker, memento, shortcut, or glide pip.
8. Return to Cicka Home or revisit the landmark and see that the sketchbook
   changed.

The repeatable pleasure is not just "new content." It is returning to the same place and feeling that the sketchbook remembers.

## Reward Language

- **Stamps**: durable proof that a hobby scene was cleared.
- **Stickers**: visible world changes. These are the emotional reward.
- **Manual Pages**: one-screen clues that reinterpret a route, sign, or mechanic.
- **Artifacts**: found personal objects, tools, scraps, or odd props that teach
  Danilo through context instead of static profile text. Major work/project
  artifacts should be easy to notice; smaller skill scraps such as languages,
  libraries, and tools can be tucked into optional re-read details.
- **Mementos**: small proof objects from mini-games that physically change
  Cicka Home. They are memory and relationship, not currency.
- **Glide Pips**: movement upgrades inspired by *A Short Hike* feathers.
- **Shortcuts**: route changes inspired by *Hollow Knight* relief moments.
- **Circuit**: Potassium Slip's major reward and one major proof toward the Relay Spire gate. Derive this from the existing inventory item instead of duplicating `potassium.circuitOwned` in progress.
- **Cicka Notes**: tiny cat-side observations that reinterpret nearby props without becoming a full language system.
- **Developer Laptop**: a future portable or Cicka Home-adjacent terminal that
  extends the Basement computer fantasy. It may support debug/dev commands and
  artifact inspection after the player has the right key and Glasses, but it
  should not make typing mandatory for mobile progression.

Bridge-owned progress should stay small and serializable. Exact naming should follow the current bridge store shape. A likely implementation is to extend `BridgeProgressState` with a `ridge` object and add explicit award actions:

```ts
type RidgeProgress = {
  stamps: string[];
  manualPages: string[];
  mobility: {
    glidePips: number;
  };
  shortcuts: string[];
};
```

Stickers can be derived from stamps/manual pages until there is a proven need to store them separately.

## Mini-Game Roadmap

### 0. Potassium Slip

Status: existing flagship.

Role:

- anchor secret
- Ball x Pit fun already captured
- one major proof toward the first ending through Circuit
- benchmark for mini-game depth and documentation

Do:

- integrate the Circuit into Ridge progression as one major proof
- let Ridge signs and NPCs acknowledge Potassium
- preserve vertical-board controls

Do not:

- add another ricochet scene
- build a generic arcade framework because Potassium is large
- make every future mini-game as deep as Potassium

### 1. Stampede Sketch

First new mini-game.

Inspiration: *Vampire Survivors*.

Theme: Danilo is chased by inky ideas, deadline icons, and overexcited notebook
creatures around a picnic blanket. Nearby enemies chase Danilo; enemies that
lose his attention may drift toward the blanket and crowd the calm patch.

Purpose: protect one calm picnic-blanket patch from a stampede of runaway ideas.
See [`stampede-sketch.md`](../mini-games/stampede-sketch.md) for the active narrative and
asset brief.

Core verb: **Kite**.

Controls:

- laptop: WASD/arrows
- mobile: drag-to-move or virtual stick
- attacks are automatic

First-slice scope:

- 60-90 second internal prototype, then expand to a 3-minute fixed run
- one arena
- capped enemy count
- 3 auto-attacks
- 3 upgrade choices per level
- one first-clear glide pip
- simple results overlay

Why first:

- fastest fun read
- mobile-friendly
- balances Potassium's skill-heavy ricochet with low-input chaos
- easy to tune as a lunch-break toy

### 2. Telegraph Terrace

Second priority if Muay Thai / reactive combat becomes the next obsession.

Inspiration: *Clair Obscur* plus Muay Thai pad work.

Theme: a cliffside training terrace where a sketchy coach, heavy bag, or `TODO: AI` dummy treats a tiny sparring session like a world-title bout.

Core verb: **Parry**.

Controls:

- one large parry button
- optional dodge/jump later
- clear audio and visual telegraphs
- assist timing mode for mobile

First version:

- three short enemy "verses"
- successful parries build Tempo
- Tempo powers a simple counter-combo
- misses cost confidence, not a long restart

Keep it small:

- no full party system
- no AP encyclopedia
- no frame-data lab in v1

The fun is that enemy turns are not waiting. They are performance.

### 3. Margin Manual Hunt

Inspiration: *Tunic*.

Theme: torn sketchbook pages explain things the player has been walking past.

Core verb: **Re-see**.

Controls:

- pure overworld interaction
- React Manual overlay with large readable pages

Rules:

- each page fits on one screen
- each page teaches one idea
- no ARG, no cryptography homework
- manual pages should make Danilo say "oh, wait" rather than "I need a spreadsheet"

Use this to support the Relay Spire gate.

### 4. Cicka Daydream

Optional small mini-scene / Ridge modifier.

Inspiration: the wish to understand Cicka for a day, *A Short Hike* low-stakes movement, and *Tunic* re-reading familiar places.

Theme: Cicka says "meow" and the whole Ridge briefly admits that this is probably a complete sentence.

Core verb: **Notice**.

Controls:

- laptop: move, jump, interact/meow
- mobile: drag or swipe movement, tap to meow/interact
- no precision platforming

First version:

- 90-second cat daydream
- play as Cicka on a tiny version of the Ridge
- crawl under two props Danilo cannot enter
- follow scent/sound trails instead of quest markers
- knock one small object into a new place
- unlock one Cicka Note or sticker when the daydream ends

Kitty translator rule:

- before translator: Cicka dialogue is only "meow", posture, timing, and punctuation
- after translator: subtitles are affectionate guesses, not perfect literal speech
- examples: "meow" becomes "this box has historical importance" or "you are standing on the good paper"

Keep it small:

- no full pet system
- no cat inventory
- no permanent second campaign
- no complex animal-language grammar

Why it belongs:

- it makes the world less lonely
- it turns a personal real-life presence into a playable secret
- it supports the core Ridge idea: new knowledge makes old places different

### 5. Domino Desk

Inspiration: *Divinity: Original Sin 2* surfaces and deterministic systems.

Theme: a messy desk battlefield with coffee rings, tape, staples, sticky notes, and overheated laptop tiles.

Core verb: **Push-turn**.

Controls:

- tap/select piece
- swipe cardinal direction
- undo for fat-finger mistakes

First version:

- two compact puzzles
- deterministic chain reactions
- no stats
- no dice
- reward: service elevator shortcut

The fun is feeling clever, not managing a CRPG.

### 6. Neutral Notebook

Inspiration: fighting games.

Theme: Danilo spars with an onion-paper sketch of his past self.

Core verb: **Poke**.

Controls:

- move/backdash macro zones
- one poke button
- one dash button
- no motion inputs

Keep:

- spacing
- whiff punish
- corner tension
- three-hit rounds

Avoid:

- combo trials
- netcode
- full character roster

This is a later scene because the design tuning is subtle.

### 7. Shaft of Scratches

Inspiration: *Hollow Knight* pogo mastery.

Theme: a scratchy utility shaft with doodled hazards.

Core verb: **Pogo**.

Controls:

- jump
- air-tap/down-strike bounce
- generous coyote time

Role:

- optional skill souvenir
- unlocks a satisfying shortcut rope

This should be small and slightly spicy. It should never block the main ending.

## NPC And Dialogue Tone

The tone is **warm weirdos with tiny stakes delivered like destiny**.

Character Designer rule: every NPC should be readable by silhouette first, voice second, and function third. If an NPC exists only to explain a menu, it should be a sign instead.

Examples:

- A training dummy named `TODO: AI` demands an honorable duel before it has implemented legs.
- A clipboard officer treats banana ricochets as workplace law.
- A ridge guide gives sincere advice, then worries about font licensing.
- A printer oracle speaks in jammed paper prophecies.
- A tiny NPC takes a sticker placement dispute more seriously than the finale.
- Cicka says "meow" with the emotional specificity of a 900-page novel.

Rules:

- short dialogue
- sincere under the joke
- no generic portfolio exposition
- no recruiter-facing sales pitch
- the bit should reveal a real Danilo taste, habit, hobby, or worry
- the cast should stay tiny; no NPC schedules until static characters already feel alive

## Character Layer

Characters should make the Ridge feel inhabited without turning the project into an RPG.

### Cast Size

First target:

- **Cicka**: cat, translator mystery, companionable re-seeing of the Ridge.
- **Ridge Guide**: gentle A Short Hike-style orientation and small encouragement.
- **Potassium Compliance Officer**: already the absurd authority of the banana arcade world.
- **TODO: AI**: training dummy / sparring partner for Telegraph Terrace or Neutral Notebook.
- **Printer Oracle**: manual-page hint giver, dramatic about paper jams.

That is enough for v1. More characters should arrive only when a new mini-game needs a face.

### Interaction Shape

Each NPC gets:

- one first-meeting line
- one post-stamp line
- one optional joke or vulnerability line
- one clear interaction affordance if they launch a scene or overlay

No NPC should require a dialogue tree in v1. The goal is presence, not conversation management.

### Cicka

Cicka should feel like a real tiny resident of the sketchbook, not a mascot pasted on top.

Behavior:

- appears on perches, boxes, warm laptop vents, and suspiciously important paper
- sometimes blocks a path for no reason until the player returns with a sticker or manual clue
- reacts to cleared mini-games with new "meow" punctuation
- leaves paw-print margin marks near hidden details
- grows from side resident into the emotional guide for the first ending
- leaves through a symbolic farewell at the Relay Spire, toward somewhere the player cannot follow

Design:

- small black-ink silhouette with very readable tail shapes
- stepped animation: blink, loaf, stretch, suspicious turn, tiny hop
- subtitles should use paper-cut dialogue bubbles, but only after the translator moment

Ending and tribute rule:

- Cicka's farewell is a tribute beat, not a literal death scene.
- Use presence, absence, paw marks, and one or two translated lines instead of heavy exposition.
- After the ending, the Ridge remains open for replay, and Cicka's final mark should persist.
- Micka appears after the player returns to the Ridge from completing or
  replaying one post-ending mini-game. She is continuity, not replacement.

Translator fantasy:

The kitty translator is not a universal decoder. It is a playful empathy device. It teaches the player that Cicka has been commenting on the Ridge the whole time, but the translations are intentionally a little questionable.

Good translations:

- "This cardboard is load-bearing."
- "You forgot to smell the shortcut."
- "The banana place is loud in a legally interesting way."
- "Nap here and the world becomes 12% more true."

Bad direction:

- long exposition
- exact lore dumps
- Cicka solving puzzles for the player
- making Cicka sound like a normal human

## Manga And Sketchbook Feel

The style guide remains **Digital Sketchbook**: off-white paper, black ink, hand-drawn silhouettes, paper-cut UI, stepped animation.

The manga influence should come through as:

- panel-like compositions for Trail Cards and Manual Pages
- expressive black shapes and negative space
- funny-sad little observations in margins
- a handmade feeling that tolerates roughness

Use the *Oyasumi Punpun* taste signal carefully. The goal is not to make the portfolio bleak. The useful ingredient is the contrast: simple drawings can carry real interior feeling.

## Level Design Rules

1. The Relay Spire must be visible early.
2. A landmark should be readable by silhouette before text explains it.
3. Every first clear should change the ridge visually.
4. Backtracking must get faster after rewards.
5. Falling should not punish the player in the overworld.
6. No main-path jump should require precision platforming.
7. Optional mastery paths can be hard, but must be clearly optional.
8. A mobile player should be able to reach the first Trail Card within one minute.
9. Long-term topology should stay 2D side-view and interconnected, not
   top-down/isometric by default.
10. Wall cling / double jump are desirable long-term movement flavors, but not
    required gates for the first farewell ending.

## Architecture Rules For This Plan

Respect the current React + Phaser architecture:

- **Scenes** are Phaser worlds.
- **Overlays** are React surfaces.
- **Triggers** are scene-owned.
- Durable cross-scene progress belongs in the bridge store.
- Trail Cards, Manual Pages, upgrade choices, and results screens are React overlays through `OverlayHost`.
- Mini-games should be separate scene folders, not modes inside one mega-scene.
- Do not introduce a generic mini-game framework until at least three shipped scenes prove repeated pain.
- Arcade scenes with direct pointer input should intentionally use a non-`portrait-cover` presentation mode so they do not sit under the mobile gesture overlay. Potassium already uses `vertical-board`; future scenes should extend scene presentation policy deliberately.
- If Ridge glide needs touch-hold behavior, add durable touch state such as `jumpHeld` or `glideHeld`, not another one-shot. Make glide opt-in for Ridge so Hobbies/Basement do not inherit it by accident.

Likely folders when implementation starts:

- Proposed Ridge scene folder.
- Proposed Stampede Sketch scene folder.
- Proposed Telegraph Terrace scene folder.
- Proposed Cicka Daydream scene folder, only if the cat daydream becomes a separate scene.
- Proposed Domino Desk scene folder.
- scene-local overlays under each scene's `overlays/`
- shared/global Manual or Trail Card overlays only if repeated use justifies it

## Development Plan

### Slice 0: Production Baseline

Goal: make the current state legible before adding more.

Tasks:

- treat Potassium Slip as the mini-game benchmark
- document the final expected Circuit reward path from existing inventory ownership
- decide the minimal bridge progress keys
- confirm current return-to-overworld behavior and overlay pause behavior still work

Done when:

- Potassium can be referenced by future Ridge gates without ambiguity
- there is no new architecture invented for hypothetical mini-games
- the plan is clear that mini-game run state stays inside each scene, while the bridge stores only durable rewards

### Slice 1: Ridge Shell

Goal: make the main game shape playable.

Tasks:

- add a compact side-view Ridge scene
- show Relay Spire silhouette
- add three landmark triggers with Trail Cards
- place Cicka's first perch and one static NPC who makes the Ridge feel inhabited
- support return to Ridge from child scenes
- add placeholder sticker changes for cleared content

Done when Danilo can:

- enter the Ridge
- see the destination
- interact with at least three hobby props
- back out without losing place
- understand that mini-games are optional

### Slice 2: Stampede Sketch

Goal: ship the first new mini-game.

Tasks:

- implement move-only survivor arena
- add automatic attacks
- add XP pickups and three-choice upgrades
- cap entities for phone performance
- add results overlay
- reward first clear with one glide pip and a visible sticker

Done when:

- the first 60 seconds are fun without reading instructions
- a mobile player can survive through movement alone
- clearing it changes traversal or visuals on the Ridge

### Slice 3: Ridge Memory

Goal: make rewards emotionally visible.

Tasks:

- sticker layer changes signs, planks, background doodles, or route hints
- one shortcut opens
- glide pip affects overworld movement
- manual page overlay explains one existing sign
- first Cicka Note, memory reaction, or pre-translator interaction makes an old
  prop feel newly readable

Done when:

- returning to the Ridge after a clear feels different
- the player can explain what changed without opening an inventory

### Slice 4: Telegraph Terrace

Goal: test the Muay Thai / Clair Obscur direction at indie scope.

Tasks:

- build one-button parry scene
- use 3 short attack patterns
- successful defense builds Tempo
- Tempo triggers a clear counter
- add assist timing mode
- reward a manual page for Relay rhythm glyphs

Done when:

- defense feels active
- missing is recoverable
- the scene works with one thumb

### Slice 5: Relay Spire First Ending

Goal: close the loop with Cicka as the emotional spine.

Tasks:

- add final gate logic
- require at least three major clears / proofs, with Potassium Circuit counting
  as one proof
- require one Cicka / translator / manual insight
- add short ending overlay / paper-cut farewell beat
- return player to Ridge after ending
- keep mini-games replayable after the ending
- introduce Micka after the player returns from completing or replaying one
  post-ending mini-game, not inside the ending sequence

Done when:

- Danilo can finish a complete route in roughly 20 to 35 minutes
- the ending feels like shipping a living sketchbook and saying goodbye with care

## Design Validation

Before adding another mini-game, the current build should pass these checks:

- Danilo smiles before any long text explains the premise.
- The Ridge is memorable enough to describe from memory.
- Phone controls do not feel like a compromise.
- Every mini-game has one sentence, one verb, one reward.
- The first reward visibly changes the world.
- The first NPC interaction makes the Ridge feel less lonely without starting a dialogue tree.
- Potassium still feels special.
- The main ending does not require beating the hardest optional scene.

## Scope Cuts

Cut or defer these until the core loop is proven:

- full fighting-game engine
- full Clair Obscur party/AP system
- full Tunic cipher language
- second ricochet mini-game
- large overworld map
- top-down/isometric overworld pivot before a dedicated spike
- multi-biome asset set
- generic mini-game framework
- meta-progression shop
- complex NPC schedules
- required precision platforming

## Current Open Knobs For Danilo

These are the choices to iterate on next:

- **Tone mix**: default to 70% goofy, 30% quiet ache.
- **Avatar**: Danilo-as-Danilo, a sketchbook stand-in, or a tiny abstract mascot.
- **First ending length**: default to 20 to 35 minutes.
- **Next mini-game after Stampede**: default to Muay Thai / Telegraph Terrace.
- **Manual difficulty**: default to one-screen aha clues, no real cipher.
- **Cicka timing**: default to first perch in Slice 1, translator/daydream after Ridge Memory proves return play.
- **World scale**: default to one ridge before any new area.

## Level Designer Verdict

Build the smallest version that already feels like the real game:

1. a visible Relay Spire
2. a compact ridge
3. Potassium as the secret arcade anchor
4. Stampede Sketch as the first new opt-in toy
5. stickers that make the ridge remember
6. Cicka's first perch, so the sketchbook is not lonely

That is enough for the game to have a soul before it has a backlog.
