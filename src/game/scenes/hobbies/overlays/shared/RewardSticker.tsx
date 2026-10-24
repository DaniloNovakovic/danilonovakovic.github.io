import { X } from 'lucide-react';
import { hobbyFocusRing } from './hobbyStyles';
import { PartIcon, type StickerIconId } from './PartIcon';
import './hobbyMotion.css';

interface RewardStickerProps {
  icon: StickerIconId;
  title: string;
  /** Item or headline line printed under the title. */
  label?: string;
  body?: string;
  dismissLabel: string;
  onDismiss: () => void;
}

/**
 * Paper sticker that drops onto a mini-game board for a reward moment.
 * Position it from the parent (it is absolutely placed in the top-right of the
 * nearest positioned ancestor) and remount it with a new `key` to replay the drop.
 */
export function RewardSticker({ icon, title, label, body, dismissLabel, onDismiss }: RewardStickerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="hobby-sticker-drop pointer-events-auto absolute right-3 top-3 z-20 w-[min(15rem,calc(100%-1.5rem))] -rotate-3"
    >
      <div className="hobby-hatch-light absolute -top-2.5 left-1/2 h-5 w-16 -translate-x-1/2 rotate-2 border border-[#1a1a1a]/40 bg-[#f4f1ea]/90" />
      <div className="flex gap-3 rounded-md border-[3px] border-[#1a1a1a] bg-[#fbfbf9] p-3 pr-7 text-[#1a1a1a] shadow-[5px_5px_0px_0px_rgba(26,26,26,1)]">
        <div className="shrink-0 rounded-full border-2 border-dashed border-[#1a1a1a] p-1">
          <PartIcon id={icon} size={40} />
        </div>
        <div className="min-w-0 text-left">
          <p className="text-sm font-black uppercase tracking-wider">{title}</p>
          {label ? <p className="text-xs font-bold">{label}</p> : null}
          {body ? <p className="mt-1 text-[11px] leading-snug opacity-70">{body}</p> : null}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label={dismissLabel}
          className={`absolute right-1.5 top-1.5 cursor-pointer rounded-full p-0.5 hover:bg-[#e8e5df] ${hobbyFocusRing}`}
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
