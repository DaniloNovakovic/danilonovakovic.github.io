# Agent E Proposal: Sketchbook Ridge: A Compact Summit Loop

## Title

**Sketchbook Ridge: A Compact Summit Loop**

## Pillars

1. **Landmarks over square mileage** — One short loop, three readable silhouettes (kiosk, workshops, relay spire). Density beats scale; getting lost is optional, curiosity is not.
2. **One verb per hobby scene** — Each mini-game is a Phaser scene built around a single skill you can explain in six words. No genre kitchens.
3. **Touch-first, keyboard-friendly** — Every loop must work with thumbs; keyboard is convenience, not a secret handshake.
4. **Knowledge is a key (not a wiki)** — Manual fragments and signage do real gatekeeping (Tunic-style), but each fragment fits on one overlay screen.
5. **Potassium Slip stays the arcade spine** — Ball x Pit ricochet fantasy remains the flagship vertical-board game; Ridge content feeds *into* and *out of* it, never replaces it.

## Overworld Loop

1. **Pull**: You are trying to reach the **Relay Spire** to “send the sketchbook” (ship the portfolio fantasy). A polite timer shown as signal bars ticks up slowly—it never kills you, it only motivates Return-to-City spacing like A Short Hike’s call-home hook.
2. **Discovery**: The ridge is a **single clockwise trail** with three hobby glades marked by sketch landmarks (oversized pencil, coffee ring boulder, stacked sticky-note cairn). Triggers are scene-owned: interact opens a React **Trail Card** overlay (title, time estimate, reward), then `enterScene` if accepted.
3. **Return**: Clearing a hobby grants a **stamp + fragment + bridge flag**. The overworld gains one tangible affordance—shortcut plank, extra glide puff, or readable sign revision—so backtracking feels faster without new geometry sprawl.
4. **Compactness**: The entire ridge fits **one side-view strip** (~3–5 screen widths) with layered parallax and a tiny vertical shaft shortcut late game. No separate biomes—only morning / ridge / timberline palette shifts using style-guide ink density, not new tilesets.

## Progression

Bridge-owned only (small JSON-shaped state):

- **`ridge.stamps[]`** — enum ids for cleared hobbies (portfolio “badge plate” visuals).
- **`ridge.manualPages[]`** — ids unlocking glossary rows in a React Manual overlay (not a second registry—same overlay id, page-driven props).
- **`ridge.mobility`** — `{ glidePips: 0..3 }` earned slowly; each pip adds glide duration or one midair “brush flap.” Feathers-from-Hike translated into **brush stamina** without fuel micromanagement.
- **`ridge.shortcuts`** — booleans for unlocked ladder / rope that shorten the loop (Hollow Knight-ish tension/release via routing, not combat).
- **`potassium.circuitOwned`** — already canonical from Potassium Slip; Ridge quests can *reference* the Circuit as proof of arcade literacy.

Hard gate for finale: **any three stamps OR Circuit owned**, plus **manual page that decodes the Relay trail sign** (knowledge gate). Keeps speedrun and curious paths both valid (Divinity-style fallback routes).

## Mini-Game Concepts

### 1) Potassium Slip (anchor — maintain, don’t remake)

- **Theme**: Office-banana ricochet absurdism (existing).
- **Research inspiration**: Ball x Pit — ricochet readability, upgrade synergy, vertical pit tension.
- **Core verb**: **Bank shots** (launch / recall).
- **Session length**: 12–25 minutes to campaign win; endless optional.
- **Win/loss**: Lives hit zero = reset run; boss cleared = persistent Circuit reward (existing).
- **Mobile control profile**: Drag-aim near banana, hold-recall anywhere (`vertical-board`; pointer-first).
- **Reward**: Keeps **Circuit** + leaderboard prestige; Ridge uses Circuit as alternate finale key.
- **Out of scope**: New fusion grids, new boss phases, second vertical-board mode.
- **Why it is fun**: Satisfying geometry + escalating build nonsense already proven; Ridge rides its dopamine without cloning it.

### 2) Stampede Sketch

