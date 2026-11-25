import { bridgeActions, useBridgeState } from '@/game/bridge/store';
import { OverlayDialogFrame } from '@/game/overlays/OverlayDialogFrame';
import type { OverlayControllerProps } from '@/game/overlays/types';
import { useMessages } from '@/shared/i18n';
import { notebookShadowRoles, sketchFocusVisible } from '@/shared/ui/tokens';
import { cn } from '@/shared/ui/utils';
import { SlotDoodle } from './backpackIcons';
import { getBackpackView, type BackpackSlot } from './backpackView';

/** Paper cutouts sit a little crooked, never in lockstep. */
const SLOT_TILT = ['-rotate-1', 'rotate-[0.6deg]', 'rotate-1', '-rotate-[0.6deg]', 'rotate-[0.4deg]', '-rotate-1'];

export default function InventoryOverlay({ close, titleId, descriptionId }: OverlayControllerProps) {
  const bridge = useBridgeState();
  const messages = useMessages();
  const copy = messages.inventory;
  const view = getBackpackView({
    ownedItemIds: bridge.inventory.ownedItemIds,
    equippedItemIds: bridge.equipment.equippedItemIds,
    discoveredSecretIds: bridge.progress.discoveredSecretIds
  });

  return (
    <OverlayDialogFrame title={copy.title} close={close} titleId={titleId} descriptionId={descriptionId}>
      <div className="grid gap-4 text-[#1a1a1a]">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <ol className="flex gap-1" aria-hidden>
            {view.slots.map((slot) => (
              <li
                key={slot.id}
                className={cn(
                  'h-3 w-3 rotate-45 border-2 border-[#1a1a1a]',
                  slot.found ? 'bg-[#1a1a1a]' : 'bg-transparent'
                )}
              />
            ))}
          </ol>
          <p className="text-xs font-bold uppercase tracking-widest">{copy.tally(view.found, view.total)}</p>
        </div>

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {view.slots.map((slot, index) => (
            <li key={slot.id} className={SLOT_TILT[index % SLOT_TILT.length]}>
              {slot.found ? <FoundSlot slot={slot} /> : <UnknownSlot />}
            </li>
          ))}
        </ul>

        {view.hiddenSlots.length > 0 && (
          <section aria-labelledby="backpack-off-the-page" className="grid gap-2">
            <h3
              id="backpack-off-the-page"
              className="border-t-2 border-dashed border-[#1a1a1a]/45 pt-3 text-xs font-bold uppercase tracking-widest"
            >
              {copy.offThePage}
            </h3>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              {view.hiddenSlots.map((slot) => (
                <li key={slot.id} className="-rotate-2">
                  <FoundSlot slot={slot} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </OverlayDialogFrame>
  );
}

function FoundSlot({ slot }: { slot: BackpackSlot }) {
  const copy = useMessages().inventory;
  const text = copy.slots[slot.id];
  const pocketed = slot.id === 'glasses' && !slot.worn;
  return (
    <div
      className={cn(
        'relative flex h-full flex-col items-center gap-1.5 rounded-md border-2 border-[#1a1a1a] bg-[#fbfbf9] px-2.5 pb-3 pt-3 text-center',
        notebookShadowRoles.control
      )}
    >
      {slot.soldered && (
        <span className="absolute -right-1.5 -top-2 rotate-6 rounded-sm border-2 border-[#1a1a1a] bg-[#1a1a1a] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[#fbfbf9]">
          {copy.soldered}
        </span>
      )}
      <SlotDoodle slotId={slot.id} className={cn('h-12 w-12 sm:h-14 sm:w-14', pocketed && 'opacity-40')} />
      <p className="text-sm font-bold uppercase tracking-wide">{text.name}</p>
      <p className="text-[11px] leading-snug text-[#1a1a1a]/70 sm:text-xs">
        {'pocketedNote' in text && pocketed ? text.pocketedNote : text.note}
      </p>
      {slot.id === 'glasses' && <GlassesSwitch worn={slot.worn === true} />}
    </div>
  );
}

function GlassesSwitch({ worn }: { worn: boolean }) {
  const copy = useMessages().inventory;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={worn}
      aria-label={copy.wearToggle}
      onClick={() => bridgeActions.toggleItemEquipped('glasses')}
      className={cn(
        'mt-auto flex cursor-pointer items-center gap-2 rounded-full pt-1 text-[10px] font-bold uppercase tracking-widest',
        sketchFocusVisible
      )}
    >
      <span
        className={cn(
          'relative h-5 w-9 rounded-full border-2 border-[#1a1a1a] transition-colors motion-reduce:transition-none',
          worn ? 'bg-[#1a1a1a]' : 'bg-[#f4f1ea]'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-3 w-3 rounded-full border-2 border-[#1a1a1a] bg-[#fbfbf9] transition-[left] motion-reduce:transition-none',
            worn ? 'left-[18px]' : 'left-0.5'
          )}
        />
      </span>
      {worn ? copy.wearing : copy.pocketed}
    </button>
  );
}

function UnknownSlot() {
  const copy = useMessages().inventory;
  return (
    <div className="flex h-full min-h-32 flex-col items-center justify-center gap-1.5 rounded-md border-2 border-dashed border-[#1a1a1a]/45 px-2.5 pb-3 pt-3 text-center text-[#1a1a1a]/45">
      <span className="flex h-12 w-12 items-center justify-center text-4xl font-bold sm:h-14 sm:w-14" aria-hidden>
        ?
      </span>
      <p className="text-[11px] font-bold uppercase tracking-widest">{copy.unknown}</p>
    </div>
  );
}
