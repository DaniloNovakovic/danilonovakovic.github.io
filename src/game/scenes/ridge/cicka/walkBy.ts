const CICKA_WALK_BY_RADIUS = 88;
export const CICKA_WALK_BY_BARK_DURATION_MS = 2600;

export interface CickaWalkByState {
  hasBarked: boolean;
  visibleUntilMs: number;
}

export interface CickaWalkByFrame {
  enabled: boolean;
  playerX: number;
  playerY: number;
  cickaX: number;
  cickaY: number;
  nowMs: number;
}

export interface CickaWalkByUpdate {
  state: CickaWalkByState;
  triggered: boolean;
  visible: boolean;
}

export function createCickaWalkByState(): CickaWalkByState {
  return {
    hasBarked: false,
    visibleUntilMs: 0
  };
}

export function updateCickaWalkBy(
  state: CickaWalkByState,
  frame: CickaWalkByFrame
): CickaWalkByUpdate {
  const visible = frame.nowMs < state.visibleUntilMs;
  if (!frame.enabled) {
    return {
      state,
      triggered: false,
      visible: false
    };
  }

  if (state.hasBarked) {
    return {
      state,
      triggered: false,
      visible
    };
  }

  const dx = frame.playerX - frame.cickaX;
  const dy = frame.playerY - frame.cickaY;
  const isNearCicka = dx * dx + dy * dy <= CICKA_WALK_BY_RADIUS * CICKA_WALK_BY_RADIUS;
  if (!isNearCicka) {
    return {
      state,
      triggered: false,
      visible: false
    };
  }

  const nextState = {
    hasBarked: true,
    visibleUntilMs: frame.nowMs + CICKA_WALK_BY_BARK_DURATION_MS
  };

  return {
    state: nextState,
    triggered: true,
    visible: true
  };
}
