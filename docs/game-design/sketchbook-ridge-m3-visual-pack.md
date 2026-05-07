# Sketchbook Ridge M3 Visual Pack

Rade visual direction with Milena character input. This pack is implementation
guidance, not a final art bible. M4 should be able to ship rough placeholders
from these specs without waiting for polished drawings.

Active sources: `sketchbook-ridge-summit.md`, `sketchbook-ridge-milestone-plan.md`,
`docs/design/style-guide.md`, current runtime docs, scoped agent rules, and
selected research summaries for A Short Hike, Tunic, Vampire Survivors, Clair
Obscur, Divinity: Original Sin 2, and fighting game feel. Archived competition
docs are not used as active source of truth.

## Visual Thesis

- The Ridge is a playable sketchbook page: off-white paper, black ink,
  readable silhouettes, and sticker changes that make the same route feel
  remembered.
- Manga influence should appear through composition, negative space, bold ink
  shapes, and funny-sad margin notes, not expensive frame counts or detailed
  comic panels everywhere.
- Every NPC and landmark must read as a silhouette before copy explains it.
  Text is a bonus, not the first affordance.
- Art should be modular: base silhouettes, stamp overlays, paper scraps,
  paw marks, arrows, tape, and ink stains should recombine instead of requiring
  bespoke redraws.
- Roughness is allowed when it is intentional and readable. Smudgy, charming,
  and stepped beats polished-but-generic.

## Global Art Rules

- Palette: paper background plus black ink only. Value comes from line weight,
  fill density, hatching, stipple, and torn-paper masks.
- Perspective: 2D side-view with landmark silhouettes staged like a compact
  ridge trail. Background detail must not compete with interactables.
- Animation: stepped 10-12 FPS feeling. For M4, static poses plus 1-2 idle
  swaps are acceptable.
- Line hierarchy: thick outer contour for foreground interactables, medium
  contour for NPCs, thin broken lines for background and memory marks.
- Interaction affordance: wobble, paper lift, ink jitter, or sticker shimmer.
  Avoid color-dependent signals.

## NPC Silhouette Sheet Spec

Each NPC should have one neutral silhouette, one interaction pose, and one
post-reward variant. Sheet should work as black shapes on paper before details
are added.

| NPC | Silhouette Read | Function Read | Required Motifs | Avoid |
| --- | --- | --- | --- | --- |
| Cicka | Small low cat shape, tail doing the sentence, ears sharp | Resident, notice-guide, secret marker | Tail punctuation, loaf mass, tiny paws, blink slits | Mascot face, oversized UI pet, human-like talking poses |
| Ridge Guide | Upright friendly guide with soft triangle poncho or jacket, signpost lean | Orientation and gentle encouragement | Hiking stick or folded map, slightly worried posture, font-license anxiety in props | Tutorial lecturer, generic park ranger, big dialogue-tree stance |
| Potassium Compliance Officer | Clipboard rectangle plus banana-law cap, stiff side profile | Absurd authority for Potassium hints | Clipboard, tiny badge, caution tape, one pointing hand | Police realism, threatening authority, second ricochet mascot |
| TODO: AI | Training dummy with unfinished legs and label area | Telegraph or Neutral sparring partner | Box head, visible TODO tag, taped-on arms, one honorable stance | Robot complexity, full humanoid rig, lore-heavy AI design |
| Printer Oracle | Tall jammed-printer silhouette with oracle posture | Manual-page hint giver | Paper crown, accordion jam trail, prophetic output slot | Clean office printer, readable paragraphs on body, too many moving parts |

### Sheet Layout

- Canvas idea: one horizontal contact sheet with five columns.
- Row 1: pure filled silhouette at gameplay size.
- Row 2: line-art silhouette with motifs.
- Row 3: interaction pose or prop extension.
- Row 4: post-reward memory overlay, such as sticker, stamp, margin note, or
  extra paper strip.
- Minimum implementation read: silhouette still communicates identity at about
  48-64 px tall in the game camera.

## Cicka Mini Kit Spec

