import { pickRoomInteractTarget } from '../../core/ecs/systems/roomInteractSystems';

export interface InteriorInteractionPrompt {
  x: number;
  y: number;
}

/**
 * Plain target facts for an interior prop. Scenes own Phaser objects and side effects;
 * this runtime only decides active target, prompt placement, and typed effect commands.
 */
export interface InteriorInteractionTarget<Id extends string, Effect> {
  id: Id;
  kind: string;
  /** X coordinate used for proximity checks. */
  x: number;
  /** Y coordinate used for proximity checks, usually the prop's player-facing anchor. */
  distanceAnchorY: number;
  /** Overrides the room default radius for targets with larger/smaller hotspots. */
  interactRadius?: number;
  prompt: InteriorInteractionPrompt;
  /** Disabled targets are ignored for both prompt display and effects. */
  enabled?: () => boolean;
  /** Function effects are resolved at interaction time so gates can read current state. */
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

/**
 * Creates a Phaser-free interaction runtime for interior rooms. Exit requests take
 * precedence over target effects, and prompt visibility is returned as data for the
 * scene to apply to its own text objects.
 */
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
