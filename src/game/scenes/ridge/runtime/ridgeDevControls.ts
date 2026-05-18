export interface RidgeDevTeleportRequest {
  sequence: number;
  label: string;
  x: number;
  y: number;
  applySpawnOffset: boolean;
}

export interface RidgeDevPlayerSnapshot {
  x: number;
  y: number;
}

export interface RidgeDevControls {
  resolveCameraZoom?: () => number | undefined;
  consumeTeleportRequest?: () => RidgeDevTeleportRequest | null;
  publishPlayerSnapshot?: (snapshot: RidgeDevPlayerSnapshot) => void;
}

export interface RidgeDevTeleportPlayer {
  x: number;
  y: number;
  body?: {
    setAllowGravity?: (allowGravity: boolean) => void;
  };
  setPosition?: (x: number, y: number) => void;
  setVelocityX?: (velocityX: number) => void;
  setVelocityY?: (velocityY: number) => void;
}

export const RIDGE_PLAYER_SPAWN_OFFSET_Y = -80;
export const RIDGE_DEFAULT_CAMERA_ZOOM = 1;
export const RIDGE_DEV_MIN_CAMERA_ZOOM = 0.65;
export const RIDGE_DEV_MAX_CAMERA_ZOOM = 1.6;

export function resolveRidgeDevCameraZoom(value: number | undefined): number {
  if (!Number.isFinite(value)) return RIDGE_DEFAULT_CAMERA_ZOOM;
  return Math.min(
    RIDGE_DEV_MAX_CAMERA_ZOOM,
    Math.max(RIDGE_DEV_MIN_CAMERA_ZOOM, Math.round((value ?? RIDGE_DEFAULT_CAMERA_ZOOM) * 100) / 100)
  );
}

export function resolveRidgeDevTeleportPosition(
  request: RidgeDevTeleportRequest
): { x: number; y: number } {
  return {
    x: request.x,
    y: request.y + (request.applySpawnOffset ? RIDGE_PLAYER_SPAWN_OFFSET_Y : 0)
  };
}

export function applyRidgeDevTeleportToPlayer(
  player: RidgeDevTeleportPlayer,
  request: RidgeDevTeleportRequest
): { x: number; y: number } {
  const position = resolveRidgeDevTeleportPosition(request);
  if (player.setPosition) {
    player.setPosition(position.x, position.y);
  } else {
    player.x = position.x;
    player.y = position.y;
  }
  player.setVelocityX?.(0);
  player.setVelocityY?.(0);
  player.body?.setAllowGravity?.(true);
  return position;
}
