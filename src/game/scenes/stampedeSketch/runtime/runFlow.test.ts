import { describe, expect, it } from 'vitest';
import {
  STAMPEDE_AUTO_ATTACK_COOLDOWN_MS,
  createStampedeAutoAttackState
} from './autoAttack';
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

  it('can emit an auto attack while the run continues', () => {
    const frame = resolveStampedeRunFrame({
      session: createStampedeSession(),
      autoAttackState: createStampedeAutoAttackState(),
      deltaMs: STAMPEDE_AUTO_ATTACK_COOLDOWN_MS,
      closeRequested: false,
      velocity: baseVelocity,
      player: basePlayer,
      contactCandidates: [{
        id: 'mark-a',
        x: basePlayer.x + 60,
        y: basePlayer.y,
        radius: 10
      }]
    });

    expect(frame.kind).toBe('playing');
    if (frame.kind !== 'playing') return;
    expect(frame.attack?.hitIds).toEqual(['mark-a']);
    expect(frame.autoAttackState?.nextFireAtMs).toBe(
      STAMPEDE_AUTO_ATTACK_COOLDOWN_MS * 2
    );
  });

  it('excludes attack-cleared marks from same-frame contact checks', () => {
    const frame = resolveStampedeRunFrame({
      session: createStampedeSession(),
      autoAttackState: createStampedeAutoAttackState(),
      deltaMs: STAMPEDE_AUTO_ATTACK_COOLDOWN_MS,
      closeRequested: false,
      velocity: baseVelocity,
      player: basePlayer,
      contactCandidates: [{
        id: 'mark-a',
        ...basePlayer,
        radius: 10
      }]
    });

    expect(frame.kind).toBe('playing');
    if (frame.kind !== 'playing') return;
    expect(frame.attack?.hitIds).toEqual(['mark-a']);
    expect(frame.contactCandidate).toBeNull();
    expect(frame.session.contacts).toBe(0);
  });

  it('still applies contact from uncleared candidates', () => {
    const uncleared = {
      ...basePlayer,
      radius: 10
    };
    const frame = resolveStampedeRunFrame({
      session: createStampedeSession(),
      autoAttackState: createStampedeAutoAttackState(),
      deltaMs: STAMPEDE_AUTO_ATTACK_COOLDOWN_MS,
      closeRequested: false,
      velocity: baseVelocity,
      player: basePlayer,
      contactCandidates: [
        {
          id: 'mark-a',
          x: basePlayer.x + 60,
          y: basePlayer.y,
          radius: 10
        },
        {
          id: 'mark-b',
          x: basePlayer.x + 80,
          y: basePlayer.y,
          radius: 10
        },
        uncleared
      ]
    });

    expect(frame.kind).toBe('playing');
    if (frame.kind !== 'playing') return;
    expect(frame.attack?.hitIds).toEqual(['mark-a', 'mark-b']);
    expect(frame.contactCandidate).toBe(uncleared);
    expect(frame.session.contacts).toBe(1);
  });

  it('does not emit attacks for terminal timer frames', () => {
    const frame = resolveStampedeRunFrame({
      session: createStampedeSession({ durationMs: 100 }),
      autoAttackState: createStampedeAutoAttackState({ nextFireAtMs: 100 }),
      deltaMs: 100,
      closeRequested: false,
      velocity: baseVelocity,
      player: basePlayer,
      contactCandidates: [{
        id: 'mark-a',
        ...basePlayer,
        radius: 10
      }]
    });

    expect(frame.kind).toBe('terminal');
    if (frame.kind !== 'terminal') return;
    expect(frame.phase).toBe('cleared');
    expect(frame.attack).toBeNull();
  });

  it('does not emit attacks for terminal contact frames', () => {
    let session = createStampedeSession();
    for (let index = 0; index < STAMPEDE_CONTACT_LIMIT - 1; index += 1) {
      session = resolveStampedeContact(session, index * 1_000);
    }

    const frame = resolveStampedeRunFrame({
      session,
      autoAttackState: createStampedeAutoAttackState(),
      deltaMs: STAMPEDE_AUTO_ATTACK_COOLDOWN_MS,
      closeRequested: false,
      velocity: baseVelocity,
      player: basePlayer,
      contactCandidates: [
        {
          id: 'mark-a',
          x: basePlayer.x + 60,
          y: basePlayer.y,
          radius: 10
        },
        {
          id: 'mark-b',
          x: basePlayer.x + 80,
          y: basePlayer.y,
          radius: 10
        },
        {
          ...basePlayer,
          radius: 10
        }
      ]
    });

    expect(frame.kind).toBe('terminal');
    if (frame.kind !== 'terminal') return;
    expect(frame.phase).toBe('failed');
    expect(frame.attack).toBeNull();
  });
});
