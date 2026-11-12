import { describe, expect, it } from 'vitest';
import {
  createStampedeJealousy,
  deferStampedeBoyfriendVisit,
  STAMPEDE_JEALOUSY_HEARTS,
  stepStampedeJealousy,
  type StampedeJealousyInput
} from './jealousy';

const DURATION = 150_000;

function input(overrides: Partial<StampedeJealousyInput>): StampedeJealousyInput {
  return {
    elapsedMs: 0,
    durationMs: DURATION,
    heartsAdded: 0,
    exOnField: false,
    boyfriendOnField: false,
    ...overrides
  };
}

describe('jealousy', () => {
  it('warns once the flock has swooned enough, without arriving early', () => {
    const step = stepStampedeJealousy(
      createStampedeJealousy(),
      input({ elapsedMs: 40_000, heartsAdded: STAMPEDE_JEALOUSY_HEARTS })
    );
    expect(step.event).toBe('foreshadow');

    const again = stepStampedeJealousy(step.state, input({ elapsedMs: 41_000, heartsAdded: 5 }));
    expect(again.event).toBeNull();
  });

  it('arrives at 1:50 when jealous enough, but waits for the ex to leave', () => {
    const jealous = { hearts: STAMPEDE_JEALOUSY_HEARTS, foreshadowed: true, visits: 0 };
    expect(stepStampedeJealousy(jealous, input({ elapsedMs: 110_000, exOnField: true })).event).toBeNull();
    expect(stepStampedeJealousy(jealous, input({ elapsedMs: 110_000 })).event).toBe('arrive');
  });

  it('always arrives by Last Call, jealous or not', () => {
    const calm = createStampedeJealousy();
    expect(stepStampedeJealousy(calm, input({ elapsedMs: 129_000 })).event).toBeNull();
    const step = stepStampedeJealousy(calm, input({ elapsedMs: 130_000, exOnField: true }));
    expect(step.event).toBe('arrive');
    expect(step.state.visits).toBe(1);
  });

  it('returns on a beat in endless overtime, never twice at once', () => {
    const visited = { hearts: 0, foreshadowed: true, visits: 1 };
    expect(stepStampedeJealousy(visited, input({ elapsedMs: DURATION + 59_000 })).event).toBeNull();
    expect(stepStampedeJealousy(visited, input({ elapsedMs: DURATION + 60_000 })).event).toBe('arrive');
    expect(stepStampedeJealousy(
      visited,
      input({ elapsedMs: DURATION + 60_000, boyfriendOnField: true })
    ).event).toBeNull();

    const twice = { ...visited, visits: 2 };
    expect(stepStampedeJealousy(twice, input({ elapsedMs: DURATION + 100_000 })).event).toBeNull();
    expect(stepStampedeJealousy(twice, input({ elapsedMs: DURATION + 150_000 })).event).toBe('arrive');
  });

  it('puts a missed arrival back so the same beat can try again', () => {
    const due = stepStampedeJealousy(
      { hearts: 0, foreshadowed: true, visits: 1 },
      input({ elapsedMs: DURATION + 60_000 })
    );
    expect(due.event).toBe('arrive');

    const held = deferStampedeBoyfriendVisit(due.state);
    expect(held.visits).toBe(1);
    expect(stepStampedeJealousy(held, input({ elapsedMs: DURATION + 60_000 })).event).toBe('arrive');

    const kept = stepStampedeJealousy(due.state, input({ elapsedMs: DURATION + 60_000 }));
    expect(kept.event).toBeNull();
  });
});
