import type { StampedePressureSnapshot } from './pressure';
import type { StampedeProgressionState } from './progression';
import {
  STAMPEDE_CONTACT_LIMIT,
  type StampedeSessionSnapshot
} from './session';

export type StampedeHudFeedback = 'smudged' | 'blanketHeld' | 'crowded' | string;

export interface StampedeHudSnapshot {
  timeRemainingSeconds?: number;
  timerSeconds?: number;
  pageNoise?: number;
  phaseLabel?: string;
  feedback?: StampedeHudFeedback;
  contacts?: number;
  contactLimit?: number;
  healthRemaining?: number;
  scrapsCollected?: number;
  scrapGoal?: number;
}

export function createStampedeHudSnapshot(
  session: StampedeSessionSnapshot,
  pressure?: StampedePressureSnapshot,
  progression?: StampedeProgressionState
): StampedeHudSnapshot {
  const remainingMs = Math.max(0, session.durationMs - session.elapsedMs);

  return {
    timeRemainingSeconds: remainingMs / 1000,
    pageNoise: resolveHudNoise(session, pressure),
    phaseLabel: resolvePhaseLabel(session, pressure),
    feedback: resolveHudFeedback(session),
    contacts: session.contacts,
    contactLimit: STAMPEDE_CONTACT_LIMIT,
    healthRemaining: Math.max(0, STAMPEDE_CONTACT_LIMIT - session.contacts),
    scrapsCollected: progression?.scrapsCollected,
    scrapGoal: progression?.scrapGoal
  };
}

function resolveHudNoise(
  session: StampedeSessionSnapshot,
  pressure?: StampedePressureSnapshot
): number {
  if (session.phase === 'failed') return 1;
  if (session.phase === 'cleared') return 0.08;
  return pressure?.pressure ?? 0.12;
}

function resolvePhaseLabel(
  session: StampedeSessionSnapshot,
  pressure?: StampedePressureSnapshot
): string {
  if (session.phase === 'failed') return 'Page crowded';
  if (session.phase === 'cleared') return 'Blanket held';

  switch (pressure?.band) {
    case 'build':
      return 'Noise rising';
    case 'surge':
      return 'Surge';
    case 'recover':
      return 'Breather';
    case 'calm':
    default:
      return 'Kite ideas';
  }
}

function resolveHudFeedback(
  session: StampedeSessionSnapshot
): StampedeHudFeedback | undefined {
  if (session.phase === 'failed') return 'crowded';
  if (session.phase === 'cleared') return 'blanketHeld';
  if (session.recentContact) return 'smudged';
  return undefined;
}