- **Theme**: Inky wildlife (“ideas”) swarm a picnic blanket hero-dev.
- **Research inspiration**: Vampire Survivors — auto-fire frees attention; XP gems pull you into danger; power spiral.
- **Core verb**: **Kite** (move-only offense).
- **Session length**: 5 minutes fixed timer + 30s wind-down chest moment.
- **Win/loss**: Survive timer; death ends attempt with score tally overlay.
- **Mobile control profile**: Virtual stick or drag-to-move (single pointer); large pickup magnet radius after minute three for accessibility.
- **Reward**: `glidePips += 1` first clear only; repeat clears swap to cosmetic ink particles.
- **Out of scope**: Weapon evolution trees, meta-currency towns, more than three passive pick-ups per level-up choice.
- **Why it is fun**: Turns portfolio anxiety into a cartoon storm you outgrow—readable power fantasy on a lunch break.

### 3) Telegraph Terrace

- **Theme**: Performing on a cliffside amphitheater for distracted birds (critics).
- **Research inspiration**: Clair Obscur Expedition 33 — reactive defense rewards offense; rhythmic mastery.
- **Core verb**: **Parry** (tap/hold shield on audio-visual flash).
- **Session length**: 90 seconds × 3 verses; ~5 minutes total including overlay intros.
- **Win/loss**: Miss N telegraphs in a verse = verse fail; three verse wins clear session.
- **Mobile control profile**: Large central shield button; optional “focus mode” widens timing ±4 frames; color + sound telegraphs (headphones rewarded, not required).
- **Reward**: Manual page: **“Relay Rhythm glyphs”** (decodes summit sign).
- **Out of scope**: Full AP economies, party turns, aim modes.
- **Why it is fun**: Turns LinkedIn dread into a drum solo—you’re safest when you’re brave.

### 4) Neutral Notebook

- **Theme**: Sparring with your past self sketched on onion paper.
- **Research inspiration**: Fighting games — spacing, whiff punish windows, corner psychology shrunk to a shoestring arena.
- **Core verb**: **Poke** (one attack button + one dash button; no joystick specials).
- **Session length**: First-to-three hits in ~3–6 minutes.
- **Win/loss**: Round resets on hit; match ends at three.
- **Mobile control profile**: Left half tap = step back / step forward macro zones; right button poke; separate dash chip—**no diagonal DP motions**.
- **Reward**: Stamp **“Neutral Reader”** + cosmetic ink hit FX on overworld interact sparks.
- **Out of scope**: Combo trials, frame-perfect OS lists, netcode.
- **Why it is fun**: Teaches portfolio visitors how you think under pressure—readable yomi without tournament baggage.

### 5) Shaft of Scratches

- **Theme**: Descending a utility elevator shaft lined with doodled hazards.
- **Research inspiration**: Hollow Knight — crisp jumps, pogo momentum, optional cruelty for devotees.
- **Core verb**: **Pogo** (down-strike to bounce).
- **Session length**: 45–120 seconds for skilled ascent; optional bell collectible +30s.
- **Win/loss**: Touch spikes or timer optional fail → restart shaft; summit plate grants clear.
- **Mobile control profile**: Jump fixed button; **second finger tap while airborne = pogo** (never requires keyboard); generous coyote time.
- **Reward**: Shortcut rope halfway up Ridge (routing prize, not stats).
- **Out of scope**: Charms, nail arts, multi-room map.
- **Why it is fun**: Pure skill souvenir—players who finish feel ownership of the site’s verticality.

### 6) Domino Desk

- **Theme**: Messy desk battlefield—coffee rings, tape, staples-as-traps.
- **Research inspiration**: Divinity: Original Sin 2 — deterministic surfaces; elemental chaining without dice drama.
- **Core verb**: **Push-turn** (slide one object per turn to trigger chain).
- **Session length**: 4–8 turns per puzzle; two puzzles back-to-back ≈6 minutes.
- **Win/loss**: Objective tile ignites within turn limit; overflow failure resets puzzle seed.
- **Mobile control profile**: Tap select piece; swipe cardinal to slide; undo stack ×3 for fat-finger recovery.
- **Reward**: Opens **service elevator** skip near Potassium entrance (fallback routing).
- **Out of scope**: Full armor math, multiplayer shenanigans, emergent lava oceans.
- **Why it is fun**: Lets visitors feel clever without needing RTS thumbs—brain candy sized for phones.

