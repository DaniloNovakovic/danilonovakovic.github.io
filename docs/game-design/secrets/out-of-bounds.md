# Out of Bounds — The Fourth-Wall Secret Arc

> Status: **idea / pre-production**. Nothing here is shipped or canon until
> it's built and written into [`../player-manual.md`](../player-manual.md).
> Live slice status belongs in GitHub Issues, not here.

## Pitch

Players usually walk right, so the secret is to the left. If you keep walking
left in the Hobbies room you leave the drawn room and walk into the blank,
unfinished edge of the sketchbook. Something is waiting out there. You pick it
up, an alarm goes off, and there's no way back. You come up through the
basement onto the street, where the chick that always ran from you is waiting,
and it's evil now. You fight with a hammer, pigeons dive at you, every smash
cracks the _screen itself_, and you keep breaking it until nothing is left. On
the other side it turns into a different game, and the first thing in the
whole portfolio that isn't drawn: you wake up unplugged aboard a real, 3D alien
ship. You sneak, grab a gun, shoot your way through insect-like aliens, take over the
ship, fly it home in an invaders-style arcade shooter, and land in a quiet
closing scene: playing guitar with Cicka and your wife.
_Thank you for playing._ That is the **true ending**.

The fun comes from escalation and surprise. Each act should make the player
ask "wait, how far does this go?"

## Design Pillars

1. **Reward curiosity, not grinding.** Each act is short, about 2–5 minutes.
   Walking left should get you somewhere fast.
2. **Every act ends on a payoff.** We ship one act at a time, so each slice
   needs a satisfying cliffhanger, never a dead end.
3. **The style breaks on purpose.** Each act shifts the Digital Sketchbook look
   (sketch → blank paper → glitch → cracked glass → **real 3D** → warm final
   watercolor). Inside the simulation (Acts 1–3) and in the ending it stays
   hand-drawn. **The exception is the real world** (Acts 4–5): chunky
   low-poly 3D with flat/toon shading and thick ink outlines, stylised rather
   than realistic. It's the first thing that isn't a drawing, on purpose. The
   outlines tie it back to the sketchbook's ink so it never reads as stock
   assets. See [`../../design/style-guide.md`](../../design/style-guide.md).
4. **A way out until the page falls into black.** Through Act 3 the header
   Back button, the static-mode switch and `Esc` keep working, so a recruiter
   who wanders in is never stuck. From the black screen on there is no way
   out (see Act 4): anyone who got that far is invested.
5. **Inspired by, never a copy.** The references below are feelings. Characters,
   enemies, art and music are ours.

## Entry Points

| Entry                                | Role                   | Notes                                                                                                                                                                                                                                                    |
| ------------------------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Hobbies room, far left**           | Main entrance          | The current bug becomes the feature. Today the physics world is wider than the drawn room, so the player can walk off either side. Make the **left** side a disguised collision bug that opens onto the void. Fix the **right** side so it stays a wall. |
| **Street, left of the `START` sign** | Hint / second entrance | The sign is at `x=60`, at the world edge, so the street needs negative-x space. Possible uses: a hint ("the edges aren't finished yet"), a smudge that's only visible later, or a quick return to the void once you've found it.                         |

Reference points in the current code: `src/game/scenes/hobbies/runtime/HobbiesScene.ts`
(world and camera bounds), `src/game/core/console/hobbiesLogic.ts` (headless
clamp `60..900`), `src/game/core/console/content/overworldSpots.ts`
(`OVERWORLD_SIGNPOST.x = 60`).

## The Arc

### Act 1 — Walk Off the Page

It should look like a bug, not a secret. The left wall is inked as solid as the
right one, but it has no collision: walk into it and you just walk through, like
a collision bug. The camera, which was framed on the room, comes unstuck and
follows you out. Outside is blank paper, and the walk is long (about 20 seconds).
There are only a few marks, far apart: "TODO: fix left wall collision" in the
margin, a coffee ring, a placeholder labelled `ROOM_END`. Danilo says very little, three short thoughts across the whole walk: "...did I
just walk through the wall?" just outside, "...this wasn't finished." near the
first mark, and "Wait. There's something up ahead." before the end. The only sound is a sparse pencil scratch per few steps.

**Payoff:** something glowing faintly on the floor at the very end of the page.

### Act 2 — The Debugging Tools

The artifact is a **Debugging Tools** kit: a beat-up developer's toolbox lying
on the floor where the room should end. The only tool inside is a **hammer**
(decided 2026-11-26, #139: the screen destroyer plays well with one tool;
reopen only if a later act needs a new one).

