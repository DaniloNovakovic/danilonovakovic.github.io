import { bridgeActions, type BridgeState } from '@/game/bridge/store';
import { BackpackDoodle } from '@/game/overlays/inventory/backpackIcons';
import { useMessages } from '@/shared/i18n';
import { notebookShadowRoles, sketchFocusVisible } from '@/shared/ui/tokens';
import { cn } from '@/shared/ui/utils';
import { canOpenBackpack, INVENTORY_OVERLAY_ID } from './useBackpack';

export function BackpackButton({ bridge }: { bridge: BridgeState }) {
  const copy = useMessages().inventory;
  if (bridge.activeOverlayId !== null || !canOpenBackpack(bridge)) return null;
  return (
    <button
      type="button"
      onClick={() => bridgeActions.openOverlay(INVENTORY_OVERLAY_ID)}
      aria-haspopup="dialog"
      aria-label={copy.open}
      title={`${copy.open} (${copy.hotkey})`}
      className={cn(
        'group absolute right-2 top-2 z-30 flex cursor-pointer items-center gap-1 rounded-md border-2 border-[#1a1a1a] bg-[#fbfbf9]/90 p-1 backdrop-blur-sm transition-transform motion-reduce:transition-none',
        'hover:-translate-y-0.5 hover:-rotate-3 active:translate-y-px sm:right-3 sm:top-3',
        notebookShadowRoles.control,
        sketchFocusVisible
      )}
    >
      <BackpackDoodle className="h-8 w-8 sm:h-9 sm:w-9" />
      <kbd className="mr-1 hidden rounded-sm border border-[#1a1a1a]/50 px-1 font-[inherit] text-[10px] font-bold leading-4 text-[#1a1a1a]/70 md:inline">
        {copy.hotkey}
      </kbd>
    </button>
  );
}
