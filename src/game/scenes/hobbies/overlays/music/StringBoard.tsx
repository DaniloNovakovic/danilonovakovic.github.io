import { useId, useRef, type PointerEvent } from 'react';
import { GUITAR_STRINGS, type GuitarStringSpec } from './useGuitarSynth';
import '../shared/hobbyMotion.css';

const INK = '#1a1a1a';
const PAPER = '#fbfbf9';
const VIEW_HEIGHT = 132;
const FIRST_STRING_Y = 14;
const STRING_SPACING = 21;
const NUT_X = 18;
const BRIDGE_X = 286;
const VIEW_WIDTH = 332;
const FRET_XS = [48, 76, 100, 122] as const;

/** Open chords stay on the nut. Shapes past the first four frets scroll up the neck. */
function fretBase(frets: readonly (number | null)[]): number {
  const stopped = frets.filter((fret): fret is number => fret !== null && fret > 0);
  if (stopped.length === 0) return 0;
  const hasOpen = frets.some((fret) => fret === 0);
  if (hasOpen || Math.max(...stopped) <= FRET_XS.length) return 0;
  return Math.min(...stopped);
}

function fretWireX(fret: number, base: number): number | undefined {
  const slot = base === 0 ? fret - 1 : fret - base;
  return FRET_XS[slot];
}

function stringY(index: number): number {
  return FIRST_STRING_Y + index * STRING_SPACING;
}

function speakingStart(fret: number | null, base: number): number {
  if (fret === null || fret <= 0) return NUT_X;
  return fretWireX(fret, base) ?? NUT_X;
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
  gripName: string;
  /** Fret per string, index 0 = high E. `null` is muted. */
  frets: readonly (number | null)[];
  palm: boolean;
  /** Latched staccato: strings speak, then stop. */
  shortStrum: boolean;
  /** Right-hand key for each string, high E first. */
  stringKeys: readonly string[];
  /** Pluck counter per string (top to bottom); a change replays that string's vibration. */
  plucks: readonly number[];
  /** True when that string's latest note was a short strum, so it chucks instead of ringing. */
  chops: readonly boolean[];
  onPick: (spec: GuitarStringSpec) => void;
  onStrum: (spec: GuitarStringSpec) => void;
  /** A stroke that crossed at least two strings — a strum, not a single pick. */
  onRake: () => void;
}

/**
 * Six strings over a hatched sound hole, with the latched chord drawn on the
 * frets. Pointer down picks the string under the pointer; hovering (mouse) or
 * dragging across strings strums. Crossing a second string counts as a rake.
 */
export function StringBoard({
  label,
  gripName,
  frets,
  palm,
  shortStrum,
  stringKeys,
  plucks,
  chops,
  onPick,
  onStrum,
  onRake
}: StringBoardProps) {
  const hatchId = useId();
  const lastRowRef = useRef<number | null>(null);
  const rowsRef = useRef(new Set<number>());
  const rakedRef = useRef(false);
  const base = fretBase(frets);

  const endStroke = () => {
    lastRowRef.current = null;
    rowsRef.current.clear();
    rakedRef.current = false;
  };

  const hit = (row: number, kind: 'pick' | 'strum') => {
    if (row === lastRowRef.current) return;
    lastRowRef.current = row;
    rowsRef.current.add(row);
    const spec = GUITAR_STRINGS[row];
    if (!spec) return;
    if (kind === 'pick') onPick(spec);
    else onStrum(spec);
    if (!rakedRef.current && rowsRef.current.size >= 2) {
      rakedRef.current = true;
      onRake();
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    hit(rowAt(event), 'pick');
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' && event.buttons === 0) return;
    hit(rowAt(event), 'strum');
  };

  return (
    <div
      role="img"
      aria-label={label}
      className="relative aspect-[332/132] w-full cursor-pointer touch-none select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endStroke}
      onPointerLeave={endStroke}
      onPointerCancel={endStroke}
    >
      <svg viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} className="h-full w-full" aria-hidden="true">
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
        {palm ? <rect x="248" y="8" width="16" height={VIEW_HEIGHT - 16} fill={INK} opacity="0.16" /> : null}
        {shortStrum ? (
          <line
            x1={BRIDGE_X - 16}
            y1="8"
            x2={BRIDGE_X - 16}
            y2={VIEW_HEIGHT - 8}
            stroke={INK}
            strokeWidth="2"
            strokeDasharray="3 3"
          />
        ) : null}
        {base > 0 ? (
          <text x="2" y="70" fill={INK} fontSize="9" fontFamily="ui-monospace, monospace" fontWeight="700">
            {base}
          </text>
        ) : null}
        <line x1={NUT_X} y1="2" x2={NUT_X} y2={VIEW_HEIGHT - 2} stroke={INK} strokeWidth={base > 0 ? 1.5 : 5} />
        <rect x={BRIDGE_X - 3} y="6" width="8" height={VIEW_HEIGHT - 12} fill={PAPER} stroke={INK} strokeWidth="2.5" />
        {GUITAR_STRINGS.map((spec, index) => (
          <GuitarString
            key={spec.number}
            spec={spec}
            y={stringY(index)}
            fret={frets[index] ?? null}
            base={base}
            palm={palm}
            chop={chops[index] ?? false}
            pluckId={plucks[index] ?? 0}
          />
        ))}
        {frets.map((fret, index) => (
          <FretMarker key={index} fret={fret ?? null} base={base} y={stringY(index)} />
        ))}
        {stringKeys.map((key, index) => (
          <text
            key={key}
            x={BRIDGE_X + 14}
            y={stringY(index) + 3}
            fill={INK}
            fontSize="9"
            fontFamily="ui-monospace, monospace"
            fontWeight="700"
            opacity="0.55"
          >
            {key}
          </text>
        ))}
      </svg>
      <span className="pointer-events-none absolute left-[63%] top-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-[#1a1a1a] bg-[#fbfbf9] px-1.5 font-mono text-sm font-black leading-none">
        {gripName}
      </span>
    </div>
  );
}

