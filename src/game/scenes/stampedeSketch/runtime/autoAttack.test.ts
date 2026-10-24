import { describe, expect, it } from 'vitest';
import {
  STAMPEDE_AUTO_ATTACK_COOLDOWN_MS,
  STAMPEDE_AUTO_ATTACK_RANGE,
  createStampedeAutoAttackState,
  resolveStampedeAutoAttackFrame,
  type StampedeAutoAttackCandidate
} from './autoAttack';

describe('stampede auto attack', () => {
  const player = { x: 100, y: 100 };
  const baseCandidate: StampedeAutoAttackCandidate = {
    id: 'mark-a',
    x: 170,
    y: 100,
    radius: 5
  };

  it('waits for the cooldown boundary before firing', () => {
    const early = resolveStampedeAutoAttackFrame({
      state: createStampedeAutoAttackState(),
      elapsedMs: STAMPEDE_AUTO_ATTACK_COOLDOWN_MS - 1,
      player,
      velocity: { x: 0, y: 0 },
      candidates: [baseCandidate]
    });
    const ready = resolveStampedeAutoAttackFrame({
      state: createStampedeAutoAttackState(),
      elapsedMs: STAMPEDE_AUTO_ATTACK_COOLDOWN_MS,
      player,
      velocity: { x: 0, y: 0 },
      candidates: [baseCandidate]
    });

    expect(early.attack).toBeNull();
    expect(ready.attack?.hitIds).toEqual(['mark-a']);
  });

  it('fires at most once on a large elapsed jump', () => {
    const frame = resolveStampedeAutoAttackFrame({
      state: createStampedeAutoAttackState(),
      elapsedMs: STAMPEDE_AUTO_ATTACK_COOLDOWN_MS * 4,
      player,
      velocity: { x: 0, y: 0 },
      candidates: [baseCandidate]
    });

    expect(frame.attack).not.toBeNull();
    expect(frame.state.nextFireAtMs).toBe(
      STAMPEDE_AUTO_ATTACK_COOLDOWN_MS * 5
    );
  });

  it('targets the nearest in-range mark first', () => {
    const far: StampedeAutoAttackCandidate = {
      id: 'mark-far',
      x: 230,
      y: 100,
      radius: 5
    };
    const near: StampedeAutoAttackCandidate = {
      id: 'mark-near',
      x: 140,
      y: 100,
      radius: 5
    };
    const frame = resolveStampedeAutoAttackFrame({
      state: createStampedeAutoAttackState(),
      elapsedMs: STAMPEDE_AUTO_ATTACK_COOLDOWN_MS,
      player,
      velocity: { x: 0, y: 0 },
      candidates: [far, near]
    });

    expect(frame.attack?.hitIds[0]).toBe('mark-near');
  });

  it('snaps a random nearby chick and ignores marks outside range', () => {
    const frame = resolveStampedeAutoAttackFrame({
      state: createStampedeAutoAttackState({ lastDirection: { x: 0, y: -1 } }),
      elapsedMs: STAMPEDE_AUTO_ATTACK_COOLDOWN_MS,
      player,
      velocity: { x: 0, y: 0 },
      candidates: [
        { id: 'mark-near', x: 140, y: 100, radius: 5 },
        { id: 'mark-far', x: 400, y: 100, radius: 5 }
      ]
    });

    expect(frame.attack?.hitIds).toEqual(['mark-near']);
    expect(frame.attack?.target).toEqual({ x: 140, y: 100 });
  });

  it('stays inside selfie range', () => {
    const inside: StampedeAutoAttackCandidate = {
      id: 'mark-inside',
      x: player.x + STAMPEDE_AUTO_ATTACK_RANGE - 10,
      y: player.y,
      radius: 5
    };
    const outside: StampedeAutoAttackCandidate = {
      id: 'mark-outside',
      x: player.x + STAMPEDE_AUTO_ATTACK_RANGE + 20,
      y: player.y,
      radius: 5
    };
    const frame = resolveStampedeAutoAttackFrame({
      state: createStampedeAutoAttackState(),
      elapsedMs: STAMPEDE_AUTO_ATTACK_COOLDOWN_MS,
      player,
      velocity: { x: 1, y: 0 },
      candidates: [inside, outside]
    });

    expect(frame.attack?.hitIds).toEqual(['mark-inside']);
  });

  it('caps cleared marks at two and returns the one it did not photograph', () => {
    const candidates: StampedeAutoAttackCandidate[] = [
      { id: 'mark-a', x: 130, y: 100, radius: 5 },
      { id: 'mark-b', x: 150, y: 100, radius: 5 },
      { id: 'mark-c', x: 170, y: 100, radius: 5 }
    ];
    const frame = resolveStampedeAutoAttackFrame({
      state: createStampedeAutoAttackState(),
      elapsedMs: STAMPEDE_AUTO_ATTACK_COOLDOWN_MS,
      player,
      velocity: { x: 1, y: 0 },
      candidates
    });

    expect(frame.attack?.hitIds).toHaveLength(2);
    expect(frame.remainingCandidates).toHaveLength(1);
    expect([
      ...(frame.attack?.hitIds ?? []),
      frame.remainingCandidates[0]?.id
    ].sort()).toEqual(['mark-a', 'mark-b', 'mark-c']);
  });

  it('is deterministic for the same plain inputs', () => {
    const input = {
      state: createStampedeAutoAttackState(),
      elapsedMs: STAMPEDE_AUTO_ATTACK_COOLDOWN_MS,
      player,
      velocity: { x: 1, y: 0 },
      candidates: [baseCandidate]
    };

    expect(resolveStampedeAutoAttackFrame(input)).toEqual(
      resolveStampedeAutoAttackFrame(input)
    );
  });

  it('will not photograph a situationship', () => {
    const frame = resolveStampedeAutoAttackFrame({
      state: createStampedeAutoAttackState(),
      elapsedMs: STAMPEDE_AUTO_ATTACK_COOLDOWN_MS,
      player,
      velocity: { x: 1, y: 0 },
      candidates: [
        { id: 'complicated', x: 140, y: 100, radius: 5, kind: 'situationship' },
        { id: 'plain', x: 180, y: 100, radius: 5, kind: 'chick' }
      ]
    });

    expect(frame.attack?.hitIds).toEqual(['plain']);
  });
});
