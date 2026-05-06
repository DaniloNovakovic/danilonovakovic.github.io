import type { OverlayDefinition } from './types';
import { getMessages } from '@/shared/i18n';
import InventoryOverlay from './inventory/InventoryOverlay';
import DevSwitcherOverlay from './devSwitcher/DevSwitcherOverlay';

const messages = getMessages();

export const GLOBAL_OVERLAY_DEFINITIONS: readonly OverlayDefinition[] = [
  {
    id: 'inventory',
    title: messages.inventory.title,
    component: InventoryOverlay,
    loadComponent: async () => ({ default: InventoryOverlay })
  },
  {
    id: 'devSwitcher',
    title: messages.gameShell.devSwitcher,
    component: DevSwitcherOverlay,
    loadComponent: async () => ({ default: DevSwitcherOverlay })
  }
];
