import type { OverlayDefinition } from '@/game/overlays/types';

export const BASEMENT_OVERLAY_DEFINITIONS: readonly OverlayDefinition[] = [
  {
    id: 'games',
    load: () => import('./overlays/developerConsole/CodingOverlay')
  }
];
