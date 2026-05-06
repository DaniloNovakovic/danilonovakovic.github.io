import type { OverlayDefinition } from './types';

export const GLOBAL_OVERLAY_DEFINITIONS: readonly OverlayDefinition[] = [
  {
    id: 'inventory',
    load: () => import('./inventory/InventoryOverlay')
  },
  {
    id: 'devSwitcher',
    load: () => import('./devSwitcher/DevSwitcherOverlay')
  }
];
