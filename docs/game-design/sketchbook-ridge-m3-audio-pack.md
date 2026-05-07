# Sketchbook Ridge M3 Audio Direction Pack

Owner mode: Django, Music / Sound Designer.

Purpose: implementation-facing audio research for the Ridge, Cicka, Potassium
acknowledgements, Stampede Sketch, and Telegraph Terrace. This is a spec pack,
not final asset direction.

Active references:

- `sketchbook-ridge-summit.md`: low-cortisol Ridge, high-spice mini-games,
  stickers/world memory, Cicka as resident.
- `style-guide.md`: off-white paper, black ink, stepped handmade feel.
- `A Short Hike`: calm musical-map layering and movement reward.
- `Vampire Survivors`: one-stick focus, rapid reward ticks, power spiral.
- `Clair Obscur`: timing is readable through combined visual and audio cues.
- `Tunic`: tiny audio motifs can imply hidden knowledge, but Ridge should avoid
  cryptography homework.
- `Ball x Pit`: dense action needs EQ thinning, instance limiting, and short
  cooldowns so the mix stays legible.

## Audio Thesis

- The Ridge should sound like a quiet sketchbook desk that learned to breathe:
  paper, pencil, muted strings, tiny room tone, and sparse handmade melody.
- Music should reward movement and landmarks with small layers, not a full
  dynamic score engine in v1.
- Mini-games can be louder and more rhythmic, but they should return the player
  to a calmer Ridge bed without emotional whiplash.
- Cicka is a resident with opinions, not a UI mascot; her sounds should feel
  close, dry, and specific.
- Timing audio can support mastery, but every Telegraph cue needs a primary
  visual read and an assist-mode fallback.

## Ridge Overworld Loop

Goal: a short seamless loop that can run for several minutes without demanding
attention. Think "desk at midnight" more than "forest soundtrack."

Palette options:

1. Paper guitar
   - Nylon or soft electric guitar harmonics.
   - Sparse two-note motif around open strings.
   - Gentle pencil taps as irregular percussion.
   - Best if the Ridge should feel warm and personal.

2. Margin piano
   - Felt piano or toy piano, very few notes.
   - Low paper-rustle bed and distant room air.
   - Occasional reversed pencil scrape into landmark stingers.
   - Best if the Ridge should feel more reflective.

3. Ink music box
   - Plucked kalimba/music-box tones with rounded attacks.
   - Tiny brushed percussion, no bright chimes.
   - Good for Manual Page and Relay Spire adjacency.
   - Risk: can become too cute if overused.

Quiet handmade tone rules:

- Keep the main loop narrow and dry; avoid cinematic reverb, huge pads, EDM
  risers, and glossy trailer percussion.
- Use imperfect attacks: finger noise, pick scrape, pencil tick, chair creak,
  soft page turn.
- Avoid animal/cartoon libraries for Cicka and avoid generic mobile-game
  reward blips for stamps.
- One memorable interval is enough. The Ridge motif should be hummable but not
  attention-seeking.

Layering rules for v1:

- Base layer: always-on low-volume loop, 45-90 seconds, no hard cadence.
- Movement layer: add a soft pulse only when walking/sprinting for more than
  1.5 seconds; fade out over 0.5-1.0 seconds when idle.
- Landmark layer: one short local motif for Relay Spire, Cicka perch, and each
  Trail Card prop. Trigger once per approach, then cooldown.
- Reward layer: stamps/manual pages add a one-shot plus a very subtle permanent
  mix change on the Ridge return, such as an extra pencil counterline.
- Do not crossfade by exact X coordinate in v1. Use explicit trigger zones and
  simple gain ramps.

## Cicka SFX Language

Cicka sounds should communicate posture, punctuation, and intent before any
translator fantasy exists.

Core kit:

- `cicka_meow_notice_01`: short, upward, curious. Used near hidden marks.
- `cicka_meow_disagree_01`: clipped and dry. Used when blocking or judging.
- `cicka_meow_satisfied_01`: low, tiny chirrup. Used after a stamp/world change.
- `cicka_purr_loop_soft_01`: optional near perch only; very quiet, not constant.
- `cicka_paw_tap_01`: paper tap with claw detail; used for paw-print marks.
- `cicka_hop_paper_01`: small body thump plus paper rustle.

Rules:

- Cicka should be mostly close-mic, mono or narrow stereo, and quieter than UI
  confirmation sounds.
- Use silence as part of the joke. A suspicious turn can be funnier than a meow.
- Keep repeated meows rate-limited; max one vocal every 4-6 seconds unless the
  player deliberately interacts.
- Translator subtitles can reinterpret the same meow later, but the raw sound
  should still work without text.

## Potassium Acknowledgement Micro-Pack

This pack acknowledges Potassium Slip from the Ridge without changing
Potassium's scene-owned run behavior, controls, boss, upgrades, or presentation.

Allowed sounds:

- Ridge Trail Card hover/open: a tiny rubbery banana squeak under the paper UI.
- Circuit acknowledgement: short contact-clean chime plus paper stamp thump.
- Potassium sign/NPC line: muted office intercom tick or clipboard clack.
- Return from Potassium with Circuit: one celebratory but restrained two-hit
  stinger, then immediately settle back into Ridge loop.

Do not:

- Replace Potassium's future in-scene SFX palette from this pack.
- Add ricochet-heavy sounds to the Ridge; Potassium owns that lane.
- Make the Circuit stinger louder than a Stampede clear.
- Add stored Ridge flags for Circuit audio. Implementation should read existing
  inventory ownership, same as the Ridge gate direction.

Suggested names:

