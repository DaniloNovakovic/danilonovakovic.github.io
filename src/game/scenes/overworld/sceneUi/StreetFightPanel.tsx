import { useEffect, useRef } from 'react';
import { screenLayerName, type ScreenDestroyerProgress, type StreetFightProgress } from '@/game/core/console';
import { bridgeStore } from '@/game/bridge/store';
import type { SceneUiSurfaceProps } from '@/game/sceneUi/registry';
import { ALERT_RED_CSS } from '@/game/sharedSceneRuntime/escapeAlert';
import { cn } from '@/shared/ui/utils';

export interface StreetFightPanelView extends StreetFightProgress {
  /** The page coming apart (#164), from the moment the chick is down; null before. */
  destroyer?: ScreenDestroyerProgress | null;
  /** The hammer is on the screen itself: a click or tap anywhere is a smash. */
  onTheScreen?: boolean;
}

/** Things on the page that keep their own click: never a smash. */
const NOT_A_SMASH = 'button, a, input, select, textarea, label, [role="button"], [role="dialog"], [data-no-smash]';
const DESTROYER_CURSOR_CLASS = 'screen-destroyer-active';

/**
 * Out of Bounds street fight (#163): what's going on, and big Swing and Parry
 * buttons for touch. `F` swings and `R` parries on a keyboard (the scene reads
 * them). Nothing here moves or flashes; the fight lives in the scene. It never
 * gives away that the street can be hit: that is for the player to find.
 *
 * Once the hammer is on the screen itself (#164), a click or tap anywhere on
 * the page is a smash too, except on a control (Static mode, the Swing
 * button...), which keeps its own click. The cursor is a hammer meanwhile.
 */
export function StreetFightPanel({ params, dispatchAction }: SceneUiSurfaceProps) {
  const view = readParams(params);
  const smashing = Boolean(view?.onTheScreen && view.destroyer && !view.destroyer.blackout);
  usePageSmash(smashing, dispatchAction);
  if (!view) return null;
  const swing = () => dispatchAction('streetFightSwing');
  const parry = () => dispatchAction('streetFightParry');

  return (
    <div className="absolute inset-0 flex flex-col justify-between p-2 sm:p-3 short:p-1.5">
      <div role="status" aria-live="polite" className="pointer-events-none ml-auto flex flex-col items-end gap-1.5">
        <span
          className="-rotate-2 rounded border-2 border-[#1a1a1a] px-2 py-0.5 text-[19px] font-black uppercase leading-none tracking-widest text-[#1a1a1a] shadow-[3px_3px_0px_0px_rgba(26,26,26,1)]"
          style={{ backgroundColor: ALERT_RED_CSS }}
        >
          {badge(view)}
        </span>
        <span className="rounded border-2 border-[#1a1a1a] bg-[#fbfbf9] px-1.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-[#1a1a1a] tabular-nums sm:text-xs">
          {statusLine(view)}
        </span>
        {smashing && (
          <span className="rounded border-2 border-[#1a1a1a] bg-[#fbfbf9] px-1.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-[#1a1a1a] tabular-nums sm:text-xs">
            Smash anywhere
          </span>
        )}
      </div>

      <div className="flex items-end justify-end gap-2 sm:gap-3">
        <FightButton label="Parry" hint="R" aria="Parry: bat eggs back, block swipes" tone="paper" onPress={parry} />
        <FightButton label="Swing" hint="F" aria="Swing the hammer" tone="ink" onPress={swing} />
      </div>
    </div>
  );
}

/** Fires on press (the pigeons don't wait for a release); Enter on a focused button works too. */
function FightButton({
  label,
  hint,
  aria,
  tone,
  onPress
}: {
  label: string;
  hint: string;
  aria: string;
  tone: 'ink' | 'paper';
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={aria}
      title={`${aria} (${hint})`}
      onPointerDown={(event) => {
        event.preventDefault();
        onPress();
      }}
      onClick={(event) => {
        // Keyboard activation (Enter on a focused button) has no pointer press.
        if (event.detail === 0) onPress();
      }}
      className={cn(
        'pointer-events-auto h-16 touch-manipulation select-none rounded-full border-[3px] border-[#1a1a1a] px-6 text-base font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(75,67,55,1)] transition-transform duration-75 active:translate-y-1 active:shadow-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none sm:h-20 sm:px-8 sm:text-lg short:h-12 short:px-4 short:text-sm',
        tone === 'ink'
          ? 'bg-[#1a1a1a] text-[#fbfbf9] focus-visible:outline-[#fbfbf9]'
          : 'bg-[#fbfbf9] text-[#1a1a1a] focus-visible:outline-[#1a1a1a]'
      )}
    >
      {label}
      <span className="ml-2 hidden text-[10px] opacity-70 pointer-fine:inline short:hidden">{hint}</span>
    </button>
  );
}

/** Clicks and taps on the page, while the screen destroyer runs, go to the scene as smashes. */
function usePageSmash(active: boolean, dispatchAction: SceneUiSurfaceProps['dispatchAction']): void {
  // The host hands a new callback every render; listen once per destroyer run.
  const dispatch = useRef(dispatchAction);
  useEffect(() => {
    dispatch.current = dispatchAction;
  });
  useEffect(() => {
    if (!active) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      if (event.target instanceof Element && event.target.closest(NOT_A_SMASH)) return;
      // A menu (the Backpack) is open: the game is paused, the page isn't a target.
      if (bridgeStore.getState().activeOverlayId) return;
      dispatch.current('streetFightSmashPage', {
        x: event.clientX / window.innerWidth,
        y: event.clientY / window.innerHeight
      });
    };
    window.addEventListener('pointerdown', onPointerDown, true);
    document.documentElement.classList.add(DESTROYER_CURSOR_CLASS);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true);
      document.documentElement.classList.remove(DESTROYER_CURSOR_CLASS);
    };
  }, [active]);
}

function badge(view: StreetFightPanelView): string {
  if (view.destroyer?.blackout) return 'Unplugged';
  return view.onTheScreen ? 'Break it all' : 'Under attack';
}

function statusLine(view: StreetFightPanelView): string {
  if (view.destroyer?.blackout) return 'Nothing left';
  if (view.onTheScreen && view.destroyer?.breaking) return `Breaking ${screenLayerName(view.destroyer.breaking)}`;
  return view.phase === 'chick' ? 'Evil chick' : 'They keep coming';
}

function readParams(params: unknown): StreetFightPanelView | null {
  if (!params || typeof params !== 'object') return null;
  const view = params as Partial<StreetFightPanelView>;
  return view.phase === 'chick' || view.phase === 'horde' ? (view as StreetFightPanelView) : null;
}
