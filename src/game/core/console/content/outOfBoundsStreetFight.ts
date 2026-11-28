/**
 * Out of Bounds, Act 3 steps 2–3 (#163): the street fight, and the street in
 * alarm. Up through the hatch while the simulation is broken, the street is a
 * manhunt at night: every door is taped shut, and the chick that always ran
 * away is waiting, evil now. The hammer from the Debugging Tools smacks it,
 * then the street comes for Danilo and never stops: hordes of the dumpster
 * raccoons (whose paw prints were always on the street) rushing in from both
 * sides to swipe at him, while pigeons circle overhead bombing him with eggs
 * and worse.
 *
 * The horde is endless by design (Danilo's direction, 2026-11-28): smashing
 * raccoons and pigeons is fun but goes nowhere. The way on is to hit the
 * street itself, then the screen (outOfBoundsScreenDestroyer.ts). So the
 * fight is one number: smashes that moved it on. Smash 1 is the chick; every
 * later one landed on the page. Getting hit (a peck, a swipe, an egg) only
 * knocks Danilo back and stuns him for a moment: there is no game over.
 * Design source: docs/game-design/secrets/out-of-bounds.md (Act 3).
 */

export type StreetFightEnemy = 'pigeon' | 'raccoon';

/** The chick standing, then the endless horde. */
export type StreetFightPhase = 'chick' | 'horde';
export type StreetFightTarget = 'chick' | StreetFightEnemy;

export interface StreetFightProgress {
  phase: StreetFightPhase;
}

export function streetFightProgress(smashes: number): StreetFightProgress {
  return { phase: Math.floor(smashes) >= 1 ? 'horde' : 'chick' };
}

/**
 * Raccoons smashed (live) before Danilo notices it's going nowhere, if the
 * hammer hasn't found the street yet.
 */
export const STREET_HORDE_ENDLESS_AFTER = 12;

/** The evil chick's confrontation, said once Danilo is up the ladder. */
export const EVIL_CHICK_LINES = [
  {
    speaker: 'chick',
    text: 'Well, well. Look who climbed out of his little hole.'
  },
  {
    speaker: 'chick',
    text: 'All those times I ran from you? I was getting ready. Now YOU run.'
  },
  { speaker: 'danilo', text: '...is that chick bigger than I remember?' }
] as const;

/** Danilo, when the street turns out to be a manhunt (once per visit). */
export const STREET_ALARM_THOUGHT = 'Searchlights. A helicopter. ...they’re looking for me.';
/** Trying a taped-shut door, the hatch or the way back (`Esc`) during the alarm. */
export const STREET_LOCKDOWN_THOUGHT = 'Taped shut. Nowhere to hide now.';
/** Once the horde has gone on long enough without the hammer finding anything else. */
export const STREET_HORDE_ENDLESS_THOUGHT = 'They just keep coming. ...this is going nowhere.';
/** Pecked by the chick / clawed by a raccoon / hit by something a pigeon dropped. */
export const STREET_FIGHT_HURT_THOUGHTS = { peck: 'It PECKED me!', swipe: 'Ow!', dropping: 'Ew. EW.' } as const;

/** The street fight and the alarm, for the headless console. */
export const OUT_OF_BOUNDS_STREET_TEXT = {
  alarm:
    'The street is dark. Searchlights sweep the buildings, a helicopter circles overhead, and every door is taped shut with red tape.',
  confront: `The chick that always ran from you is waiting, bigger now, eyes red. "${EVIL_CHICK_LINES[0].text} ${EVIL_CHICK_LINES[1].text}" It lunges, beak first. The hammer from the Debugging Tools is in your hand: swing.`,
  lockdown: 'Taped shut, like everything else tonight. Nowhere to hide.',
  chickSmashed: 'You swing the hammer. BONK: the evil chick folds flat and skids off.',
  hordeIncoming:
    'Claws on the pavement from both ends of the street: raccoons coming, more than you can count, and pigeons circling overhead, dropping eggs.',
  pigeonSmashed: 'THWACK: a pigeon tumbles out of the air. Another circles in to take its place.',
  raccoonSmashed: 'WHACK: a raccoon spins off into the gutter. Another one is already coming.',
  whiff: 'You swing at the air.',
  noHammer: 'You have nothing to swing.'
} as const;
