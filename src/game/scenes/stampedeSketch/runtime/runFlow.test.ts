import { describe, expect, it } from 'vitest';
import {
  STAMPEDE_PLAYER_CONTACT_RADIUS,
  resolveStampedeRunFrame
} from './runFlow';
import {
  STAMPEDE_CONTACT_LIMIT,
  createStampedeSession,
  resolveStampedeContact
} from './session';

describe('stampede run flow', () => {
  const baseVelocity = { x: 10, y: -20 };
  const basePlayer = { x: 500, y: 300 };

  it('returns close without advancing the run session', () => {
    const session = createStampedeSession({ durationMs: 1_000 });
    const frame = resolveStampedeRunFrame({
      session,
      deltaMs: 900,
      closeRequested: true,
      velocity: baseVelocity,
      player: basePlayer,
      contactCandidates: []
    });

    expect(frame).toEqual({
      kind: 'close',
      session
    });
  });

  it('returns a terminal clear frame once the timer completes', () => {
    const frame = resolveStampedeRunFrame({
      session: createStampedeSession({ durationMs: 1_000 }),
      deltaMs: 1_000,
      closeRequested: false,
      velocity: baseVelocity,
      player: basePlayer,
      contactCandidates: []
    });

    expect(frame.kind).toBe('terminal');
    if (frame.kind !== 'terminal') return;
    expect(frame.phase).toBe('cleared');
    expect(frame.session.phase).toBe('cleared');
    expect(frame.swarm).toEqual({
      mode: 'recover',
      pressure: 0.08
    });
  });

  it('clamps player facts and applies one contact when a candidate reaches the player', () => {
    const candidate = {
      x: 315,
      y: 526,
      radius: 10
    };
    const frame = resolveStampedeRunFrame({
      session: createStampedeSession(),
      deltaMs: 500,
      closeRequested: false,
      velocity: baseVelocity,
      player: { x: 100, y: 900 },
      contactCandidates: [candidate]
    });

    expect(frame.kind).toBe('playing');
    if (frame.kind !== 'playing') return;
    expect(frame.player).toEqual({
      x: 315,
      y: 526,
      radius: STAMPEDE_PLAYER_CONTACT_RADIUS
    });
    expect(frame.contactCandidate).toBe(candidate);
    expect(frame.session.contacts).toBe(1);
    expect(frame.pressure.canContact).toBe(true);
  });

  it('returns a terminal failure frame when a contact reaches the limit', () => {
    let session = createStampedeSession();
    for (let index = 0; index < STAMPEDE_CONTACT_LIMIT - 1; index += 1) {
      session = resolveStampedeContact(session, index * 1_000);
    }

    const frame = resolveStampedeRunFrame({
      session,
      deltaMs: 2_500,
      closeRequested: false,
      velocity: baseVelocity,
      player: basePlayer,
      contactCandidates: [{ ...basePlayer, radius: 10 }]
    });

    expect(frame.kind).toBe('terminal');
    if (frame.kind !== 'terminal') return;
    expect(frame.phase).toBe('failed');
    expect(frame.session.phase).toBe('failed');
    expect(frame.session.contacts).toBe(STAMPEDE_CONTACT_LIMIT);
    expect(frame.contactCandidate).toEqual({ ...basePlayer, radius: 10 });
    expect(frame.swarm).toEqual({
      mode: 'recover',
      pressure: 1
    });
  });

  it('keeps terminal sessions terminal on the next frame', () => {
    const frame = resolveStampedeRunFrame({
      session: resolveStampedeContact(
        resolveStampedeContact(
          resolveStampedeContact(createStampedeSession(), 0),
          100
        ),
        200
      ),
      deltaMs: 1_000,
      closeRequested: false,
      velocity: baseVelocity,
      player: basePlayer,
      contactCandidates: [{ ...basePlayer, radius: 10 }]
    });

    expect(frame.kind).toBe('terminal');
    if (frame.kind !== 'terminal') return;
    expect(frame.phase).toBe('failed');
  });
});
