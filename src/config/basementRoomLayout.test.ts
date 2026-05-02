import { describe, expect, it } from 'vitest';
import {
  BASEMENT_GAMES_OVERLAY_ID,
  BASEMENT_ROOM_INTERACTABLES,
  createBasementInteractionTargets
} from './basementRoomLayout';

describe('basement room layout', () => {
  it('includes exit, computer, and glasses pickup with unique interactable ids', () => {
    const ids = BASEMENT_ROOM_INTERACTABLES.map((target) => target.id);

    expect(ids).toEqual(['computer', 'glasses', 'exit']);
    expect(new Set(ids).size).toBe(ids.length);
    expect(BASEMENT_ROOM_INTERACTABLES.every((target) => target.radius > 0)).toBe(true);
    expect(BASEMENT_ROOM_INTERACTABLES.every((target) => Number.isFinite(target.prompt.y))).toBe(true);
  });

  it('resolves basement computer effect from current glasses ownership', () => {
    let hasGlasses = false;
    const computer = createBasementInteractionTargets({ isGlassesOwned: () => hasGlasses }).find(
      (target) => target.id === 'computer'
    );

    expect(computer).toBeDefined();
    expect(typeof computer!.effect).toBe('function');
    expect((computer!.effect as () => unknown)()).toEqual({
      kind: 'showThought',
      text: "ughh... I can't see"
    });

    hasGlasses = true;

    expect((computer!.effect as () => unknown)()).toEqual({
      kind: 'openOverlay',
      id: BASEMENT_GAMES_OVERLAY_ID
    });
  });

  it('disables glasses pickup after glasses are owned', () => {
    let hasGlasses = false;
    const glasses = createBasementInteractionTargets({ isGlassesOwned: () => hasGlasses }).find(
      (target) => target.id === 'glasses'
    );

    expect(glasses?.enabled?.()).toBe(true);

    hasGlasses = true;

    expect(glasses?.enabled?.()).toBe(false);
  });
});
