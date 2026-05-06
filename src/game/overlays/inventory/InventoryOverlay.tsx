import { bridgeActions, useBridgeState } from '@/game/bridge/store';
import { OverlayDialogFrame } from '@/game/overlays/OverlayDialogFrame';
import type { OverlayControllerProps } from '@/game/overlays/types';
import { getMessages } from '@/shared/i18n';

export default function InventoryOverlay({ close, titleId, descriptionId }: OverlayControllerProps) {
  const bridge = useBridgeState();
  const messages = getMessages();

  return (
    <OverlayDialogFrame
      title={messages.inventory.title}
      close={close}
      titleId={titleId}
      descriptionId={descriptionId}
    >
      <div className="grid gap-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]">
          {messages.inventory.equipment}
        </p>
        {bridge.inventory.ownedItemIds.includes('glasses') ? (
          <label className="flex cursor-pointer items-center justify-between gap-2 rounded border border-[#1a1a1a]/40 bg-white/50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#1a1a1a]">
            <span>{messages.inventory.glasses}</span>
            <input
              type="checkbox"
              checked={bridge.equipment.equippedItemIds.includes('glasses')}
              onChange={() => bridgeActions.toggleItemEquipped('glasses')}
              className="h-4 w-4 accent-[#1a1a1a]"
            />
          </label>
        ) : bridge.inventory.ownedItemIds.length === 0 ? (
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#1a1a1a]/60">
            {messages.inventory.noItemsYet}
          </p>
        ) : null}
        {bridge.inventory.ownedItemIds.includes('circuit') && (
          <div className="rounded border border-[#1a1a1a]/40 bg-white/50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#1a1a1a]">
            {messages.inventory.circuit}
          </div>
        )}
      </div>
    </OverlayDialogFrame>
  );
}
