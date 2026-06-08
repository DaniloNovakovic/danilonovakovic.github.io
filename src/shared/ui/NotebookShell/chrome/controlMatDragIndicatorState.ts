export interface ControlMatDragIndicatorState {
  anchorX: number;
  anchorY: number;
  currentX: number;
  currentY: number;
}

export type ControlMatDragIndicatorAction =
  | { type: 'begin'; point: { x: number; y: number } }
  | { type: 'move'; point: { x: number; y: number } }
  | { type: 'clear' };

export function reduceControlMatDragIndicator(
  state: ControlMatDragIndicatorState | null,
  action: ControlMatDragIndicatorAction
): ControlMatDragIndicatorState | null {
  switch (action.type) {
    case 'begin':
      return {
        anchorX: action.point.x,
        anchorY: action.point.y,
        currentX: action.point.x,
        currentY: action.point.y
      };
    case 'move':
      return state
        ? { ...state, currentX: action.point.x, currentY: action.point.y }
        : null;
    case 'clear':
      return null;
  }
}