The kit goes in the Backpack as a **hidden slot**. It does _not_ count toward the
`START` sign's `Secrets found: n/6` tally, so nothing gives the secret away.
As built (#148): the toolbox lies on the floor in a pulsing glow. Press `E` and
it lifts toward Danilo, a latch clacks, and he thinks "...debugging tools?
There's a hammer in here." Only a dusty footprint is left. The Backpack lists
the kit under "Off the page", outside the tally, and owning only the kit is
enough to show the Backpack button. Like every item today, it lasts for the
session.

**Point of no return (#149).** Before the pickup, a clear video-game style
warning asks whether to go on. Confirming is a choice: from here **the
simulation is broken** and you are escaping it.

**Cliffhanger (#149):** the pickup becomes a short cinematic (input locked,
the camera zooms in on Danilo and the toolbox, then back out). Then an
**alert** goes off. The way back right is shut, and the only way is to keep
walking **left**.

As built (#149):

- The warning is the one place the sketchbook flips: an **ink card with
  cream lettering**, hazard tape top and bottom, and a misprinted
  `POINT OF NO RETURN` title. It reads as the page itself warning you. "Leave it"
  has focus first, so a stray `Enter` is safe. `Y`/`N` answer directly. `Esc`
  is left to the scene and leaves the room, as everywhere else. It is a
  scene-owned panel (`pointOfNoReturn` in the scene UI registry), so screen
  readers get an `alertdialog`.
- Confirming collects the kit immediately (leaving mid-cinematic still
  counts). The player is held through the controller only, so `Esc` stays
  live. The camera zooms to 1.7× on Danilo and the toolbox (0.7 s), the kit
  lifts, and the camera eases back. Then the alert: an `OUT_OF_BOUNDS` rubber
  stamp slams across the top of the view, the view's border is re-scribbled
  every ~110 ms for ~3 s, a graphite-scratch alarm whoops six times, the
  camera shakes once, and an ink **scribble wall** draws itself in just right
  of the toolbox spot, with the page beyond it hatched out. Danilo: "...okay.
  That sounds bad." Reduced motion: every camera move is a cut, no shake,
  the wall and stamp appear whole, the border holds still.
- Walking into the wall: "It scribbled itself shut. No going back." (once per
  visit). Left past the toolbox spot the floor runs on as hurried dashes to a
  **torn opening** with a scratched arrow, 700 px further left. "The page
  keeps going. Left, then." #162 continues from that opening.
- **The broken simulation is owning the Debugging Tools.** Confirming the
  warning is the only way to get them, so no separate flag. A return visit
  starts just inside the wall, facing left, with the walk-in thoughts already
  spent. Geometry and copy: `src/game/core/console/content/outOfBoundsVoid.ts`.
  Headless: `interact toolbox` → `confirm` / `decline`, and `look` reports
  `escape: way back blocked`.

### Act 3 — Breakout

Danilo's vision (2026-11-25), one continuous sequence:

1. **Through the basement.** Further left the void runs into the side of the
   real **Developer Basement**, and the old exit ladder climbs up and out onto
   the street.
2. **The evil chick.** Outside, the chick that always ran away from you has
   turned **evil** and confronts you. The first hammer swing is on it.
3. **Pigeons.** More enemies dive in **from the sky**. Smashing them damages
   **the screen itself**: cracks across the whole browser viewport, over the
   game _and_ the portfolio chrome.
4. **Screen destroyer.** The player keeps wrecking the screen, freely, layer
   after layer: the header peels, building labels slide, the drawn street
   falls away, even Danilo's own drawing can vanish, as the illusion of the
   screen comes apart. New enemies keep coming in from the screen edges. It
   is inspired by desktop-destruction toys, never a copy.

As built (#162, step 1):

- Walking into the torn opening (past its middle) fades the view into its ink
  and lands Danilo at the **right wall of the real Basement**, facing left,
  through a ragged hole showing the blank page. It scribbles itself shut
  behind him (ink with alert-red strokes). "...my basement? Someone's been
  through here." Pressing into the shut hole: "Shut behind me too. Up the
  ladder, then." (once per visit). Reduced motion: cuts, the hole is shown shut.
- **Ransacked den** whenever the simulation is broken: desk tipped up, the
  corkboard hanging off one pin with its notes on the floor, the shelf
  leaning over, papers everywhere, claw marks, a `WANTED` poster and red
  circles scrawled around "his PC" and "his bench". Same stations, same spots.
- **Alert red** is now a shared escape token
  (`src/game/sharedSceneRuntime/escapeAlert.ts`, rules in the style guide);
  the #149 stamp and barrier use it.
- Every way out of the Basement during the escape (ladder, `Esc`, header Back)
  comes up through the **hatch onto the street** (x=280), where #163 takes
  over.
- Geometry and copy: `src/game/core/console/content/outOfBoundsBreakout.ts`.
  Headless: walking `go left` into the opening enters the basement; `look`
  reports `escape: ransacked, way back blocked`; `interact exit` lands on the
  street at the hatch.

As built (#163, steps 2–3):

- **The street in alarm** (Danilo's direction, 2026-11-26): whenever the
  simulation is broken, the street is a prison-break manhunt at night. It is
  still the street: a dark wash over the same drawing, a hatched moon,
  searchlight cones sweeping up behind the buildings, an ink helicopter
  circling with a spotlight that sweeps near Danilo, and every door crossed
  with red, ink-chevroned tape. The helicopter's nav light is a steady red,
  never blinking. Reduced motion: lights and helicopter hold still.
- **Lockdown.** Nothing on the street can be entered (buildings, the hatch,
  the CRT, the litter pile, the chick talk) and `H`/`Esc` no longer go back to
  Hobbies: "Taped shut. Nowhere to hide now." Static mode is the way out. So a
  later Hobbies visit can't happen any more during the escape.
- **The evil chick.** Up the hatch (once Danilo has landed), the street chick
  is waiting, 2.4× its size, hackles up, a scribble of rage over its head and
  an alert-red eye under a hard ink brow (its conversation portrait gets the
  same eye). Two lines, Danilo's "...is that chick bigger than I remember?",
  then it stalks him and taunts ("run, little doodle." / "bring it."), and
  pecks (Danilo's direction, 2026-11-26: the chick attacks too): an alert-red
  `!` for ~0.6 s, then a beak-first lunge that lands within ~108 px (`PECK!`,
  Danilo: "It PECKED me!"), then ~0.9 s before the next. A parried peck
  leaves it dizzy (ink stars) for ~1.5 s.
- **The hammer** is drawn in Danilo's hand during the escape, with two moves
  (Danilo's direction, 2026-11-26): **Swing** (`F`) connects only with an
  enemy in front of him, the way he last walked (the shared player movement
  now keeps the last facing when idle, in every scene); **Parry** (`R`) raises
  a ~0.28 s guard (an ink arc in front of him, hammer held across), ~0.65 s
  apart. A swing flattens **everything** in reach at once, so a pack can go
  down in one hit. Docked **Swing** and **Parry** touch buttons (`streetFight` scene
  panel, which also shows the wave, what's left and the crack count). Whiffs
  are free. Stepped swing, no easing.
- **Waves** are raccoon hordes of 5, 8 and 12 (Danilo's direction,
  2026-11-26: "a bunch of enemies coming at me, so I can just keep stomping
  them"), with 1, 2 and 3 pigeons overhead. Raccoons pour in from alternating
  sides of the view, one every ~0.45 s, at most 5 on the street at once.
  **Pigeons are not required** (same direction): they're harassment, not
  progress. Knocking one out never counts or cracks the screen, and another
  circles in ~2.2 s later; when the last raccoon drops they finish their pass
  and leave. A fight is 26 smashes: the chick plus 25 raccoons.
  - **Pigeons** cross the sky left and right, alternating between a low lane
    150 px above the street (jump and swing) and a high one 230 px up (out of
    the hammer's reach). As they approach they lob an egg or a dropping on an
    arc that lands where Danilo is standing at that moment: standing still
    gets hit, stepping aside dodges, and a miss splats on the street and dries
    off the page. **Parried**, it flies back (`RETURN!`) and knocks out the
    pigeon that dropped it (`BOINK!`), or the nearest one if that's gone; that
    is the only way to bring down the high lane (never needed).
  - **Raccoons** (the dumpster raccoons from the litter-pile secret) rush in
    along the ground, stop beside Danilo (each at its own distance, so a pack
    doesn't stack on one spot), raise a claw with an alert-red `!`
    over their heads for ~0.56 s (the tell; the claw carries it in
    greyscale), swipe, back off and come again. Stepping back during the tell
    dodges it; a **parried** swipe (`PARRY!`) leaves the raccoon dizzy, stars
    over its head, for ~1.5 s.
  - **Getting hit** (`PECK!` / `SWIPE!` / `SPLAT!`) knocks
    him back and stuns him for ~0.5 s (no walking, swinging or parrying,
    hammer dropped), then ~0.6 s where nothing else lands, so hits never
    chain. Nothing flickers. There is no game over: the fight only ends by
    winning.
  - Hits read muted: `BONK!`/`THWACK!`/`WHACK!` in ink, the chick folds flat
    and skids off, pigeons tumble with crossed-out eyes and feathers,
    raccoons spin off into the gutter.
- **Screen damage layer** (`src/game/shell/ScreenDamageLayer.tsx`, mounted in
  `src/App.tsx` so it stays over the interactive shell, Static mode and the
  mode picker alike): one SVG over the whole viewport (`fixed`, `z-[70]`, `pointer-events-none`,
  `aria-hidden`), above the game, the header and overlays. Cracks live in the
  bridge (`screenDamage.cracks`: a viewport point plus a seed), one per
  smash (chick or raccoon; never a pigeon), so they survive scene changes and static-mode round trips; the
  fight's progress derives from their count. Each crack breaks out of a
  **screen corner**, every other one on the side of the hit and the rest
  across from it, so 26 spread over all four (top or bottom at random; Danilo's
  direction: keep the middle visible), with an impact star, broken rings and
  branching runs inward that stop at a clear oval in the middle
  (`CRACK_CLEAR_CENTER` in `src/game/shell/screenCracks.ts`), so the street
  and Danilo always stay visible. Ink with a pale edge so it reads on cream
  and on dark. The newest runs out in 260 ms; reduced motion shows it whole,
  and there is no camera shake. #164 grows from this layer.
- Pure progress and copy: `src/game/core/console/content/outOfBoundsStreetFight.ts`
  and `streetFightLogic.ts`. Phaser: `StreetFight.ts` plus
  `street/fight/` (one module per enemy). Headless: `swing` (or `smash`,
  optionally `swing pigeon|raccoon`, which is what the live scene sends;
  `swing pigeon` during the waves never moves the fight on); the
  headless fight is discrete, so nothing attacks back there. `look` reports
  `alarm: doors taped shut` and `fight: <phase> wave=… enemies left=…
  screen damage=… cracks`.

As built (#164, step 4). This build also answered #143 (how the screen
destroyer should feel): Danilo played it and liked it, so the layer order and
counts below are the design, not a placeholder.

- **Starts** ~2.2 s after the last raccoon drops, with Danilo's "It's all just
  a drawing. ...what if I keep hitting it?". From then on every smash lands on
  the page: a click or tap anywhere (a scene UI action from the `streetFight`
  panel; anything that is a control keeps its own click; the cursor is a
  hammer), or a hammer swing that meets nothing (it hits the glass in front of
  him, `CRASH!`). Each one leaves a **dent** where it landed
  (`screenDamage.dents` in the bridge, drawn by `ScreenDamageLayer` in the
  interactive mode only, so static mode stays readable).
- **Enemies keep coming** from the edges of the view: raccoons (at most 3 at
  once, one every ~1.5 s) and 2 pigeons. Clicking one or swinging at it knocks
  it out and counts as a smash; pigeons count now.
- **Layers**, outside in (`SCREEN_LAYERS` in
  `src/game/core/console/content/outOfBoundsScreenDestroyer.ts`):
  1. **header**, 6 smashes: the Dev/Backpack group tilts off its corner and
     drops away; Static mode stays, held by an alert-red tape strip and lifted
     above the dents and the black (`src/game/shell/screenDestroyerHeader.ts`).
  2. **labels**, 6: the building labels slide and tilt down their buildings,
     then tumble off.
  3. **street**, 10: the street's own drawing stops moving (helicopter,
     searchlights, props), and everything drawn before the fight falls away
     front to back into blank paper (`street/StreetComingApart.ts`).
  4. **danilo**, 6: Danilo is erased from the top down; then the hammer goes.
- **Falling into black.** With the last layer gone the fight stops and the
  shell fades to black (1.4 s; a cut under reduced motion) and shows the
  **Unplugged** screen (`src/game/shell/UnpluggedHandOff.tsx`): "...signal
  lost. Somewhere that isn't a drawing, something opens its eyes." Its only
  button, **Wake up** (focused), opens the real world (Act 4,
  `RealWorldTakeover`, ADR-0007). The Static switch is gone from here on.
- Reduced motion: no animated sliding, falling or tearing, no shake, no fade.
  Nothing flashes.
- Headless: after the fight, `swing` hits the page; `look` reports
  `screen: breaking=<layer> (<hits>/<of>) layers left=…`, then
  `screen: black — every layer gone, unplugged`. 28 swings reach the end.

**Payoff:** once everything is destroyed, the page falls into black and the
game becomes the first-person 3D alien ship (Act 4).

_Implementation note:_ the screen damage is an app-shell layer above the
Phaser canvas and portfolio UI (Architect check first). It must never block
the way out, must honor `prefers-reduced-motion`, and must avoid strobe/flash
patterns.

Acts are numbered as built: Acts 1 and 2 play as one sequence (milestone
OB1). The old Acts 4–6 (Unplugged, Sneak, Armed) merged into one act, and the
old Acts 7–8 became Acts 5–6 (#140, 2026-11-26).

### Act 4 — The Ship

**Real life is 3D.** The whole portfolio, hammer included, was a drawn
simulation. The hammer was a virtual tool and stays behind. The real world is
first-person 3D for full immersion: low-poly toon with ink outlines (pillar 3).

**Look (#144 prototype, Danilo 2026-11-26).** Leaning towards **ink linework
over flat colour**: crisp edge lines on flat, barely shaded fills (prototype
look **C**). Mood references: _Sable_ and _Rollerdrome_ (feelings only, never
their art). Runner-up: **A**, toon shading with ink outlines. Out: **B**, flat
low-poly with no lines. The lines are what keeps the real world related to the
sketchbook.
Round 2 (2026-11-26): Danilo likes look C done as a **screen-space ink
pass** (edges found from depth and normals, so the line keeps one weight at
any distance, with a slight hand-drawn wobble and thinning into the
distance). The line should be a little thinner than the prototype's 2.2 CSS px
(about 1.8). Palette: **Night lab** (deep navy walls and floor, near-black
ink, warm yellow light strips, pink aliens). A dark ship suits the escape:
the light strips are where you get seen, the dark between them is where you
hide. Real-phone check passed: it runs, and the touch controls feel good.
The look is settled (#144 closed).

The act has two halves, a stealth escape and then an action fight (Danilo,
2026-11-26). Mood references: _Thief_, _Deus Ex_ and _Vampire: The
Masquerade – Bloodlines_ for the first half (light and shadow, vents, rooms
that feel like real places and more than one way through them), _Doom_ for
the second (pace and swagger only: stuns, no gore).

**The aliens are non-lethal** (Danilo, 2026-11-26). They look insect-like and
frightening, but they never kill: getting downed always leaves Danilo alive,
and their blasters only stun (so does Danilo's, once he has one). They keep
humans plugged in for containment and study: they are trying to understand
why humans are aggressive, what makes them commit evil and destroy other
species. The lab is that research. Hint at it quietly and never spell it out:
you always wake up unharmed, the lab is clinical rather than cruel, and the
aliens react to things goofily. Until the true ending ships, failure here is
"Try again" from the latest checkpoint. The alternate failure path that
builds on this (the Coop, `disconnect --all`) is parked in #173.

1. **Wake up.** The black screen's only button is **Wake up** (it replaces
   "Back to the portfolio" in `UnpluggedHandOff`; the click is the gesture
   the browser needs for fullscreen and pointer lock). Danilo is unplugged
   from the VR rig, a pod in an alien **lab**: the portfolio was the
   simulation running inside it. ~30 s.

   **The lab** (Danilo, 2026-11-26; built in #171). The aliens research the
   human mind here, and it should feel like it: a little horror, never gore
   or jump-scare flashes. It is small and full rather than big and empty,
   and laid out like a room someone works in, in zones (Danilo: "it should
   make sense layout-wise"):
   - **The ward** (north): the pods in a row against the wall, cabled up
     into a ceiling tray that runs to a life-support rack in the corner. One
     lamp on the rack is dark: Danilo's.
   - **The watch desk** (west): under the two monitors, a researcher's chair
     turned to them, a keypad, a drink, a bin of crumpled sketches.
   - **The procedure bay** (middle): the operating table over a floor drain,
     an instrument cart beside it, the specimen shelves on the nearest wall.
     A cable runs from the crown on the table to the desk.
   - **The way out** (south): the locked door with delivery crates beside
     it, and the vent half hidden behind a stack of crates in the corner.
   - The way from Danilo's pod to the door and to the vent stays clear.
     Heavy things stand against walls; the middle is open floor.
   - **Other people are still plugged in**: asleep in pods of glowing fluid,
     reading helmets on their heads, wires up into the pod caps.
   - **Danilo's pod is smashed open from the inside**: jagged glass teeth,
     shards across the floor, a puddle, the torn-out plug. It mirrors the
     hammer smashing the page.
   - **Ties to the old world**: a monitor shows the drawn street with the
     screen destroyer's cracks and black hole (the aliens were watching), and
     a sketchbook page lies on the watch desk under a lamp, being studied (a
     stick figure swinging a hammer).
   - **The research**: an operating table with straps, a pronged
     mind-reading crown and a surgical lamp; shelves of brains in jars (one
     jar holds an eye); a second monitor reads a sleeping brain.
   - **Mood**: fog in the far corners, a strip light that sags now and then,
     a slow red breath on the locked door. All motion stops under reduced
     motion.
   - **Toys**: a rubber ball, a crumpled page and a squishy brain can be
     picked up and thrown (click or `E`; a Grab / Throw button on touch).
     They bounce off walls and furniture and land on the table, the desk and
     the crates.

2. **Escape the lab**, ~1–2 min, no weapon. Crawl through **vents** and keep
   to the **shadows**: in the light strips patrolling aliens see you, in the
   dark they don't. You can't fight back yet. Getting caught resets to a
   nearby checkpoint, never the start of the act.

   **The vent** (Danilo, 2026-11-26; first slice). The locked door stays
   locked (aiming at it says so); the vent is the only way out for now.
   - **Pry**: aim at the grate behind the crates and hold click / `E` / the
     touch **Pry** button for about a second. It bends out and rattles, and
     springs back if you let go too soon. Then it tips flat onto the floor.
   - **Crawl**: walking into the open vent ducks you down on your own (no
     crouch button). Inside you crawl, slower, hands busy (no throwing);
     backing out stands you up again. The duct is dark sheet metal, and the
     dark closes in (the fog comes near).
   - **Where it leads**: a short duct through the wall, a bend north in the
     dark, then east over two grates in the duct floor. The pattern (Danilo,
     2026-11-27): the first gap only shows you what you're up against, a
     later one lets you through.
   - **The first grate: the glimpse.** Bolted from below. Warm light comes up
     through its slats from a lit ship corridor. An alien researcher in a lab
     coat walks along below, stops right under you with its antennae working
     the air, then walks on. Its first round is cued: it waits out of sight
     until you crawl into the duct, arrives as you reach the grate, and stays
     under it until you've had a few seconds' look, so the first look down
     always finds it. After that it comes round every so often. Mood only: it doesn't see you and doesn't look
     up (yet). Under reduced motion it just stands there.
   - **The second grate: the way down.** On over the corridor wall and a bend
     south: this grate pries off like the first one (hold) and falls through.
     Crawl over the hole and you drop into the **storeroom**: a short fall,
     landing on your feet. There's no climbing back up.
   - **The storeroom** (#145): a cramped, dim supply closet next to the
     corridor, where the ship's cleaners live. Racks down the back (spare
     light tubes and bulbs; boxes, pod fluid, folded spare lab coats), a mop
     bucket and a pegboard of tools by the door, drums of cleaning fluid, a
     cleaner's cart left out in the middle, and two cleaning drones asleep on
     their docks, standby lights breathing. One light strip at the back. Its
     door, onto the corridor, is a service door with a drone on its sign:
     aiming at it says it opens for cleaning drones. The sneaking starts here.
   - Loose things stay in the lab: crawling takes both hands, so whatever
     you're holding is put down at the vent's mouth.

   **The ship deck** (Danilo, 2026-11-28; the corridor slice). The storeroom
   is one room of a deck laid out like a working place, rooms off the
   corridor Danilo looked down into from the vent (same corridor, same strips,
   the researcher on the same round):
   - **Out of the storeroom: wake a drone.** Aim at a sleeping drone and hold
     (click / `E` / the touch **Wake** button). Its lens lights up, it rolls
     off its dock to the door, the door slides open for it (lamp red to
     green), and it trundles out on its cleaning beat up and down the
     corridor. The door stays open; the other drone sleeps on.
   - **The rooms.** The corridor runs north–south past the storeroom. North:
     the crew's **break room** (mess table, drinks machine, lockers). West,
     alongside the corridor: the dim **laundry** (washers, racks of spare lab
     coats with one officer's jacket among them). South: the **security
     post**, where both ways meet: the officer's desk with camera screens
     (one shows the lab, Danilo's pod empty), lockers, and the **armoury
     cage** in the south wall with the stun blaster behind bars.
   - **More than one way through.** Straight down the lit corridor past the
     researcher, or the long way round: north behind it, through the break
     room and the dark laundry, in along the lockers.
   - **Light and shadow.** Each strip throws a pool of light on the floor,
     drawn exactly as the rules have it. An alien sees you far off in a pool
     and only right up close in the dark, and only ahead of it (unless you
     walk into it). Dark spots: between the corridor's pools, the storeroom
     doorway, a nook at the corridor's south end. A light gem at the bottom
     of the screen shows how lit you are.
   - **Two aliens.** The **researcher** from the glimpse (lab coat): a drink
     at the machine, down the corridor, a sniff under the grate, a look
     towards security, and back. The **officer** (police-style uniform, cap,
     holstered blaster): stands at the security desk, watches the corridor
     door, the room, then the camera screens for a while (the window to
     slip past). The officer makes up its mind faster.
   - **Being seen is readable.** A faint pink cone on the floor shows where
     each alien looks, as long as it would spot you where you stand now. Seen,
     a "?" fills over its head; past a third it stops and turns to look; full
     is "!". Out of sight, it calms down and goes back to its round.
   - **Caught.** "It saw you. A sting in the neck, then nothing…" and **Try
     again** puts you at the latest checkpoint (the storeroom, then the
     laundry or the corridor nook), the aliens back on their rounds, the door
     still open. Non-lethal, as always.
   - **The end of OB3: the blaster, out of reach.** Reach the cage: the
     blaster hangs there behind bars, charged and humming, locked in. "To be
     continued."
   - Dev: `?mode=interactive&oob=unplugged&rw=deck` wakes up in the storeroom.

   **After the blaster** (Danilo, 2026-11-28): OB4 stays Deus Ex-like. The
   blaster opens a way, it doesn't close the others: every encounter keeps a
   sneaking route, a hacking or tool option (a computer that turns cameras
   off, distractions), waiting it out, and going in blasting. The instinct
   will be to shoot; letting a player notice that, and that they didn't have
   to, quietly answers what the aliens are studying.

   **The aliens** (Danilo, 2026-11-26). A bit scary, never goofy blobs, and
   never gore: upright insect people, part ant, part machine. A long chitin
   head on a thin neck, glowing compound eyes, hooked mandibles, elbowed
   antennae that twitch, a hunch, claws for hands and a small second pair
   folded at the chest, reverse-jointed legs, the gaster pushing out behind,
   and steel bolted on (a plate and a red lens over the skull, cables into
   the collar). They wear what their job needs: lab coats for researchers,
   officer or police uniforms for the armed ones.

3. **The gun.** A chunky alien stun blaster (from a weapons locker or a
   stunned guard). The sneak flips into a hunt: from here on it's fast,
   loud action.
4. **Fight through the ship**, ~3 min, first-person, to the **control room**,
   and take the ship over. The aliens are the ones who kept Danilo in the
   simulation and want Danilo back in the pod: the insect people above, the
   armed ones in uniform. The blaster **stuns**: they seize up, spin and
   flop over with a buzz. No blood, nobody dies (same tone as Act 3's knock-outs). Each
   alien shows an alert-red tell before it shoots.

**No way out from here.** The game takes the full viewport: no portfolio
header, no static switch, no Back. Real fullscreen where the browser allows
it; on iPhone (Safari only allows fullscreen for video) it fills the visible
viewport with the shell hidden. The browser always lets `Esc` drop
fullscreen and pointer lock, so `Esc` **pauses** behind a "click to keep
going" card. Reloading the page is the only reset (nothing is saved across
reloads yet), and it isn't advertised.

**Controls.** Desktop: WASD + mouse look (pointer lock), click to fire.
Touch: left thumb stick to move, drag on the right to look, a fire button.
Comfort: no head bob, a steady crosshair, no camera shake or kick under
reduced motion. Enemies are slow and readable.

**Cliffhangers.** OB3 ends with the blaster spotted out of reach; OB4 ends
sitting in the pilot seat.

### Act 5 — Flight Home

From the pilot seat the game becomes an **invaders-style arcade shooter**
home to Earth: your ship along the bottom, waves of enemy ships coming down,
power-ups, one boss. It stays in the real world's low-poly toon 3D with a
fixed camera behind or above your ship (gameplay on a flat playfield), and
reuses the 3D setup from Act 4. Touch: drag to steer, auto-fire.

Enemies are the same insect aliens in chunky saucers and drones, with one big
**mothership** boss. No chickens or birds: that keeps us clearly away from
_Chicken Invaders_, and the evil chick and pigeons belong to the simulation.
Wave patterns, power-ups and the boss are our own. Ends with Earth in view.

### Act 6 — Homecoming (True Ending)

A non-interactive or lightly interactive scene, framed as the **afterlife**:
Ridge was the memory of the old life, and this is the moment everyone gets to
share. The ship lands, the art turns back into warm sketch and watercolor, and
you sit on a porch or rooftop playing guitar with **Cicka** and an unnamed girl
with long black hair (your wife). No names appear anywhere. Let the player strum along with the
existing guitar synth if that works. Then: _Thank you for playing._ Credits roll
in handwriting.

## Inspiration Boundaries

These are moods and mechanics. Don't recreate their content.

| Reference                                                             | What we take                                                                                      | What we don't                                             |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Out-of-bounds / "edge of the map" secrets in games like _Prey_        | The unease of walking where you shouldn't be                                                      | Anything specific to that game                            |
| Desktop-destruction toys                                              | The joy of hitting the screen and seeing damage pile up                                           | Their tools, UI or art                                    |
| _Sable_, _Rollerdrome_                                                | Ink linework over flat colour for the real world                                                  | Their characters, palettes, compositions or UI            |
| _The Matrix_-style "wake up unplugged"                                | The reveal that the portfolio was a simulation                                                    | Iconography, pods-as-shot, green code rain, characters    |
| First-person shooters (_Half-Life_-style immersion)                   | Being inside the world, the gun in your hands                                                     | Their enemies, weapons, levels, look or story             |
| _Thief_-style stealth                                                 | Hiding in shadow, crawling through vents (Act 4 escape)                                           | Its world, characters, levels, look or story              |
| _Deus Ex_, _Vampire: The Masquerade – Bloodlines_                     | Rooms laid out like real places that tell a story; a vent as the other way through (Act 4 escape) | Their worlds, characters, factions, levels, look or story |
| _Doom_-style action                                                   | Fast, loud fighting once armed (Act 4 fight)                                                      | Its demons, gore, weapons, levels or look                 |
| Invaders-style arcade shooters (_Space Invaders_, _Chicken Invaders_) | Waves coming down, power-ups, a boss                                                              | Their enemies (no chickens), waves, theme or art          |

## Technical Questions to Settle Early

- **3D in a Phaser 2D app.** Working default (#140): a **lazy-loaded
  Three.js chunk** for Acts 4–5, fetched only once the page falls into black
  so the portfolio's first load is unaffected. A Phaser/canvas raycaster fits
  wireframe corridors but not free-look first person with low-poly enemies,
  outlines and a cockpit. It's a new dependency: confirmed or rejected by the
  Architect review plus the #144/#145 prototype.
- **Progress saving.** Save each act as it's reached so a return visit picks up
  where you left off. Use the existing session/item store, not ad-hoc
  `localStorage`.
- **Mobile.** Each act needs a touch control scheme (tap-to-smack in Act 3;
  twin-stick first person in Act 4 and drag-to-steer in Act 5, see above).
- **Bundle size.** Load each act lazily. The portfolio's first load must stay
  light.
- **Accessibility.** No strobe flashes, screen shake toned down under reduced
  motion, a skip option for the cinematic.

## Decisions

- **Ridge is the old life; the true ending is the afterlife.** Ridge, seen
  through the street CRT, is a _memory of an old life_. The true ending is an
  afterlife or heaven where everyone shares one great moment together. That
  makes it a reunion that answers the Cicka Threshold Farewell, not a
  contradiction of it. Ridge canon stays as it is.
- **Nobody in the ending is named.** It's a cinematic moment with no name
  cards. The wife is an unnamed girl with long black hair, and Cicka is shown,
  not introduced.
- **Anyone can reach the true ending for now.** Walking left out of the Hobbies
  room is the only requirement. No street secrets or Ridge clear needed.
- **Later: unlock through the computer.** The walk-out can be gated behind a
  cheat typed on the basement computer (working idea: `getmeout`) that
  "writes an intentional bug" into the room. It belongs to a later group of
  **subconscious lore secrets** reached through the computer. Not part of the
  first build.
- **The artifact is the Debugging Tools kit.** It holds one tool, the hammer
  (#139), and sits in a hidden Backpack slot outside the `n/6` tally. It lies
  on the floor at the end of the void.
- **Picking it up is the point of no return.** A warning asks first. After
  confirming, the simulation is broken and the escape is the game's state;
  through Act 3 the header Back button, static mode and `Esc` still leave the
  page.
- **Acts 2–3 are one sequence** (2026-11-25): alert, basement, ladder, evil
  chick, pigeons, screen destroyer, then the 3D ship. This replaced the
  earlier "ink bugs crawl over the page" idea.
- **Six acts, four milestones left** (#140, 2026-11-26). Unplugged, Sneak and
  Armed merged into **The Ship**; the arcade shooter stays (invaders-style,
  in 3D); Homecoming is its own small milestone.
- **Real life is 3D.** The hammer was virtual and stays in the simulation;
  the real world is first-person low-poly toon 3D, insect-like aliens
  (scary, not too scary), a stun blaster, no gore.
- **No way out after the black.** From the **Wake up** prompt on, the game
  takes the full viewport with no exit UI; `Esc` pauses, reload resets. Act 3
  keeps its Static switch as built.
- **Build it in chunks.** Planning and work items live in GitHub. Open
  decisions go on a wayfinder map, build slices become issues, one milestone
  at a time.

## Open Questions

1. ~~**The Debugging Tools kit.**~~ Settled (#139): just the hammer.
2. ~~**Scope ceiling.**~~ Settled (#140): six acts, see the Milestone Plan.
3. **Street left side.** A hint only, a second entrance, or a shortcut back?
4. **The afterlife and the alien ship.** How do the ship and the "back to
   Earth" landing read once the ending is heaven? Is the ship the passage
   between life and afterlife?

## Milestone Plan

Each milestone ships on its own and ends on a cliffhanger. Turn each one into
GitHub issues (vertical slices) when it's ready to build.

| #       | Milestone         | Ships                                                                                                                                                                             | Cliffhanger                 |
| ------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| **OB0** | Paper pass        | Answer the open questions above. Throwaway prototype: low-poly toon first-person look + Three.js fit (#144, #145; the screen-destroyer feel was settled by the #164 build, #143). | —                           |
| **OB1** | Walk Off the Page | Hobbies left void (Act 1), right-edge bug fixed, Debugging Tools pickup + hidden Backpack slot, point of no return                                                                | Alert; the way back is shut |
| **OB2** | Breakout          | Through the ransacked Basement up its ladder to the street, evil chick + pigeons with the hammer, screen cracks, layered screen destroyer (Act 3)                                 | Falling into black          |
| **OB3** | Unplugged         | "Wake up" + fullscreen, pod wake-up, the 3D foundation (lazy Three.js chunk, renderer, controls, pause), no-weapon lab escape through vents and shadows (Act 4, steps 1–2)        | The blaster, out of reach   |
| **OB4** | Armed             | Stun blaster, first-person fight through the ship to the control room (Act 4, steps 3–4)                                                                                          | Sitting in the pilot seat   |
| **OB5** | Flight Home       | Invaders-style shooter in low-poly 3D, waves, power-ups, mothership boss (Act 5)                                                                                                  | Earth in view               |
| **OB6** | Homecoming        | Ending scene, credits, true-ending flag (Act 6)                                                                                                                                   | — the end                   |
| —       | Street hint       | Negative-x space left of the `START` sign, first hint                                                                                                                             | "The edges aren't finished" |

The street hint is independent and can ship any time after OB1. Everything else is in order.

**Later, not scheduled:** the computer cheat (`getmeout`) that gates the walk
out, plus the wider subconscious lore secrets on the basement computer.
