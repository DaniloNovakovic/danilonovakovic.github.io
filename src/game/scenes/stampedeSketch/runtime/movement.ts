export const STAMPEDE_ARENA = {
  left: 275,
  right: 725,
  top: 0,
  bottom: 600,
  safeLeft: 315,
  safeRight: 685,
  safeTop: 74,
  safeBottom: 526
} as const;

export const STAMPEDE_PLAYER_SPEED = 210;
export const STAMPEDE_STICK_DEAD_ZONE = 10;
export const STAMPEDE_STICK_FULL_DISTANCE = 60;

export interface StampedeAxisInput {
  x: number;
  y: number;
}

export interface StampedePointerInput {
  active: boolean;
  deltaX: number;
  deltaY: number;
}

export interface StampedeVelocityInput {
  keyboard: StampedeAxisInput;
  pointer: StampedePointerInput;
  speed?: number;
}

export interface StampedeVelocity {
  x: number;
  y: number;
}

export interface StampedeBounds {
  safeLeft: number;
  safeRight: number;
  safeTop: number;
  safeBottom: number;
}

export function resolveStampedeVelocity({
  keyboard,
  pointer,
  speed = STAMPEDE_PLAYER_SPEED
}: StampedeVelocityInput): StampedeVelocity {
  const vector = pointer.active
    ? resolvePointerAxis(pointer)
    : normalizeAxis(keyboard.x, keyboard.y);

  return {
    x: vector.x * speed,
    y: vector.y * speed
  };
}

export function clampStampedePosition(
  position: { x: number; y: number },
  bounds: StampedeBounds = STAMPEDE_ARENA
): { x: number; y: number } {
  return {
    x: clamp(position.x, bounds.safeLeft, bounds.safeRight),
    y: clamp(position.y, bounds.safeTop, bounds.safeBottom)
  };
}

function resolvePointerAxis(pointer: StampedePointerInput): StampedeAxisInput {
  const distance = Math.hypot(pointer.deltaX, pointer.deltaY);
  if (distance < STAMPEDE_STICK_DEAD_ZONE) return { x: 0, y: 0 };

  const normalized = normalizeAxis(pointer.deltaX, pointer.deltaY);
  const intensity = clamp(
    (distance - STAMPEDE_STICK_DEAD_ZONE) /
      (STAMPEDE_STICK_FULL_DISTANCE - STAMPEDE_STICK_DEAD_ZONE),
    0,
    1
  );

  return {
    x: normalized.x * intensity,
    y: normalized.y * intensity
  };
}

function normalizeAxis(x: number, y: number): StampedeAxisInput {
  const length = Math.hypot(x, y);
  if (length === 0) return { x: 0, y: 0 };
  return {
    x: x / length,
    y: y / length
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
