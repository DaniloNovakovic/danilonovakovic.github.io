import type { OverlayDefinition } from './types';
import { lazyOverlay } from './lazyOverlay';

export const GLOBAL_OVERLAY_DEFINITIONS: readonly OverlayDefinition[] = [
  {
    id: 'inventory',
    component: lazyOverlay(() => import('./inventory/InventoryOverlay'))
  },
  {
    id: 'devSwitcher',
    component: lazyOverlay(() => import('./devSwitcher/DevSwitcherOverlay'))
  }
];
