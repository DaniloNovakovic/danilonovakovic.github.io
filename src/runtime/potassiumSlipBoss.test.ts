import { describe, expect, it } from 'vitest';
import {
  createPotassiumBossState,
  getPotassiumBossPhase,
  POTASSIUM_BOSS_PHASE_1_DRIFT,
  POTASSIUM_BOSS_PHASE_2_DRIFT,
  POTASSIUM_BOSS_PATROL_SPEED,
  POTASSIUM_BOSS_STONE_DURATION_MS,
  POTASSIUM_BOSS_STONE_INTERVAL_MS,
  POTASSIUM_BOSS_SUMMON_INTERVAL_MS,
  POTASSIUM_BOSS_SUMMON_VELOCITY_Y,
  resolvePotassiumBossFrame,
  type PotassiumBossFacts,
  type PotassiumBossFrameInput
} from './potassiumSlipBoss';

describe('potassium slip boss', () => {
  it('resolves phase 1, 2, and 3 from hp thresholds', () => {
    expect(getPotassiumBossPhase(61, 100)).toBe(1);
    expect(getPotassiumBossPhase(60, 100)).toBe(2);
    expect(getPotassiumBossPhase(30, 100)).toBe(3);
  });

  it('emits phase transition commands with hints and camera shake', () => {
    const result = resolvePotassiumBossFrame(frame({
      boss: boss({ hp: 55, maxHp: 100 }),
      state: createPotassiumBossState(1000)
    }));

    expect(result.state?.phase).toBe(2);
    expect(result.commands).toEqual([
      { type: 'setBossPhase', phase: 2 },
      { type: 'shakeCamera', durationMs: 220, intensity: 0.007 },
      { type: 'setBossHint', text: 'Boss phase 2 • Orbiting walls hate angles' },
      { type: 'setBossVelocity', velocityY: POTASSIUM_BOSS_PHASE_2_DRIFT, velocityX: POTASSIUM_BOSS_PATROL_SPEED },
      { type: 'spawnOrbitBlockers' },
      { type: 'updateOrbitBlockers', now: 1000 },
      { type: 'setStoneVisual', active: false }
    ]);
  });

  it('emits phase 1 patrol velocity and drift', () => {
    const result = resolvePotassiumBossFrame(frame({
      boss: boss({ x: 360, velocityX: 0 }),
      state: createPotassiumBossState(1000)
    }));

    expect(result.commands).toContainEqual({
      type: 'setBossVelocity',
      velocityY: POTASSIUM_BOSS_PHASE_1_DRIFT,
      velocityX: POTASSIUM_BOSS_PATROL_SPEED
    });
  });

  it('starts orbit blockers once and updates orbit every phase 2 frame', () => {
    const first = resolvePotassiumBossFrame(frame({
      boss: boss({ hp: 55, maxHp: 100, velocityX: 54 }),
      state: createPotassiumBossState(1000)
    }));
    const second = resolvePotassiumBossFrame(frame({
      now: 1016,
      boss: boss({ hp: 55, maxHp: 100, velocityX: 54 }),
      state: first.state
    }));

    expect(first.commands.filter((command) => command.type === 'spawnOrbitBlockers')).toHaveLength(1);
    expect(second.commands.some((command) => command.type === 'spawnOrbitBlockers')).toBe(false);
    expect(second.commands).toContainEqual({ type: 'updateOrbitBlockers', now: 1016 });
  });

  it('starts and ends stone windows on the existing interval and duration', () => {
    const state = {
      ...createPotassiumBossState(1000),
      phase: 3 as const,
      nextStoneAt: 5300
    };
    const started = resolvePotassiumBossFrame(frame({
      now: 5300,
      boss: boss({ hp: 25, maxHp: 100 }),
      state
    }));

    expect(started.commands).toContainEqual({
      type: 'startStone',
      stoneUntil: 5300 + POTASSIUM_BOSS_STONE_DURATION_MS,
      nextStoneAt: 5300 + POTASSIUM_BOSS_STONE_INTERVAL_MS
    });
    expect(started.commands).toContainEqual({ type: 'setStoneVisual', active: false });

    const active = resolvePotassiumBossFrame(frame({
      now: 5400,
      boss: boss({ hp: 25, maxHp: 100 }),
      state: started.state
    }));
    expect(active.commands).toContainEqual({ type: 'setStoneVisual', active: true });

    const ended = resolvePotassiumBossFrame(frame({
      now: 6650,
      boss: boss({ hp: 25, maxHp: 100 }),
      state: active.state
    }));
    expect(ended.commands).toContainEqual({ type: 'setStoneVisual', active: false });
    expect(ended.commands).toContainEqual({ type: 'endStone' });
    expect(ended.state?.stoneUntil).toBeUndefined();
  });

  it('emits summon facts on the existing interval', () => {
    const state = {
      ...createPotassiumBossState(1000),
      phase: 3 as const,
      nextSummonAt: 4600
    };
    const result = resolvePotassiumBossFrame(frame({
      now: 4600,
      boss: boss({ hp: 25, maxHp: 100, x: 500, y: 220 }),
      state
    }));

    expect(result.commands).toContainEqual({
      type: 'spawnSummons',
      nextSummonAt: 4600 + POTASSIUM_BOSS_SUMMON_INTERVAL_MS,
      summons: [
        { kind: 'scope', column: 2, y: 296, velocityY: POTASSIUM_BOSS_SUMMON_VELOCITY_Y },
        { kind: 'deadline', column: 3, y: 296, velocityY: POTASSIUM_BOSS_SUMMON_VELOCITY_Y }
      ]
    });
  });

  it('clears orbit blockers for missing or dying bosses', () => {
    expect(resolvePotassiumBossFrame(frame({ boss: undefined })).commands).toEqual([
      { type: 'clearOrbitBlockers' }
    ]);
    expect(resolvePotassiumBossFrame(frame({ boss: boss({ dying: true }) })).commands).toEqual([
      { type: 'clearOrbitBlockers' }
    ]);
  });

  it('returned state prevents duplicate one-shot phase and orbit commands', () => {
    const first = resolvePotassiumBossFrame(frame({
      boss: boss({ hp: 55, maxHp: 100 }),
      state: createPotassiumBossState(1000)
    }));
    const second = resolvePotassiumBossFrame(frame({
      now: 1032,
      boss: boss({ hp: 55, maxHp: 100, velocityX: 54 }),
      state: first.state
    }));

    expect(second.commands.some((command) => command.type === 'setBossPhase')).toBe(false);
    expect(second.commands.some((command) => command.type === 'setBossHint')).toBe(false);
    expect(second.commands.some((command) => command.type === 'spawnOrbitBlockers')).toBe(false);
    expect(second.commands).toContainEqual({ type: 'updateOrbitBlockers', now: 1032 });
  });
});

function frame(overrides: Partial<PotassiumBossFrameInput> = {}): PotassiumBossFrameInput {
  return {
    now: 1000,
    state: createPotassiumBossState(1000),
    boss: boss(),
    patrolBounds: { left: 353, right: 647 },
    summonLayout: {
      arenaLeft: 275,
      arenaWidth: 450,
      safeTop: 58,
      safeBottom: 484
    },
    ...overrides
  };
}

function boss(overrides: Partial<PotassiumBossFacts> = {}): PotassiumBossFacts {
  return {
    active: true,
    dying: false,
    hp: 92,
    maxHp: 92,
    x: 500,
    y: 190,
    velocityX: 0,
    ...overrides
  };
}
