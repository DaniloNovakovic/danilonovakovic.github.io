import { useEffect, useRef, useCallback, Suspense } from 'react';
import Game from './components/Game';
import { X } from 'lucide-react';
import { GameState } from './game/gameState';
import { getMiniGameById } from './game/miniGameRegistry';
import { MiniGameType } from './game/types';
import { TEXTS } from './config/content';
import { isMiniGameId } from './config/featureIds';
import { bridgeActions, useBridgeSelector } from './shared/bridge/store';

function App() {
  const appState = useBridgeSelector((current) => ({
    status: current.status,
    activeMiniGameId: current.activeMiniGameId
  }));
  const modalRef = useRef<HTMLDivElement>(null);

  const handleInteract = (area: string) => {
    if (!isMiniGameId(area)) return;
    bridgeActions.requestInteraction(area);
  };

  const closeOverlay = useCallback(() => {
    bridgeActions.closeActiveOverlay();
  }, []);

  // Global Escape handler for React Overlays
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && appState.status === GameState.IN_MINIGAME) {
        const activeGame = getMiniGameById(appState.activeMiniGameId!);
        if (activeGame?.type === MiniGameType.REACT_OVERLAY) {
          closeOverlay();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [appState.status, appState.activeMiniGameId, closeOverlay]);

  // Phase 5: Auto-focus modal for keyboard scrollability
  useEffect(() => {
    if (appState.status === GameState.IN_MINIGAME && modalRef.current) {
      modalRef.current.focus();
    }
  }, [appState.status, appState.activeMiniGameId]);

  const activeMiniGame = appState.activeMiniGameId ? getMiniGameById(appState.activeMiniGameId) : undefined;

  return (
    <div
      className="relative flex min-h-[100dvh] min-h-dvh w-full flex-col overflow-x-hidden bg-[#f4f1ea]"
      style={{ fontFamily: '"Comic Sans MS", cursive, sans-serif' }}
    >
      {/* Game area: scales down on narrow viewports; leaves room for hints + safe areas */}
      <div className="flex min-h-0 flex-1 w-full flex-col items-center justify-center px-2 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-[max(0.5rem,env(safe-area-inset-top,0px))] sm:px-4 sm:pb-24 sm:pt-2">
        <div className="relative w-full max-w-[1000px] shrink-0 shadow-[12px_12px_0px_0px_rgba(26,26,26,1)]">
          <div
            className="relative w-full overflow-hidden rounded-lg border-4 border-[#1a1a1a] bg-[#fbfbf9] aspect-[1000/600] max-h-[min(82dvh,calc(100dvh-8.5rem))] sm:max-h-[min(88dvh,600px)]"
          >
            <div className="absolute inset-0">
              {/* Paper Texture Overlay */}
              <div className="pointer-events-none absolute inset-0 z-[5] bg-[url('https://www.transparenttextures.com/patterns/felt.png')] opacity-[0.03]" />
              <Game onInteract={handleInteract} onClose={closeOverlay} />
            </div>
          </div>
        </div>

        {/* Hints below game on small screens (avoids covering touch controls) */}
        {appState.status === GameState.EXPLORING && (
          <div className="mt-2 w-full max-w-lg shrink-0 px-1 text-center md:hidden">
            <p className="text-[11px] font-bold uppercase leading-snug tracking-widest text-[#1a1a1a] opacity-80">
              {TEXTS.navigation.hintsCompact}
            </p>
          </div>
        )}
      </div>

      {/* Interactive Overlay */}
      {appState.status === GameState.IN_MINIGAME && activeMiniGame && activeMiniGame.type === MiniGameType.REACT_OVERLAY && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-2 backdrop-blur-sm animate-in fade-in duration-300 sm:items-center sm:p-4">
          <div
            ref={modalRef}
            tabIndex={0}
            className="relative max-h-[92dvh] w-full max-w-[600px] overflow-y-auto rounded-t-2xl border-4 border-[#1a1a1a] bg-[#fbfbf9] p-4 text-[#1a1a1a] shadow-[12px_12px_0px_0px_rgba(26,26,26,1)] outline-none animate-in zoom-in-95 fade-in focus:ring-0 sm:rounded-2xl sm:p-8"
          >
            <button
              type="button"
              onClick={closeOverlay}
              className="absolute right-2 top-2 z-10 rounded-full border-2 border-[#1a1a1a] bg-[#f4f1ea] p-2 transition-colors hover:bg-[#e8e5df] sm:right-4 sm:top-4"
              aria-label="Close"
            >
              <X size={20} color="#1a1a1a" />
            </button>

            <h2 className="mb-3 mt-1 border-b-4 border-[#1a1a1a] pb-2 pr-12 text-2xl font-bold uppercase tracking-wider sm:mb-4 sm:mt-0 sm:pr-0 sm:text-4xl">
              {activeMiniGame.name}
            </h2>

            <div className="mt-4 text-base leading-relaxed sm:mt-6 sm:text-xl">
              <p className="mb-6 font-medium italic opacity-80 sm:mb-8">{activeMiniGame.description}</p>

              <div className="mt-4">
                <Suspense
                  fallback={
                    <p className="text-sm font-bold text-[#1a1a1a] opacity-60">{TEXTS.common.loading}</p>
                  }
                >
                  {activeMiniGame.Component && <activeMiniGame.Component />}
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating UI Hints (desktop / tablet) */}
      {appState.status === GameState.EXPLORING && (
        <div className="fixed bottom-6 left-1/2 z-40 hidden w-auto max-w-lg -translate-x-1/2 border-2 border-[#1a1a1a] bg-[#fbfbf9]/80 px-4 py-2 opacity-60 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] backdrop-blur-sm transition-opacity hover:opacity-100 md:block">
          <p className="text-sm font-bold uppercase tracking-widest text-[#1a1a1a]">
            {TEXTS.navigation.hints}
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
