import { useEffect, useRef, useState } from 'react';
import type { RealWorldHandle } from '@/game/realWorld';
import { getMessages } from '@/shared/i18n';
import { hasWebGL, requestFullscreenQuietly } from './realWorldBrowser';

type Status = 'loading' | 'running' | 'paused' | 'noWebGL' | 'loadFailed';

const HINT_MS = 6000;

const isTouchScreen = () => typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

/** Crosshair, plus a few seconds of how-to-move. */
function RunningHud({ hint }: { hint: string }) {
  const [showHint, setShowHint] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), HINT_MS);
    return () => clearTimeout(timer);
  }, []);
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 before:absolute before:left-[6px] before:top-0 before:h-3.5 before:w-0.5 before:bg-white before:shadow-[0_0_0_1px_#000] after:absolute after:left-0 after:top-[6px] after:h-0.5 after:w-3.5 after:bg-white after:shadow-[0_0_0_1px_#000]"
      />
      {showHint && (
        <p className="pointer-events-none absolute left-1/2 top-[max(1rem,env(safe-area-inset-top))] -translate-x-1/2 whitespace-nowrap text-xs text-white [text-shadow:0_1px_2px_#000]">
          {hint}
        </p>
      )}
    </>
  );
}

interface CardProps {
  message: string;
  action?: string;
  onAction?: () => void;
  dim?: boolean;
  alert?: boolean;
}

/** A line of text over the black, with at most one button (focused). */
function Card({ message, action, onAction, dim = false, alert = false }: CardProps) {
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => button.current?.focus(), []);
  return (
    <div
      role={alert ? 'alert' : undefined}
      className={`absolute inset-0 flex flex-col items-center justify-center gap-4 px-4 text-center ${dim ? 'bg-[#050505]/70' : ''}`}
    >
      <p className="max-w-md">{message}</p>
      {action && (
        <button
          ref={button}
          type="button"
          onClick={onAction}
          className="rounded border-2 border-[#d8d4ca] px-4 py-2 text-sm font-bold uppercase tracking-wider hover:bg-[#d8d4ca] hover:text-[#050505] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d8d4ca]"
        >
          {action}
        </button>
      )}
    </div>
  );
}

/**
 * Out of Bounds Act 4 (ADR-0007): the real world takes the whole viewport. The
 * Three.js chunk loads here and only here. No exit UI: `Esc` pauses, a reload
 * starts over. The one way back is for when the real world can't run at all.
 */
export function RealWorldTakeover({ onGiveUp }: { onGiveUp: () => void }) {
  const text = getMessages().gameShell.realWorld;
  const host = useRef<HTMLDivElement>(null);
  const handle = useRef<RealWorldHandle | null>(null);
  const [status, setStatus] = useState<Status>(() => (hasWebGL() ? 'loading' : 'noWebGL'));
  const canRun = status !== 'noWebGL';

  useEffect(() => {
    const element = host.current;
    if (!element || !canRun) return;
    let cancelled = false;
    import('@/game/realWorld')
      .then(({ bootRealWorld }) => {
        if (cancelled) return;
        handle.current = bootRealWorld(
          element,
          { onPausedChange: (paused) => setStatus(paused ? 'paused' : 'running') },
          getMessages().gameShell.realWorld
        );
        setStatus((current) => (current === 'loading' ? 'running' : current));
      })
      .catch(() => {
        if (!cancelled) setStatus('loadFailed');
      });
    return () => {
      cancelled = true;
      handle.current?.dispose();
      handle.current = null;
    };
  }, [canRun]);

  const resume = () => {
    requestFullscreenQuietly();
    handle.current?.resume();
  };

  return (
    <div
      role="application"
      aria-label={text.label}
      data-testid="real-world"
      className="fixed inset-0 z-[90] select-none overflow-hidden bg-[#050505] font-mono text-[#d8d4ca]"
    >
      <div ref={host} className="absolute inset-0" />

      {status === 'running' && <RunningHud hint={isTouchScreen() ? text.hintTouch : text.hintMouse} />}
      {status === 'loading' && <Card message={text.loading} />}
      {status === 'paused' && <Card message={text.paused} action={text.keepGoing} onAction={resume} dim />}
      {status === 'noWebGL' && <Card alert message={text.noWebGL} action={text.back} onAction={onGiveUp} />}
      {status === 'loadFailed' && <Card alert message={text.loadFailed} action={text.back} onAction={onGiveUp} />}
    </div>
  );
}
