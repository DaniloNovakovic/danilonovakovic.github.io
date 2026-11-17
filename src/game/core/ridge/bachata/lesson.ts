/**
 * The Profe's One-Step Practice: the bachata basic, danced as a rhythm chart.
 *
 * The judge is the same forgiving rhythm engine as the Concert gig (pure,
 * clock-free, never fails), fed a dance chart instead of a guitar part. Lanes
 * mean feet here: step left, the hip tap on four, step right. The basic is
 * three steps and a tap each way: "one, two, three, tap; five, six, seven, tap".
 *
 * Crowd hype becomes the driver's nerve: he starts shaky and steadies as you
 * keep the count for him.
 */
import {
  compileGigSong,
  ConcertGig,
  type GigBarSpec,
  type GigChord,
  type GigGrade,
  type GigLane,
  type GigSong,
  type GigSongSpec
} from '../concertGig';

/** Lanes of the lesson, as feet. */
const BACHATA_STEPS = ['left', 'tap', 'right'] as const;
export type BachataStep = (typeof BACHATA_STEPS)[number];

export const bachataStepOf = (lane: GigLane): BachataStep => BACHATA_STEPS[lane];

/** How nervous the driver is at the first count, before anything warms him up. */
export const BACHATA_START_NERVE = 0.3;
/** Session flag for the grade of the most recent lesson, e.g. `dance_grade_great`. */
export const danceGradeFlag = (grade: GigGrade): string => `dance_grade_${grade}`;

/** One, two, three, tap — travelling left. */
const toLeft = (chord: GigChord): GigBarSpec => ({ chord, pattern: '0.0.0.1.' });
/** Five, six, seven, tap — and back. */
const toRight = (chord: GigChord): GigBarSpec => ({ chord, pattern: '2.2.2.1.' });

/**
 * "Uno, dos, tres": the Profe counts two eights with no band, then the güira
 * and bongo come in, then the driver joins, then one last eight to finish.
 */
const BACHATA_LESSON_SPEC: GigSongSpec = {
  id: 'one-step',
  bpm: 112,
  countInBars: 1,
  outroBeats: 4,
  sections: [
    { kind: 'count', bars: [toLeft('Am'), toRight('Am')] },
    { kind: 'basic', bars: [toLeft('Am'), toRight('Dm'), toLeft('E'), toRight('Am')] },
    { kind: 'together', bars: [toLeft('Am'), toRight('Dm'), toLeft('E'), toRight('Am')] },
    { kind: 'flourish', bars: [toLeft('Dm'), toRight('E')] }
  ]
};

const BACHATA_LESSON_SONG: GigSong = compileGigSong(BACHATA_LESSON_SPEC);

/** A new lesson. The judge never fails; it only grades. */
export function createBachataLesson(startNerve = BACHATA_START_NERVE): ConcertGig {
  return new ConcertGig({ mode: 'show', song: BACHATA_LESSON_SONG, startHype: startNerve });
}

/**
 * Feet after a step lands. `open` is mid-stride, `together` is the closing
 * step, and a tap points the free foot while the hip pops toward it.
 */
export type BachataStance = 'open' | 'together' | 'tap-left' | 'tap-right';

export interface BachataFootwork {
  /** Body position in steps from the dancer's mark: -1 is a full basic to the left. */
  offset: number;
  stance: BachataStance;
}

/** Where a dancer stands before the first count. */
export const BACHATA_REST: BachataFootwork = { offset: 1, stance: 'together' };

/**
 * Footwork after each note of a chart, by note id. Step, close, step travels
 * two steps; the tap after a run points the trailing foot.
 */
function bachataFootwork(song: GigSong): readonly BachataFootwork[] {
  const walk: Walk = { offset: BACHATA_REST.offset, run: 0, lastLane: null, travel: 'right' };
  return song.notes.map((note) => nextFootwork(walk, note.lane));
}

/** A dancer partway through a chart: where they are and which way they last travelled. */
interface Walk {
  offset: number;
  /** Steps in a row on the same lane: the second of three is the closing step. */
  run: number;
  lastLane: GigLane | null;
  travel: 'left' | 'right';
}

function nextFootwork(walk: Walk, lane: GigLane): BachataFootwork {
  const step = bachataStepOf(lane);
  walk.run = lane === walk.lastLane ? walk.run + 1 : 0;
  walk.lastLane = lane;
  if (step === 'tap') return { offset: walk.offset, stance: walk.travel === 'left' ? 'tap-right' : 'tap-left' };
  walk.travel = step;
  const closing = walk.run % 3 === 1;
  if (!closing) walk.offset += step === 'left' ? -1 : 1;
  return { offset: walk.offset, stance: closing ? 'together' : 'open' };
}

export const BACHATA_LESSON_FOOTWORK = bachataFootwork(BACHATA_LESSON_SONG);
