export const PORTRAIT_COVER_DRAG_MAX_DISTANCE_PX = 44;
export const PORTRAIT_COVER_TAP_THRESHOLD_PX = 15;
export const PORTRAIT_COVER_MOVEMENT_DEADZONE = 0.18;

export function resolvePortraitCoverHorizontalAxis(
  deltaX: number,
  maxDistance = PORTRAIT_COVER_DRAG_MAX_DISTANCE_PX,
  deadzone = PORTRAIT_COVER_MOVEMENT_DEADZONE
): number {
  const normalized = Math.max(-1, Math.min(1, deltaX / maxDistance));
  return Math.abs(normalized) >= deadzone ? normalized : 0;
}

export function shouldPortraitCoverDragActivate(
  deltaX: number,
  threshold = PORTRAIT_COVER_TAP_THRESHOLD_PX
): boolean {
  return Math.abs(deltaX) > threshold;
}
