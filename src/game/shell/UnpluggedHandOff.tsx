import { useEffect, useMemo, useRef, type CSSProperties } from 'react';
import type { ScreenCrack } from '@/game/bridge/store';
import { UNPLUGGED_TEXT } from '@/game/core/console';
import { ALERT_RED_CSS } from '@/game/sharedSceneRuntime/escapeAlert';
import { shatterShards } from './screenCracks';

/** A strip of alert-red tape holding the way out on the page. */
export function TapeStrip() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute -right-2 -top-2 h-3 w-10 rotate-[24deg] border border-[#1a1a1a] opacity-90"
      style={{ backgroundColor: ALERT_RED_CSS }}
    />
  );
}

/**
 * The screen has shattered into black. With motion, the pieces of the page
 * fall away (nearest the last smash first) and the words fade in; without, it
 * is a cut. Never a flash. From here there is no way out (out-of-bounds.md,
 * pillar 4): the only button is Wake up, and its click is the gesture the
 * browser needs for fullscreen and pointer lock (ADR-0007).
 */
export function UnpluggedHandOff({ onWakeUp, lastSmash }: { onWakeUp: () => void; lastSmash: ScreenCrack | null }) {
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    button.current?.focus();
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="unplugged-title"
      data-testid="unplugged-hand-off"
      className="fixed inset-0 z-[75] flex items-center justify-center bg-[#050505] px-4"
    >
      <ShatteredScreen impact={lastSmash ?? { x: 0.5, y: 0.5, seed: 1 }} />
      <div className="relative flex max-w-md flex-col items-center gap-4 text-center motion-safe:animate-[unplugged-fade_1200ms_ease-out_1400ms_both]">
        <h2 id="unplugged-title" className="text-xs font-bold uppercase tracking-[0.5em] text-[#8a8a8a]">
          {UNPLUGGED_TEXT.title}
        </h2>
        {UNPLUGGED_TEXT.lines.map((line) => (
          <p key={line} className="font-mono text-base text-[#d8d4ca] sm:text-lg">
            {line}
          </p>
        ))}
        <button
          ref={button}
          type="button"
          onClick={onWakeUp}
          className="mt-4 rounded border-2 border-[#d8d4ca] px-4 py-2 text-sm font-bold uppercase tracking-wider text-[#d8d4ca] hover:bg-[#d8d4ca] hover:text-[#050505] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d8d4ca]"
        >
          {UNPLUGGED_TEXT.wakeUp}
        </button>
      </div>
    </div>
  );
}

/** The shattered page, falling away piece by piece. Drawn only with motion. */
function ShatteredScreen({ impact }: { impact: ScreenCrack }) {
  const shards = useMemo(
    () => shatterShards(impact, { width: window.innerWidth, height: window.innerHeight }),
    [impact]
  );
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      data-testid="screen-shards"
      className="pointer-events-none absolute inset-0 h-full w-full select-none motion-reduce:hidden"
      viewBox={`0 0 ${window.innerWidth} ${window.innerHeight}`}
      preserveAspectRatio="none"
    >
      {shards.map((shard, i) => (
        <polygon
          key={i}
          className="screen-shard"
          points={shard.points}
          fill="#f4f1ea"
          stroke="#1a1a1a"
          strokeWidth={1.4}
          strokeLinejoin="round"
          style={
            {
              '--shard-drift-x': `${shard.driftX}px`,
              '--shard-turn': `${shard.turn}deg`,
              animationDelay: `${shard.delayMs}ms`
            } as CSSProperties
          }
        />
      ))}
    </svg>
  );
}
