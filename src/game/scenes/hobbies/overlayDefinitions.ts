import type { OverlayDefinition } from '@/game/overlays/types';

export const HOBBIES_OVERLAY_DEFINITIONS: readonly OverlayDefinition[] = [
  {
    id: 'art',
    load: () => import('./overlays/art/DrawingCanvas')
  },
  {
    id: 'music',
    load: () => import('./overlays/music/GuitarStrings')
  },
  {
    id: 'fitness',
    load: () => import('./overlays/fitness/MuayThaiOverlay')
  },
  {
    id: 'dancing',
    load: () => import('./overlays/dancing/DancingOverlay')
  }
];
