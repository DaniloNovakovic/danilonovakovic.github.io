// One frame of the lesson reads several judge facts per dancer; branches are the choreography.
// fallow-ignore-file complexity
import {
  BACHATA_LESSON_FOOTWORK,
  BACHATA_REST,
  bachataStepOf,
  type BachataFootwork,
  type BachataStance,
  type BachataStep,
  type ConcertGig,
  type GigJudgment,
  type GigSectionKind,
  type RidgeEmotion
} from '@/game/core/ridge';
import type { ActorNudge, DuelActorStaging } from './duelStaging';

/** World units a dancer travels per step. */
const STEP_WORLD = 8;
/** How long a step takes to land, in song ms. */
const STEP_EASE_MS = 120;
/** How long a judgment word and a stumble last, in song ms. */
export const LESSON_FLASH_MS = 460;
/** The most a nervous driver lags the count, in song ms. */
const MAX_DRIVER_LAG_MS = 190;

/** What one frame of the lesson looks like, independent of Phaser. */
export interface LessonFrame {
  timeMs: number;
  /** 0..1 through the current beat (0 on the beat), or null before the count. */
  beatPhase: number | null;
  /** The Profe's count-in, "5, 6, 7, 8", while it runs. */
  countIn: number | null;
  /** 1..8 within the eight once the dancing starts. */
  count: number | null;
  section: GigSectionKind | null;
  nerve: number;
  /** Most recent judged step, for the word over your head and the target flash. */
  flash: null | { step: BachataStep; judgment: GigJudgment; age: number; serial: number };
  actors: DuelActorStaging;
}

/**
 * Pure staging for the lesson. The Profe dances the chart exactly; you move
 * when you step (a missed step lands late, with a stumble); the driver
 * watches, then joins, mirroring you, a little behind the count until his
 * nerve steadies.
 */
export function stageBachataLesson(lesson: ConcertGig): LessonFrame {
  const t = lesson.timeMs;
  const { beatMs, startMs } = lesson.song;
  const beatPhase = t < 0 ? null : (t % beatMs) / beatMs;
  const countIn = t >= 0 && t < startMs ? Math.floor(t / beatMs) + 5 : null;
  const beatIndex = Math.floor((t - startMs) / beatMs);
  const count = t >= startMs && lesson.phase !== 'finished' ? (beatIndex % 8) + 1 : null;
  const section = lesson.section?.kind ?? null;
  const nerve = lesson.hype;
  const last = lesson.lastHit;
  const flash =
    last && t - last.timeMs < LESSON_FLASH_MS
      ? { step: bachataStepOf(last.lane), judgment: last.judgment, age: t - last.timeMs, serial: last.serial }
      : null;
  const stumbling = flash?.judgment === 'miss';
  const finished = lesson.phase === 'finished';
  const joined = section === 'together' || section === 'flourish' || finished;

  const teacher = footworkAt(lesson, t);
  const player = playerFootwork(lesson, t);
  const driverLag = (1 - nerve) * MAX_DRIVER_LAG_MS;
  const driver = joined ? footworkAt(lesson, t - driverLag) : null;
  const pulse = beatPhase === null ? 0 : Math.abs(Math.sin(Math.PI * beatPhase));

  return {
    timeMs: t,
    beatPhase,
    countIn,
    count,
    section,
    nerve,
    flash,
    actors: {
      'dance-teacher': dancer(teacher, 1, 'playful'),
      player: {
        ...dancer(player, 1, stumbling ? 'surprised' : lesson.combo >= 8 || finished ? 'playful' : 'determined'),
        dy: stumbling ? -Math.round(4 * (1 - flash!.age / LESSON_FLASH_MS)) : 0
      },
      // Facing you, he mirrors: your left is his right.
      driver: driver
        ? {
            ...dancer(driver, -1, driverMood(nerve, stumbling, finished)),
            dy: stumbling ? -3 : 0
          }
        : { dx: 0, dy: Math.round(-pulse * 1.2), emotion: nerve > 0.5 ? 'curious' : 'thoughtful' }
    }
  };
}

function driverMood(nerve: number, stumbling: boolean, finished: boolean): RidgeEmotion {
  if (stumbling) return 'surprised';
  if (finished || nerve > 0.7) return 'playful';
  return nerve > 0.45 ? 'determined' : 'thoughtful';
}

interface Eased {
  from: BachataFootwork;
  to: BachataFootwork;
  /** 0..1 through the step. */
  progress: number;
}

/** The chart's footwork at song time `t`: the last step that should have landed by then. */
function footworkAt(lesson: ConcertGig, t: number): Eased {
  const notes = lesson.song.notes;
  let index = -1;
  for (let i = 0; i < notes.length && notes[i]!.timeMs <= t; i += 1) index = i;
  if (index < 0) return { from: BACHATA_REST, to: BACHATA_REST, progress: 1 };
  return {
    from: BACHATA_LESSON_FOOTWORK[index - 1] ?? BACHATA_REST,
    to: BACHATA_LESSON_FOOTWORK[index] ?? BACHATA_REST,
    progress: clamp01((t - notes[index]!.timeMs) / STEP_EASE_MS)
  };
}

/** You move when you step: to the footwork of the step you just danced (or missed). */
function playerFootwork(lesson: ConcertGig, t: number): Eased {
  const last = lesson.lastHit;
  if (!last) return { from: BACHATA_REST, to: BACHATA_REST, progress: 1 };
  return {
    from: BACHATA_LESSON_FOOTWORK[last.noteId - 1] ?? BACHATA_REST,
    to: BACHATA_LESSON_FOOTWORK[last.noteId] ?? BACHATA_REST,
    progress: clamp01((t - last.timeMs) / STEP_EASE_MS)
  };
}

function dancer(eased: Eased, mirror: 1 | -1, emotion: RidgeEmotion): ActorNudge {
  const offset = eased.from.offset + (eased.to.offset - eased.from.offset) * easeOut(eased.progress);
  // Mid-step the feet are apart; they land in the step's stance.
  const stance: BachataStance = eased.progress < 1 && eased.from.offset !== eased.to.offset ? 'open' : eased.to.stance;
  return {
    dx: Math.round(mirror * offset * STEP_WORLD),
    dy: 0,
    emotion,
    dance: mirror === 1 ? stance : mirrorStance(stance)
  };
}

function mirrorStance(stance: BachataStance): BachataStance {
  if (stance === 'tap-left') return 'tap-right';
  if (stance === 'tap-right') return 'tap-left';
  return stance;
}

function easeOut(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
