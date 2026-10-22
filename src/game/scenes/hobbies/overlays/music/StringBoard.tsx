import { useId, useRef, type PointerEvent } from 'react';
import { GUITAR_STRINGS, type GuitarStringSpec } from './useGuitarSynth';
import '../shared/hobbyMotion.css';

const INK = '#1a1a1a';
const PAPER = '#fbfbf9';
const VIEW_HEIGHT = 132;
const FIRST_STRING_Y = 14;
const STRING_SPACING = 21;
const NUT_X = 12;
const BRIDGE_X = 300;
const FRET_XS = [44, 74, 101, 125] as const;

function stringY(index: number): number {
  return FIRST_STRING_Y + index * STRING_SPACING;
}

function rowAt(event: PointerEvent<HTMLDivElement>): number {
  const rect = event.currentTarget.getBoundingClientRect();
  if (rect.height <= 0) return 0;
  const y = ((event.clientY - rect.top) / rect.height) * VIEW_HEIGHT;
  const row = Math.floor((y - FIRST_STRING_Y + STRING_SPACING / 2) / STRING_SPACING);
  return Math.min(GUITAR_STRINGS.length - 1, Math.max(0, row));
}

interface StringBoardProps {
  label: string;
  /** Pluck counter per string (top to bottom); a change replays that string's vibration. */
  plucks: readonly number[];
  onPick: (spec: GuitarStringSpec) => void;
  onStrum: (spec: GuitarStringSpec) => void;
}

/**
 * Six strings over a hatched sound hole. Pointer down picks the string under
 * the pointer; hovering (mouse) or dragging (touch/pen) across strings strums.
 */
export function StringBoard({ label, plucks, onPick, onStrum }: StringBoardProps) {
  const hatchId = useId();
  const lastRowRef = useRef<number | null>(null);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const row = rowAt(event);
    lastRowRef.current = row;
    onPick(GUITAR_STRINGS[row]!);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' && event.buttons === 0) return;
    const row = rowAt(event);
    if (row === lastRowRef.current) return;
    lastRowRef.current = row;
    onStrum(GUITAR_STRINGS[row]!);
  };

  return (
    <div
      role="img"
      aria-label={label}
      className="aspect-[320/132] w-full cursor-pointer touch-none select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => {
        lastRowRef.current = null;
      }}
    >
      <svg viewBox={`0 0 320 ${VIEW_HEIGHT}`} className="h-full w-full" aria-hidden="true">
        <defs>
          <pattern id={hatchId} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(40)">
            <line x1="0" y1="0" x2="0" y2="5" stroke={INK} strokeWidth="1" opacity="0.35" />
          </pattern>
        </defs>
        <circle cx="210" cy="66" r="44" fill={`url(#${hatchId})`} stroke={INK} strokeWidth="3" />
        <circle cx="210" cy="66" r="50" fill="none" stroke={INK} strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
        {FRET_XS.map((x) => (
          <line key={x} x1={x} y1="4" x2={x} y2={VIEW_HEIGHT - 4} stroke={INK} strokeWidth="1.5" opacity="0.35" />
        ))}
        <line x1={NUT_X} y1="2" x2={NUT_X} y2={VIEW_HEIGHT - 2} stroke={INK} strokeWidth="5" />
        <rect x={BRIDGE_X - 3} y="6" width="8" height={VIEW_HEIGHT - 12} fill={PAPER} stroke={INK} strokeWidth="2.5" />
        {GUITAR_STRINGS.map((spec, index) => (
          <GuitarString key={spec.number} spec={spec} y={stringY(index)} pluckId={plucks[index] ?? 0} />
        ))}
      </svg>
    </div>
  );
}

function GuitarString({ spec, y, pluckId }: { spec: GuitarStringSpec; y: number; pluckId: number }) {
  const amplitude = 3 + spec.gauge * 1.2;
  return (
    <g>
      <line x1={NUT_X} y1={y} x2={BRIDGE_X} y2={y} stroke={INK} strokeWidth={spec.gauge} strokeLinecap="round" />
      {spec.wound ? (
        <line x1={NUT_X} y1={y} x2={BRIDGE_X} y2={y} stroke={PAPER} strokeWidth={spec.gauge * 0.5} strokeDasharray="0.8 1.8" />
      ) : null}
      {pluckId > 0 ? (
        <g key={pluckId}>
          <path
            className="hobby-string-vibrate"
            style={{ transformOrigin: `160px ${y}px` }}
            d={`M${NUT_X} ${y} Q 156 ${y - amplitude * 2} ${BRIDGE_X} ${y}`}
            fill="none"
            stroke={INK}
            strokeWidth={spec.gauge}
            vectorEffect="non-scaling-stroke"
          />
          <line
            className="hobby-string-flash"
            x1={NUT_X}
            y1={y}
            x2={BRIDGE_X}
            y2={y}
            stroke={INK}
            strokeWidth={spec.gauge + 2.5}
            strokeLinecap="round"
          />
        </g>
      ) : null}
    </g>
  );
}
