import { describe, expect, it } from 'vitest';
import {
  STAMPEDE_AUTO_ATTACK_COOLDOWN_MS,
  STAMPEDE_AUTO_ATTACK_HALF_WIDTH,
  STAMPEDE_AUTO_ATTACK_LENGTH,
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

  it('ignores marks outside targeting range and swipes in the last movement direction', () => {
    const frame = resolveStampedeAutoAttackFrame({
      state: createStampedeAutoAttackState({ lastDirection: { x: 0, y: -1 } }),
      elapsedMs: STAMPEDE_AUTO_ATTACK_COOLDOWN_MS,
      player,
      velocity: { x: 0, y: 0 },
      candidates: [{
        id: 'mark-far',
        x: 400,
        y: 100,
        radius: 5
      }]
    });

    expect(frame.attack?.hitIds).toEqual([]);
    expect(frame.attack?.direction).toEqual({ x: 0, y: -1 });
  });

  it('uses swipe geometry at the boundary', () => {
    const target: StampedeAutoAttackCandidate = {
      id: 'mark-target',
      x: player.x + 40,
      y: player.y,
      radius: 5
    };
    const boundary: StampedeAutoAttackCandidate = {
      id: 'mark-boundary',
      x: player.x + STAMPEDE_AUTO_ATTACK_LENGTH,
      y: player.y + STAMPEDE_AUTO_ATTACK_HALF_WIDTH + 5,
      radius: 5
    };
    const outside: StampedeAutoAttackCandidate = {
      id: 'mark-outside',
      x: player.x + STAMPEDE_AUTO_ATTACK_LENGTH,
      y: player.y + STAMPEDE_AUTO_ATTACK_HALF_WIDTH + 6,
      radius: 5
    };

    const frame = resolveStampedeAutoAttackFrame({
      state: createStampedeAutoAttackState(),
      elapsedMs: STAMPEDE_AUTO_ATTACK_COOLDOWN_MS,
      player,
      velocity: { x: 1, y: 0 },
      candidates: [target, boundary, outside]
    });

    expect(frame.attack?.hitIds).toContain('mark-target');
    expect(frame.attack?.hitIds).toContain('mark-boundary');
    expect(frame.attack?.hitIds).not.toContain('mark-outside');
  });

  it('caps cleared marks at two and returns remaining candidates', () => {
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

    expect(frame.attack?.hitIds).toEqual(['mark-a', 'mark-b']);
    expect(frame.remainingCandidates.map((candidate) => candidate.id)).toEqual([
      'mark-c'
    ]);
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
});
