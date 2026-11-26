/**
 * Out of Bounds, Act 3 steps 2–3 (#163): the street fight, and the street in
 * alarm. Up through the hatch while the simulation is broken, the street is a
 * manhunt at night: every door is taped shut, and the chick that always ran
 * away is waiting, evil now. The hammer from the Debugging Tools smacks it,
 * then the street comes for Danilo in waves: pigeons crossing the sky and
 * bombing him with eggs and worse, and the dumpster raccoons (whose paw prints
 * were always on the street) rushing in from the sides to swipe at him.
 * Every smash cracks the screen itself.
 *
 * The whole fight is one number: how many smashes have landed. Smash 1 is the
 * chick; the waves follow. The shell keeps the cracks (one per smash), so the
 * fight resumes from them after any remount. Getting hit only knocks Danilo
 * back and stuns him for a moment: there is no game over.
 * Design source: docs/game-design/secrets/out-of-bounds.md (Act 3).
 */

export type StreetFightEnemy = 'pigeon' | 'raccoon';

interface StreetFightWave {
  pigeons: number;
  raccoons: number;
}

/** The waves after the chick, in order. */
const STREET_FIGHT_WAVES: readonly StreetFightWave[] = [
  { pigeons: 3, raccoons: 0 },
  { pigeons: 2, raccoons: 2 },
  { pigeons: 3, raccoons: 2 }
];

const waveSize = (wave: StreetFightWave) => wave.pigeons + wave.raccoons;
/** Smashes that finish the fight: the chick, then every enemy of every wave. */
export const STREET_FIGHT_TOTAL_SMASHES = 1 + STREET_FIGHT_WAVES.reduce((sum, wave) => sum + waveSize(wave), 0);

export type StreetFightPhase = 'chick' | 'waves' | 'cleared';
export type StreetFightTarget = 'chick' | StreetFightEnemy;

export interface StreetFightProgress {
  phase: StreetFightPhase;
  /** 1-based wave; 0 before the waves and after the last one. */
  wave: number;
  /** Enemies still to smash in the current wave. */
  leftInWave: number;
  /** Everything still to smash: the chick (if standing) and every wave. */
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
    const size = waveSize(wave);
    if (hitInWaves < size) {
      return { phase: 'waves', wave: index + 1, leftInWave: size - hitInWaves, enemiesLeft, screenCracks: landed };
    }
    hitInWaves -= size;
  }
  return { phase: 'cleared', ...between };
}

/** The enemies of a wave, ground first, so a resumed wave keeps the raccoons in it. */
export function streetFightWaveEnemies(wave: number, leftInWave: number): StreetFightEnemy[] {
  const shape = STREET_FIGHT_WAVES[wave - 1];
  if (!shape) return [];
  const all: StreetFightEnemy[] = [
    ...Array<StreetFightEnemy>(shape.raccoons).fill('raccoon'),
    ...Array<StreetFightEnemy>(shape.pigeons).fill('pigeon')
  ];
  return all.slice(0, Math.max(0, leftInWave));
}

/** What the next smash lands on headless (the live scene says what it hit), or null once it's over. */
export function streetFightTarget(smashes: number): StreetFightTarget | null {
  const progress = streetFightProgress(smashes);
  if (progress.phase === 'cleared') return null;
  if (progress.phase === 'chick') return 'chick';
  return streetFightWaveEnemies(progress.wave, progress.leftInWave)[0] ?? 'pigeon';
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
/** Clawed by a raccoon / hit by something a pigeon dropped. */
export const STREET_FIGHT_HURT_THOUGHTS = { swipe: 'Ow!', dropping: 'Ew. EW.' } as const;

/** The street fight and the alarm, for the headless console. */
export const OUT_OF_BOUNDS_STREET_TEXT = {
  alarm:
    'The street is dark. Searchlights sweep the buildings, a helicopter circles overhead, and every door is taped shut with red tape.',
  confront: `The chick that always ran from you is waiting, bigger now, eyes red. "${EVIL_CHICK_LINES[0].text} ${EVIL_CHICK_LINES[1].text}" The hammer from the Debugging Tools is in your hand: swing.`,
  lockdown: 'Taped shut, like everything else tonight. Nowhere to hide.',
  chickSmashed: 'You swing the hammer. BONK: the evil chick folds flat and skids off. The screen cracks.',
  wavesIncoming:
    'Wings overhead, and claws on the pavement: pigeons crossing the sky, dropping eggs, and raccoons coming.',
  pigeonSmashed: 'THWACK: a pigeon tumbles out of the air. Another crack spreads across the screen.',
  raccoonSmashed: 'WHACK: a raccoon spins off into the gutter. Another crack spreads across the screen.',
  nextWave: 'More of them: wings from the sky, raccoons from both ends of the street.',
  cleared:
    'The last of them drops. The street goes quiet, and the screen is a web of cracks, right across the page and the portfolio around it.',
  whiff: 'You swing at the air.',
  noHammer: 'You have nothing to swing.'
} as const;
