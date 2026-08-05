/** Ambient chatter scheduling. No Phaser or DOM, so it stays testable. */

export type BarkLines = Readonly<Record<string, readonly string[]>>;

export interface BarkPerformance {
  actorId: string;
  text: string;
  /** 0..1 fade envelope for the bubble. */
  alpha: number;
}

const HOLD_MS = 2900;
const FADE_MS = 260;
const MIN_GAP_MS = 3200;
const MAX_GAP_MS = 6400;

/**
 * Picks one nearby resident at a time to mutter something.
 *
 * One line at a time on purpose: overlapping chatter turns into noise, and a
 * single bubble reads as a world you are walking through rather than a UI.
 */
export class BarkDirector {
  private readonly lines: BarkLines;
  private readonly random: () => number;
  private current: { actorId: string; text: string; startedAt: number } | null = null;
  private nextAt = 0;
  private readonly lastLineByActor = new Map<string, string>();

  constructor(lines: BarkLines, random: () => number = Math.random) {
    this.lines = lines;
    this.random = random;
  }

  /**
   * @param candidates actors currently worth hearing from, nearest first.
   * @returns the line to show right now, if any.
   */
  update(now: number, candidates: readonly string[]): BarkPerformance | null {
    if (this.current) {
      const elapsed = now - this.current.startedAt;
      const stillOnStage = candidates.includes(this.current.actorId);
      if (elapsed < HOLD_MS && stillOnStage) {
        return {
          actorId: this.current.actorId,
          text: this.current.text,
          alpha: envelope(elapsed)
        };
      }
      this.current = null;
      this.nextAt = now + MIN_GAP_MS + this.random() * (MAX_GAP_MS - MIN_GAP_MS);
      return null;
    }

    if (candidates.length === 0) {
      // Nobody around: let the next line land soon after someone shows up.
      this.nextAt = Math.min(this.nextAt, now + MIN_GAP_MS);
      return null;
    }
    if (now < this.nextAt) return null;

    const picked = this.pick(candidates);
    if (!picked) {
      this.nextAt = now + MIN_GAP_MS;
      return null;
    }

    this.current = { ...picked, startedAt: now };
    this.lastLineByActor.set(picked.actorId, picked.text);
    return { ...picked, alpha: 0 };
  }

  /** Drop any line in flight, e.g. when a real conversation opens. */
  interrupt(now: number): void {
    if (!this.current) return;
    this.current = null;
    this.nextAt = now + MIN_GAP_MS;
  }

  private pick(candidates: readonly string[]): { actorId: string; text: string } | null {
    const speakable = candidates.filter((id) => (this.lines[id]?.length ?? 0) > 0);
    if (speakable.length === 0) return null;

    const actorId = speakable[Math.floor(this.random() * speakable.length)] ?? speakable[0]!;
    const options = this.lines[actorId]!;
    const previous = this.lastLineByActor.get(actorId);
    const fresh = options.length > 1 ? options.filter((line) => line !== previous) : options;
    const text = fresh[Math.floor(this.random() * fresh.length)] ?? fresh[0]!;
    return { actorId, text };
  }
}

function envelope(elapsed: number): number {
  if (elapsed < FADE_MS) return elapsed / FADE_MS;
  const remaining = HOLD_MS - elapsed;
  if (remaining < FADE_MS) return Math.max(0, remaining / FADE_MS);
  return 1;
}
