export interface StampedePointerPoint {
  pointerId: number;
  x: number;
  y: number;
}

export interface StampedePointerControlState {
  active: boolean;
  pointerId: number | null;
  anchorX: number;
  anchorY: number;
  currentX: number;
  currentY: number;
}

export interface StampedePointerInputSnapshot {
  active: boolean;
  deltaX: number;
  deltaY: number;
}

export function createStampedePointerControlState(): StampedePointerControlState {
  return {
    active: false,
    pointerId: null,
    anchorX: 0,
    anchorY: 0,
    currentX: 0,
    currentY: 0
  };
}

export function beginStampedePointerControl(
  point: StampedePointerPoint
): StampedePointerControlState {
  return {
    active: true,
    pointerId: point.pointerId,
    anchorX: point.x,
    anchorY: point.y,
    currentX: point.x,
    currentY: point.y
  };
}

export function moveStampedePointerControl(
  state: StampedePointerControlState,
  point: StampedePointerPoint
): StampedePointerControlState {
  if (!state.active || state.pointerId !== point.pointerId) return state;
  return {
    ...state,
    currentX: point.x,
    currentY: point.y
  };
}

export function endStampedePointerControl(
  state: StampedePointerControlState,
  pointerId: number
): StampedePointerControlState {
  if (!state.active || state.pointerId !== pointerId) return state;
  return createStampedePointerControlState();
}

export function readStampedePointerInput(
  state: StampedePointerControlState
): StampedePointerInputSnapshot {
  if (!state.active) return { active: false, deltaX: 0, deltaY: 0 };

  return {
    active: true,
    deltaX: state.currentX - state.anchorX,
    deltaY: state.currentY - state.anchorY
  };
}
