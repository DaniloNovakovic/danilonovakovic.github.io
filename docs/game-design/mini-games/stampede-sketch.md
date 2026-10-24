# Stampede Sketch

> Mini-game design brief and Ridge reward contract.

Stampede Sketch is the first new opt-in mini-game prototype for Sketchbook
Ridge. On the current street it ships as **Chick Magnet**: a chick just past
Experiences starts it while glasses are off, the first clear grants and equips
the glasses, and wearing glasses makes that chick run away. The arena is a
flock that gets meaner over a 2:30 run: chicks, then broody hens, then a
rooster that charges. You pick one starting weapon. Scraps come slowly and
are at least 18 seconds apart; each draft is another weapon or a meaner
version of one you have. Bad selfie hits random nearby chicks, bad breath
damages the cone in front of you, bad smell is a circle around you, and fake
glasses drops the nearest chicks. You keep each one. Closing returns to the street. In the active Ridge pre-production route, it is optional
side fun, not required Living Proof for the first ending.

## Core Purpose

Protect one calm picnic-blanket patch from a stampede of runaway ideas.

The enemies are not monsters and they are not trying to kill Danilo. They are
overexcited ink ideas, interruptions, deadlines, pings, and notebook creatures
that want to crowd the page. The player is keeping one tiny kind space open
long enough for the page to calm down.

## Player Fantasy

The player is a blanket guardian: small, scrappy, and mobile, protecting a calm
sketchbook picnic space through movement rather than direct manual attacking.
The blanket stays in the arena as a protected landmark; the player may carry a
small tether, corner string, charm, or pencil that visually links them to it.

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
- **Spells:** weapons you keep. The run starts with one chosen weapon. Bad selfie
  damages random nearby chicks. Bad breath damages the cone in front of where
  you are looking. Bad smell damages a circle around you. Fake glasses damages
  the nearest chicks, and the character wears them while that weapon is in the kit. Scrap drafts are spaced at least 18 seconds apart and
  offer either a new weapon or a stronger rank of one you already have. Hens
  arrive after the opening and take two hits. A rooster arrives later, takes
  three hits, and charges.
- **XP pickups:** captured ink drops, sticky notes, or useful scraps.
- **Upgrades:** better ways to organize, soften, or survive pressure.
- **Damage/contact:** smudges, page noise, crowding.
- **Win:** the blanket stays calm until the timer ends.
- **First-clear reward:** the street glasses, owned and equipped. A repeat
  clear does not grant another pair. The earlier Ridge stamp and glide pip
  candidate is not awarded by this clear.

## First-Slice Art Direction

Keep the generated enemy designs. They already fit the premise.

For the first player asset, create a Stampede-specific guardian sprite sheet:

- `idle-down`
- `idle-up`
- `idle-side`
- `move-down-1`
- `move-down-2`
- `move-up`
- `move-side`
- `smudged`
- `tether-guard`
- `respawn`

Use transparent final PNGs, fixed frame dimensions, center origin, and a
separate FX layer for noisy sketch marks when possible.

## Blanket Aggro Rule

Stampede should keep the chase-first survivor feel, but the blanket should make
the scene more specific than a pure survival arena.

Default rule:

- enemies inside the player's guardian radius prioritize the player
- enemies outside that radius may drift toward the calm patch
- returning near the calm patch should pull attention back to the player
- blanket crowding increases page noise or calm loss
- direct player contact still creates smudge/contact feedback

This lets the player kite, collect, and dodge like a survivor game while still
making the mission "protect the calm patch," not merely "do not get touched."
