export const STAMPEDE_SESSION_DURATION_MS = 75_000;
export const STAMPEDE_CONTACT_LIMIT = 3;

const STAMPEDE_RECENT_CONTACT_MS = 600;

export type StampedeSessionPhase = 'playing' | 'cleared' | 'failed';

export interface StampedeSession {
  phase: StampedeSessionPhase;
  elapsedMs: number;
  durationMs: number;
  contacts: number;
  lastContactAtMs: number | null;
  recentContact: boolean;
}

export interface StampedeSessionOptions {
  durationMs?: number;
  contactLimit?: number;
}

export type StampedeSessionSnapshot = Readonly<StampedeSession>;

export function createStampedeSession(
  options: StampedeSessionOptions = {}
): StampedeSession {
  return {
    phase: 'playing',
    elapsedMs: 0,
    durationMs: Math.max(0, options.durationMs ?? STAMPEDE_SESSION_DURATION_MS),
    contacts: 0,
    lastContactAtMs: null,
    recentContact: false
  };
}

export function advanceStampedeSession(
  session: StampedeSession,
  deltaMs: number
): StampedeSession {
  if (session.phase !== 'playing') return session;

  const elapsedMs = clamp(
    session.elapsedMs + Math.max(0, deltaMs),
    0,
    session.durationMs
  );
  const phase: StampedeSessionPhase =
    elapsedMs >= session.durationMs ? 'cleared' : 'playing';

  return {
    ...session,
    phase,
    elapsedMs,
    recentContact: isRecentContact(session.lastContactAtMs, elapsedMs)
  };
}

export function resolveStampedeContact(
  session: StampedeSession,
  atMs: number = session.elapsedMs,
  options: StampedeSessionOptions = {}
): StampedeSession {
  if (session.phase !== 'playing') return session;

  const contactLimit = options.contactLimit ?? STAMPEDE_CONTACT_LIMIT;
  const elapsedMs = clamp(atMs, 0, session.durationMs);
  const contacts = session.contacts + 1;

  return {
    ...session,
    phase: contacts >= contactLimit ? 'failed' : 'playing',
    elapsedMs,
    contacts,
    lastContactAtMs: elapsedMs,
    recentContact: true
  };
}

export function readStampedeSessionSnapshot(
  session: StampedeSession
): StampedeSessionSnapshot {
  return { ...session };
}

function isRecentContact(lastContactAtMs: number | null, elapsedMs: number): boolean {
  return (
    lastContactAtMs !== null &&
    elapsedMs - lastContactAtMs <= STAMPEDE_RECENT_CONTACT_MS
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
