import type { OverlayDefinition } from '@/game/overlays/types';
import { lazyOverlay } from '@/game/overlays/lazyOverlay';

export const HOBBIES_OVERLAY_DEFINITIONS: readonly OverlayDefinition[] = [
  {
    id: 'art',
    component: lazyOverlay(() => import('./overlays/art/DrawingCanvas'))
  },
  {
    id: 'music',
    component: lazyOverlay(() => import('./overlays/music/GuitarStrings'))
  },
  {
    id: 'fitness',
    component: lazyOverlay(() => import('./overlays/fitness/MuayThaiOverlay'))
  },
  {
    id: 'dancing',
    component: lazyOverlay(() => import('./overlays/dancing/DancingOverlay'))
  }
];
