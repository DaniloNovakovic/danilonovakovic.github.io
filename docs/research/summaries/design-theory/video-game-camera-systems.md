# Video Game Camera Systems

> Status: research summary / design-theory reference.
> Source: Gemini deep research shared by Danilo on 2026-05-30.
> This is not a current Sketchbook Ridge spec. Use it as comparison material
> when designing or reviewing camera behavior.
> If a camera direction becomes accepted canon, move that decision into
> `docs/game-design/ridge/` rather than treating this summary as the source of
> truth.

## Why This Matters For Ridge

Sketchbook Ridge is currently a 2D Phaser project, so the most useful parts of
the camera research are not first-person or 3D orbit mechanics. The useful
takeaways are the player-comfort rules that generalize across camera types:

- The camera should support the player's immediate spatial task, not simply
  follow the avatar transform.
- Small vertical movements should usually be damped or ignored, especially
  during jumps, steps, and uneven-ground traversal.
- The viewport should bias toward player intent so the player sees hazards,
  routes, exits, and rewards before committing.
- Camera behavior and level layout are one system. A level that requires a
  blind jump is often a camera/layout problem before it is a player-skill
  problem.
- Debugging tools should expose active camera mode, bounds, dead zones,
  look-ahead, trigger volumes, and world limits.

## Useful Ridge Candidate: 2.5D Sketchbook Diorama

The most promising reference direction from this research is not pure
side-scroller and not true isometric. It is a **2.5D sketchbook diorama camera**:
side-view interaction simplicity with shallow staged depth, authored camera
zones, and foreground/background paper layers that make each area feel like a
small handmade set.

Treat this as reference synthesis, not canon. If adopted, the current Ridge
game-design docs should define the actual camera contract.

Potential fit:

- **Bridge**: frame the hill edge, Cicka's toy car, blueprint table, and
  unfinished crossing as a readable paper construction set.
- **Concert**: present crowd, street facades, stage edge, and musician-side nook
  as a compact town-block diorama rather than a flat corridor.
- **Dance Festival**: use shallow plaza depth so the shuttle, operations table,
  service gate, lantern lines, and dance floor can all be legible anchors.
- **Relay Threshold**: lock into a quiet sunset tableau after **Sit and Play**,
  then hold the empty spot after Cicka leaves instead of chasing motion.

Avoid defaulting to true isometric unless a deliberate prototype proves it is
worth the added movement, depth-sorting, collision, touch-control, and tiny-Cicka
readability cost. Pure isometric risks making Ridge feel more like a tactical
map than an intimate sketchbook route.

## Camera Model Taxonomy

| Camera model | Core mechanics | Good for | Main risks |
| --- | --- | --- | --- |
| First-person | Camera locked near the character's sensory origin | Precise aiming, close inspection, embodiment | Limited peripheral awareness, motion sickness, weak rear awareness |
| Over-the-shoulder | Close asymmetric third-person framing | Ranged action, stealth, character visibility | Poor foot visibility and depth judgment for platforming |
| Orbital third-person | Variable camera offset around a target | 3D traversal, melee, platforming | Collision, occlusion, manual rotation burden |
| Fixed cinematic | Triggered static viewpoints | Horror, authored composition, narrative beats | Disorienting input changes and abrupt cuts |
| Isometric / orthographic | Fixed high-angle projection without perspective scaling | Tactical readability, diorama style, strategy | Reduced intimacy, rotation disorientation, weak distance cues |
| 2D side-scroller | Camera constrained to a 2D plane | Platforming, Metroidvania traversal, readable jumps | Blind hazards if framing and level layout disagree |

## 2D Camera Patterns

### Camera Window / Dead Zone

Instead of centering the player every frame, define a box inside the viewport.
The camera only moves when the player pushes against that box.

Use this when:

- Jump arcs should not cause constant camera bob.
- The player needs stable framing for precise platforming.
- Short local movement should feel like avatar motion, not world motion.

Design note: the vertical window can be wider than the horizontal window so
normal jumps do not drag the camera up and down. The camera can recenter only
after landing or after the player reaches a sustained climb.

### Directional Look-Ahead

Bias the camera toward the player's velocity, aim, or intended route. This keeps
the avatar on the trailing side of the viewport and gives more forward sight.

Use this when:

- The route has hazards, gaps, interactables, or enemies ahead.
- The player is moving quickly enough that centered framing feels late.
- A scene wants a stronger sense of downhill/uphill momentum.

Risk: look-ahead can feel jittery if it flips immediately when the player taps
left/right. Smooth or threshold it so small corrections do not yank the frame.

### Vertical Intent Rules

Treat vertical motion differently depending on intent.

| Situation | Better camera behavior |
| --- | --- |
| Normal jump | Hold or lightly damp vertical tracking |
| Long fall or drop | Bias downward early enough to preview landing risk |
| Climb or sustained ascent | Move camera after the player reaches the upper window |
| Landing | Ease back to the local composition rather than snapping |

### Off-Screen Fairness

Camera policy should define what can happen outside the viewport.

- Do not let enemies or hazards require reactions the player cannot see.
- If an off-screen threat matters, telegraph it with audio, particles, screen
  edge indicators, or level composition before it becomes dangerous.
- Avoid spawn logic that repeatedly respawns enemies just because the camera
  crosses a boundary during backtracking.

## Adaptive Camera Modes

Hybrid games often switch cameras based on task. In a 2D Ridge context, that
does not need to mean switching perspective. It can mean switching camera
profiles:

| Mode | Possible profile |
| --- | --- |
| Exploration | Wider dead zone, soft look-ahead, stable parallax |
| Precision platforming | Tighter horizontal control, restrained vertical motion |
| Dialogue or tribute beat | Locked or gently staged composition |
| Chase / urgency | Stronger forward bias, faster catch-up, wider preview |
| Interior / tight space | Reduced look-ahead and narrower world bounds |

Treat these as authored camera states with clear triggers and blend rules.
Camera cuts should be reserved for moments where a blend would be misleading or
too slow.

## Implementation Heuristics

- Keep camera parameters explicit: target, viewport bounds, dead zone,
  look-ahead, smoothing, zoom, world bounds, and active profile.
- Blend between camera profiles in parameter space instead of snapping raw
  camera coordinates.
- Ignore high-frequency avatar jitter before it reaches the camera target.
- Keep parallax subordinate to gameplay readability.
- Ensure trigger zones have visible authoring/debug overlays during
  development.
- When a route feels unfair, inspect the camera frame and level composition
  before increasing tutorial text or player stats.

## Debug Checklist

A useful camera debug overlay should expose:

- Active camera profile or mode.
- Camera world position and target position.
- Dead-zone/window rectangle.
- Look-ahead vector and current bias.
- World bounds and room bounds.
- Trigger volumes that change camera profile.
- Parallax layer offsets.
- Recent camera cuts or blends.

## Ridge Follow-Up Questions

- Which Ridge areas need authored camera profiles instead of default traversal?
- Should bridge, concert, dance festival, and relay ending each define camera
  intent alongside spatial layout?
- Do manual "look up/down" controls belong in exploration, accessibility, or
  debug-only tooling?
- Should the playability tester include camera-window and blind-jump checks in
  smoke paths?
