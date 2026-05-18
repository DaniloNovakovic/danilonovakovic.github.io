import type { RidgeViewerLayerId } from './model';
import type { LayerState, ModelViewport } from './types';

export const INITIAL_MODEL_VIEW: ModelViewport = {
  zoom: 0.12,
  panX: 42,
  panY: 30
};

export const INITIAL_PREVIEW_ZOOM = 1;

export const PREVIEW_ZOOM_OPTIONS = [0.65, 0.75, 1, 1.25, 1.5, 1.6] as const;

export const PLAYER_SNAPSHOT_RENDER_INTERVAL_MS = 250;

export const DEFAULT_LAYERS: LayerState = {
  grid: true,
  rooms: true,
  anchors: true,
  routes: true,
  futureRoutes: true,
  shortcuts: true,
  colliders: true,
  assistZones: true,
  rects: true
};

export const LAYER_LABELS: Record<RidgeViewerLayerId, string> = {
  grid: 'Grid',
  rooms: 'Rooms',
  anchors: 'Anchors',
  routes: 'Routes',
  futureRoutes: 'Future routes',
  shortcuts: 'Shortcuts',
  colliders: 'Colliders',
  assistZones: 'Assist zones',
  rects: 'Rects'
};
