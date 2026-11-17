/**
 * The Concert Crossing gig: a three-lane rhythm judge. Pure and clock-free.
 * The adapter owns time (the audio clock in the browser, explicit steps in
 * the console) and feeds it in through `advance` and `strum`, so the console
 * verdict and the played show always agree.
 *
 * Forgiving by design: the show never fails, a stray strum never drains the
 * crowd, and practice passes on its own after enough honest tries. Strays do
 * break the combo and count a little against accuracy, so mashing every lane
 * is never the best way to play.
 */
import {
  compileGigSong,
  CROSSING_SHOW_SPEC,
  PRACTICE_RIFF_SPEC,
  type GigLane,
  type GigNote,
  type GigSection,
  type GigSong
} from './song';

/** Within this many ms of the note: a perfect strum. */
const GIG_PERFECT_MS = 55;
/** Within this many ms: still counts. Past it the note is missed. */
export const GIG_GOOD_MS = 135;
/** Share of a practice pass that must land to move on. */
const PRACTICE_PASS_SHARE = 0.7;
export const GIG_START_HYPE = 0.5;
const START_HYPE = GIG_START_HYPE;
const HYPE_GAIN = { perfect: 0.035, good: 0.02 } as const;
const HYPE_LOSS = 0.06;
const POINTS = { perfect: 100, good: 60 } as const;
/** How much a stray strum weighs against accuracy, relative to a note. */
const STRAY_WEIGHT = 0.5;
/** Combo steps that raise the score multiplier, up to MAX_MULTIPLIER. */
const MULTIPLIER_STEP = 10;
const MAX_MULTIPLIER = 4;

export type GigMode = 'practice' | 'show';
export type GigJudgment = 'perfect' | 'good' | 'miss';
export type GigPhase = 'countIn' | 'playing' | 'finished';
export type GigGrade = 'legendary' | 'great' | 'good' | 'rough';
export const GIG_GRADES: readonly GigGrade[] = ['legendary', 'great', 'good', 'rough'];

/** Session flag: a practice pass ran out rather than landed. Steve reacts to it. */
export const CONCERT_PRACTICE_ASSISTED_FLAG = 'concert_practice_assisted';
/** Session flag for the grade of the most recent show, e.g. `concert_grade_great`. */
export const concertGradeFlag = (grade: GigGrade): string => `concert_grade_${grade}`;

export interface GigHit {
  noteId: number;
  lane: GigLane;
  judgment: GigJudgment;
  /** Signed: negative is early. Zero for misses. */
  offsetMs: number;
  timeMs: number;
  /** Increments on every judged note, so views can replay one-shots. */
  serial: number;
}

export type GigStrumResult =
  | { kind: 'hit'; hit: GigHit; chord: GigNote['chord'] }
  | { kind: 'stray'; lane: GigLane }
  | { kind: 'ignored' };

export interface GigOptions {
  mode: GigMode;
  /** Override the chart (tests). Defaults to the practice riff or the show. */
  song?: GigSong;
  /** Crowd warmth at the first note, 0..1. */
  startHype?: number;
}

/** Narrow an untrusted number (a panel param) to a lane. */
export const isGigLane = (value: unknown): value is GigLane => value === 0 || value === 1 || value === 2;

export class ConcertGig {
  readonly mode: GigMode;
  readonly song: GigSong;
  /** Crowd warmth at the first note (above the default when someone warmed them up). */
  readonly startHype: number;
  private time = Number.NEGATIVE_INFINITY;
  private readonly judgments: (GigJudgment | null)[];
  /** First note whose miss deadline has not passed yet. */
  private cursor = 0;
  private hypeLevel: number;
  private comboCount = 0;
  private bestComboCount = 0;
  private points = 0;
  private serial = 0;
  private readonly tally = { perfect: 0, good: 0, miss: 0 };
  private strays = 0;
  private last: GigHit | null = null;
  private finishedAt: number | null = null;
  private practicePassed = false;
  /** Practice sections already scored. */
  private loopsScored = 0;

  constructor(options: GigOptions) {
    this.mode = options.mode;
    this.song =
      options.song ?? compileGigSong(options.mode === 'practice' ? PRACTICE_RIFF_SPEC : CROSSING_SHOW_SPEC);
    this.judgments = this.song.notes.map(() => null);
    this.startHype = clamp01(options.startHype ?? START_HYPE);
    this.hypeLevel = this.startHype;
  }

  get timeMs(): number {
    return Number.isFinite(this.time) ? this.time : 0;
  }

  get phase(): GigPhase {
    if (this.finishedAt !== null) return 'finished';
    return this.timeMs < this.song.startMs ? 'countIn' : 'playing';
  }

  get hype(): number {
    return this.hypeLevel;
  }

  get combo(): number {
    return this.comboCount;
  }

  get bestCombo(): number {
    return this.bestComboCount;
  }

  get score(): number {
    return this.points;
  }

  get multiplier(): number {
    return Math.min(MAX_MULTIPLIER, 1 + Math.floor(this.comboCount / MULTIPLIER_STEP));
  }

  get counts(): Readonly<{ perfect: number; good: number; miss: number }> {
    return this.tally;
  }

  get lastHit(): GigHit | null {
    return this.last;
  }

  /** Landed notes over judged notes, with strays weighing against it. */
  get accuracy(): number {
    const judged = this.tally.perfect + this.tally.good + this.tally.miss;
    if (judged === 0) return 0;
    return (this.tally.perfect + this.tally.good * 0.6) / (judged + this.strays * STRAY_WEIGHT);
  }

  get grade(): GigGrade {
    const accuracy = this.accuracy;
    if (accuracy >= 0.9) return 'legendary';
    if (accuracy >= 0.72) return 'great';
    if (accuracy >= 0.45) return 'good';
    return 'rough';
  }

