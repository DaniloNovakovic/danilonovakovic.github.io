// One frame of staging reads several gig facts per actor; branches are the choreography.
// fallow-ignore-file complexity
import { GIG_START_HYPE, type ConcertGig, type GigJudgment, type GigLane, type RidgeEmotion } from '@/game/core/ridge';
import type { DuelActorStaging } from './duelStaging';

/** How long a judgment word and target flash stay up, in song ms. */
export const GIG_FLASH_MS = 420;

/** What one frame of the show looks like, independent of Phaser. */
export interface GigFrame {
  timeMs: number;
  /** 0..1 through the current beat (0 on the beat), or null before the song. */
  beatPhase: number | null;
  /** Count-in number 1..4 while the drummer clicks, else null. */
  countIn: number | null;
  hype: number;
  /** Most recent judged note and how long ago it was, for flashes. */
  flash: null | { lane: GigLane; judgment: GigJudgment; age: number; serial: number };
  actors: DuelActorStaging;
}

/**
 * Pure staging for the concert: the crowd bounces on the beat harder the
 * warmer it is, the performer's strum arm flicks on every landed note, and
 * Steve cheers (or winces) from the wings.
 */
export function stageConcertGig(gig: ConcertGig): GigFrame {
  const t = gig.timeMs;
  const { beatMs, startMs } = gig.song;
  const beatPhase = t < 0 ? null : (t % beatMs) / beatMs;
  const countIn = t >= 0 && t < startMs ? Math.floor(t / beatMs) + 1 : null;
  const hype = gig.hype;
  const last = gig.lastHit;
  const flash = last && t - last.timeMs < GIG_FLASH_MS
    ? { lane: last.lane, judgment: last.judgment, age: t - last.timeMs, serial: last.serial }
    : null;

  const playing = gig.phase === 'playing';
  const finished = gig.phase === 'finished';
  const pulse = beatPhase === null || !playing ? 0 : Math.abs(Math.sin(Math.PI * beatPhase));
  // A finished show is a standing ovation: everyone up on their toes.
  const crowdLift = finished ? -6 : -pulse * (1.5 + hype * 7);
  const strum = landedCount(gig) % 2;
  // The kid who warmed the crowd is already clapping on the count-in.
  const kidClapping = gig.startHype > GIG_START_HYPE && countIn !== null && beatPhase !== null;
  const kidLift = kidClapping ? -Math.abs(Math.sin(Math.PI * beatPhase)) * 4 : crowdLift * 1.4;

  return {
    timeMs: t,
    beatPhase,
    countIn,
    hype,
    flash,
    actors: {
      player: {
        dx: 0,
        dy: playing ? -pulse * 1.5 : 0,
        strum,
        emotion: performerEmotion(gig, flash)
      },
      crowd: { dx: 0, dy: Math.round(crowdLift), emotion: hype > 0.62 || finished ? 'playful' : 'curious' },
      kid: { dx: 0, dy: Math.round(kidLift), emotion: hype > 0.5 || kidClapping ? 'playful' : 'determined' },
      guitarist: {
        dx: 0,
        dy: Math.round(-pulse * 2),
        emotion: flash?.judgment === 'miss' ? 'surprised' : hype > 0.7 || finished ? 'playful' : 'determined'
      },
      cicka: { dx: 0, dy: 0, emotion: hype > 0.8 ? 'curious' : 'sleepy' }
    }
  };
}

function performerEmotion(gig: ConcertGig, flash: GigFrame['flash']): RidgeEmotion {
  if (gig.phase === 'finished') return 'playful';
  if (flash?.judgment === 'miss') return 'surprised';
  if (gig.combo >= 10) return 'playful';
  return 'determined';
}

function landedCount(gig: ConcertGig): number {
  return gig.counts.perfect + gig.counts.good;
}
