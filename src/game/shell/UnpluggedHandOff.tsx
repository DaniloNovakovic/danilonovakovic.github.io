import { useEffect, useRef } from 'react';
import { UNPLUGGED_TEXT } from '@/game/core/console';
import { ALERT_RED_CSS } from '@/game/sharedSceneRuntime/escapeAlert';

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
 * The page has fallen into black. A slow fade with motion, a cut without;
 * never a flash. From here there is no way out (out-of-bounds.md, pillar 4):
 * the only button is Wake up, and its click is the gesture the browser needs
 * for fullscreen and pointer lock (ADR-0007).
 */
export function UnpluggedHandOff({ onWakeUp }: { onWakeUp: () => void }) {
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
      className="fixed inset-0 z-[75] flex items-center justify-center bg-[#050505] px-4 motion-safe:animate-[unplugged-fade_1400ms_ease-in_both]"
    >
      <div className="flex max-w-md flex-col items-center gap-4 text-center motion-safe:animate-[unplugged-fade_1200ms_ease-out_1400ms_both]">
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
