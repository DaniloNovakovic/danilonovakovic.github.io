import { describe, expect, it } from 'vitest';
import {
  beginStampedePointerControl,
  createStampedePointerControlState,
  endStampedePointerControl,
  moveStampedePointerControl,
  readStampedePointerInput
} from './pointerControl';
import { resolveStampedeVelocity } from './movement';

describe('stampede pointer control', () => {
  it('resolves external down and move into velocity deltas', () => {
    const started = beginStampedePointerControl({ pointerId: 7, x: 420, y: 300 });
    const moved = moveStampedePointerControl(started, { pointerId: 7, x: 480, y: 250 });

    expect(readStampedePointerInput(moved)).toEqual({
      active: true,
      deltaX: 60,
      deltaY: -50
    });
  });

  it('feeds pointer deltas into the same movement resolver as canvas input', () => {
    const started = beginStampedePointerControl({ pointerId: 7, x: 420, y: 300 });
    const moved = moveStampedePointerControl(started, { pointerId: 7, x: 480, y: 300 });
    const velocity = resolveStampedeVelocity({
      keyboard: { x: 0, y: 0 },
      pointer: readStampedePointerInput(moved),
      speed: 100
    });

    expect(velocity).toEqual({ x: 100, y: 0 });
  });

  it('clears pointer movement on up or cancel', () => {
    const started = beginStampedePointerControl({ pointerId: 7, x: 420, y: 300 });
    const ended = endStampedePointerControl(started, 7);

    expect(ended).toEqual(createStampedePointerControlState());
    expect(readStampedePointerInput(ended)).toEqual({
      active: false,
      deltaX: 0,
      deltaY: 0
    });
  });

  it('ignores events from a different pointer', () => {
    const started = beginStampedePointerControl({ pointerId: 7, x: 420, y: 300 });

    expect(moveStampedePointerControl(started, { pointerId: 8, x: 480, y: 250 })).toBe(started);
    expect(endStampedePointerControl(started, 8)).toBe(started);
  });
});
