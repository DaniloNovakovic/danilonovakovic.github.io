import {
  clampStampedePosition,
  type StampedeVelocity
} from './movement';
import {
  resolveStampedeAutoAttackFrame,
  type StampedeAutoAttackCandidate,
  type StampedeAutoAttackEvent,
  type StampedeAutoAttackState
} from './autoAttack';
import {
  resolveStampedePressure,
  type StampedeContactCandidate,
  type StampedePressurePoint,
  type StampedePressureSnapshot
} from './pressure';
import {
  advanceStampedeSession,
  resolveStampedeContact,
  type StampedeSession,
  type StampedeSessionPhase
} from './session';
import type { StampedeSwarmMode } from './swarmPresentation';

export const STAMPEDE_PLAYER_CONTACT_RADIUS = 24;

export interface StampedeRunFrameInput {
  session: StampedeSession;
  autoAttackState?: StampedeAutoAttackState;
  deltaMs: number;
  closeRequested: boolean;
  velocity: StampedeVelocity;
  player: StampedePressurePoint;
  contactCandidates: readonly StampedeRunContactCandidate[];
}

export interface StampedeRunSwarmFrame {
  mode: StampedeSwarmMode;
  pressure: number;
}

export interface StampedeRunContactCandidate extends StampedeContactCandidate {
  id?: string;
}

export type StampedeRunFrame =
  | {
    kind: 'close';
    session: StampedeSession;
    autoAttackState?: StampedeAutoAttackState;
  }
  | {
    kind: 'terminal';
    session: StampedeSession;
    autoAttackState?: StampedeAutoAttackState;
    phase: Exclude<StampedeSessionPhase, 'playing'>;
    player?: StampedePressurePoint;
    pressure?: StampedePressureSnapshot;
    contactCandidate?: StampedeContactCandidate | null;
    attack?: StampedeAutoAttackEvent | null;
    swarm: StampedeRunSwarmFrame;
  }
  | {
    kind: 'playing';
    session: StampedeSession;
    autoAttackState?: StampedeAutoAttackState;
    velocity: StampedeVelocity;
    player: StampedePressurePoint;
    pressure: StampedePressureSnapshot;
    contactCandidate: StampedeContactCandidate | null;
    attack?: StampedeAutoAttackEvent | null;
    swarm: StampedeRunSwarmFrame;
  };

export function resolveStampedeRunFrame({
  session,
  autoAttackState,
  deltaMs,
  closeRequested,
  velocity,
  player,
  contactCandidates
}: StampedeRunFrameInput): StampedeRunFrame {
  if (closeRequested) {
    return {
      kind: 'close',
      session,
      ...optionalAutoAttackState(autoAttackState)
    };
  }

  const advancedSession = advanceStampedeSession(session, deltaMs);
  if (advancedSession.phase !== 'playing') {
    return {
      kind: 'terminal',
      session: advancedSession,
      ...optionalAutoAttackState(autoAttackState),
      attack: null,
      phase: advancedSession.phase,
      swarm: {
        mode: 'recover',
        pressure: advancedSession.phase === 'failed' ? 1 : 0.08
      }
    };
  }

  const clampedPlayer = {
    ...clampStampedePosition(player),
    radius: player.radius ?? STAMPEDE_PLAYER_CONTACT_RADIUS
  };
  const autoAttackFrame = autoAttackState
    ? resolveStampedeAutoAttackFrame({
      state: autoAttackState,
      elapsedMs: advancedSession.elapsedMs,
      player: clampedPlayer,
      velocity,
      candidates: contactCandidates.filter(hasStampedeCandidateId)
    })
    : null;
  const pressureCandidates = removeHitCandidates(
    contactCandidates,
    autoAttackFrame?.attack?.hitIds ?? []
  );
  const pressure = resolveStampedePressure({
    elapsedMs: advancedSession.elapsedMs,
    durationMs: advancedSession.durationMs,
    player: clampedPlayer,
    candidates: pressureCandidates,
    lastContactAtMs: advancedSession.lastContactAtMs
  });
  const nextSession = pressure.canContact
    ? resolveStampedeContact(advancedSession, advancedSession.elapsedMs)
    : advancedSession;

  if (nextSession.phase !== 'playing') {
    return {
      kind: 'terminal',
      session: nextSession,
      ...optionalAutoAttackState(autoAttackFrame?.state ?? autoAttackState),
      phase: nextSession.phase,
      player: clampedPlayer,
      pressure,
      contactCandidate: pressure.canContact ? pressure.nearestContactCandidate : null,
      attack: null,
      swarm: {
        mode: 'recover',
        pressure: 1
      }
    };
  }

  return {
    kind: 'playing',
    session: nextSession,
    ...optionalAutoAttackState(autoAttackFrame?.state ?? autoAttackState),
    velocity,
    player: clampedPlayer,
    pressure,
    contactCandidate: pressure.canContact ? pressure.nearestContactCandidate : null,
    attack: autoAttackFrame?.attack ?? null,
    swarm: {
      mode: pressure.band,
      pressure: pressure.pressure
    }
  };
}

function hasStampedeCandidateId(
  candidate: StampedeRunContactCandidate
): candidate is StampedeAutoAttackCandidate {
  return typeof candidate.id === 'string';
}

function optionalAutoAttackState(
  autoAttackState: StampedeAutoAttackState | undefined
): { autoAttackState: StampedeAutoAttackState } | Record<string, never> {
  return autoAttackState ? { autoAttackState } : {};
}

function removeHitCandidates(
  candidates: readonly StampedeRunContactCandidate[],
  hitIds: readonly string[]
): readonly StampedeRunContactCandidate[] {
  if (hitIds.length === 0) return candidates;

  const hitIdSet = new Set(hitIds);
  return candidates.filter((candidate) => (
    !candidate.id || !hitIdSet.has(candidate.id)
  ));
}
