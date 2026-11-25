import { useEffect, useRef } from 'react';
import { POINT_OF_NO_RETURN_TEXT } from '@/game/core/console';
import type { SceneUiSurfaceProps } from '@/game/sceneUi/registry';

/**
 * Out of Bounds, Act 2: the warning before the toolbox. The sketchbook flips
 * here: ink paper, cream lettering, hazard tape and a misprinted title, so it
 * reads like the page itself is warning you. Nothing moves except one pop in
 * (none under reduced motion), and nothing flashes.
 *
 * Keys: Y picks it up, N leaves it, Enter / Space / E press the focused
 * button, ←/→ move between them. Esc is left to the scene: it leaves the room,
 * as it does everywhere else. "Leave it" has focus first, so a stray Enter is safe.
 */
export function PointOfNoReturnPanel({ dispatchAction }: SceneUiSurfaceProps) {
  const declineRef = useRef<HTMLButtonElement>(null);
  const confirm = () => dispatchAction('pointOfNoReturnConfirm');
  const decline = () => dispatchAction('pointOfNoReturnDecline');
  usePanelKeys(confirm, decline);

  useEffect(() => {
    declineRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div
      role="alertdialog"
      aria-labelledby="point-of-no-return-title"
      aria-describedby="point-of-no-return-body"
      className="relative w-[min(25rem,calc(100vw-2rem))] -rotate-1 animate-ridge-bust-pop border-4 border-[#1a1a1a] bg-[#1a1a1a] text-[#fbfbf9] shadow-[8px_8px_0px_0px_rgba(26,26,26,0.45)] motion-reduce:animate-none"
    >
      <HazardTape />
      <div className="px-5 pb-4 pt-3 sm:px-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#fbfbf9]/70">⚠ simulation warning</p>
        <h2
          id="point-of-no-return-title"
          className="relative mt-1 text-[1.65rem] font-black uppercase leading-none tracking-wider sm:text-3xl"
        >
          {/* A misprint: the title stamped twice, slightly off. */}
          <span aria-hidden="true" className="absolute left-[3px] top-[3px] text-[#fbfbf9]/30">
            {POINT_OF_NO_RETURN_TEXT.title}
          </span>
          <span className="relative">{POINT_OF_NO_RETURN_TEXT.title}</span>
        </h2>
        <p id="point-of-no-return-body" className="mt-3 text-sm leading-snug sm:text-base">
          {POINT_OF_NO_RETURN_TEXT.body}
        </p>
        <div className="mt-4 flex flex-wrap justify-end gap-3">
          <button
            ref={declineRef}
            type="button"
            data-point-of-no-return-choice
            onClick={decline}
            className="rounded border-2 border-[#fbfbf9] bg-transparent px-3 py-1.5 font-bold text-[#fbfbf9] transition-transform duration-150 hover:-translate-y-0.5 focus:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#fbfbf9] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a] motion-reduce:transition-none"
          >
            {POINT_OF_NO_RETURN_TEXT.decline} <KeyHint>N</KeyHint>
          </button>
          <button
            type="button"
            data-point-of-no-return-choice
            onClick={confirm}
            className="rounded border-2 border-[#fbfbf9] bg-[#fbfbf9] px-3 py-1.5 font-black uppercase text-[#1a1a1a] shadow-[3px_3px_0px_0px_rgba(251,251,249,0.35)] transition-transform duration-150 hover:-translate-y-0.5 focus:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#fbfbf9] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a] motion-reduce:transition-none"
          >
            {POINT_OF_NO_RETURN_TEXT.confirm} <KeyHint>Y</KeyHint>
          </button>
        </div>
      </div>
      <HazardTape />
    </div>
  );
}

function HazardTape() {
  return (
    <div
      aria-hidden="true"
      className="h-3 border-y-2 border-[#1a1a1a]"
      style={{
        backgroundImage: 'repeating-linear-gradient(-45deg, #fbfbf9 0 9px, #1a1a1a 9px 18px)'
      }}
    />
  );
}

function KeyHint({ children }: { children: string }) {
  return (
    <span aria-hidden="true" className="ml-1 hidden font-mono text-xs opacity-60 sm:inline">
      [{children}]
    </span>
  );
}

const ACTIVATE_KEYS = new Set(['Enter', ' ', 'e', 'E']);
const MOVE_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D']);

/** Window keys, not native button keys: Phaser captures Space, E and the arrows. */
function usePanelKeys(confirm: () => void, decline: () => void): void {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.key === 'y' || event.key === 'Y') {
        event.preventDefault();
        confirm();
      } else if (event.key === 'n' || event.key === 'N') {
        event.preventDefault();
        decline();
      } else if (ACTIVATE_KEYS.has(event.key)) {
        event.preventDefault();
        focusedChoice()?.click();
      } else if (MOVE_KEYS.has(event.key)) {
        event.preventDefault();
        moveFocus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirm, decline]);
}

function choiceButtons(): HTMLButtonElement[] {
  return Array.from(document.querySelectorAll<HTMLButtonElement>('button[data-point-of-no-return-choice]'));
}

function focusedChoice(): HTMLButtonElement | undefined {
  const buttons = choiceButtons();
  // Focus lost (say, a click on the canvas): fall back to the safe choice.
  return buttons.find((button) => button === document.activeElement) ?? buttons[0];
}

function moveFocus(): void {
  const buttons = choiceButtons();
  const current = buttons.findIndex((button) => button === document.activeElement);
  buttons[(current + 1) % buttons.length]?.focus({ preventScroll: true });
}
