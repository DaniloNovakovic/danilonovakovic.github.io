import { useEffect, useMemo, useState } from 'react';
import { useBridgeState } from '@/game/bridge/store';
import { drawScreenCrack, drawScreenDent } from './screenCracks';

function readViewport() {
  return { width: window.innerWidth, height: window.innerHeight };
}

/**
 * Damage to the screen itself (Out of Bounds street fight, #163): cracks drawn
 * over the whole browser viewport, above the game, the header and every
 * overlay. It is glass, not UI: it never takes a click or focus (`Back`,
 * static mode and `Esc` keep working through it) and screen readers skip it.
 * The newest crack runs out from the hit; reduced motion shows it whole.
 *
 * Dents from the screen destroyer (#164) belong to the game page coming
 * apart, so they're drawn only with `withDents` (the interactive mode):
 * static mode keeps the cracks at the edges and stays readable.
 */
export function ScreenDamageLayer({ withDents = false }: { withDents?: boolean }) {
  const { screenDamage } = useBridgeState();
  const [viewport, setViewport] = useState(readViewport);

  useEffect(() => {
    const onResize = () => setViewport(readViewport());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const drawings = useMemo(
    () => screenDamage.cracks.map((crack) => drawScreenCrack(crack, viewport)),
    [screenDamage.cracks, viewport]
  );

  const dents = useMemo(
    () => (withDents ? screenDamage.dents.map((dent) => drawScreenDent(dent, viewport)) : []),
    [withDents, screenDamage.dents, viewport]
  );

  if (drawings.length === 0 && dents.length === 0) return null;
  const newest = drawings.length - 1;
  const newestDent = dents.length - 1;

  return (
    <svg
      data-testid="screen-damage-layer"
      aria-hidden="true"
      focusable="false"
      className="pointer-events-none fixed inset-0 z-[70] h-full w-full select-none"
      viewBox={`0 0 ${viewport.width} ${viewport.height}`}
      preserveAspectRatio="none"
    >
      {drawings.map((drawing, index) => (
        <g
          key={index}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={index === newest ? 'screen-crack-new' : undefined}
        >
          {/* A pale edge beside each ink line, so cracks read on cream paper and the dark header alike. */}
          {drawing.runs.map((d, i) => (
            <path key={`r${i}`} d={d} stroke="#fbfbf9" strokeWidth={4} strokeOpacity={0.75} pathLength={1} />
          ))}
          {drawing.runs.map((d, i) => (
            <path key={`ri${i}`} d={d} stroke="#1a1a1a" strokeWidth={1.6} strokeOpacity={0.9} pathLength={1} />
          ))}
          {drawing.impact.map((d, i) => (
            <path key={`i${i}`} d={d} stroke="#1a1a1a" strokeWidth={1.8} strokeOpacity={0.8} pathLength={1} />
          ))}
        </g>
      ))}
      {dents.map((marks, index) => (
        <g
          key={`dent${index}`}
          data-testid="screen-dent"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={index === newestDent ? 'screen-crack-new' : undefined}
        >
          {marks.map((d, i) => (
            <path key={`e${i}`} d={d} stroke="#fbfbf9" strokeWidth={4} strokeOpacity={0.75} pathLength={1} />
          ))}
          {marks.map((d, i) => (
            <path key={`d${i}`} d={d} stroke="#1a1a1a" strokeWidth={1.8} strokeOpacity={0.9} pathLength={1} />
          ))}
        </g>
      ))}
    </svg>
  );
}