- `ridge_potassium_trailcard_open_01`
- `ridge_potassium_circuit_ack_01`
- `ridge_potassium_sign_clack_01`
- `ridge_potassium_return_circuit_01`

## Stampede Sketch Prototype Audio

The first prototype should prove movement feel before building a dense combat
mix. Start with simple generated Web Audio or placeholder assets, then replace
only the sounds that carry the loop.

Movement-only state:

- Player move: optional soft paper-footstep tick, gated by speed and capped to
  4-6 ticks per second.
- Enemy proximity: low ink-pressure loop that fades in when the nearest swarm is
  close. Keep it tonal/noisy, not scary.
- Near miss: very short brush whoosh, cooldown 250-400 ms.
- Damage/fail: paper crumple plus low thud, no harsh buzzer.
- Timer last 10 seconds: add pencil-tap pulse, not an alarm.

Later auto-attack/enemy/XP states:

- Auto-attack fire: quiet, frequent sounds with strict instance limits. The
  player should feel attacks exist without hearing every projectile.
- Enemy hit: one family of ink splats with random pitch and 40-80 ms cooldown.
- Enemy pop: brighter paper tear/snap, limited to 2-4 overlapping instances.
- XP pickup: tiny ascending pencil/glass tick. Batch pickups into short rolls
  instead of one sound per orb when many are collected.
- Level up: paper fan + stamp thump + one clear pitch rise.
- Upgrade choice: UI should quiet the action bed by 3-6 dB while the overlay is
  open, then restore quickly.

Mix target:

- Movement and proximity should be readable at low volume.
- XP and level-up sounds can be more rewarding, but never casino-bright.
- Late-run density should be felt through rhythm and texture, not through
  unlimited overlapping SFX.

## Telegraph Timing Cue Notes

Telegraph Terrace should treat audio as a timing helper, not the truth source.
The primary cue is visual: pose, impact line, screen rhythm, or button affordance
must communicate the timing window without sound.

Cue shape:

- Wind-up: soft inhale/brush pull, starts with the visual anticipation pose.
- Ready cue: small high-mid tick or stick click 120-180 ms before the ideal
  parry point for early patterns.
- Impact point: dry slap/clack exactly on the parry frame, paired with a visual
  flash/ink contact.
- Perfect parry: crisp ring plus 80-120 ms ducked ambience, never too bright.
- Miss: muted body/paper thud, short recovery, no shame buzzer.
- Tempo gain: low upward pulse after the successful defense resolves.

Assist mode concerns:

- Assist timing can widen the input window and optionally move the ready cue
  earlier, but it should also update the visual cue. Do not make assist an
  audio-only metronome.
- Provide a reduced-cue option if repeated ticks feel stressful on mobile.
- Keep attack patterns learnable with screen muted.
- Avoid cue language where higher pitch always means "press now"; players with
  limited hearing still need shape, motion, and contrast.

## Web Audio Implementation Constraints For V1

Keep v1 boring technically so the project can ship the feel.

- Create or resume `AudioContext` only after a player gesture. Mobile browsers
  may keep it suspended until touch/click.
- Keep Web Audio adapters scene-owned at first, or under `src/game/adapters`
  once at least two scenes share the same need. Do not put browser audio code in
  `src/game/core`.
- No full dynamic music graph in v1. Use named loops, one-shots, simple gain
  ramps, and per-sound cooldowns.
- Prefer short compressed assets for final SFX (`.ogg` with fallback only if the
  target browser check proves it necessary). Generated oscillators are fine for
  prototype beeps but should not define final Ridge tone.
- Decode/load audio during scene preload or first intentional entry, not during
  per-frame update.
- Every repeating or dense cue needs an instance limit and a cooldown.
- React overlays should request audio through bridge/adapter-facing actions only
  if needed later; do not import Phaser into React overlays.
- When overlays pause a scene, action SFX should stop or duck with the scene.
  UI confirmation sounds may continue if they are overlay-owned.

Asset naming ideas:

- Pattern: `scene_subject_action_variant`.
- Use lowercase ASCII, underscores, and two-digit variants.
- Examples:
  - `ridge_loop_paper_guitar_01`
  - `ridge_layer_walk_pencil_01`
  - `ridge_landmark_relay_spire_01`
  - `cicka_meow_notice_01`
  - `stampede_enemy_pop_03`
  - `stampede_xp_roll_01`
  - `telegraph_parry_perfect_01`
  - `telegraph_attack_ready_tick_01`

Volume and mix rules:

- Start with conservative defaults: music around -18 dBFS perceived, common SFX
  around -12 dBFS, reward stingers around -9 dBFS.
- Reserve the loudest moment for clear/finale confirmations, not hover sounds.
- Duck music 3-6 dB under Trail Cards, Manual Pages, upgrade choices, and result
  overlays.
- Cicka vocals should sit below UI confirms and above ambience.
- Timing cues should sit above music but below damage/fail sounds.
- Add master mute/volume before adding per-category sliders. Per-category mix
  can wait until dense mini-games prove the need.

## Open Taste Questions For Danilo

- Should the Ridge base loop lean more "paper guitar", "margin piano", or "ink
  music box"?
- Should Cicka's raw voice be based on real Cicka-like reference recordings if
  available, or should it stay designed/abstract?
- How silly should Potassium acknowledgement be on the Ridge: almost hidden,
  obviously banana-coded, or office-law absurd?
- For Telegraph, should the ideal cue feel more like Muay Thai pad work, a
  rhythm-game click, or a manga impact beat?
- On return after a first clear, should the permanent Ridge mix change be
  noticeable, or only felt subconsciously?