Cicka gets the smallest real kit because she is a resident, not a menu icon.
These can be implemented as separate placeholder textures or simple sprite
frames. Tail shape carries most emotion.

| Piece | Visual Spec | Implementation Need |
| --- | --- | --- |
| Perch | Cicka sits on a box, warm laptop vent, sign, or suspicious paper edge | Static body or sprite anchored to prop; no pathing required |
| Blink | Eyes vanish for 2-3 stepped frames; body does not move | Idle timer swap; keep subtle |
| Loaf | Body becomes a compact ink oval with ears and tail tucked | Alternate idle pose for warm/rest places |
| Stretch | Long low curve, front paws extended, tail counter-curve | One-shot idle flourish; non-blocking |
| Suspicious turn | Head/tail rotate toward player, body stays planted | Interaction acknowledgement before translator |
| Tiny hop | Small up/down hop from perch to nearby mark | Optional tween; no navigation promise |
| Paw-print mark | Three-to-four bean marks plus tiny scratch arrow | Reusable sticker/memory decal near hidden details |
| Pre-translator meow bubble | Paper-cut bubble with only "meow", punctuation, or spacing | React/Phaser text can use plain "meow"; no translated subtitle until translator beat |

### Cicka Emotion Grammar

- Tail vertical: alert, noticed something.
- Tail curled around paws: content, safe place.
- Tail horizontal point: "look there."
- Tail question mark: suspicious or teasing.
- Ears forward: curiosity.
- Ears flat: Potassium is loud or printer is doing theology again.

## Landmark Silhouette Board

Landmarks must work like map anchors from A Short Hike: the player should
understand the route by looking, not by opening a map. Each board entry needs
a far silhouette, near/interact composition, and post-reward memory overlay.

| Landmark | Far Silhouette | Near Composition | Memory / Sticker Hook |
| --- | --- | --- | --- |
| Relay Spire | Tall thin ink tower with paper antenna forks, visible early above ridge | Base sign half-decoded by manual scrap; cables look hand-taped | Signal stickers climb upward; final "sent" stamp can cap the antenna |
| Basement hatch | Low rectangular hatch, chunky handle, underground hatching below trail | Familiar current-content bridge, staged as a sketchbook trapdoor | Tape label, glasses mark, small arrow back to known work |
| Potassium hint | Banana-shaped warning sign or ricochet diagram pinned to rock | Compliance tape, clipboard note, arrow toward arcade secret | Circuit stamp, banana-law seal, rebound arc doodle |
| Stampede picnic blanket / ink swarm | Blanket diamond with small black swarm cloud rising behind it | Picnic props threatened by overexcited ink ideas; clear Trail Card prop | Glide pip sticker, swarm becomes friendlier background doodles |
| Telegraph terrace / bag | Cliff ledge with hanging heavy bag and three timing marks | Bag silhouette at readable impact height; TODO: AI may stand nearby | Rhythm ticks, tempo stamp, manual glyph scrap |
| Domino desk / elevator | Messy desk skyline with domino rectangles and small service elevator | Tape, coffee rings, pushable-looking blocks, elevator gate | Shortcut arrow, elevator permit sticker, deterministic path lines |

### Board Rules

- Far silhouettes should use fewer than three dominant shapes each.
- Near compositions can add jokes, but the interaction prop must be the darkest
  readable object in its cluster.
- Post-reward overlays should be additive. Do not swap the whole landmark if a
  sticker, scrap, hatching change, or route marker can do the job.

## Sticker / Ink-Memory Vocabulary

Stickers are the visible reward language. They should feel placed by the Ridge,
not unlocked by a menu.