function FretMarker({ fret, base, y }: { fret: number | null; base: number; y: number }) {
  if (fret === null) {
    const x = NUT_X + 14;
    return (
      <g stroke={INK} strokeWidth="1.7" strokeLinecap="round">
        <line x1={x - 3.2} y1={y - 3.2} x2={x + 3.2} y2={y + 3.2} />
        <line x1={x - 3.2} y1={y + 3.2} x2={x + 3.2} y2={y - 3.2} />
      </g>
    );
  }
  if (fret <= 0) {
    return <circle cx={NUT_X + 14} cy={y} r="3.2" fill={PAPER} stroke={INK} strokeWidth="1.5" />;
  }
  const x = fretWireX(fret, base);
  if (x === undefined) return null;
  return <circle cx={x} cy={y} r="4.4" fill={INK} />;
}

function stringPaint(fret: number | null, palm: boolean, chop: boolean, wound: boolean) {
  const muted = fret === null;
  const stopped = fret !== null && fret > 0;
  const choked = palm || chop || muted;
  return {
    muted,
    stopped,
    motion: choked ? 'hobby-string-chuck' : 'hobby-string-vibrate',
    dash: muted ? '2 3' : undefined,
    restOpacity: stopped || muted ? 0.28 : 1,
    wind: wound && !muted
  };
}

function GuitarString({
  spec,
  y,
  fret,
  base,
  palm,
  chop,
  pluckId
}: {
  spec: GuitarStringSpec;
  y: number;
  fret: number | null;
  base: number;
  palm: boolean;
  chop: boolean;
  pluckId: number;
}) {
  const startX = speakingStart(fret, base);
  const paint = stringPaint(fret, palm, chop, spec.wound);
  const amplitude = 3 + spec.gauge * 1.2;
  const originX = (startX + BRIDGE_X) / 2;
  return (
    <g>
      <line
        x1={NUT_X}
        y1={y}
        x2={BRIDGE_X}
        y2={y}
        stroke={INK}
        strokeWidth={spec.gauge}
        strokeLinecap="round"
        strokeDasharray={paint.dash}
        opacity={paint.restOpacity}
      />
      {paint.stopped ? (
        <line x1={startX} y1={y} x2={BRIDGE_X} y2={y} stroke={INK} strokeWidth={spec.gauge} strokeLinecap="round" />
      ) : null}
      {paint.wind ? (
        <line
          x1={startX}
          y1={y}
          x2={BRIDGE_X}
          y2={y}
          stroke={PAPER}
          strokeWidth={spec.gauge * 0.5}
          strokeDasharray="0.8 1.8"
        />
      ) : null}
      {pluckId > 0 ? (
        <g key={pluckId}>
          <path
            className={paint.motion}
            style={{ transformOrigin: `${originX}px ${y}px` }}
            d={`M${startX} ${y} Q ${originX} ${y - amplitude * 2} ${BRIDGE_X} ${y}`}
            fill="none"
            stroke={INK}
            strokeWidth={spec.gauge}
            vectorEffect="non-scaling-stroke"
          />
          <line
            className="hobby-string-flash"
            x1={startX}
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
