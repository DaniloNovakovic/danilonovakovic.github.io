import type { OverlayDefinition } from '@/game/overlays/types';
import { lazyOverlay } from '@/game/overlays/lazyOverlay';

export const RIDGE_OVERLAY_DEFINITIONS: readonly OverlayDefinition[] = [
  {
    id: 'bridgeBuilder',
    component: lazyOverlay(() => import('./overlays/bridgeBuilder/BridgeBuilderOverlay'))
  }
];
