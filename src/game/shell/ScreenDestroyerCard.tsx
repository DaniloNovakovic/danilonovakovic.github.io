import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ScreenCrack } from '@/game/bridge/store';
import { cn } from '@/shared/ui/utils';
import { CrackMarks } from './ScreenDamageLayer';
import { drawScreenCrack } from './screenCracks';

/** How long the broken card takes to fall out of the picture. */
const CARD_FALL_MS = 1100;

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** A smash point on the viewport, as a point on the card (fractions of it). */
function onTheCard(crack: ScreenCrack, box: Box): ScreenCrack {
  const clamp = (n: number) => Math.min(1, Math.max(0, n));
  return {
    ...crack,
    x: clamp((crack.x * window.innerWidth - box.left) / box.width),
    y: clamp((crack.y * window.innerHeight - box.top) / box.height)
  };
}

/**
 * The card that frames the game, breaking (Out of Bounds screen destroyer,
 * #164): cracks from its corners, one per smash, that stop short of the
 * middle so Danilo stays in view. When it breaks, the cracked card (border,
 * shadow and all) drops out of the picture and the game is left on paper,
 * edge to edge. Reduced motion: the card is simply gone. Drawn over the game,
 * under the fight buttons; never takes a click, and screen readers skip it.
 */
export function ScreenDestroyerCard({ cracks, gone }: { cracks: readonly ScreenCrack[]; gone: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [falling, setFalling] = useState(false);
  const wasGone = useRef(gone);

  useLayoutEffect(() => {
    const element = ref.current?.parentElement;
    if (!element) return;
    const measure = () => {
      const { left, top, width, height } = element.getBoundingClientRect();
      if (width > 0 && height > 0) setBox({ left, top, width, height });
    };
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(element);
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  // Only a card that breaks while you watch falls; a remount just finds it gone.
  useEffect(() => {
    if (!gone || wasGone.current) return;
    wasGone.current = true;
    setFalling(true);
    const timer = window.setTimeout(() => setFalling(false), CARD_FALL_MS);
    return () => window.clearTimeout(timer);
  }, [gone]);

  const drawings = useMemo(
    () => (box ? cracks.map((crack) => drawScreenCrack(onTheCard(crack, box), box)) : []),
    [box, cracks]
  );

  if (gone && !falling) return <div ref={ref} hidden />;
  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-testid="screen-destroyer-card"
      className={cn(
        'pointer-events-none absolute inset-0 select-none',
        falling &&
          'screen-card-fall rounded-lg border-4 border-[#1a1a1a] shadow-[12px_12px_0px_0px_rgba(26,26,26,1)] motion-reduce:hidden'
      )}
    >
      {box && drawings.length > 0 && (
        <svg
          className="h-full w-full"
          focusable="false"
          viewBox={`0 0 ${box.width} ${box.height}`}
          preserveAspectRatio="none"
        >
          <CrackMarks drawings={drawings} />
        </svg>
      )}
    </div>
  );
}
