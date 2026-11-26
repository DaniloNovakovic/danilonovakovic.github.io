import type { StreetFightProgress } from '@/game/core/console';
import type { SceneUiSurfaceProps } from '@/game/sceneUi/registry';
import { ALERT_RED_CSS } from '@/game/sharedSceneRuntime/escapeAlert';
import { cn } from '@/shared/ui/utils';

export type StreetFightPanelView = StreetFightProgress;

/**
 * Out of Bounds street fight (#163): what's left to smash, how cracked the
 * screen is, and big Swing and Parry buttons for touch. `F` swings and `R`
 * parries on a keyboard (the scene reads them). Nothing here moves or
 * flashes; the fight lives in the scene.
 */
export function StreetFightPanel({ params, dispatchAction }: SceneUiSurfaceProps) {
  const view = readParams(params);
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
          {view.phase === 'cleared' ? 'Quiet' : 'Under attack'}
        </span>
        <span className="rounded border-2 border-[#1a1a1a] bg-[#fbfbf9] px-1.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-[#1a1a1a] tabular-nums sm:text-xs">
          {statusLine(view)}
        </span>
        <span className="rounded border-2 border-[#1a1a1a] bg-[#fbfbf9] px-1.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-[#1a1a1a] tabular-nums sm:text-xs">
          Screen cracks {view.screenCracks}
        </span>
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

function statusLine(view: StreetFightPanelView): string {
  if (view.phase === 'chick') return 'Evil chick';
  if (view.phase === 'waves') return `Wave ${view.wave}: ${view.leftInWave} left`;
  return 'All smashed';
}

function readParams(params: unknown): StreetFightPanelView | null {
  if (!params || typeof params !== 'object') return null;
  const view = params as Partial<StreetFightPanelView>;
  return typeof view.phase === 'string' && typeof view.screenCracks === 'number'
    ? (view as StreetFightPanelView)
    : null;
}
