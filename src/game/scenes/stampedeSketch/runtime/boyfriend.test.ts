import { describe, expect, it } from 'vitest';
import {
  befriendBrad,
  BRAD_ALLY_MS,
  BRAD_CONFUSED_MS,
  bradComboTuning,
  confuseBrad,
  createBradBrain,
  planBradCombo,
  stepBradBrain,
  type BradBrain,
  type BradStepInput
} from './boyfriend';

function input(overrides: Partial<BradStepInput> = {}): BradStepInput {
  return {
    nowMs: 10_000,
    self: { x: 0, y: 0 },
    player: { x: 1_000, y: 0 },
    hp: 24,
    maxHp: 24,
    escorts: 3,
    ...overrides
  };
}

function ready(brain: BradBrain): BradBrain {
  return { ...brain, nextComboAtMs: 0, nextShakerAtMs: 0, nextWhistleAtMs: 0 };
}

describe('Brad combo', () => {
  it('chains three lanes, each starting where the last one ends', () => {
    const lanes = planBradCombo({ x: 0, y: 0 }, { x: 100, y: 0 }, false);
    expect(lanes).toHaveLength(3);
    expect(lanes[0]).toMatchObject({ x: 0, y: 0, dirX: 1, dirY: 0 });
    expect(lanes[1]!.x).toBeCloseTo(lanes[0]!.length);
    expect(lanes[1]!.dirY).toBeGreaterThan(0);
    expect(lanes[2]!.dirY).toBeLessThan(0);
  });

  it('winds up near the player, then dashes every lane before resting', () => {
    let brain = ready(createBradBrain(0));
    brain = stepBradBrain(brain, input({ player: { x: 200, y: 0 } })).brain;
    expect(brain.mode.kind).toBe('comboWindup');

    const tuning = bradComboTuning(false);
    let now = 10_000 + tuning.windupMs;
    for (let lane = 0; lane < 3; lane += 1) {
      brain = stepBradBrain(brain, input({ nowMs: now })).brain;
      expect(brain.mode).toMatchObject({ kind: 'comboDash', lane });
      now += tuning.dashMs;
    }
    brain = stepBradBrain(brain, input({ nowMs: now })).brain;
    expect(brain.mode.kind).toBe('rest');
  });
});

describe('Brad tricks', () => {
  it('lobs a shaker at where the player stood from mid range', () => {
    let brain = ready(createBradBrain(0));
    brain = stepBradBrain(brain, input({ player: { x: 400, y: 0 } })).brain;
    expect(brain.mode.kind).toBe('shakerWindup');
    const thrown = stepBradBrain(brain, input({ nowMs: 20_000, player: { x: 0, y: 400 } }));
    expect(thrown.action).toEqual({ kind: 'throwShaker', target: { x: 400, y: 0 } });
  });

  it('whistles for a chick shield only when he has none', () => {
    const brain = ready(createBradBrain(0));
    expect(stepBradBrain(brain, input({ escorts: 0 })).brain.mode.kind).toBe('whistle');
    expect(stepBradBrain(brain, input({ escorts: 2 })).brain.mode.kind).not.toBe('whistle');
  });

  it('flexes once at half health and stays enraged', () => {
    const brain = createBradBrain(0);
    const flex = stepBradBrain(brain, input({ hp: 12 }));
    expect(flex.action).toEqual({ kind: 'flex' });
    expect(flex.brain.enraged).toBe(true);

    const later = stepBradBrain({ ...flex.brain, mode: { kind: 'stalk' } }, input({ hp: 6 }));
    expect(later.action).toBeNull();
  });
});

describe('Brad and dad jokes', () => {
  it('stands there confused, then gets back to it', () => {
    const confused = confuseBrad(createBradBrain(0), 1_000);
    expect(confused.mode.kind).toBe('confused');
    expect(stepBradBrain(confused, input({ nowMs: 1_000 + BRAD_CONFUSED_MS })).brain.mode.kind).toBe('stalk');
  });

  it('turns wingman, then leaves for good', () => {
    const ally = befriendBrad(createBradBrain(0), 1_000);
    expect(ally.mode.kind).toBe('ally');
    expect(confuseBrad(ally, 2_000)).toBe(ally);

    const done = stepBradBrain(ally, input({ nowMs: 1_000 + BRAD_ALLY_MS }));
    expect(done.action).toEqual({ kind: 'allyDone' });
    expect(done.brain.mode.kind).toBe('leaving');
  });
});
