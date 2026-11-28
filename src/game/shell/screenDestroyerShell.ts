import type { CSSProperties } from 'react';
import { observeScreenDestroyer, screenLayer } from '@/game/core/console';
import type { BridgeScreenDamageState } from '@/game/bridge/store';

/**
 * The shell's share of the screen destroyer (Out of Bounds, #164): the card
 * that frames the game cracking and falling away (and the header buttons with
 * it), and the page shattering into black. The street comes apart in the
 * scene; the card's cracks are drawn by ScreenDestroyerCard, the glass's by
 * ScreenDamageLayer.
 *
 * The way out never goes: the Static mode button hangs on by a strip of tape,
 * above the cracks and the black, and the hand-off has its own calm way back.
 */
export interface ShellDamage {
  /** The card has started to crack: the Static button gets its tape. */
  torn: boolean;
  /** The card has fallen away: no frame, no shadow, paper edge to edge. */
  cardGone: boolean;
  /** The left-hand buttons (Dev, Backpack): they tilt as the card cracks, then drop off with it. */
  leftStyle: CSSProperties | undefined;
  /** How the left-hand buttons move (none under reduced motion: no animated tearing). */
  leftClassName: string;
  /** Every layer is gone: the page has fallen into black. */
  blackout: boolean;
  /** The card's ink (shadow, then border and paper), gone with the card; the frame keeps its size. */
  shellClassName: string;
  frameClassName: string;
  gameChrome: 'framed' | 'unframed';
}

const CARD_INK = {
  shellClassName: 'shadow-[12px_12px_0px_0px_rgba(26,26,26,1)]',
  frameClassName: 'border-[#1a1a1a] bg-[#fbfbf9]',
  gameChrome: 'framed'
} as const;
const NO_CARD = {
  shellClassName: '',
  frameClassName: 'border-transparent bg-[#f4f1ea]',
  gameChrome: 'unframed'
} as const;

/** Reduced motion: the same states, without animated tearing. */
const PEEL_CLASS = 'transition-transform duration-200 ease-out motion-reduce:transition-none';
const FALL_CLASS = 'transition-[transform,opacity] duration-[900ms] ease-in motion-reduce:transition-none';

const UNTOUCHED: ShellDamage = {
  torn: false,
  cardGone: false,
  leftStyle: undefined,
  leftClassName: '',
  blackout: false,
  ...CARD_INK
};

export function shellDamage(screenDamage: BridgeScreenDamageState): ShellDamage {
  const progress = observeScreenDestroyer({ screenSmashes: screenDamage.smashes });
  if (!progress) return UNTOUCHED;
  const card = screenLayer(progress, 'card');
  if (card.hitsTaken === 0) return UNTOUCHED;
  const d = card.damage;
  return {
    torn: true,
    cardGone: card.gone,
    leftStyle: card.gone
      ? { transform: 'translateY(45vh) rotate(-28deg)', opacity: 0 }
      : { transform: `rotate(${8 * d}deg) translateY(${10 * d}px)`, transformOrigin: '0% 0%' },
    leftClassName: card.gone ? FALL_CLASS : PEEL_CLASS,
    blackout: progress.blackout,
    ...(card.gone ? NO_CARD : CARD_INK)
  };
}
