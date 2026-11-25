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
the other side it turns into a different game. You wake up unplugged aboard an
alien ship, sneak, arm up, take the ship, fly it home in an arcade shooter, and
land in a quiet closing scene: playing guitar with Cicka and your wife.
_Thank you for playing._ That is the **true ending**.

The fun comes from escalation and surprise. Each act should make the player
ask "wait, how far does this go?"

## Design Pillars

1. **Reward curiosity, not grinding.** Each act is short, about 2–5 minutes.
   Walking left should get you somewhere fast.
2. **Every act ends on a payoff.** We ship one act at a time, so each slice
   needs a satisfying cliffhanger, never a dead end.
3. **The style breaks on purpose.** Each act shifts the Digital Sketchbook look
   (sketch → blank paper → glitch → cracked glass → wireframe → arcade → warm
   final watercolor). It should still look hand-drawn, never like stock assets.
   See [`../../design/style-guide.md`](../../design/style-guide.md).
4. **Always leave a way out.** The header Back button, the static-mode switch
   and `Esc` keep working, so a recruiter who wanders in is never stuck.
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
on the floor where the room should end. The first tool inside is a **hammer**.
More tools may come in the screen-destroyer phase (Act 3).

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
   real **Developer Basement**. A new **staircase** there climbs up and out onto
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

**Payoff:** once everything is destroyed, the page falls into black and the
game becomes the first-person 3D alien ship (Act 4).

_Implementation note:_ the screen damage is an app-shell layer above the
Phaser canvas and portfolio UI (Architect check first). It must never block
the way out, must honor `prefers-reduced-motion`, and must avoid strobe/flash
patterns.

### Act 4 — Unplugged

A black screen, then a slow wake-up. Danilo was in a pod; the whole portfolio
was a simulation. You are aboard an alien ship drawn as **pencil wireframe 3D**:
graph-paper corridors, ballpoint-blue construction lines.

### Act 5 — Sneak

A short first-person or isometric stealth section. Patrol drones sweep their
view cones, you duck behind crates, and you pick up a keycard or part. You
can't fight back yet. Getting caught resets you to a nearby checkpoint, never
the start of the act.

### Act 6 — Armed

You find a weapon (a doodled blaster, or a Debugging Tool gets upgraded). A short
corridor fight flips the stealth: now you hunt the drones. It ends at the
bridge.

### Act 7 — Take the Ship

You sit in the pilot seat and the game turns into a **vertical arcade shooter**
home to Earth: waves of enemies, power-ups, one boss. For enemies, reuse our
own cast: Act 3's evil chick and pigeons, alien drones, maybe a callback to the doodle chicks
from Chick Magnet. _Don't_ recreate another game's enemies, waves or look.

### Act 8 — Homecoming (True Ending)

A non-interactive or lightly interactive scene, framed as the **afterlife**:
Ridge was the memory of the old life, and this is the moment everyone gets to
share. The ship lands, the art turns back into warm sketch and watercolor, and
you sit on a porch or rooftop playing guitar with **Cicka** and an unnamed girl
with long black hair (your wife). No names appear anywhere. Let the player strum along with the
existing guitar synth if that works. Then: _Thank you for playing._ Credits roll
in handwriting.

## Inspiration Boundaries

These are moods and mechanics. Don't recreate their content.

| Reference                                                      | What we take                                            | What we don't                                          |
| -------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------ |
| Out-of-bounds / "edge of the map" secrets in games like _Prey_ | The unease of walking where you shouldn't be            | Anything specific to that game                         |
| Desktop-destruction toys                                       | The joy of hitting the screen and seeing damage pile up | Their tools, UI or art                                 |
| _The Matrix_-style "wake up unplugged"                         | The reveal that the portfolio was a simulation          | Iconography, pods-as-shot, green code rain, characters |
| Classic vertical shooters                                      | Waves, power-ups, a boss                                | Another game's enemies, waves or theme                 |

## Technical Questions to Settle Early

- **3D in a Phaser 2D app.** Options: (a) a faked pseudo-3D/raycaster drawn in
  Phaser or canvas, which stays in-stack and fits the wireframe look;
  (b) a lazy-loaded Three.js chunk used only for Acts 4–6. Recommendation: try
  (a) with a throwaway prototype first, because the wireframe-pencil look
  hides how simple it is.
- **Progress saving.** Save each act as it's reached so a return visit picks up
  where you left off. Use the existing session/item store, not ad-hoc
  `localStorage`.
- **Mobile.** Each act needs a touch control scheme (tap-to-smack works well;
  stealth and the shooter need thought).
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
- **The artifact is the Debugging Tools kit.** It starts with a hammer, more
  destruction tools may come later, and it sits in a hidden Backpack slot
  outside the `n/6` tally. It lies on the floor at the end of the void.
- **Picking it up is the point of no return.** A warning asks first. After
  confirming, the simulation is broken and the escape is the game's state;
  the header Back button, static mode and `Esc` still leave the page.
- **Acts 2–3 are one sequence** (2026-11-25): alert, basement, staircase, evil
  chick, pigeons, screen destroyer, then the 3D ship. This replaced the
  earlier "ink bugs crawl over the page" idea.
- **Build it in chunks.** Planning and work items live in GitHub. Open
  decisions go on a wayfinder map, build slices become issues, one milestone
  at a time.

## Open Questions

1. **The Debugging Tools kit.** Whether the screen-destroyer phase adds tools
   beyond the hammer, and what each one does.
2. **Scope ceiling.** Eight acts is a lot. Which acts could merge (5+6, for
   example) without losing the escalation?
3. **Street left side.** A hint only, a second entrance, or a shortcut back?
4. **The afterlife and the alien ship.** How do the ship and the "back to
   Earth" landing read once the ending is heaven? Is the ship the passage
   between life and afterlife?

## Milestone Plan

Each milestone ships on its own and ends on a cliffhanger. Turn each one into
GitHub issues (vertical slices) when it's ready to build.

| #       | Milestone         | Ships                                                                                                                   | Cliffhanger                 |
| ------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| **OB0** | Paper pass        | Answer the open questions above. Throwaway prototypes: pseudo-3D look, screen-destroyer feel.                           | —                           |
| **OB1** | Walk Off the Page | Hobbies left void (Act 1), right-edge bug fixed, Debugging Tools pickup + hidden Backpack slot, point of no return      | Alert; the way back is shut |
| **OB2** | Breakout          | Basement staircase to the street, evil chick + pigeons with the hammer, screen cracks, layered screen destroyer (Act 3) | Falling into black          |
| **OB3** | Unplugged & Sneak | Wake-up + pencil-wireframe ship + stealth section (Acts 4–5)                                                            | Weapon spotted behind glass |
| **OB4** | Armed             | Weapon + corridor fight to the bridge (Act 6)                                                                           | Sitting in the pilot seat   |
| **OB5** | Flight Home       | Vertical shooter + boss (Act 7)                                                                                         | Earth in view               |
| **OB6** | Homecoming        | Ending scene, credits, true-ending flag (Act 8)                                                                         | — the end                   |
| —       | Street hint       | Negative-x space left of the `START` sign, first hint                                                                   | "The edges aren't finished" |

The street hint is independent and can ship any time after OB1. Everything else is in order.

**Later, not scheduled:** the computer cheat (`getmeout`) that gates the walk
out, plus the wider subconscious lore secrets on the basement computer.
