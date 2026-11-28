import { useEffect, useRef, useState } from 'react';
import { cn } from '@/shared/ui/utils';
import './playerDoodle.css';

const INK = '#1a1a1a';
const PAPER = '#fbfbf9';

/**
 * Flips true once the visitor has scrolled at least once and the element is on
 * screen, so the wave plays as they start moving down the page rather than
 * unseen during load.
 */
function useWaveCue<T extends Element>() {
  const ref = useRef<T>(null);
  const [cued, setCued] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || cued || typeof IntersectionObserver === 'undefined') return;
    let visible = false;
    let scrolled = false;
    const check = () => {
      if (visible && scrolled) setCued(true);
    };
    const onScroll = () => {
      scrolled = true;
      check();
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry?.isIntersecting ?? false;
        check();
      },
      { threshold: 0.6 }
    );
    observer.observe(node);
    window.addEventListener('scroll', onScroll, { once: true, passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, [cued]);

  return [ref, cued] as const;
}

/**
 * The game's player doodle (idle pose, glasses on) as SVG, so the static page
 * can show it without loading Phaser. Mirrors `drawPlayer` in
 * `src/game/sharedSceneRuntime/textures/TextureGenerator.ts`; keep the two in step.
 * Static-page only extras (the game sprite has neither): an arm that waves once
 * when the visitor first scrolls to it, then drops; and a shy face on hover.
 */
export function PlayerDoodle({ className }: { className?: string }) {
  const [ref, cued] = useWaveCue<SVGSVGElement>();

  return (
    <svg
      ref={ref}
      viewBox="0 0 48 65"
      overflow="visible"
      className={cn('player-doodle', className)}
      data-waving={cued || undefined}
      aria-hidden
    >
      <ellipse cx={24} cy={60} rx={10} ry={3} fill="#000" fillOpacity={0.1} />
      <g className="player-doodle-body">
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
        <g className="player-doodle-blush" fill="#f2a7a0">
          <ellipse cx={22} cy={21} rx={3} ry={1.6} />
          <ellipse cx={32} cy={21} rx={3} ry={1.6} />
        </g>
        <g className="player-doodle-face">
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
        </g>
        <g className="player-doodle-fluster" fill="none" stroke={INK} strokeWidth={1.5} strokeLinecap="round">
          <line x1={38} y1={4} x2={41} y2={1} />
          <line x1={40} y1={8} x2={44} y2={7} />
        </g>
      </g>
    </svg>
  );
}
