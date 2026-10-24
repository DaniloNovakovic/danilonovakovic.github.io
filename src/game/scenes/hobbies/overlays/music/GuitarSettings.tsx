import { useEffect, useId, useRef, useState } from 'react';
import { Settings } from 'lucide-react';
import { hobbyFocusRing } from '../shared/hobbyStyles';
import { HOME_KEYS, type HomeKeyId } from './grips';
import { inkKeyClass } from './GripBar';

interface GuitarSettingsProps {
  openLabel: string;
  bassLabel: string;
  bassHint: string;
  keyGroupLabel: string;
  keyLabel: (key: string) => string;
  bass: boolean;
  onBass: (on: boolean) => void;
  homeKey: HomeKeyId;
  onHomeKey: (id: HomeKeyId) => void;
}

/** Small settings popover: bass-note toggle and the home key. */
export function GuitarSettings({
  openLabel,
  bassLabel,
  bassHint,
  keyGroupLabel,
  keyLabel,
  bass,
  onBass,
  homeKey,
  onHomeKey
}: GuitarSettingsProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const hintId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener('pointerdown', onPointer);
    return () => window.removeEventListener('pointerdown', onPointer);
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-label={openLabel}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
        className={`${inkKeyClass} w-11 bg-[#fbfbf9] text-[#1a1a1a]`}
      >
        <Settings size={16} aria-hidden />
      </button>
      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label={openLabel}
          className="absolute right-0 top-full z-30 mt-1.5 w-56 border-2 border-[#1a1a1a] bg-[#fbfbf9] p-3 text-left shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]"
        >
          <label className="flex cursor-pointer items-center gap-2 text-sm font-black">
            <input
              type="checkbox"
              checked={bass}
              aria-describedby={hintId}
              onChange={(event) => onBass(event.target.checked)}
              className={`size-4 accent-[#1a1a1a] ${hobbyFocusRing}`}
            />
            {bassLabel}
          </label>
          <p id={hintId} className="mt-1 text-[11px] italic leading-snug opacity-60">
            {bassHint}
          </p>
          <div role="radiogroup" aria-label={keyGroupLabel} className="mt-3 flex gap-1.5">
            {HOME_KEYS.map((key) => {
              const selected = key.id === homeKey;
              return (
                <button
                  key={key.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={keyLabel(key.id)}
                  onClick={() => onHomeKey(key.id)}
                  className={`${inkKeyClass} flex-1 ${selected ? 'bg-[#1a1a1a] text-[#fbfbf9]' : 'bg-[#fbfbf9] text-[#1a1a1a]'}`}
                >
                  <span className="font-black">{key.id}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
