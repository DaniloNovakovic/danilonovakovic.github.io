import type { MouseEvent } from 'react';
import { hobbyFocusRing } from '../shared/hobbyStyles';
import { CHORD_GRIPS, type ChordColor, type GripId, type Voicing } from './grips';

export const inkKeyClass = `flex h-11 min-w-11 cursor-pointer flex-col items-center justify-center rounded border-2 border-[#1a1a1a] px-1.5 leading-none shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${hobbyFocusRing}`;

const inkKeyIdle = 'bg-[#fbfbf9] text-[#1a1a1a]';
const inkKeyOn = 'bg-[#1a1a1a] text-[#fbfbf9]';

interface GripBarProps {
  label: string;
  activeId: GripId;
  gripName: (id: GripId) => string;
  gripKey: (id: GripId) => string;
  gripLabel: (name: string, key: string) => string;
  onSelect: (id: GripId, voicing: Voicing, color: ChordColor) => void;
}

/** One tap latches a shape. It stays fretted until the next tap. */
export function GripBar({ label, activeId, gripName, gripKey, gripLabel, onSelect }: GripBarProps) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap justify-center gap-1.5">
      {CHORD_GRIPS.map((grip) => {
        const name = gripName(grip.id);
        const keyLabel = gripKey(grip.id);
        const selected = grip.id === activeId;
        return (
          <button
            key={grip.id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={gripLabel(name, keyLabel)}
            onClick={(event: MouseEvent<HTMLButtonElement>) =>
              onSelect(grip.id, event.shiftKey ? 'high' : 'low', event.altKey ? 'alt' : 'scale')
            }
            className={`${inkKeyClass} ${selected ? inkKeyOn : inkKeyIdle}`}
          >
            <span className="font-black">{name}</span>
            <span className={`font-mono text-[9px] ${selected ? 'opacity-70' : 'opacity-60'}`}>{keyLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
