import { useEffect, useRef, useState } from 'react';
import { cn } from '@/shared/ui/utils';
import './playerDoodle.css';

const INK = '#1a1a1a';
const PAPER = '#fbfbf9';

/** Flips true the first time the element is on screen. */
function useSeenOnce<T extends Element>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || seen || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setSeen(true);
      },
      { threshold: 0.6 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [seen]);

  return [ref, seen] as const;
}

/**
 * The game's player doodle (idle pose, glasses on) as SVG, so the static page
 * can show it without loading Phaser. Mirrors `drawPlayer` in
 * `src/game/sharedSceneRuntime/textures/TextureGenerator.ts`; keep the two in step.
 * The arm is static-page only (the game sprite has none): it waves once on
 * first sight, then drops.
 */
export function PlayerDoodle({ className }: { className?: string }) {
  const [ref, seen] = useSeenOnce<SVGSVGElement>();

  return (
    <svg
      ref={ref}
      viewBox="0 0 48 65"
      overflow="visible"
      className={cn('player-doodle', className)}
      data-waving={seen || undefined}
      aria-hidden
    >
      <ellipse cx={24} cy={60} rx={10} ry={3} fill="#000" fillOpacity={0.1} />
      <g fill={PAPER} stroke={INK} strokeWidth={3} strokeLinejoin="round">
        <line x1={18} y1={45} x2={18} y2={60} />
        <line x1={30} y1={45} x2={30} y2={60} />
        <rect x={8} y={28} width={8} height={16} />
        <rect x={14} y={24} width={20} height={22} />
        <circle cx={24} cy={16} r={12} />
      </g>
      <line
        className="player-doodle-arm"
        x1={34}
        y1={29}
        x2={42}
        y2={18}
        stroke={INK}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <g fill={INK}>
        <circle cx={26} cy={14} r={2} />
        <circle cx={32} cy={14} r={2} />
      </g>
      <g fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round">
        <circle cx={26} cy={14} r={4} />
        <circle cx={32} cy={14} r={4} />
        <line x1={28} y1={14} x2={30} y2={14} />
        <line x1={22} y1={13} x2={18} y2={12} />
      </g>
    </svg>
  );
}
