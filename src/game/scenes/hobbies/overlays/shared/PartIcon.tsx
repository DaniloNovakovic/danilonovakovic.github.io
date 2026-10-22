import type { ReactNode } from 'react';
import type { SparePartId } from './useSparePartReward';

export type StickerIconId = SparePartId | 'pin';

const INK = '#1a1a1a';

const ICON_ART: Record<StickerIconId, ReactNode> = {
  'battery-cell': (
    <>
      <rect x="17" y="6" width="14" height="5" rx="1" fill={INK} />
      <rect x="11" y="10" width="26" height="33" rx="3" fill="#fbfbf9" stroke={INK} strokeWidth="3.2" />
      <path d="M14 30 L34 30 M14 34 L34 34 M14 38 L34 38" stroke={INK} strokeWidth="1.2" opacity="0.55" />
      <path d="M26 14 L19 25 L24 25 L21 34 L29 22 L24 22 Z" fill={INK} />
    </>
  ),
  'copper-string': (
    <>
      <circle cx="24" cy="24" r="15" fill="#fbfbf9" stroke={INK} strokeWidth="3" />
      <circle cx="24" cy="24" r="10.5" fill="none" stroke={INK} strokeWidth="1.4" strokeDasharray="2 1.6" />
      <circle cx="24" cy="24" r="6" fill="none" stroke={INK} strokeWidth="1.4" strokeDasharray="2 1.6" />
      <path d="M37 18 C42 14 44 9 41 5" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="41" cy="5" r="2" fill={INK} />
    </>
  ),
  'clock-crystal': (
    <>
      <path d="M24 4 L36 16 L30 44 L18 44 L12 16 Z" fill="#fbfbf9" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M12 16 L36 16 M24 4 L20 16 L24 44 M24 4 L28 16 L24 44" fill="none" stroke={INK} strokeWidth="1.3" />
      <path d="M29 20 L33 18 M30 26 L33 24 M29 32 L32 30" stroke={INK} strokeWidth="1.2" opacity="0.6" />
    </>
  ),
  pin: (
    <>
      <rect x="9" y="14" width="30" height="26" fill="#fbfbf9" stroke={INK} strokeWidth="3" transform="rotate(-6 24 27)" />
      <path d="M14 33 C18 24 22 36 27 26 S33 30 34 24" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="24" cy="12" r="5" fill={INK} />
      <path d="M24 16 L24 22" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
    </>
  )
};

/** Hand-drawn ink icon for reward stickers. */
export function PartIcon({ id, size = 48 }: { id: StickerIconId; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      {ICON_ART[id]}
    </svg>
  );
}
