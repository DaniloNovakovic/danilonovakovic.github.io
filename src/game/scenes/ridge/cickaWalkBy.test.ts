import { describe, expect, it } from 'vitest';
import {
  CICKA_WALK_BY_BARK_DURATION_MS,
  createCickaWalkByState,
  updateCickaWalkBy,
  type CickaWalkByFrame
} from './cickaWalkBy';

function createFrame(overrides: Partial<CickaWalkByFrame> = {}): CickaWalkByFrame {
  return {
    enabled: true,
    playerX: 220,
    playerY: 446,
    cickaX: 220,
    cickaY: 446,
    nowMs: 1000,
    ...overrides
  };
}

describe('cicka walk-by memory', () => {
  it('does not trigger when the memory is unavailable', () => {
    const initialState = createCickaWalkByState();

    const update = updateCickaWalkBy(initialState, createFrame({ enabled: false }));

    expect(update).toEqual({
      state: initialState,
      triggered: false,
      visible: false
    });
  });

  it('does not trigger outside the walk-by radius', () => {
    const initialState = createCickaWalkByState();

    const update = updateCickaWalkBy(initialState, createFrame({ playerX: 360 }));

    expect(update).toEqual({
      state: initialState,
      triggered: false,
      visible: false
    });
  });

  it('triggers once when the player enters range with the memory available', () => {
    const update = updateCickaWalkBy(createCickaWalkByState(), createFrame());

    expect(update.triggered).toBe(true);
    expect(update.visible).toBe(true);
    expect(update.state).toEqual({
      hasBarked: true,
      visibleUntilMs: 1000 + CICKA_WALK_BY_BARK_DURATION_MS
    });
  });

  it('does not duplicate on repeated in-range frames', () => {
    const firstUpdate = updateCickaWalkBy(createCickaWalkByState(), createFrame());
    const secondUpdate = updateCickaWalkBy(firstUpdate.state, createFrame({ nowMs: 1200 }));

    expect(secondUpdate.triggered).toBe(false);
    expect(secondUpdate.visible).toBe(true);
    expect(secondUpdate.state).toBe(firstUpdate.state);
  });

  it('hides after the bark duration elapses', () => {
    const firstUpdate = updateCickaWalkBy(createCickaWalkByState(), createFrame());
    const hiddenUpdate = updateCickaWalkBy(
      firstUpdate.state,
      createFrame({ nowMs: 1000 + CICKA_WALK_BY_BARK_DURATION_MS })
    );

    expect(hiddenUpdate.triggered).toBe(false);
    expect(hiddenUpdate.visible).toBe(false);
  });
});