### 7) Margin Manual Hunt

- **Theme**: Recover torn manual scraps stuck in bird nests, vending machines, and “printer demons.”
- **Research inspiration**: Tunic — manual fragments reinterpret old screens; knowledge gates progression.
- **Core verb**: **Re-see** (revisit landmark with new gloss text).
- **Session length**: Passive accumulation across Ridge play; active chase session ~8 minutes once clues understood.
- **Win/loss**: Non-failable; incomplete simply locks Relay finale copy until solved.
- **Mobile control profile**: Overworld interactions only—tap prompts; reading happens in React overlays with big type.
- **Reward**: Manual overlay entries plus finale dialogue clarity (and one humorous bad ending if you ship without reading anything).
- **Out of scope**: Cryptographic ARG across repo files, multi-language cipher ladder.
- **Why it is fun**: Turns portfolio literacy into exploration pride—the visitor becomes co-author of the joke.

## Mobile Controls

- **Overworld (side-view)**: Existing bridge touch pattern—walk/jump/interact one-shots; optional translucent drag zone for analog-ish walk; **glide** on hold-after-jump when pips > 0 (single extra verb, telegraphed HUD puff).
- **Potassium Slip**: Drag aim + hold-recall (`vertical-board`).
- **Stampede Sketch**: Drag-to-move or floating stick; fat hitbox; auto-attack always on.
- **Telegraph Terrace**: One big parry surface; color-coded lanes; no simultaneous chord taps.
- **Neutral Notebook**: Macro lane controls—no quarter-circle gestures.
- **Shaft of Scratches**: Jump + air-tap pogo; restart instantly on fail.
- **Domino Desk**: Tap-select, swipe-slide; undo chain.
- **Manual Hunt**: Pure tap narrative UI—zero action dexterity gate.

## Implementation Scope

**Slice 1 (ship-worthy)**  
Add Ridge scene shell + three triggers wired to bridge; ship **Stampede Sketch** only as first Phaser mini-game + results overlay; mobility pip reward hooks into bridge.

**Slice 2**  
Telegraph Terrace + Manual page overlay wiring (reuse single Manual overlay id with page prop).

**Slice 3**  
Neutral Notebook + Domino Desk (small physics-lite grid, not full tile engine).

**Slice 4**  
Shaft of Scratches + shortcut rope; finale Relay Spire trigger + ending overlay.

Folder discipline per `docs/runtime-architecture.md`:

- Proposed Ridge scene folder — overworld scene, triggers, local overlays for Trail Cards.
- Proposed mini-game scene folders — Stampede Sketch, Telegraph Terrace, Neutral Notebook, Domino Desk, and Shaft of Scratches each own scene context + resume policy.
- Shared overlays only via `OverlayHost`; mini-game instructions/results as React overlays, not Phaser text stacks.
- Reuse `SideViewPlayerRuntime` for Ridge and platform scenes; Potassium unchanged adapter path.

## Risks

| Risk | Mitigation |
| --- | --- |
| Overworld creep (too big, too many NPCs) | Hard cap strip length; landmarks instead of biome packs |
| Touch rhythm unfairness (Terrace) | Assist modes widen windows; color lanes; fail-forward with shorter verses |
| Survivor-like perf on low phones | Cap entity count hard; stamp sprites batched; pick lightweight VFX |
| Knowledge gates confuse casual visitors | Manual Hunt gated finale is optional alternate; Circuit bypass |
| “Too many modes” maintenance | One verb audits before scope approval; no generic mini-game framework |

## Fun Thesis

This version exists because a portfolio should feel like **a hike you finish smiling**—not a hallway of resumes. Sketchbook Ridge pairs **Ball x Pit fireworks** (Potassium) with **short hike pacing**, lets phones participate without apology, and trades graphical ambition for **moments you want to tell someone about**: the first clean parry chorus, the absurd kite-around-a-desk survival win, and the quiet laugh when a manual margin finally explains the joke you’ve been walking past.
