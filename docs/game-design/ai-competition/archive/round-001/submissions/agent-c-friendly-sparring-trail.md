# Agent C Proposal: The Friendly Sparring Trail

## Pillars

- **Calm world, spicy bursts**: relaxed exploration between short skill scenes.
- **Combat as conversation**: Muay Thai and reactive combat are rhythm, spacing, confidence, and playfulness.
- **Mastery without gatekeeping**: generous defaults, optional shiny goals.
- **Goofy first, deep second**: deadlines, laundry piles, TODO brains, bananas, and gym bags are fair game.
- **Scene-owned and indie-scoped**: each mini-game is a Phaser scene, with React overlays only for menus, drafts, results, and readable text.

## Overworld Loop

The overworld becomes a compact sketch hike through a hand-drawn neighborhood/hill. The player wanders, notices a landmark or jittering object, enters a mini-game or tiny quest, earns a traversal/social unlock, and returns with a new route, shortcut, or joke available.

There is no fall damage, no world timer, and no harsh fail state outside mini-games.

## Progression

- **Focus Wraps** soft-gate traversal with dash, wall hop, air kick, glide-drift, or sketch-climb stamina.
- **Hobby Stamps** mark played and mastered mini-games.
- **Keepsakes** unlock rooms, shortcuts, or dialogue.
- **Dojo Board** in the Hobbies room shows discovered games, best scores, and mastery goals.

Suggested arc: get Glasses, discover Potassium Slip, earn Circuit, power the Dojo Board, reveal hobby stations, complete any three hobby games for a rooftop trail, then complete all played stamps for the final contact/credits route.

## Mini-Game Concepts

- **Potassium Slip**: existing anchor; Circuit should feed wider progression.
- **Muay Thai Mayhem**: reactive turn sparring with Jab, Teep, Low Kick, Guard, Breathe, timed defense, Focus, and "Knee of Reasonable Scope".
- **Bagwork Beatdown**: one-minute rhythm/combo trainer around a swinging heavy bag.
- **Hollow Hobby Knight**: compact platform/combat scene with jump, dash, pogo kick, and a heal-or-blast Focus choice.
- **Calendar Clash**: micro boss rush against calendar events with readable rhythm attacks.
- **Dance Floor Footsies**: nonviolent fighting-game spacing lesson disguised as dancing.
- **Sketch Survivor**: 5-minute low-input swarm game against stressors.
- **Rooftop Rival**: friendly final spar that tests timing, spacing, and composure.

## Mobile Controls

Use scene-specific controls:

- Overworld: swipe left/right, swipe up, tap interact.
- Vertical boards: direct drag/touch.
- Combat: 2-4 large thumb buttons.
- Reactive defense: tap, hold, swipe-up.
- Platform mastery: left/right zones plus jump/dash/attack.
- Results/drafts: React overlays with large buttons.

No mini-game should require more than two simultaneous fingers.

## Implementation Scope

Recommended scene folders include `muayThaiMayhem`, `bagworkBeatdown`, `hollowHobbyKnight`, `calendarClash`, `danceFloorFootsies`, and `sketchSurvivor`.

Shared code should only appear after repeated need. A pure timing-window module might live in `src/game/core` if multiple reactive games need scoring. A Phaser-facing combat-feel runtime should wait until two scenes need the same hitstop, telegraph, and slow-motion policy.

## Risks

- Reactive timing may be too hardcore: use generous windows and optional mastery.
- Too many mini-games: build Potassium plus Muay Thai and Sketch Survivor first.
- Mobile input clutter: avoid classic fighting inputs.
- Tone mismatch: frame combat as practice and self-expression, not violence.

## Fun Thesis

The emotional arc is: wander, discover, try something silly, get better, and return to the world slightly more capable. The overworld gives curiosity and rest; mini-games give skill, rhythm, and impact.
