# Out of Bounds — The Fourth-Wall Secret Arc

> Status: **idea / pre-production**. Nothing here is shipped or canon until
> it's built and written into [`../player-manual.md`](../player-manual.md).
> Live slice status belongs in GitHub Issues, not here.

## Pitch

Players usually walk right, so the secret is to the left. If you keep walking
left in the Hobbies room you leave the drawn room and walk into the blank,
unfinished edge of the sketchbook. Something is waiting out there. You pick it
up, and the portfolio starts to come apart: bugs crawl over the screen, you
smash them, the _screen itself_ cracks, and you break out of the game. On the
other side it turns into a different game. You wake up unplugged aboard an
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
first mark, and "Wait. There's something up ahead." before the pedestal. The only sound is a sparse pencil scratch per few steps.

**Payoff:** a glowing toolbox on a pedestal made from a sketchbook spine.

### Act 2 — The Debugging Tools

The artifact is a **Debugging Tools** kit: a beat-up developer's toolbox sitting
where the room should end. The first tool inside is a **hammer**. The rest of
the kit unlocks over Act 3, and each tool is a different creative way to wreck
the screen in the spirit of a desktop-destruction toy (ideas to settle: a
stapler that pins bugs, a highlighter that burns lines, a rubber-band
slingshot, a find-and-replace that swaps chunks of the page, a `rm -rf`
eraser).

The kit goes in the Backpack as a **hidden slot**. It does _not_ count toward the
`START` sign's `Secrets found: n/6` tally, so nothing gives the secret away.
**Cliffhanger for this slice:** you swing the hammer once in the void, a hairline
crack appears _across the browser viewport_ (not the game canvas), then fades.
"...huh."

### Act 3 — Screen Breaker

With the Debugging Tools equipped, back on the street or in any room, **bugs** start
showing up: small ink beetles and glitch sprites that crawl over the whole page,
on top of the canvas _and_ the React portfolio chrome. Click or tap to smack
them, switching between the kit's tools as they unlock. Every hit leaves damage on the "screen" (cracks, ink splats, pixels
knocked loose, a corner of the header peeling away). As damage builds, the
portfolio itself gives way. Building labels slide, the header text falls over.

**Payoff:** at enough damage, the glass shatters inward and you fall through the
hole. This is the fourth-wall moment. Treat it like a boss fight against the
website.

_Implementation note:_ this is an app-shell React overlay layer above the Phaser
canvas and portfolio UI. It is not a Phaser scene. It must pause cleanly, honor
`prefers-reduced-motion`, and avoid strobe/flash patterns.

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
own cast: Act 3's ink bugs, alien drones, maybe a callback to the doodle chicks
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
  destruction tools come later, and it sits in a hidden Backpack slot outside
  the `n/6` tally.
- **Build it in chunks.** Planning and work items live in GitHub. Open
  decisions go on a wayfinder map, build slices become issues, one milestone
  at a time.

## Open Questions

1. **The Debugging Tools kit.** Which tools beyond the hammer, how each one
   wrecks the screen, and when each unlocks.
2. **Scope ceiling.** Eight acts is a lot. Which acts could merge (5+6, for
   example) without losing the escalation?
3. **Street left side.** A hint only, a second entrance, or a shortcut back?
4. **The afterlife and the alien ship.** How do the ship and the "back to
   Earth" landing read once the ending is heaven? Is the ship the passage
   between life and afterlife?

## Milestone Plan

Each milestone ships on its own and ends on a cliffhanger. Turn each one into
GitHub issues (vertical slices) when it's ready to build.

| #       | Milestone         | Ships                                                                                                  | Cliffhanger                        |
| ------- | ----------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------- |
| **OB0** | Paper pass        | Answer the open questions above. Throwaway prototypes: pseudo-3D look, screen-crack overlay.           | —                                  |
| **OB1** | Walk Off the Page | Hobbies left void (Act 1), right-edge bug fixed, Debugging Tools pickup + hidden Backpack slot (Act 2) | One crack across the real viewport |
| **OB2** | Street hint       | Negative-x space left of the `START` sign, first hint                                                  | "The edges aren't finished"        |
| **OB3** | Screen Breaker    | App-shell bug/damage layer, portfolio chrome falling apart, shatter transition (Act 3)                 | Falling into black                 |
| **OB4** | Unplugged & Sneak | Wake-up + pencil-wireframe ship + stealth section (Acts 4–5)                                           | Weapon spotted behind glass        |
| **OB5** | Armed             | Weapon + corridor fight to the bridge (Act 6)                                                          | Sitting in the pilot seat          |
| **OB6** | Flight Home       | Vertical shooter + boss (Act 7)                                                                        | Earth in view                      |
| **OB7** | Homecoming        | Ending scene, credits, true-ending flag (Act 8)                                                        | — the end                          |

OB2 is independent and can ship any time after OB1. Everything else is in order.

**Later, not scheduled:** the computer cheat (`getmeout`) that gates the walk
out, plus the wider subconscious lore secrets on the basement computer.
