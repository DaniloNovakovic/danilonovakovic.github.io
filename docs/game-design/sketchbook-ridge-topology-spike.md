# Sketchbook Ridge Topology Spike

> Active M5 design brief for the next Ridge blockout. This document narrows
> [`sketchbook-ridge-milestone-plan.md`](./sketchbook-ridge-milestone-plan.md)
> into one map-design spike. It is not shipped behavior; update
> [`player-manual.md`](./player-manual.md) only after a playable route ships.

## Purpose

Design and lightly prototype the first Ridge route shape before replacing the
current Overworld.

The current Overworld is not the long-term target. It should become the
**Outskirts / Trailhead** edge of the Ridge: the player-facing place where
existing portfolio access, the Basement hatch, glasses, Potassium hints, and
the first Ridge steps can eventually live.

The long-term replacement should not be a nicer row of portfolio buildings.
Ridge should teach Danilo through a **scrambled sketchbook restoration** loop:
find artifacts, play scenes, earn proofs, return to Cicka Home, and watch the
place become more legible.

## Design Thesis

Ridge fun should come from **route mastery before dexterity**.

The first good version should make the player think:

> I know where the Relay Spire is, and now I know a faster way back to Cicka.

This means:

- main path stays calm, readable, and mobile-safe
- Relay Spire is visible early
- Cicka Home is the emotional return anchor, not a menu hub
- Danilo is learned through artifacts, mementos, skills, manual insights, and
  Cicka reactions instead of static resume modals
- mini-game clears create mementos and route changes
- shortcuts make return play faster without flattening the climb fantasy
- platforming spice stays optional until touch controls prove it is pleasant

## Portfolio Learning Model

Avoid:

- generic buildings that open modal biography panels
- hobby rooms that exist mainly as text wrappers
- Cicka gift checklists
- resume facts that are not earned by world interaction

Prefer:

- **Memory scraps**: page fragments, stickers, margin notes, and manual clues
  that reinterpret old props.
- **Personal artifacts**: glasses, receipts, laptop keys, gloves, notebooks,
  cables, coffee rings, or project fragments.
- **Skill proofs**: stamps from mini-games that show what Danilo can do or what
  he cares about.
- **Cicka readings**: tiny reactions that make a found object feel personal
  without turning Cicka into an exposition machine.

Artifact hierarchy:

- **Major artifacts** should be easy to find and remember. Use them for jobs,
  major projects, and identity anchors.
- **Minor scraps** can be hidden deeper. Use them for programming languages,
  libraries, tools, small anecdotes, and optional details.
- **Re-read details** should appear after Glasses, manual pages, Cicka notes, or
  mini-game clears make an old object more meaningful.

Work/project artifact examples:

| Source | Possible artifact | Discovery role |
| --- | --- | --- |
| Vega IT / Saturn office | Saturn sticker, ringed planet door plate, office keycard, tiny desk planet | Easy major artifact for a job memory |
| Hummingbird | feather, tiny bird pin, hovering note, nectar-like ink drop | Easy major artifact for current work |
| Specific projects | broken UI tile, deploy stamp, puzzle component, console log scrap | Medium artifact that can unlock a short story beat |
| Skills/tools | loose keycaps, syntax scraps, language stickers, tiny CLI flags | Optional hidden scraps, not main route blockers |

Core loop:

```text
find weird object -> play / inspect / use it -> Cicka reacts
  -> Cicka Home changes -> old route means more
```

Basement, Potassium Slip, and the Glasses re-read effect should stay as strong
anchors. Generic portfolio modal buildings should gradually retire into
artifacts, playable scenes, manual pages, and Cicka Home mementos.

### Developer Laptop / Terminal

The Basement computer concept should survive and can expand into a future
Developer Laptop artifact.

Good direction:

- laptop or terminal starts locked or unclear
- player needs a **laptop key** plus **Glasses** to use it meaningfully
- terminal can inspect recovered artifacts, show debug-flavored hints, and
  support dev commands such as skip/reset/seed while in development
- terminal language should feel like Danilo debugging the sketchbook, not a
  separate admin menu

Constraints:

- do not require typed commands for core mobile progression
- provide touch-friendly command buttons or shortcuts for any required action
- keep real dev/debug commands clearly separated from player-facing lore
- do not replace map learning with terminal menus
- do not make laptop available before it has a reason to matter

## Source Signals

Use these docs as inspiration, not hard scope:

- [`sketchbook-ridge-summit.md`](./sketchbook-ridge-summit.md): Ridge vision,
  Cicka arc, mini-game reward language, and mobile constraints.
- [`sketchbook-ridge-long-term-topology-ideas.md`](./sketchbook-ridge-long-term-topology-ideas.md):
  compact three-layer mountain, shortcut vocabulary, and secret families.
