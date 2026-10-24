import { useEffect, useId, useRef, useState } from 'react';
import { Settings } from 'lucide-react';
import { hobbyFocusRing } from '../shared/hobbyStyles';
import type { Extension } from './extensions';
import { HOME_KEYS, type HomeKeyId } from './grips';
import { inkKeyClass } from './GripBar';

const COLOR_TONES: readonly Extension[] = [2, 4, 6, 7];

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
  extensionGroupLabel: string;
  extensionHint: string;
  extensionLabel: (tone: string, on: boolean) => string;
  extensions: readonly Extension[];
  onExtension: (tone: Extension) => void;
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
  onHomeKey,
  extensionGroupLabel,
  extensionHint,
  extensionLabel,
  extensions,
  onExtension
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
    window.addEventListener('pointerdown', onPointer, true);
    return () => window.removeEventListener('pointerdown', onPointer, true);
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
          className="absolute right-0 top-full z-30 mt-1.5 w-64 border-2 border-[#1a1a1a] bg-[#fbfbf9] p-3 text-left shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]"
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
          <div role="radiogroup" aria-label={keyGroupLabel} className="mt-3 grid grid-cols-4 gap-1.5">
            {HOME_KEYS.map((key) => {
              const selected = key.id === homeKey;
              return (
                <button
                  key={key.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={keyLabel(key.id)}
                  onClick={() => {
                    onHomeKey(key.id);
                    setOpen(false);
                  }}
                  className={`${inkKeyClass} min-w-0 ${selected ? 'bg-[#1a1a1a] text-[#fbfbf9]' : 'bg-[#fbfbf9] text-[#1a1a1a]'}`}
                >
                  <span className="font-black">{key.id}</span>
                </button>
              );
            })}
          </div>
          <div role="group" aria-label={extensionGroupLabel} className="mt-3 flex gap-1.5">
            {COLOR_TONES.map((tone) => {
              const selected = extensions.includes(tone);
              return (
                <button
                  key={tone}
                  type="button"
                  aria-pressed={selected}
                  aria-label={extensionLabel(String(tone), selected)}
                  onClick={() => onExtension(tone)}
                  className={`${inkKeyClass} min-w-0 flex-1 ${selected ? 'bg-[#1a1a1a] text-[#fbfbf9]' : 'bg-[#fbfbf9] text-[#1a1a1a]'}`}
                >
                  <span className="font-black">{tone}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-1 text-[11px] italic leading-snug opacity-60">{extensionHint}</p>
        </div>
      ) : null}
    </div>
  );
}
