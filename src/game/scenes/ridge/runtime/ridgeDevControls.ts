import type { RidgeBridgeBeatState } from '@/game/bridge/store';
import type { BridgeStageCompositionSource } from '../bridge/stageComposition';
import type { StageAuthoringSelection } from '../bridge/stageAuthoring';

export interface RidgeDevTeleportRequest {
  sequence: number;
  label: string;
  x: number;
  y: number;
  applySpawnOffset: boolean;
}

export interface RidgeDevRouteBeatRequest {
  sequence: number;
  label: string;
  bridgeBeat: RidgeBridgeBeatState;
}

export interface RidgeDevResetRequest {
  sequence: number;
  label: string;
}

export interface RidgeDevPlayerSnapshot {
  x: number;
  y: number;
  railDepth?: number;
  railProgress?: number;
  railScale?: number;
  bridgeBeat?: RidgeBridgeBeatState;
  crossingOpen?: boolean;
  playerProgressMax?: number;
  nearestStageSpotId?: string;
  sourceSnippet?: string;
}

export interface RidgeDevDebugSettings {
  graybox: boolean;
  showColliders: boolean;
  showPlayerBody: boolean;
  showInteractZones: boolean;
  showTraversalAssists: boolean;
}

export interface RidgeDevAuthoringState {
  active: boolean;
  selection: StageAuthoringSelection | null;
}

export interface RidgeDevAuthoringDragRequest {
  selection: StageAuthoringSelection;
  worldX: number;
  worldY: number;
  offsetOnly: boolean;
  dragAnchor?: {
    worldX: number;
    worldY: number;
    targetX: number;
    targetY: number;
  };
}

export interface RidgeDevControls {
  resolveCameraZoom?: () => number | undefined;
  resolveCompositionSource?: () => BridgeStageCompositionSource | undefined;
  resolveDebugSettings?: () => Partial<RidgeDevDebugSettings> | undefined;
  resolveAuthoringState?: () => RidgeDevAuthoringState | undefined;
  consumeRouteBeatRequest?: () => RidgeDevRouteBeatRequest | null;
  consumeResetRequest?: () => RidgeDevResetRequest | null;
  consumeTeleportRequest?: () => RidgeDevTeleportRequest | null;
  publishAuthoringPick?: (selection: StageAuthoringSelection) => void;
  publishAuthoringDrag?: (request: RidgeDevAuthoringDragRequest) => void;
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
const RIDGE_DEV_MIN_CAMERA_ZOOM = 0.65;
const RIDGE_DEV_MAX_CAMERA_ZOOM = 1.6;

const RIDGE_DEV_DEFAULT_DEBUG_SETTINGS: RidgeDevDebugSettings = {
  graybox: false,
  showColliders: false,
  showPlayerBody: false,
  showInteractZones: false,
  showTraversalAssists: false
};

export function resolveRidgeDevCameraZoom(value: number | undefined): number {
  if (!Number.isFinite(value)) return RIDGE_DEFAULT_CAMERA_ZOOM;
  return Math.min(
    RIDGE_DEV_MAX_CAMERA_ZOOM,
    Math.max(RIDGE_DEV_MIN_CAMERA_ZOOM, Math.round((value ?? RIDGE_DEFAULT_CAMERA_ZOOM) * 100) / 100)
  );
}

export function resolveRidgeDevDebugSettings(
  value: Partial<RidgeDevDebugSettings> | undefined
): RidgeDevDebugSettings {
  return {
    ...RIDGE_DEV_DEFAULT_DEBUG_SETTINGS,
    ...value
  };
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