| Vocabulary Item | Use | Shape Rules |
| --- | --- | --- |
| Stamp | Durable hobby clear proof | Thick border, imperfect circle/square, one bold icon |
| Sticker patch | World changed by reward | Slight paper lift shadow, peeled corner, taped edge |
| Manual scrap | Knowledge clue or Relay decoding | Torn rectangle, one diagram, one phrase max |
| Paw mark | Cicka noticed something | Tiny repeated beans, can point with scratch arrow |
| Ink memory | The world remembers a clear | Faint hatching, ghost doodle, old attempt crossed out |
| Route arrow | Backtracking or shortcut readability | Hand-drawn arrow, never neon, paired with physical prop |
| Tape strip | Patch, permit, or construction gag | Two rough strips max per landmark cluster |
| Impact burst | Parry, stamp, or Stampede hit feedback | Starburst or ink splat; use sparingly so it stays legible |
| Swarm dot | Stampede enemy/idea language | Small black flecks with varied size; cap density near player |
| Signal line | Relay/progress motif | Broken upward strokes, can connect stickers toward Spire |

### Memory Layer Priority

1. Gameplay readability: path, interactable, reward state.
2. Emotional memory: "the Ridge remembers I did this."
3. Joke layer: margin line, tiny dispute, absurd label.

If a sticker makes interaction less clear, remove or fade the sticker.

## M4 Placeholder Rules

M4 Stampede and Ridge implementation can move with placeholders if they obey
the read of this pack.

- Use simple black silhouettes on paper: rectangles, ovals, triangles, torn
  scraps, and hand-drawn arcs are enough.
- Name placeholders by role, not final-art promise, for example
  `stampede_picnic_blanket_placeholder`, `cicka_perch_placeholder`, and
  `relay_spire_silhouette_placeholder`.
- Build props as separate layers where practical: base landmark, interaction
  prop, memory sticker. This keeps M5 Ridge Memory cheap.
- Prefer one static texture plus a wobble/tint/scale pulse over incomplete
  animation sets.
- Cicka placeholder minimum: perch silhouette, blink swap, paw-print decal,
  "meow" bubble.
- NPC placeholder minimum: filled silhouette, one prop motif, one interaction
  affordance.
- Stampede placeholder minimum: picnic blanket, enemy swarm dots, XP ink drops,
  one auto-attack doodle, result stamp icon.
- Telegraph and Domino can remain inert landmark silhouettes until their scenes
  exist. Their Trail Cards should not imply playable behavior before wiring.
- Do not introduce a shared asset pipeline or generic mini-game art framework
  for M4. Scene-owned placeholders are fine until repeated pain is proven.
- Keep placeholder art monochrome and readable at mobile crop. If it only reads
  on desktop, simplify the silhouette.

## Implementation Handoff Notes

- Ridge scene owns landmark placement, triggers, and placeholder sticker layer.
- Trail Cards and Manual Pages remain React overlay surfaces; this pack only
  defines visual language they can echo.
- Durable reward state should stay small. Stickers can be derived from stamps,
  manual pages, glide pips, shortcuts, or Potassium Circuit ownership.
- Audio cues may reinforce timing and reward beats, but visual cues must carry
  the meaning without sound. Telegraph timing especially needs visual ticks plus
  any sound cue.

## Open Taste Questions For Danilo

These are taste calls, not implementation blockers.

1. Should Cicka be drawn as a near-solid black cat silhouette, or as a lighter
   outline-and-hatching cat with black tail/ear accents?
2. How weird should the Printer Oracle be: "office object being dramatic" or
   "almost religious sketchbook artifact"?
3. Should the Relay Spire feel more handmade radio tower, manga antenna shrine,
   or messy contact-device sculpture?
4. Are the stickers allowed to look intentionally childish, or should they stay
   closer to clean monochrome graphic-design marks?
5. For Stampede, should the ink swarm read more like cute overexcited ideas or
   like anxious deadline pressure with jokes around the edge?

## Verification

- Changed file path: `docs/game-design/sketchbook-ridge-m3-visual-pack.md`
- Verification run: `perl -ne 'print if /[^\x00-\x7F]/' docs/game-design/sketchbook-ridge-m3-visual-pack.md`
  returned no output, confirming ASCII-only content.
- Verification run: `git diff --check -- docs/game-design/sketchbook-ridge-m3-visual-pack.md`
  returned no output.