  /** Practice only: one pass landed. False means it ran out and passed anyway. */
  get passed(): boolean {
    return this.mode === 'show' || this.practicePassed;
  }

  /** Practice pass the player is on (0-based), clamped to the last. */
  get loop(): number {
    return Math.min(this.loopsScored, this.song.sections.length - 1);
  }

  get loopsTotal(): number {
    return this.song.sections.length;
  }

  /** Hits needed in one practice pass. */
  get loopNeeded(): number {
    const section = this.song.sections[0];
    return section ? Math.ceil((section.lastNote - section.firstNote) * PRACTICE_PASS_SHARE) : 0;
  }

  /** Hits so far in the current practice pass. */
  get loopHits(): number {
    const section = this.song.sections[this.loop];
    return section ? this.hitsIn(section) : 0;
  }

  /** The section under the playhead, or null during count-in and outro. */
  get section(): GigSection | null {
    const t = this.timeMs;
    return this.song.sections.find((section) => t >= section.startMs && t < section.endMs) ?? null;
  }

  judgmentOf(noteId: number): GigJudgment | null {
    return this.judgments[noteId] ?? null;
  }

  /** Earliest note still waiting for a strum. */
  nextPendingNote(): GigNote | null {
    for (let i = this.cursor; i < this.song.notes.length; i += 1) {
      if (this.judgments[i] === null) return this.song.notes[i]!;
    }
    return null;
  }

  /** Move the playhead forward. Notes whose window closed become misses. */
  advance(toMs: number): void {
    if (this.finishedAt !== null || !(toMs > this.time)) return;
    this.time = toMs;
    const notes = this.song.notes;
    while (this.cursor < notes.length && notes[this.cursor]!.timeMs + GIG_GOOD_MS < toMs) {
      if (this.judgments[this.cursor] === null) this.judge(notes[this.cursor]!, 'miss', 0);
      this.cursor += 1;
    }
    if (this.mode === 'practice') this.scorePracticeLoops();
    else if (toMs >= this.song.endMs) this.finishedAt = toMs;
  }

  /** Let the song play out: every unplayed note is a miss, and the show is over. */
  finish(): void {
    this.advance(this.song.endMs + 1);
  }

  /** Strum a lane at song time `atMs` (defaults to now). */
  strum(lane: GigLane, atMs: number = this.timeMs): GigStrumResult {
    if (this.finishedAt !== null) return { kind: 'ignored' };
    this.advance(atMs);
    if (this.finishedAt !== null) return { kind: 'ignored' };

    const note = this.closestOpenNote(lane, atMs);
    if (!note) {
      this.strays += 1;
      this.comboCount = 0;
      return { kind: 'stray', lane };
    }
    const offset = atMs - note.timeMs;
    const hit = this.judge(note, Math.abs(offset) <= GIG_PERFECT_MS ? 'perfect' : 'good', offset);
    return { kind: 'hit', hit, chord: note.chord };
  }

  private closestOpenNote(lane: GigLane, atMs: number): GigNote | null {
    let best: GigNote | null = null;
    let bestGap = Number.POSITIVE_INFINITY;
    const notes = this.song.notes;
    for (let i = this.cursor; i < notes.length; i += 1) {
      const note = notes[i]!;
      if (note.timeMs - GIG_GOOD_MS > atMs) break;
      if (note.lane !== lane || this.judgments[i] !== null) continue;
      const gap = Math.abs(atMs - note.timeMs);
      if (gap <= GIG_GOOD_MS && gap < bestGap) {
        best = note;
        bestGap = gap;
      }
    }
    return best;
  }

  private judge(note: GigNote, judgment: GigJudgment, offsetMs: number): GigHit {
    this.judgments[note.id] = judgment;
    this.tally[judgment] += 1;
    if (judgment === 'miss') {
      this.comboCount = 0;
      this.hypeLevel = clamp01(this.hypeLevel - HYPE_LOSS);
    } else {
      this.comboCount += 1;
      this.bestComboCount = Math.max(this.bestComboCount, this.comboCount);
      this.points += POINTS[judgment] * this.multiplier;
      this.hypeLevel = clamp01(this.hypeLevel + HYPE_GAIN[judgment]);
    }
    this.serial += 1;
    this.last = { noteId: note.id, lane: note.lane, judgment, offsetMs, timeMs: this.timeMs, serial: this.serial };
    return this.last;
  }

  /** At the end of each pass: enough hits ends practice; the last pass always does. */
  private scorePracticeLoops(): void {
    const sections = this.song.sections;
    while (this.finishedAt === null && this.loopsScored < sections.length) {
      const section = sections[this.loopsScored]!;
      if (this.time < section.endMs) return;
      this.loopsScored += 1;
      const landed = this.hitsIn(section) >= this.loopNeeded;
      if (landed || this.loopsScored === sections.length) {
        this.practicePassed = landed;
        this.finishedAt = this.time;
      }
    }
  }

  private hitsIn(section: GigSection): number {
    let hits = 0;
    for (let i = section.firstNote; i < section.lastNote; i += 1) {
      const judgment = this.judgments[i];
      if (judgment === 'perfect' || judgment === 'good') hits += 1;
    }
    return hits;
  }
}

/** Strum every note at the next pending time, exactly on it (console / tests). */
export function playNextNotePerfectly(gig: ConcertGig): GigStrumResult[] {
  const next = gig.nextPendingNote();
  if (!next) return [];
  return gig.song.notes
    .filter((note) => note.timeMs === next.timeMs && gig.judgmentOf(note.id) === null)
    .map((note) => gig.strum(note.lane, note.timeMs));
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
