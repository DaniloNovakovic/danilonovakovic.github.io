# Stampede Sketch

Stampede Sketch is the first new opt-in mini-game for Sketchbook Ridge.

## Core Purpose

Protect one calm picnic-blanket patch from a stampede of runaway ideas.

The enemies are not monsters and they are not trying to kill Danilo. They are
overexcited ink ideas, interruptions, deadlines, pings, and notebook creatures
that want to crowd the page. The player is keeping one tiny kind space open
long enough for the page to calm down.

## Player Fantasy

The player is a blanket guardian: small, scrappy, and mobile, protecting a calm
sketchbook picnic space through movement rather than direct manual attacking.

Good player reads:

- holding a pencil, picnic pin, blanket corner, string, or small note
- guarding calm rather than fighting a war
- slightly top-down or three-quarter arena pose
- same identity as the Ridge player, but scene-specific posture
- smudged on contact, relieved on clear

Avoid:

- carrying the whole blanket, which makes the protected object ambiguous
- military, police, or combat-first framing
- horror panic, gore, or enemy malice
- generic superhero defense poses

## Enemy Intent

Stampede enemies should keep their current overexcited ink-creature language.
They chase because they want attention and page space, not because they hate the
player.

Enemy contact means the page gets crowded or the player gets smudged. Clearing
an enemy means the idea was caught, softened, redirected, or turned into useful
ink.

## Protected Object

The protected object is the picnic blanket / calm patch. It should read as a
central or near-central place worth keeping safe.

The player may visually hold a corner, strap, string, pencil, or pin that links
them to the blanket, but the blanket itself should remain a separate landmark.

## Mechanics Translation

- **Core verb:** kite.
- **Auto-attacks:** sketch tools that sort or redirect pressure.
- **XP pickups:** captured ink drops, sticky notes, or useful scraps.
- **Upgrades:** better ways to organize, soften, or survive pressure.
- **Damage/contact:** smudges, page noise, crowding.
- **Win:** the blanket stays calm until the timer ends.
- **First-clear reward:** stamp plus one glide pip for Ridge traversal.

## First-Slice Art Direction

Keep the generated enemy designs. They already fit the premise.

For the first player asset, create a Stampede-specific guardian sprite sheet:

- `idle-down`
- `idle-up`
- `idle-side`
- `move-down-1`
- `move-down-2`
- `move-up-1`
- `move-up-2`
- `move-side-1`
- `move-side-2`
- `smudged`
- `blanket-held`
- `respawn`

Use transparent final PNGs, fixed frame dimensions, center origin, and a
separate FX layer for noisy sketch marks when possible.
