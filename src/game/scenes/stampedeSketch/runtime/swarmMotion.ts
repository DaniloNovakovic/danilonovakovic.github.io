import type { StampedeSwarmMode } from './swarmPresentation';

export interface StampedeSwarmMotion {
  speedMultiplier: number;
  wobbleMultiplier: number;
  alphaMultiplier: number;
  scaleMultiplier: number;
  orbitRadius: number;
  centerBias: number;
}

interface StampedeSwarmPoint {
  x: number;
  y: number;
}

interface ResolveStampedeSwarmTargetInput {
  target: StampedeSwarmPoint;
  phase: number;
  mode: StampedeSwarmMode;
  pressure: number;
  nowMs: number;
}

export function getStampedeSwarmMotion(
  mode: StampedeSwarmMode,
  pressure: number
): StampedeSwarmMotion {
  switch (mode) {
    case 'build':
      return {
        speedMultiplier: 1.28 + pressure * 0.48,
        wobbleMultiplier: 1.1 + pressure * 0.35,
        alphaMultiplier: 1.05 + pressure * 0.18,
        scaleMultiplier: 1 + pressure * 0.08,
        orbitRadius: 42 - pressure * 12,
        centerBias: pressure * 0.25
      };
    case 'surge':
      return {
        speedMultiplier: 1.85 + pressure * 0.65,
        wobbleMultiplier: 1.45 + pressure * 0.4,
        alphaMultiplier: 1.2 + pressure * 0.24,
        scaleMultiplier: 1.08 + pressure * 0.16,
        orbitRadius: 28 - pressure * 6,
        centerBias: 0.62 + pressure * 0.18
      };
    case 'recover':
      return {
        speedMultiplier: 0.82 + pressure * 0.12,
        wobbleMultiplier: 0.86,
        alphaMultiplier: 0.92,
        scaleMultiplier: 0.96,
        orbitRadius: 62,
        centerBias: 0
      };
    case 'calm':
    default:
      return {
        speedMultiplier: 1,
        wobbleMultiplier: 1,
        alphaMultiplier: 1,
        scaleMultiplier: 1,
        orbitRadius: 54,
        centerBias: 0
      };
  }
}

export function resolveStampedeSwarmTarget({
  target,
  phase,
  mode,
  pressure,
  nowMs
}: ResolveStampedeSwarmTargetInput): StampedeSwarmPoint {
  const motion = getStampedeSwarmMotion(mode, pressure);
  const angle = phase + nowMs / 1450;
  const offsetScale = 1 - clamp(motion.centerBias, 0, 0.92);

  return {
    x: target.x + Math.cos(angle) * motion.orbitRadius * offsetScale,
    y: target.y + Math.sin(angle) * motion.orbitRadius * 0.72 * offsetScale
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
