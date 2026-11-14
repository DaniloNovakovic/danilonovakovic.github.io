import type { RidgeRouteBeatState } from '@/game/bridge/store';
import type { RidgeMode } from '@/game/core/ridge';

/** Lightweight Ridge DEV readouts for the stick/console rebuild. */
export interface RidgeDevPlayerSnapshot {
  progress: number;
  beat: RidgeRouteBeatState;
  mode: RidgeMode;
  nearby: string[];
}

export interface RidgeDevControls {
  publishPlayerSnapshot?: (snapshot: RidgeDevPlayerSnapshot) => void;
}
