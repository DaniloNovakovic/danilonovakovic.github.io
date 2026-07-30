import {
  pickGlassesSecretTarget,
  pickOverworldInteractTarget,
  type OverworldBuildingSlot,
  type OverworldInteractPickOptions,
  type OverworldSecretSlot
} from '@/game/core/ecs/systems/overworldInteractSystems';

export interface OverworldInteractionState {
  bananaFirstPeelPending: boolean;
}

export interface BasementHoleInteraction {
  x: number;
  y: number;
  promptY: number;
  interactDistanceX: number;
  minPlayerY: number;
}

export interface OverworldInteractionTexts {
  basement: string;
  enter: string;
  bananaUndiscovered: string;
  bananaDiscovered: string;
  circuitCrtLocked: string;
  circuitCrtReady: string;
}

export interface CircuitSlotInteraction {
  x: number;
  y: number;
  promptY: number;
  interactDistanceX: number;
  minPlayerY: number;
  ridgeSceneId: string;
}

export interface OverworldInteractionInput {
  playerX: number;
  playerY: number;
  interactRequested: boolean;
  hasGlassesEquipped: boolean;
  hasCircuit: boolean;
  bananaDiscovered: boolean;
  bananaWarpScheduled: boolean;
  bananaCancelExtraDist: number;
  basementSceneId: string;
  potassiumSceneId: string;
  basementHole: BasementHoleInteraction;
  circuitSlot: CircuitSlotInteraction;
  secretSlots: readonly OverworldSecretSlot[];
  buildingSlots: readonly OverworldBuildingSlot[];
  buildingPickOptions: OverworldInteractPickOptions;
  texts: OverworldInteractionTexts;
}

export type OverworldInteractionEffect =
  | { type: 'cancelBananaPeel' }
  | { type: 'discoverBananaPeel' }
  | { type: 'enter'; targetId: string };

export type OverworldInteractionPrompt =
  | { visible: false }
  | { visible: true; text: string; x: number; y: number };

export interface OverworldInteractionResult {
  state: OverworldInteractionState;
  prompt: OverworldInteractionPrompt;
  effects: OverworldInteractionEffect[];
}

export function createOverworldInteractionState(): OverworldInteractionState {
  return { bananaFirstPeelPending: false };
}

export function decideOverworldInteraction(
  state: OverworldInteractionState,
  input: OverworldInteractionInput
): OverworldInteractionResult {
  const nextState = { ...state };
  const effects: OverworldInteractionEffect[] = [];

  syncBananaPeelCancellation(nextState, effects, input);

  const basement = resolveBasementInteraction(nextState, effects, input);
  if (basement) return basement;

  const peel = resolveBananaPeelInteraction(nextState, effects, input);
  if (peel) return peel;

  const circuitCrt = resolveCircuitCrtInteraction(nextState, effects, input);
  if (circuitCrt) return circuitCrt;

  const building = resolveBuildingInteraction(nextState, effects, input);
  if (building) return building;

  return { state: nextState, effects, prompt: { visible: false } };
}

function syncBananaPeelCancellation(
  state: OverworldInteractionState,
  effects: OverworldInteractionEffect[],
  input: OverworldInteractionInput
): void {
  const peelSlot = input.secretSlots[0];
  if (!peelSlot || (!input.bananaWarpScheduled && !state.bananaFirstPeelPending)) return;

  const distToPeel = Math.hypot(input.playerX - peelSlot.x, input.playerY - peelSlot.y);
  if (distToPeel > peelSlot.radius + input.bananaCancelExtraDist) {
    state.bananaFirstPeelPending = false;
    effects.push({ type: 'cancelBananaPeel' });
  }
}

