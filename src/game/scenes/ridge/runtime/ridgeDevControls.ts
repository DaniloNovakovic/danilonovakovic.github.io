import type { RidgeBridgeBeatState } from '@/game/bridge/store';

/** Lightweight Ridge DEV readouts for the stick/console rebuild. */
export interface RidgeDevPlayerSnapshot {
  progress: number;
  beat: RidgeBridgeBeatState;
  mode: 'explore' | 'conversation';
  nearby: string[];
}

export interface RidgeDevControls {
  publishPlayerSnapshot?: (snapshot: RidgeDevPlayerSnapshot) => void;
}
