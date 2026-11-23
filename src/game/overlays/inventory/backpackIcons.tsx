/**
 * Ink doodles for the backpack: thick outer contour, lighter inner marks,
 * like the street sprites. Pure SVG, so they stay crisp at any size.
 */
import type { ReactNode, SVGProps } from 'react';
import type { BackpackSlotId } from './backpackView';

const INK = '#1a1a1a';
const PAPER = '#fbfbf9';

function Doodle({ children, ...props }: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke={INK}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

function Glasses() {
  return (
    <>
      <circle cx="15" cy="26" r="7.5" fill={PAPER} />
      <circle cx="33" cy="26" r="7.5" fill={PAPER} />
      <path d="M22.5 25c1-1.6 2-1.6 3 0" />
      <path d="M7.5 24.5 4 20M40.5 24.5 44 20" />
      <path d="M11.5 23c1-1.5 2.5-2 4-2M29.5 23c1-1.5 2.5-2 4-2" strokeWidth={1.6} />
    </>
  );
}

/** The litter pile's clue: a raccoon paw print. */
function PawPrint() {
  return (
    <>
      <path d="M17 32c0-5 3.5-8 7-8s7 3 7 8c0 3.5-3 5-7 5s-7-1.5-7-5z" fill={INK} />
      <ellipse cx="13" cy="22" rx="2.6" ry="3.6" fill={INK} stroke="none" transform="rotate(-20 13 22)" />
      <ellipse cx="19.5" cy="15.5" rx="2.6" ry="3.8" fill={INK} stroke="none" />
      <ellipse cx="28.5" cy="15.5" rx="2.6" ry="3.8" fill={INK} stroke="none" />
      <ellipse cx="35" cy="22" rx="2.6" ry="3.6" fill={INK} stroke="none" transform="rotate(20 35 22)" />
    </>
  );
}

function CopperString() {
  return (
    <>
      <path d="M8 34c4-12 8-12 10 0s6 12 10 0 6-12 10 0" />
      <path d="M38 34c1.5 4 3 4 4 2" strokeWidth={2} />
      <circle cx="7" cy="35" r="2.5" fill={PAPER} />
    </>
  );
}

function ClockCrystal() {
  return (
    <>
      <path d="M24 7 35 18 24 41 13 18z" fill={PAPER} />
      <path d="M13 18h22M19 18l5 23 5-23M19 18l5-11 5 11" strokeWidth={1.6} />
      <path d="M39 9v5M36.5 11.5h5" strokeWidth={2} />
    </>
  );
}

function BatteryCell() {
  return (
    <>
      <rect x="15" y="12" width="18" height="30" rx="2.5" fill={PAPER} />
      <path d="M20.5 8.5h7v3.5h-7z" fill={INK} />
      <path d="m26 18-5 9h6l-5 9" strokeWidth={2.4} />
    </>
  );
}

function Circuit() {
  return (
    <>
      <rect x="13" y="13" width="22" height="22" rx="2" fill={PAPER} />
      <path d="M19 13V7M24 13V7M29 13V7M19 41v-6M24 41v-6M29 41v-6M13 19H7M13 24H7M13 29H7M41 19h-6M41 24h-6M41 29h-6" />
      <path d="M19 24h4l2-4 2 8 2-4" strokeWidth={2} />
    </>
  );
}

const SLOT_DOODLES: Record<BackpackSlotId, () => ReactNode> = {
  glasses: Glasses,
  'litter-clue': PawPrint,
  'copper-string': CopperString,
  'clock-crystal': ClockCrystal,
  'battery-cell': BatteryCell,
  circuit: Circuit
};

export function SlotDoodle({ slotId, ...props }: SVGProps<SVGSVGElement> & { slotId: BackpackSlotId }) {
  const Drawing = SLOT_DOODLES[slotId];
  return (
    <Doodle {...props}>
      <Drawing />
    </Doodle>
  );
}
