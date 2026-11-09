import { describe, expect, it } from 'vitest';
import {
  STAMPEDE_AUTO_ATTACK_COOLDOWN_MS,
  createStampedeAutoAttackState
} from './autoAttack';
import { STAMPEDE_WORLD } from './movement';
import {
  STAMPEDE_PLAYER_CONTACT_RADIUS,
  resolveStampedeRunFrame
} from './runFlow';
import { STAMPEDE_CONTACT_COOLDOWN_MS } from './pressure';
import {
  STAMPEDE_CONTACT_LIMIT,
  STAMPEDE_SHELL_RECHARGE_MS,
  createStampedeSession,
  resolveStampedeContact
} from './session';

describe('stampede run flow', () => {
  const baseVelocity = { x: 10, y: -20 };
  const basePlayer = { x: 500, y: 300 };

  function sessionWithContacts(count: number, stepMs = 1_000) {
    let session = createStampedeSession();
    for (let index = 0; index < count; index += 1) {
      session = resolveStampedeContact(session, index * stepMs);
    }
    return session;
  }

  function runFrame(
    overrides: Partial<Parameters<typeof resolveStampedeRunFrame>[0]> = {}
  ) {
    return resolveStampedeRunFrame({
      session: createStampedeSession(),
      deltaMs: 500,
      closeRequested: false,
      velocity: baseVelocity,
      player: basePlayer,
      contactCandidates: [],
      ...overrides
    });
  }

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
      x: STAMPEDE_WORLD.safeLeft,
      y: STAMPEDE_WORLD.safeBottom,
      radius: 10
    };
    const frame = resolveStampedeRunFrame({
      session: createStampedeSession(),
      deltaMs: 500,
      closeRequested: false,
      velocity: baseVelocity,
      player: { x: -100, y: 5_000 },
      contactCandidates: [candidate]
    });

    expect(frame.kind).toBe('playing');
    if (frame.kind !== 'playing') return;
    expect(frame.player).toEqual({
      x: STAMPEDE_WORLD.safeLeft,
      y: STAMPEDE_WORLD.safeBottom,
      radius: STAMPEDE_PLAYER_CONTACT_RADIUS
    });
    expect(frame.contactCandidate).toBe(candidate);
    expect(frame.session.contacts).toBe(1);
    expect(frame.pressure.canContact).toBe(true);
  });

  it('returns a terminal failure frame when a contact reaches the limit', () => {
    const frame = runFrame({
      session: sessionWithContacts(STAMPEDE_CONTACT_LIMIT - 1),
      deltaMs: 2_500,
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

  it('skips contact when a weapon clears that chick on the same frame', () => {
    const frame = runFrame({
      session: sessionWithContacts(STAMPEDE_CONTACT_LIMIT - 1),
      deltaMs: 2_500,
      contactCandidates: [{ ...basePlayer, radius: 10, id: 'mark-a' }],
      ignoredContactIds: ['mark-a']
    });

    expect(frame.kind).toBe('playing');
    if (frame.kind !== 'playing') return;
    expect(frame.session.contacts).toBe(STAMPEDE_CONTACT_LIMIT - 1);
    expect(frame.contactCandidate).toBeNull();
  });

  it('keeps terminal sessions terminal on the next frame', () => {
    let session = createStampedeSession();
    for (let index = 0; index < STAMPEDE_CONTACT_LIMIT; index += 1) {
      session = resolveStampedeContact(session, index * 100);
    }

    const frame = resolveStampedeRunFrame({
      session,
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

  it('lets a ready shell catch a peck, including the last one', () => {
    let session = createStampedeSession();
    for (let index = 0; index < STAMPEDE_CONTACT_LIMIT - 1; index += 1) {
      session = resolveStampedeContact(session, index * 1_000);
    }

    const blocked = resolveStampedeRunFrame({
      session,
      deltaMs: 2_500,
      closeRequested: false,
      velocity: baseVelocity,
      player: basePlayer,
      contactCandidates: [{ ...basePlayer, radius: 10 }],
      shellOwned: true
    });

    expect(blocked.kind).toBe('playing');
    if (blocked.kind !== 'playing') return;
    expect(blocked.shellBlocked).toBe(true);
    expect(blocked.session.contacts).toBe(STAMPEDE_CONTACT_LIMIT - 1);
    expect(blocked.session.phase).toBe('playing');
    expect(blocked.session.lastContactAtMs).toBe(blocked.session.elapsedMs);
  });

  it('keeps a chick inside the ring from pecking until contact cooldown ends', () => {
    const blocked = runFrame({
      session: sessionWithContacts(1),
      deltaMs: 2_500,
      contactCandidates: [{ ...basePlayer, radius: 10 }],
      shellOwned: true
    });

    expect(blocked.kind).toBe('playing');
    if (blocked.kind !== 'playing') return;
    expect(blocked.shellBlocked).toBe(true);

    const shellReadyAtMs = blocked.session.elapsedMs + STAMPEDE_SHELL_RECHARGE_MS;
    const stillInside = runFrame({
      session: blocked.session,
      deltaMs: 200,
      contactCandidates: [{ ...basePlayer, radius: 10 }],
      shellOwned: true,
      shellReadyAtMs
    });

    expect(stillInside.kind).toBe('playing');
    if (stillInside.kind !== 'playing') return;
    expect(stillInside.shellBlocked).toBe(false);
    expect(stillInside.session.contacts).toBe(1);

    const afterCooldown = runFrame({
      session: stillInside.session,
      deltaMs: STAMPEDE_CONTACT_COOLDOWN_MS,
      contactCandidates: [{ ...basePlayer, radius: 10 }],
      shellOwned: true,
      shellReadyAtMs
    });

    expect(afterCooldown.kind).toBe('playing');
    if (afterCooldown.kind !== 'playing') return;
    expect(afterCooldown.shellBlocked).toBe(false);
    expect(afterCooldown.session.contacts).toBe(2);
  });
});
