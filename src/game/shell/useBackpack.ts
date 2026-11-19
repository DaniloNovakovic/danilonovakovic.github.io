import { useEffect } from 'react';
import { bridgeActions, type BridgeState } from '@/game/bridge/store';
import { getBackpackView } from '@/game/overlays/inventory/backpackView';
import { OVERWORLD_SCENE_ID } from '@/game/scenes/sceneIds';

export const INVENTORY_OVERLAY_ID = 'inventory';

/**
 * The backpack shows up on the street once there is something in it: a
 * quiet reward for the first find, and no clutter before then.
 */
export function canOpenBackpack(bridge: BridgeState): boolean {
  if (bridge.activeSceneId !== OVERWORLD_SCENE_ID || bridge.loadingSceneId !== null) return false;
  // A street talk owns the frame; the backpack waits.
  if (bridge.sceneUi.panel !== null) return false;
  return (
    getBackpackView({
      ownedItemIds: bridge.inventory.ownedItemIds,
      equippedItemIds: bridge.equipment.equippedItemIds,
      discoveredSecretIds: bridge.progress.discoveredSecretIds
    }).found > 0
  );
}

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

/** I opens the backpack on the street and closes it again. */
export function useBackpackHotkey(bridge: BridgeState): void {
  const canOpen = canOpenBackpack(bridge);
  const isOpen = bridge.activeOverlayId === INVENTORY_OVERLAY_ID;
  const otherOverlayOpen = bridge.activeOverlayId !== null && !isOpen;

  useEffect(() => {
    if (otherOverlayOpen || (!canOpen && !isOpen)) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'i' || event.repeat) return;
      if (event.ctrlKey || event.metaKey || event.altKey || isTyping(event.target)) return;
      event.preventDefault();
      if (isOpen) bridgeActions.closeOverlay();
      else bridgeActions.openOverlay(INVENTORY_OVERLAY_ID);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canOpen, isOpen, otherOverlayOpen]);
}
