import type { StampedePressureSnapshot } from './pressure';
import type { StampedeProgressionState } from './progression';
import {
  stampedeContactLimit,
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
  spellLabel?: string;
  spellReady?: boolean;
  spellCooldownSeconds?: number;
}

export function createStampedeHudSnapshot(
  session: StampedeSessionSnapshot,
  pressure?: StampedePressureSnapshot,
  progression?: StampedeProgressionState
): StampedeHudSnapshot {
  const remainingMs = Math.max(0, session.durationMs - session.elapsedMs);
  const contactLimit = stampedeContactLimit(progression?.bonusHearts ?? 0);

  return {
    ...(session.endless
      ? { timerSeconds: session.elapsedMs / 1000 }
      : { timeRemainingSeconds: remainingMs / 1000 }),
    pageNoise: resolveHudNoise(session, pressure),
    phaseLabel: resolvePhaseLabel(session, pressure),
    feedback: resolveHudFeedback(session),
    contacts: session.contacts,
    contactLimit,
    healthRemaining: Math.max(0, contactLimit - session.contacts),
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
  if (session.phase === 'failed') return 'Chicks caught up';
  if (session.phase === 'cleared') return 'You got away';

  switch (pressure?.band) {
    case 'build':
      return 'They noticed you';
    case 'surge':
      return 'Stampede';
    case 'recover':
      return 'They lose you';
    case 'calm':
    default:
      return session.endless ? 'Endless' : 'Chick magnet';
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
