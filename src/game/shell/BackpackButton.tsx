import { Backpack } from 'lucide-react';
import { bridgeActions, type BridgeState } from '@/game/bridge/store';
import { useMessages } from '@/shared/i18n';
import { Button } from '@/shared/ui';
import { canOpenBackpack, INVENTORY_OVERLAY_ID } from './useBackpack';

/** Header button beside Dev; shows up once there is something in the backpack. */
export function BackpackButton({ bridge }: { bridge: BridgeState }) {
  const copy = useMessages().inventory;
  const isOpen = bridge.activeOverlayId === INVENTORY_OVERLAY_ID;
  if (!isOpen && !canOpenBackpack(bridge)) return null;
  return (
    <Button
      variant="floating"
      size="sm"
      onClick={() => bridgeActions.openOverlay(INVENTORY_OVERLAY_ID)}
      className="sm:px-3 sm:py-1.5 sm:text-xs"
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      aria-label={copy.open}
      title={`${copy.open} (${copy.hotkey})`}
    >
      <Backpack className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      <span>{copy.title}</span>
    </Button>
  );
}
