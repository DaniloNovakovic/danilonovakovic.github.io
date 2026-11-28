import { useEffect, useMemo, useState } from 'react';
import { useBridgeState } from '@/game/bridge/store';
import { drawImpactCrack, type CrackDrawing } from './screenCracks';

function readViewport() {
  return { width: window.innerWidth, height: window.innerHeight };
}

/**
 * The screen itself breaking (Out of Bounds screen destroyer, #164): glass
 * cracks drawn over the whole browser viewport, above the game, the header
 * and every overlay, each bursting from where the hammer landed. It is glass,
 * not UI: it never takes a click or focus (`Back`, static mode and `Esc` keep
 * working through it) and screen readers skip it. It stays over every mode
 * until reload. The newest crack runs out from the hit; reduced motion shows
 * it whole.
 */
export function ScreenDamageLayer() {
  const { screenDamage } = useBridgeState();
  const [viewport, setViewport] = useState(readViewport);

  useEffect(() => {
    const onResize = () => setViewport(readViewport());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const drawings = useMemo(
    () => screenDamage.cracks.map((crack) => drawImpactCrack(crack, viewport)),
    [screenDamage.cracks, viewport]
  );

  if (drawings.length === 0) return null;

  return (
    <svg
      data-testid="screen-damage-layer"
      aria-hidden="true"
      focusable="false"
      className="pointer-events-none fixed inset-0 z-[70] h-full w-full select-none"
      viewBox={`0 0 ${viewport.width} ${viewport.height}`}
      preserveAspectRatio="none"
    >
      <CrackMarks drawings={drawings} />
    </svg>
  );
}

/** Ink crack lines with a pale edge, so they read on cream paper and dark chrome alike. The newest runs out. */
export function CrackMarks({ drawings }: { drawings: readonly CrackDrawing[] }) {
  const newest = drawings.length - 1;
  return drawings.map((drawing, index) => (
    <g
      key={index}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={index === newest ? 'screen-crack-new' : undefined}
    >
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
  ));
}
