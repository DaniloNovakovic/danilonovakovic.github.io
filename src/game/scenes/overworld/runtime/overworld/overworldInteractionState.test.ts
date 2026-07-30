import { describe, expect, it } from 'vitest';
import {
  createOverworldInteractionState,
  decideOverworldInteraction,
  type OverworldInteractionInput
} from './overworldInteractionState';

const baseInput: OverworldInteractionInput = {
  playerX: 0,
  playerY: 0,
  interactRequested: false,
  hasGlassesEquipped: false,
  hasCircuit: false,
  bananaDiscovered: false,
  bananaWarpScheduled: false,
  bananaCancelExtraDist: 36,
  basementSceneId: 'basement',
  potassiumSceneId: 'potassium',
  basementHole: {
    x: 230,
    y: 535,
    promptY: 485,
    interactDistanceX: 70,
    minPlayerY: 400
  },
  circuitSlot: {
    x: 1650,
    y: 520,
    promptY: 455,
    interactDistanceX: 78,
    minPlayerY: 400,
    ridgeSceneId: 'ridge'
  },
  secretSlots: [{ secretId: 'banana-peel-clue', x: 650, y: 535, radius: 95, promptOffsetY: -56 }],
  buildingSlots: [{ buildingId: 'profile', x: 900, y: 500 }],
  buildingPickOptions: {
    maxDistX: 80,
    minPlayerY: 400,
    promptOffsetY: -120
  },
  texts: {
    basement: '[E] Interact',
    enter: '[E] Enter',
    bananaUndiscovered: '[E] Peel?',
    bananaDiscovered: '[E] Peel banana',
    circuitCrtLocked: 'A blank CRT. Needs a Circuit.',
    circuitCrtReady: '[E] Insert Circuit'
  }
};

describe('decideOverworldInteraction', () => {
  it('prioritizes basement hole over other interactions', () => {
    const result = decideOverworldInteraction(createOverworldInteractionState(), {
      ...baseInput,
      playerX: 230,
      playerY: 535,
      interactRequested: true
    });

    expect(result.prompt).toEqual({ visible: true, text: '[E] Interact', x: 230, y: 485 });
    expect(result.effects).toContainEqual({ type: 'enter', targetId: 'basement' });
  });

  it('starts first banana peel flow when undiscovered', () => {
    const result = decideOverworldInteraction(createOverworldInteractionState(), {
      ...baseInput,
      playerX: 650,
      playerY: 535,
      hasGlassesEquipped: true,
      interactRequested: true
    });

    expect(result.state.bananaFirstPeelPending).toBe(true);
    expect(result.prompt.visible).toBe(false);
    expect(result.effects).toEqual([{ type: 'discoverBananaPeel' }]);
  });

  it('enters potassium directly after banana peel is discovered', () => {
    const result = decideOverworldInteraction(createOverworldInteractionState(), {
      ...baseInput,
      playerX: 650,
      playerY: 535,
      hasGlassesEquipped: true,
      bananaDiscovered: true,
      interactRequested: true
    });

    expect(result.prompt).toEqual({ visible: true, text: '[E] Peel banana', x: 650, y: 479 });
    expect(result.effects).toEqual([{ type: 'enter', targetId: 'potassium' }]);
  });

  it('cancels pending banana peel when player walks away', () => {
    const result = decideOverworldInteraction({ bananaFirstPeelPending: true }, {
      ...baseInput,
      playerX: 900,
      playerY: 535,
      hasGlassesEquipped: true
    });

    expect(result.state.bananaFirstPeelPending).toBe(false);
    expect(result.effects).toContainEqual({ type: 'cancelBananaPeel' });
  });

  it('shows locked CRT prompt without Circuit and does not enter Ridge', () => {
    const result = decideOverworldInteraction(createOverworldInteractionState(), {
      ...baseInput,
      playerX: 1650,
      playerY: 520,
      interactRequested: true
    });

    expect(result.prompt).toEqual({
      visible: true,
      text: 'A blank CRT. Needs a Circuit.',
      x: 1650,
      y: 455
    });
    expect(result.effects).toEqual([]);
  });

  it('inserts Circuit into the CRT and enters Ridge', () => {
    const result = decideOverworldInteraction(createOverworldInteractionState(), {
      ...baseInput,
      playerX: 1650,
      playerY: 520,
      hasCircuit: true,
      interactRequested: true
    });

    expect(result.prompt).toEqual({
      visible: true,
      text: '[E] Insert Circuit',
      x: 1650,
      y: 455
    });
    expect(result.effects).toEqual([{ type: 'enter', targetId: 'ridge' }]);
  });

  it('falls back to normal building prompt and enter effect', () => {
    const result = decideOverworldInteraction(createOverworldInteractionState(), {
      ...baseInput,
      playerX: 900,
      playerY: 500,
      interactRequested: true
    });

    expect(result.prompt).toEqual({ visible: true, text: '[E] Enter', x: 900, y: 380 });
    expect(result.effects).toEqual([{ type: 'enter', targetId: 'profile' }]);
  });
});
