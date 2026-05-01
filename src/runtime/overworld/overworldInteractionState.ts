import {
  pickGlassesSecretTarget,
  pickOverworldInteractTarget,
  type OverworldBuildingSlot,
  type OverworldInteractPickOptions,
  type OverworldSecretSlot
} from '../../core/ecs/systems/overworldInteractSystems';

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
}

export interface OverworldInteractionInput {
  playerX: number;
  playerY: number;
  interactRequested: boolean;
  hasGlassesEquipped: boolean;
  bananaDiscovered: boolean;
  bananaWarpScheduled: boolean;
  bananaCancelExtraDist: number;
  basementFeatureId: string;
  potassiumFeatureId: string;
  basementHole: BasementHoleInteraction;
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
  const peelSlot = input.secretSlots[0];

  if (peelSlot && (input.bananaWarpScheduled || nextState.bananaFirstPeelPending)) {
    const distToPeel = Math.hypot(input.playerX - peelSlot.x, input.playerY - peelSlot.y);
    if (distToPeel > peelSlot.radius + input.bananaCancelExtraDist) {
      nextState.bananaFirstPeelPending = false;
      effects.push({ type: 'cancelBananaPeel' });
    }
  }

  if (isNearBasementHole(input.playerX, input.playerY, input.basementHole)) {
    if (input.bananaWarpScheduled || nextState.bananaFirstPeelPending) {
      nextState.bananaFirstPeelPending = false;
      effects.push({ type: 'cancelBananaPeel' });
    }
    if (input.interactRequested) {
      effects.push({ type: 'enter', targetId: input.basementFeatureId });
    }
    return {
      state: nextState,
      effects,
      prompt: {
        visible: true,
        text: input.texts.basement,
        x: input.basementHole.x,
        y: input.basementHole.promptY
      }
    };
  }

  const secret = pickGlassesSecretTarget(
    input.playerX,
    input.playerY,
    input.hasGlassesEquipped,
    input.secretSlots
  );
  const nearPeel = secret.secretId != null && secret.promptX != null && secret.promptY != null;

  if (nearPeel && secret.promptX != null && secret.promptY != null) {
    if (
      input.interactRequested &&
      !nextState.bananaFirstPeelPending &&
      !input.bananaWarpScheduled
    ) {
      if (input.bananaDiscovered) {
        effects.push({ type: 'enter', targetId: input.potassiumFeatureId });
      } else {
        nextState.bananaFirstPeelPending = true;
        effects.push({ type: 'discoverBananaPeel' });
      }
    }

    return {
      state: nextState,
      effects,
      prompt:
        input.bananaWarpScheduled || nextState.bananaFirstPeelPending
          ? { visible: false }
          : {
              visible: true,
              text: input.bananaDiscovered
                ? input.texts.bananaDiscovered
                : input.texts.bananaUndiscovered,
              x: secret.promptX,
              y: secret.promptY
            }
    };
  }

  const interact = pickOverworldInteractTarget(
    input.playerX,
    input.playerY,
    input.buildingSlots,
    input.buildingPickOptions
  );
  if (interact.buildingId != null && interact.promptX != null && interact.promptY != null) {
    if (input.interactRequested) {
      effects.push({ type: 'enter', targetId: interact.buildingId });
    }
    return {
      state: nextState,
      effects,
      prompt: {
        visible: true,
        text: input.texts.enter,
        x: interact.promptX,
        y: interact.promptY
      }
    };
  }

  return { state: nextState, effects, prompt: { visible: false } };
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
