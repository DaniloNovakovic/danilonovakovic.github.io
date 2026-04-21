import { useCallback, Suspense, useState } from 'react';
import { BookOpen } from 'lucide-react';
import Game from './Game';
import { GameState, type AppState } from '../game/gameState';
import { getMiniGameById } from '../game/miniGameRegistry';
import { MiniGameType } from '../game/types';
import { TEXTS } from '../config/content';
import { isMiniGameId } from '../config/featureIds';
import { UI_FONT_FAMILY } from '../config/typography';
import { bridgeActions, bridgeStore } from '../shared/bridge/store';
import { OverlayCard } from './overlays/OverlayCard';

interface InteractiveAppProps {
  onSwitchToStatic: () => void;
}

export default function InteractiveApp({ onSwitchToStatic }: InteractiveAppProps) {
  const [state, setState] = useState<AppState>({
    status: GameState.EXPLORING,
    activeMiniGameId: null
  });

  const handleInteract = (area: string) => {
    if (!isMiniGameId(area)) return;
    setState({
      status: GameState.IN_MINIGAME,
      activeMiniGameId: area
    });
    bridgeActions.requestInteraction(area);
  };

  /**
   * Registry is the single source of truth for overlay parent relationships.
   * Bridge is driven here — no hardcoded parent map in the store.
   */
  const closeOverlay = useCallback(() => {
    const currentId = bridgeStore.getState().activeMiniGameId;
    const active = currentId ? getMiniGameById(currentId) : undefined;
    if (active?.overlayParentId) {
      bridgeActions.requestInteraction(active.overlayParentId);
      setState({ status: GameState.IN_MINIGAME, activeMiniGameId: active.overlayParentId });
    } else {
      bridgeActions.closeActiveOverlay();
      setState({ status: GameState.EXPLORING, activeMiniGameId: null });
    }
  }, []);

  const activeMiniGame = state.activeMiniGameId ? getMiniGameById(state.activeMiniGameId) : undefined;
  const isPaused = state.status === GameState.IN_MINIGAME && activeMiniGame?.type === MiniGameType.REACT_OVERLAY;

  return (
    <div
      className="relative flex min-h-[100dvh] min-h-dvh w-full flex-col overflow-x-hidden bg-[#f4f1ea]"
      style={{ fontFamily: UI_FONT_FAMILY }}
    >
      {/* Mode switch link — unobtrusive, top-right */}
      <button
        type="button"
        onClick={onSwitchToStatic}
        className="fixed right-2 top-[max(0.5rem,env(safe-area-inset-top,0px))] z-40 inline-flex items-center gap-1.5 rounded border-2 border-[#1a1a1a] bg-[#fbfbf9]/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-[#1a1a1a] shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] backdrop-blur-sm transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] sm:right-4 sm:top-4 sm:px-3 sm:py-1.5 sm:text-xs"
        aria-label="Switch to static portfolio"
      >
        <BookOpen className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        <span className="hidden sm:inline">Static mode</span>
        <span className="sm:hidden">Static</span>
      </button>

      {/* Game area: scales down on narrow viewports; leaves room for hints + safe areas */}
      <div className="flex min-h-0 flex-1 w-full flex-col items-center justify-center px-2 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-[max(0.5rem,env(safe-area-inset-top,0px))] sm:px-4 sm:pb-24 sm:pt-2">
        <div className="relative w-full max-w-[1000px] shrink-0 shadow-[12px_12px_0px_0px_rgba(26,26,26,1)]">
          <div
            className="relative w-full overflow-hidden rounded-lg border-4 border-[#1a1a1a] bg-[#fbfbf9] aspect-[1000/600] max-h-[min(82dvh,calc(100dvh-8.5rem))] sm:max-h-[min(88dvh,600px)]"
          >
            <div className="absolute inset-0">
              {/* Paper Texture Overlay */}
              <div className="pointer-events-none absolute inset-0 z-[5] bg-[url('https://www.transparenttextures.com/patterns/felt.png')] opacity-[0.03]" />
              <Game
                onInteract={handleInteract}
                isPaused={isPaused}
                activeMiniGameId={state.activeMiniGameId}
                onClose={closeOverlay}
              />
            </div>
          </div>
        </div>

        {/* Hints below game on small screens (avoids covering touch controls) */}
        {state.status === GameState.EXPLORING && (
          <div className="mt-2 w-full max-w-lg shrink-0 px-1 text-center md:hidden">
            <p className="text-[11px] font-bold uppercase leading-snug tracking-widest text-[#1a1a1a] opacity-80">
              {TEXTS.navigation.hintsCompact}
            </p>
          </div>
        )}
      </div>

      {/* Interactive Overlay */}
      {state.status === GameState.IN_MINIGAME && activeMiniGame && activeMiniGame.type === MiniGameType.REACT_OVERLAY && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-2 backdrop-blur-sm animate-in fade-in duration-300 sm:items-center sm:p-4">
          <OverlayCard
            title={activeMiniGame.name}
            description={activeMiniGame.description}
            onClose={closeOverlay}
          >
            <Suspense
              fallback={
                <p className="text-sm font-bold text-[#1a1a1a] opacity-60">{TEXTS.common.loading}</p>
              }
            >
              {activeMiniGame.Component && <activeMiniGame.Component />}
            </Suspense>
          </OverlayCard>
        </div>
      )}

      {/* Floating UI Hints (desktop / tablet) */}
      {state.status === GameState.EXPLORING && (
        <div className="fixed bottom-6 left-1/2 z-40 hidden w-auto max-w-lg -translate-x-1/2 border-2 border-[#1a1a1a] bg-[#fbfbf9]/80 px-4 py-2 opacity-60 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] backdrop-blur-sm transition-opacity hover:opacity-100 md:block">
          <p className="text-sm font-bold uppercase tracking-widest text-[#1a1a1a]">
            {TEXTS.navigation.hints}
          </p>
        </div>
      )}
    </div>
  );
}