- [`../research/Deep Dive_ 2D Map Design Principles.md`](../research/Deep%20Dive_%202D%20Map%20Design%20Principles.md):
  loops, landmarks, mental mapping, and earned shortcut relief.
- [`../research/Analyzing Lucky Luna's Gameplay Essence.md`](../research/Analyzing%20Lucky%20Luna's%20Gameplay%20Essence.md):
  mobile-native falling/descent ideas for optional later pockets.
- [`../research/Nine Sols Game Design Inquiry.md`](../research/Nine%20Sols%20Game%20Design%20Inquiry.md):
  evolving home anchor, mementos, and restorative return space.

## Weighted Options

Weights used for this spike:

- Fun and "grokking": 30
- Mobile safety: 25
- Overworld merge fit: 20
- Implementation risk: 15
- Emotional and landmark fit: 10

| Option | Score | Shape | Pros | Risks |
| --- | ---: | --- | --- | --- |
| Folded Summit Spine + Overworld absorption | 90 | One calm trail from Outskirts to Relay, with one loopback shortcut | Best M5 target; clear first walk; easy mobile; absorbs boring Overworld cleanly | Movement fun is mostly route compression until later rewards |
| Main Trail + Cicka Underpath | 86 | Main trail plus one low cat route returning to Cicka Home | Strong personality; Cicka becomes spatial clue; good secret language | Hidden path needs visible paw/scratch/paper-fold tells |
| Three-Layer Mini Mountain | 78 | Main trail, under-ridge, high ledges | Best long-term topology; lots of future re-reading | Too large for first spike; high layer can become precision platforming |
| Trailhead Hub + Hobby Spokes | 72 | Outskirts center with short branches to hobby props | Easy Overworld replacement; simple navigation | Can become a menu disguised as a map |
| Lucky Luna Descent Pocket | 66 | Main trail plus optional vertical drop shaft | Great mobile movement toy; fresh texture | Better as mini-pocket than main overworld; can fight side-view shell |

Chosen first direction:

> **Folded Summit Spine + Cicka Home**, with one visible shortcut and one
> teased underpath. Do not build the full three-layer mountain yet.

## First Route Graph

```text
[1 Outskirts / City Edge]
        |
[2 Cicka Home / Desk Nest]
        |
[3 Stampede Blanket] ---- cleared shortcut ----+
        |                                      |
[4 Telegraph Teaser]                          |
        |                                      |
[5 Guide / Relay Sightline]                   |
        |                                      |
[6 Domino Desk Teaser]                        |
        |                                      |
[7 Relay Gate]                                |
                                               |
        +------------- return near Cicka ------+
```

Minimum first greybox can compress this into 3-5 screens:

```text
[Outskirts] -> [Cicka Home] -> [Stampede]
                    ^             |
                    +-- shortcut--+
                         |
               [Guide / Relay View] -> [Domino / Relay Gate]
```

## Screen Beats

### 1. Outskirts / City Edge

Purpose: future replacement seed for current Overworld.

Player sees:

- street/city edge becoming sketchbook trailhead
- distant Relay Spire silhouette
- space for future Basement hatch, glasses beat, and Potassium hint
- early artifacts that replace boring portfolio buildings over time

Do not in the first spike:

- replace default Overworld
- move all current portfolio overlays
- rewire existing smoke path
- build a new row of modal information buildings

### 2. Cicka Home / Tiny Desk Nest

Purpose: emotional return anchor.

First version:

- small desk ledge near Outskirts
- cardboard box or folded blanket perch
- simple paper wall/pinboard behind it
- Cicka sits here early
- empty space reserved for mementos

Rules:

- call it **Cicka Home**, not hub
- Cicka Home changes should be visible rewards, not checklist UI
- Cicka should be easy to reach after mini-games through space, not teleport UI
- Cicka is emotional compass, not vendor, quest board, or upgrade menu

### 3. Stampede Blanket

Purpose: first active mini-game and first return-change proof.

After first clear:

- Stampede memento appears at Cicka Home
- visible shortcut opens from the Stampede side back near Cicka Home
- optional paw/scratch marks tease a later underpath
- Cicka may briefly appear near the cleared blanket, then home remains the
  reliable return anchor

### 4. Telegraph Teaser

Purpose: future timing lane signal.

First version:

- readable bag/terrace silhouette
- Trail Card remains unavailable
- no parry mechanics in the overworld

### 5. Guide / Relay Sightline

Purpose: make the route feel like a climb toward a destination.

First version:

- Guide reinforces orientation with minimal copy
- Relay Spire visible again from a new angle
- player understands the route continues past the current toy strip

### 6. Domino Desk Teaser

Purpose: future route-compression promise.

First version:

- desk/elevator shape reads as future shortcut language
- no puzzle implementation
- no service-elevator shortcut until later Domino slice

### 7. Relay Gate

Purpose: first ending promise.

First version:

- visible but not fully solvable
- communicates "proofs plus Cicka insight" without final-ending behavior

## Cicka Home Progression

Mementos should be derived from durable progress when possible. Do not add a
stored gift/checklist state until a concrete interaction needs it.

Possible mementos:

| Source | Home change |
| --- | --- |
| Stampede Sketch | calm ink scrap, settled swarm doodle, or paw note |
| Potassium Slip | banana-law receipt pinned sideways |
| Vega IT / Saturn office | ringed-planet sticker, tiny Saturn door plate, or office keycard |
| Hummingbird | small feather, bird pin, or hovering sticky note |
| Telegraph Terrace | tiny bell string or handwrap ribbon |
| Domino Desk | domino tile that later becomes a step/shortcut clue |
| Manual Page / Cicka insight | torn page corner that Cicka chooses as a seat |

Gift rule:

> Mementos are proof and memory, not currency.

Learning rule:

> Player learns Danilo by seeing why an object matters, not by reading a resume
> panel about it.

Avoid:

- "give five items" grind
- generic inventory turn-ins
- Cicka as a vendor
- forced hub returns that feel like chores
- static modal biography replacement under a different name

## Shortcut Rules

First shortcut target:

- unlock from the far side after the player has walked the route once
- visibly folds Stampede return back near Cicka Home
- should feel like a handmade sketchbook object: patched plank, taped bridge,
  paper strip ladder, binder clip latch, or cat-marked safe drop
- should not erase the main trail or make Relay feel flat

Underpath target:

- tease with paw marks, scratches, or a paper fold before it is usable
- keep it optional in first spike unless clarity is excellent
- use it to express "Cicka knows the paper under the world"

High-ledge target:

- show one tempting high ledge
- do not add glide, wall jump, or double jump yet
- later test glide with touch-hold before making it a real route requirement

## Implementation Constraints

For the first greybox:

- keep default Overworld unchanged
- keep work mostly under `src/game/scenes/ridge/**`
- use current side-view movement controls
- avoid shared runtime edits
- avoid bridge changes unless using existing Ridge progress/shortcut fields
- derive visible home changes from existing stamps where possible
- do not update `player-manual.md` until behavior is shipped

Shared seams to avoid unless explicitly planned:

- `src/game/bridge/store.ts`
- `src/game/scenes/sceneIds.ts`
- `src/game/scenes/sceneRegistry.ts`
- `src/game/overlays/overlayIds.ts`
- `src/game/overlays/overlayRegistry.ts`
- `src/game/sceneLifecycle/contexts/createSceneContexts.ts`
- `src/game/sharedSceneRuntime/**`

## Acceptance Criteria

The topology spike is successful when:

- player can boot Ridge in dev and cross the route calmly
- Relay Spire is visible early and again later
- Cicka Home is easy to find and feels like a return anchor
- Stampede remains reachable quickly
- first clear or seeded Stampede progress shows a Cicka Home memento
- one shortcut visibly returns from the Stampede side toward Cicka Home
- Outskirts contains at least one rough artifact slot that points toward
  replacing modal buildings with world learning
- work/project artifacts are staged as visible objects, while skill/tool scraps
  are reserved for optional hidden details
- player can understand the shortcut spatially without a minimap
- mobile/touch traversal remains low-cortisol
- old Overworld remains default until Ridge feels better than it

Human review prompt:

> Does returning to Cicka feel like using a place, or like operating a menu?

If it feels like a menu, reduce hub behavior and strengthen route language.

## Issue-Ready Slice

Title: `Prototype Ridge / Outskirts topology blockout`

Owner: Ridge scene.

Type: HITL for feel review after AFK implementation.

Build:

- reshape Ridge layout into Outskirts -> Cicka Home -> Stampede -> Relay-view
  route
- add Cicka Home desk-nest placeholder
- add Stampede-derived home memento when `stampede-sketch` stamp exists
- add one visible shortcut from Stampede side back near Cicka Home
- reserve at least one Outskirts artifact slot for replacing a boring portfolio
  building later
- reserve future laptop/key/glasses terminal affordance without making it part
  of the first route
- add one high-ledge teaser with no required movement verb
- keep old Overworld default

Verify:

- unit tests cover landmark order, early Relay visibility, memento derivation,
  and shortcut availability
- manual smoke uses `?mode=interactive&startScene=ridge`
- mobile/touch smoke confirms route is readable and non-precision

Do not:

- fully replace Overworld
- implement glide
- implement Cicka gift inventory
- implement required laptop typing
- add a minimap
- add generic map/topology framework
- rebuild static portfolio modals inside Ridge
