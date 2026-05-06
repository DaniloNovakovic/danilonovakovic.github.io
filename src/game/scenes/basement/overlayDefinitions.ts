import type { OverlayDefinition } from '@/game/overlays/types';
import { lazyOverlay } from '@/game/overlays/lazyOverlay';

export const BASEMENT_OVERLAY_DEFINITIONS: readonly OverlayDefinition[] = [
  {
    id: 'games',
    component: lazyOverlay(() => import('./overlays/developerConsole/CodingOverlay'))
  }
];
