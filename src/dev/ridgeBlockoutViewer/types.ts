import type { RidgeViewerLayerId } from './model';

export type Selection =
  | { type: 'room'; id: string }
  | { type: 'anchor'; id: string }
  | { type: 'route'; id: string }
  | { type: 'futureRoute'; id: string }
  | { type: 'shortcut'; id: string }
  | { type: 'collider'; id: string }
  | { type: 'rect'; id: string };

export type LayerState = Record<RidgeViewerLayerId, boolean>;

export type ViewerView = 'preview' | 'model';

export type ModelViewport = {
  zoom: number;
  panX: number;
  panY: number;
};
