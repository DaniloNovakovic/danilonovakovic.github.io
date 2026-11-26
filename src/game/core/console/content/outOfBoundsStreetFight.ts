/**
 * Out of Bounds, Act 3 steps 2–3 (#163): the street fight, and the street in
 * alarm. Up through the hatch while the simulation is broken, the street is a
 * manhunt at night: every door is taped shut, and the chick that always ran
 * away is waiting, evil now. The hammer from the Debugging Tools smacks it,
 * then the street comes for Danilo in waves: hordes of the dumpster raccoons
 * (whose paw prints were always on the street) rushing in from both sides to
 * swipe at him, while pigeons circle overhead bombing him with eggs and worse.
 * Every raccoon (and the chick) smashed cracks the screen itself.
 *
 * The whole fight is one number: how many smashes have landed. Smash 1 is the
 * chick; the raccoons of every wave follow. Pigeons are harassment, not
 * progress: knocking one out never counts, and another circles in. The shell
 * keeps the cracks (one per smash), so the fight resumes from them after any
 * remount. Getting hit (a peck, a swipe, an egg) only knocks Danilo back and
 * stuns him for a moment: there is no game over.
 * Design source: docs/game-design/secrets/out-of-bounds.md (Act 3).
 */

export type StreetFightEnemy = 'pigeon' | 'raccoon';

interface StreetFightWave {
  /** Raccoons to smash: the wave is over when they're all down. */
  raccoons: number;
  /** Pigeons circling overhead at once; one knocked out is replaced. */
  pigeons: number;
}

/** The waves after the chick, in order. */
const STREET_FIGHT_WAVES: readonly StreetFightWave[] = [
  { raccoons: 5, pigeons: 1 },
  { raccoons: 8, pigeons: 2 },
  { raccoons: 12, pigeons: 3 }
];

/** Smashes that finish the fight: the chick, then every raccoon of every wave. */
export const STREET_FIGHT_TOTAL_SMASHES = 1 + STREET_FIGHT_WAVES.reduce((sum, wave) => sum + wave.raccoons, 0);

export type StreetFightPhase = 'chick' | 'waves' | 'cleared';
export type StreetFightTarget = 'chick' | StreetFightEnemy;

export interface StreetFightProgress {
  phase: StreetFightPhase;
  /** 1-based wave; 0 before the waves and after the last one. */
  wave: number;
  /** Raccoons still to smash in the current wave. */
  leftInWave: number;
  /** Everything still to smash: the chick (if standing) and every wave's raccoons. */
  enemiesLeft: number;
  /** Cracks across the screen so far: one per smash. */
  screenCracks: number;
}

export function streetFightProgress(smashes: number): StreetFightProgress {
  const landed = Math.max(0, Math.min(Math.floor(smashes), STREET_FIGHT_TOTAL_SMASHES));
  const enemiesLeft = STREET_FIGHT_TOTAL_SMASHES - landed;
  const between = { wave: 0, leftInWave: 0, enemiesLeft, screenCracks: landed };
  if (landed === 0) return { phase: 'chick', ...between };
  let hitInWaves = landed - 1;
  for (const [index, wave] of STREET_FIGHT_WAVES.entries()) {
    if (hitInWaves < wave.raccoons) {
      return {
        phase: 'waves',
        wave: index + 1,
        leftInWave: wave.raccoons - hitInWaves,
        enemiesLeft,
        screenCracks: landed
      };
    }
    hitInWaves -= wave.raccoons;
  }
  return { phase: 'cleared', ...between };
}

/** What's still coming in a wave: the raccoons left in it (so a resumed wave is shorter), and its pigeons. */
export function streetFightWave(wave: number, leftInWave: number): StreetFightWave {
  const shape = STREET_FIGHT_WAVES[wave - 1];
  if (!shape) return { raccoons: 0, pigeons: 0 };
  return { raccoons: Math.max(0, Math.min(leftInWave, shape.raccoons)), pigeons: shape.pigeons };
}

/** What the next smash lands on headless, or null once it's over. */
export function streetFightTarget(smashes: number): Exclude<StreetFightTarget, 'pigeon'> | null {
  const { phase } = streetFightProgress(smashes);
  if (phase === 'cleared') return null;
  return phase === 'chick' ? 'chick' : 'raccoon';
}

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
/** Once the last enemy drops. */
export const STREET_FIGHT_CLEARED_THOUGHT = 'The screen... I think I broke the screen.';
/** Pecked by the chick / clawed by a raccoon / hit by something a pigeon dropped. */
export const STREET_FIGHT_HURT_THOUGHTS = { peck: 'It PECKED me!', swipe: 'Ow!', dropping: 'Ew. EW.' } as const;

/** The street fight and the alarm, for the headless console. */
export const OUT_OF_BOUNDS_STREET_TEXT = {
  alarm:
    'The street is dark. Searchlights sweep the buildings, a helicopter circles overhead, and every door is taped shut with red tape.',
  confront: `The chick that always ran from you is waiting, bigger now, eyes red. "${EVIL_CHICK_LINES[0].text} ${EVIL_CHICK_LINES[1].text}" It lunges, beak first. The hammer from the Debugging Tools is in your hand: swing.`,
  lockdown: 'Taped shut, like everything else tonight. Nowhere to hide.',
  chickSmashed: 'You swing the hammer. BONK: the evil chick folds flat and skids off. The screen cracks.',
  wavesIncoming:
    'Claws on the pavement from both ends of the street: raccoons coming, a whole pack of them, and pigeons circling overhead, dropping eggs.',
  pigeonSmashed: 'THWACK: a pigeon tumbles out of the air. Another circles in to take its place.',
  raccoonSmashed: 'WHACK: a raccoon spins off into the gutter. Another crack spreads across the screen.',
  nextWave: 'More of them: a bigger pack of raccoons from both ends of the street, more wings overhead.',
  cleared:
    'The last of them drops. The street goes quiet, and the screen is a web of cracks, right across the page and the portfolio around it.',
  whiff: 'You swing at the air.',
  noHammer: 'You have nothing to swing.'
} as const;