function resolveBasementInteraction(
  state: OverworldInteractionState,
  effects: OverworldInteractionEffect[],
  input: OverworldInteractionInput
): OverworldInteractionResult | null {
  if (!isNearBasementHole(input.playerX, input.playerY, input.basementHole)) return null;

  if (input.bananaWarpScheduled || state.bananaFirstPeelPending) {
    state.bananaFirstPeelPending = false;
    effects.push({ type: 'cancelBananaPeel' });
  }
  if (input.interactRequested) {
    effects.push({ type: 'enter', targetId: input.basementSceneId });
  }

  return {
    state,
    effects,
    prompt: {
      visible: true,
      text: input.texts.basement,
      x: input.basementHole.x,
      y: input.basementHole.promptY
    }
  };
}

function resolveBananaPeelInteraction(
  state: OverworldInteractionState,
  effects: OverworldInteractionEffect[],
  input: OverworldInteractionInput
): OverworldInteractionResult | null {
  const secret = pickGlassesSecretTarget(
    input.playerX,
    input.playerY,
    input.hasGlassesEquipped,
    input.secretSlots
  );
  if (secret.secretId == null || secret.promptX == null || secret.promptY == null) return null;

  if (
    input.interactRequested &&
    !state.bananaFirstPeelPending &&
    !input.bananaWarpScheduled
  ) {
    if (input.bananaDiscovered) {
      effects.push({ type: 'enter', targetId: input.potassiumSceneId });
    } else {
      state.bananaFirstPeelPending = true;
      effects.push({ type: 'discoverBananaPeel' });
    }
  }

  return {
    state,
    effects,
    prompt: buildBananaPeelPrompt(state, input, secret.promptX, secret.promptY)
  };
}

function buildBananaPeelPrompt(
  state: OverworldInteractionState,
  input: OverworldInteractionInput,
  promptX: number,
  promptY: number
): OverworldInteractionPrompt {
  if (input.bananaWarpScheduled || state.bananaFirstPeelPending) {
    return { visible: false };
  }
  return {
    visible: true,
    text: input.bananaDiscovered ? input.texts.bananaDiscovered : input.texts.bananaUndiscovered,
    x: promptX,
    y: promptY
  };
}

function resolveCircuitCrtInteraction(
  state: OverworldInteractionState,
  effects: OverworldInteractionEffect[],
  input: OverworldInteractionInput
): OverworldInteractionResult | null {
  if (!isNearCircuitSlot(input.playerX, input.playerY, input.circuitSlot)) return null;

  if (input.interactRequested && input.hasCircuit) {
    effects.push({ type: 'enter', targetId: input.circuitSlot.ridgeSceneId });
  }

  return {
    state,
    effects,
    prompt: {
      visible: true,
      text: input.hasCircuit ? input.texts.circuitCrtReady : input.texts.circuitCrtLocked,
      x: input.circuitSlot.x,
      y: input.circuitSlot.promptY
    }
  };
}

function resolveBuildingInteraction(
  state: OverworldInteractionState,
  effects: OverworldInteractionEffect[],
  input: OverworldInteractionInput
): OverworldInteractionResult | null {
  const interact = pickOverworldInteractTarget(
    input.playerX,
    input.playerY,
    input.buildingSlots,
    input.buildingPickOptions
  );
  if (interact.buildingId == null || interact.promptX == null || interact.promptY == null) {
    return null;
  }

  if (input.interactRequested) {
    effects.push({ type: 'enter', targetId: interact.buildingId });
  }

  return {
    state,
    effects,
    prompt: {
      visible: true,
      text: input.texts.enter,
      x: interact.promptX,
      y: interact.promptY
    }
  };
}

function isNearBasementHole(
  playerX: number,
  playerY: number,
  basementHole: BasementHoleInteraction
): boolean {
  return (
    Math.abs(playerX - basementHole.x) < basementHole.interactDistanceX &&
    playerY > basementHole.minPlayerY
  );
}

function isNearCircuitSlot(
  playerX: number,
  playerY: number,
  circuitSlot: CircuitSlotInteraction
): boolean {
  return (
    Math.abs(playerX - circuitSlot.x) < circuitSlot.interactDistanceX &&
    playerY > circuitSlot.minPlayerY
  );
}
