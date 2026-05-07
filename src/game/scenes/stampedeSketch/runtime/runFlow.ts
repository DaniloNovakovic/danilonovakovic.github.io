import {
  clampStampedePosition,
  type StampedeVelocity
} from './movement';
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
  deltaMs: number;
  closeRequested: boolean;
  velocity: StampedeVelocity;
  player: StampedePressurePoint;
  contactCandidates: readonly StampedeContactCandidate[];
}

export interface StampedeRunSwarmFrame {
  mode: StampedeSwarmMode;
  pressure: number;
}

export type StampedeRunFrame =
  | {
    kind: 'close';
    session: StampedeSession;
  }
  | {
    kind: 'terminal';
    session: StampedeSession;
    phase: Exclude<StampedeSessionPhase, 'playing'>;
    player?: StampedePressurePoint;
    pressure?: StampedePressureSnapshot;
    contactCandidate?: StampedeContactCandidate | null;
    swarm: StampedeRunSwarmFrame;
  }
  | {
    kind: 'playing';
    session: StampedeSession;
    velocity: StampedeVelocity;
    player: StampedePressurePoint;
    pressure: StampedePressureSnapshot;
    contactCandidate: StampedeContactCandidate | null;
    swarm: StampedeRunSwarmFrame;
  };

export function resolveStampedeRunFrame({
  session,
  deltaMs,
  closeRequested,
  velocity,
  player,
  contactCandidates
}: StampedeRunFrameInput): StampedeRunFrame {
  if (closeRequested) {
    return {
      kind: 'close',
      session
    };
  }

  const advancedSession = advanceStampedeSession(session, deltaMs);
  if (advancedSession.phase !== 'playing') {
    return {
      kind: 'terminal',
      session: advancedSession,
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
  const pressure = resolveStampedePressure({
    elapsedMs: advancedSession.elapsedMs,
    durationMs: advancedSession.durationMs,
    player: clampedPlayer,
    candidates: contactCandidates,
    lastContactAtMs: advancedSession.lastContactAtMs
  });
  const nextSession = pressure.canContact
    ? resolveStampedeContact(advancedSession, advancedSession.elapsedMs)
    : advancedSession;

  if (nextSession.phase !== 'playing') {
    return {
      kind: 'terminal',
      session: nextSession,
      phase: nextSession.phase,
      player: clampedPlayer,
      pressure,
      contactCandidate: pressure.canContact ? pressure.nearestContactCandidate : null,
      swarm: {
        mode: 'recover',
        pressure: 1
      }
    };
  }

  return {
    kind: 'playing',
    session: nextSession,
    velocity,
    player: clampedPlayer,
    pressure,
    contactCandidate: pressure.canContact ? pressure.nearestContactCandidate : null,
    swarm: {
      mode: pressure.band,
      pressure: pressure.pressure
    }
  };
}
