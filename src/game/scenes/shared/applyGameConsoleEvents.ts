/**
 * Scene-side adapter: GameConsoleSession events → bridge / scene callbacks.
 * Keeps core/console free of bridge imports (ADR-0006).
 */
import {
  bridgeActions,
  type InventoryItemId,
  type SecretDiscoveryId
} from '@/game/bridge/store';
import type { GameSessionEvent } from '@/game/core/console';
import type { OverlayId } from '@/game/overlays/overlayIds';
import type { SceneId } from '@/game/scenes/sceneIds';

export interface GameConsoleEventPorts {
  onEnterScene?: (sceneId: SceneId) => void;
  onOpenOverlay?: (overlayId: OverlayId) => void;
  onReturnToOverworld?: () => void;
  onThought?: (id: 'basement_cannot_see') => void;
  onBananaPeelDiscovered?: () => void;
  onBananaPeelCancelled?: () => void;
}

export function applyGameConsoleEvents(
  events: readonly GameSessionEvent[],
  ports: GameConsoleEventPorts
): void {
  for (const event of events) {
    switch (event.type) {
      case 'scene_entered':
        ports.onEnterScene?.(event.sceneId as SceneId);
        break;
      case 'scene_returned':
        ports.onReturnToOverworld?.();
        break;
      case 'overlay_opened':
        ports.onOpenOverlay?.(event.overlayId as OverlayId);
        break;
      case 'item_collected':
        if (event.itemId === 'glasses') {
          bridgeActions.collectGlasses();
        } else {
          bridgeActions.collectItem(event.itemId as InventoryItemId);
        }
        break;
      case 'item_equipped':
        if (event.itemId !== 'glasses') {
          // collectGlasses already equips; other items equip explicitly.
          bridgeActions.equipItem(event.itemId as InventoryItemId);
        }
        break;
      case 'item_unequipped':
        bridgeActions.unequipItem(event.itemId as InventoryItemId);
        break;
      case 'secret_discovered':
        bridgeActions.discoverSecret(event.secretId as SecretDiscoveryId);
        if (event.secretId === 'banana-peel-clue') {
          ports.onBananaPeelDiscovered?.();
        }
        break;
      case 'banana_peel_cancelled':
        ports.onBananaPeelCancelled?.();
        break;
      case 'thought':
        ports.onThought?.(event.id);
        break;
      default:
        break;
    }
  }
}
