import { pickRoomInteractTarget } from '../../core/ecs/systems/roomInteractSystems';

export interface InteriorInteractionPrompt {
  x: number;
  y: number;
}

export interface InteriorInteractionTarget<Id extends string, Effect> {
  id: Id;
  kind: string;
  x: number;
  distanceAnchorY: number;
  interactRadius?: number;
  prompt: InteriorInteractionPrompt;
  enabled?: () => boolean;
  effect: Effect | (() => Effect);
}

export interface InteriorInteractionRuntimeOptions<Id extends string, Effect> {
  targets: readonly InteriorInteractionTarget<Id, Effect>[];
  interactRadius: number;
  exitEffect?: Effect;
}

export interface InteriorInteractionUpdateFrame {
  playerX: number;
  playerY: number;
  interactRequested: boolean;
  exitRequested: boolean;
}

export type InteriorInteractionRuntimePrompt =
  | { visible: false }
  | { visible: true; x: number; y: number };

export interface InteriorInteractionRuntimeUpdate<Id extends string, Effect> {
  activeTarget: InteriorInteractionTarget<Id, Effect> | null;
  prompt: InteriorInteractionRuntimePrompt;
  effect: Effect | null;
}

export interface InteriorInteractionRuntime<Id extends string, Effect> {
  update(frame: InteriorInteractionUpdateFrame): InteriorInteractionRuntimeUpdate<Id, Effect>;
}

function resolveEffect<Effect>(effect: Effect | (() => Effect)): Effect {
  if (typeof effect !== 'function') return effect;
  return (effect as () => Effect)();
}

function pickInteriorInteractionTarget<Id extends string, Effect>(
  playerX: number,
  playerY: number,
  targets: readonly InteriorInteractionTarget<Id, Effect>[],
  interactRadius: number
): InteriorInteractionTarget<Id, Effect> | null {
  const hasTargetRadius = targets.some((target) => target.interactRadius !== undefined);
  if (!hasTargetRadius) {
    const picked = pickRoomInteractTarget(playerX, playerY, targets, interactRadius);
    return picked.id ? targets.find((target) => target.id === picked.id) ?? null : null;
  }

  for (const target of targets) {
    const dx = playerX - target.x;
    const dy = playerY - target.distanceAnchorY;
    if (Math.hypot(dx, dy) < (target.interactRadius ?? interactRadius)) {
      return target;
    }
  }

  return null;
}

export function createInteriorInteractionRuntime<Id extends string, Effect>(
  options: InteriorInteractionRuntimeOptions<Id, Effect>
): InteriorInteractionRuntime<Id, Effect> {
  return {
    update(frame) {
      if (frame.exitRequested && options.exitEffect !== undefined) {
        return {
          activeTarget: null,
          prompt: { visible: false },
          effect: options.exitEffect
        };
      }

      const enabledTargets = options.targets.filter((target) => target.enabled?.() ?? true);
      const activeTarget = pickInteriorInteractionTarget(
        frame.playerX,
        frame.playerY,
        enabledTargets,
        options.interactRadius
      );

      if (!activeTarget) {
        return {
          activeTarget: null,
          prompt: { visible: false },
          effect: null
        };
      }

      return {
        activeTarget,
        prompt: { visible: true, x: activeTarget.prompt.x, y: activeTarget.prompt.y },
        effect: frame.interactRequested ? resolveEffect(activeTarget.effect) : null
      };
    }
  };
}
