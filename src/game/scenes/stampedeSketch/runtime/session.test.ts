import { describe, expect, it } from 'vitest';
import {
  STAMPEDE_CONTACT_LIMIT,
  STAMPEDE_SESSION_DURATION_MS,
  advanceStampedeSession,
  createStampedeSession,
  readStampedeSessionSnapshot,
  resolveStampedeContact
} from './session';

describe('stampede session', () => {
  it('clears when the run timer reaches the duration', () => {
    const session = advanceStampedeSession(
      createStampedeSession(),
      STAMPEDE_SESSION_DURATION_MS
    );

    expect(session.phase).toBe('cleared');
    expect(session.elapsedMs).toBe(STAMPEDE_SESSION_DURATION_MS);
  });

  it('clamps timer advance at the duration', () => {
    const session = advanceStampedeSession(
      createStampedeSession({ durationMs: 1_000 }),
      1_500
    );

    expect(session).toMatchObject({
      phase: 'cleared',
      elapsedMs: 1_000
    });
  });

  it('fails at the contact limit', () => {
    let session = createStampedeSession();

    for (let index = 0; index < STAMPEDE_CONTACT_LIMIT; index += 1) {
      session = resolveStampedeContact(session, index * 100);
    }

    expect(session.phase).toBe('failed');
    expect(session.contacts).toBe(STAMPEDE_CONTACT_LIMIT);
  });

  it('ignores contacts and timer advance after a terminal state', () => {
    const cleared = advanceStampedeSession(
      createStampedeSession({ durationMs: 100 }),
      100
    );
    const contacted = resolveStampedeContact(cleared, 100);
    const advanced = advanceStampedeSession(contacted, 500);

    expect(advanced).toEqual(cleared);
  });

  it('tracks recent contact as a short-lived marker', () => {
    const contacted = resolveStampedeContact(createStampedeSession(), 250);
    const recent = advanceStampedeSession(contacted, 600);
    const stale = advanceStampedeSession(contacted, 601);

    expect(recent.recentContact).toBe(true);
    expect(stale.recentContact).toBe(false);
  });

  it('returns a defensive read snapshot', () => {
    const session = createStampedeSession();

    expect(readStampedeSessionSnapshot(session)).toEqual(session);
    expect(readStampedeSessionSnapshot(session)).not.toBe(session);
  });
});
