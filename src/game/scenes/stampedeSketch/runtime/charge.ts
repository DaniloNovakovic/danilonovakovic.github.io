export interface StampedeChargeTuning {
  triggerDistance: number;
  windupMs: number;
  dashMs: number;
  dashSpeed: number;
  restMs: number;
}

export type StampedeChargeState =
  | { phase: 'stalk' }
  | { phase: 'windup'; untilMs: number; dirX: number; dirY: number }
  | { phase: 'dash'; untilMs: number; dirX: number; dirY: number }
  | { phase: 'rest'; untilMs: number };

export const ROOSTER_CHARGE: StampedeChargeTuning = {
  triggerDistance: 210,
  windupMs: 650,
  dashMs: 520,
  dashSpeed: 430,
  restMs: 900
};

export const EX_CHARGE: StampedeChargeTuning = {
  triggerDistance: 300,
  windupMs: 800,
  dashMs: 600,
  dashSpeed: 470,
  restMs: 1_300
};

export const STAMPEDE_CHARGE_STALK: StampedeChargeState = { phase: 'stalk' };

/**
 * Stalk until close, then stop and lock a direction (the telegraph), dash along
 * that locked line, then rest. The dash never steers, so a sidestep dodges it.
 */
export function stepStampedeCharge(
  state: StampedeChargeState,
  input: { nowMs: number; dx: number; dy: number },
  tuning: StampedeChargeTuning
): StampedeChargeState {
  switch (state.phase) {
    case 'stalk': {
      const distance = Math.hypot(input.dx, input.dy);
      if (distance > tuning.triggerDistance || distance < 1) return state;
      return {
        phase: 'windup',
        untilMs: input.nowMs + tuning.windupMs,
        dirX: input.dx / distance,
        dirY: input.dy / distance
      };
    }
    case 'windup':
      if (input.nowMs < state.untilMs) return state;
      return {
        phase: 'dash',
        untilMs: input.nowMs + tuning.dashMs,
        dirX: state.dirX,
        dirY: state.dirY
      };
    case 'dash':
      if (input.nowMs < state.untilMs) return state;
      return { phase: 'rest', untilMs: input.nowMs + tuning.restMs };
    case 'rest':
      return input.nowMs < state.untilMs ? state : STAMPEDE_CHARGE_STALK;
  }
}
