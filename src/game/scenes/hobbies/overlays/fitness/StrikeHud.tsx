import type { Ref } from 'react';
import { STRIKES, type StrikeId, type StrikeZone } from './strikeCombo';
import '../shared/hobbyMotion.css';

function stampClass(index: number, step: number): string {
  if (index < step) return 'border-[#1a1a1a] bg-[#1a1a1a] text-[#fbfbf9]';
  if (index === step) return 'hobby-wobble border-dashed border-[#1a1a1a] bg-[#fbfbf9]';
  return 'border-[#1a1a1a]/30 text-[#1a1a1a]/40';
}

/** Called combo as a row of stamps: landed (inked), next (dashed), upcoming (faint). */
export function ComboTracker({ step, names }: { step: number; names: Record<StrikeId, string> }) {
  return (
    <ol className="flex flex-wrap justify-center gap-1">
      {STRIKES.map((strike, index) => (
        <li
          key={strike}
          aria-current={index === step ? 'step' : undefined}
          className={`rounded-sm border-2 px-1.5 py-0.5 text-[10px] font-black tracking-wider sm:text-xs ${stampClass(index, step)}`}
        >
          {names[strike]}
        </li>
      ))}
    </ol>
  );
}

interface TimingBarProps {
  label: string;
  zone: StrikeZone;
  markerRef: Ref<HTMLDivElement>;
}

/** Hatched sweet-spot zone with a solid perfect slit; the marker is moved by `useSweepMarker`. */
export function TimingBar({ label, zone, markerRef }: TimingBarProps) {
  const zoneLeft = (zone.center - zone.halfWidth) * 100;
  const perfectLeft = (zone.center - zone.perfectHalfWidth) * 100;
  return (
    <div role="img" aria-label={label} className="relative mx-2 h-12 rounded-sm border-[3px] border-[#1a1a1a] bg-[#fbfbf9]">
      <div
        className="hobby-hatch absolute inset-y-0 border-x-2 border-[#1a1a1a]"
        style={{ left: `${zoneLeft}%`, width: `${zone.halfWidth * 200}%` }}
      />
      <div
        className="absolute inset-y-1 bg-[#1a1a1a]"
        style={{ left: `${perfectLeft}%`, width: `${zone.perfectHalfWidth * 200}%` }}
      />
      <div ref={markerRef} className="pointer-events-none absolute -inset-y-2 left-0 w-0">
        <div className="absolute -left-[5px] -top-0.5 h-0 w-0 border-x-[5px] border-t-[7px] border-x-transparent border-t-[#1a1a1a]" />
        <div className="absolute inset-y-1 -left-[2px] w-1 bg-[#1a1a1a] shadow-[0_0_0_2px_#fbfbf9]" />
      </div>
    </div>
  );
}
