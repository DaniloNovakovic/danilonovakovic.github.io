import type { CSSProperties } from 'react';
import { screenDestroyerProgress, screenLayer } from '@/game/core/console';
import type { BridgeScreenDamageState } from '@/game/bridge/store';

/**
 * The shell's share of the screen destroyer (Out of Bounds, #164): the
 * portfolio header peeling off the page, and the page falling into black.
 * The game page comes apart in the scene; the dents are in ScreenDamageLayer.
 *
 * The way out never goes: the Static mode button hangs on by a strip of tape,
 * above the dents and the black, and the hand-off has its own calm way back.
 */
export interface HeaderPeel {
  /** The header has started to tear: the Static button gets its tape. */
  torn: boolean;
  /** The left-hand buttons (Dev, Backpack): they tilt, then drop off the page. */
  leftStyle: CSSProperties | undefined;
  /** How the left-hand buttons move (none under reduced motion: no animated tearing). */
  leftClassName: string;
  /** The left-hand buttons have fallen off. */
  fallen: boolean;
  /** Every layer is gone: the page has fallen into black. */
  blackout: boolean;
}

/** Reduced motion: the same states, without animated tearing. */
const PEEL_CLASS = 'transition-transform duration-200 ease-out motion-reduce:transition-none';
const FALL_CLASS = 'transition-[transform,opacity] duration-[900ms] ease-in motion-reduce:transition-none';

export function headerPeel(screenDamage: BridgeScreenDamageState): HeaderPeel {
  const progress = screenDestroyerProgress(screenDamage.dents.length);
  const header = screenLayer(progress, 'header');
  const torn = header.hitsTaken > 0;
  if (!torn) {
    return { torn, leftStyle: undefined, leftClassName: '', fallen: false, blackout: false };
  }
  const d = header.damage;
  return {
    torn,
    leftStyle: header.gone
      ? { transform: 'translateY(45vh) rotate(-28deg)', opacity: 0 }
      : { transform: `rotate(${8 * d}deg) translateY(${10 * d}px)`, transformOrigin: '0% 0%' },
    leftClassName: header.gone ? FALL_CLASS : PEEL_CLASS,
    fallen: header.gone,
    blackout: progress.blackout
  };
}
