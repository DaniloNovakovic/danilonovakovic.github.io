import { useCallback, useState } from 'react';
import { BookOpen, Backpack, Bug } from 'lucide-react';
import Game from './Game';
import { GameState } from '../runtime/gameState';
import {
  getMiniGameById,
  getAllMiniGames,
  getOverlayParentId,
  getReactOverlayMiniGameById
} from '../runtime/miniGameRegistry';
import { MiniGameType } from '../runtime/types';
import { TEXTS } from '../config/content';
import { isMiniGameId } from '../config/featureIds';
import { bridgeActions, useBridgeState } from '../shared/bridge/store';
import { OverlayCard } from './overlays/OverlayCard';
import {
  getPhaserScenePresentationMode,
  type PhaserScenePresentationMode
} from '../runtime/phaserScenePresentation';
import { Button, Card, Panel } from '../ui';
import { getInteractiveGameShellLayout } from './interactive/gameShellLayout';

interface InteractiveAppProps {
  onSwitchToStatic: () => void;
}

export default function InteractiveApp({ onSwitchToStatic }: InteractiveAppProps) {
  const bridge = useBridgeState();
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [devSwitcherOpen, setDevSwitcherOpen] = useState(false);

  const handleInteract = (area: string) => {
    if (!isMiniGameId(area)) return;
    bridgeActions.requestInteraction(area);
  };

  const closeOverlay = useCallback(() => {
    bridgeActions.closeActiveMode(getOverlayParentId);
  }, []);

  const jumpToDevTarget = (area: string | null) => {
    setDevSwitcherOpen(false);
    if (area === null) {
      bridgeActions.closeActiveMode();
      return;
    }
    if (!isMiniGameId(area)) return;
    bridgeActions.requestInteraction(area);
  };

  const activeMiniGame = bridge.activeMiniGameId ? getMiniGameById(bridge.activeMiniGameId) : undefined;
  const activeOverlayMiniGame = getReactOverlayMiniGameById(bridge.activeMiniGameId);
  const ActiveOverlayComponent = activeOverlayMiniGame?.component;
  const isGameInputBlocked = bridge.isPaused || bridge.loadingMiniGameId !== null;
  const activeMiniGameId = bridge.activeMiniGameId;
  const startSceneParam = new URLSearchParams(window.location.search).get('startScene');
  const initialStartSceneId = startSceneParam && isMiniGameId(startSceneParam) ? startSceneParam : null;
  const presentationMiniGameId =
    activeMiniGameId ?? initialStartSceneId;
  const presentationMode: PhaserScenePresentationMode =
    getPhaserScenePresentationMode(presentationMiniGameId);
  const gameShellLayout = getInteractiveGameShellLayout(presentationMode);

  return (
    <div className="relative flex min-h-[100dvh] min-h-dvh w-full flex-col overflow-x-hidden bg-[#f4f1ea]">
      {/* Mode switch link — unobtrusive, top-right */}
      <Button
        variant="floating"
        size="sm"
        onClick={onSwitchToStatic}
        className="fixed right-2 top-[max(0.5rem,env(safe-area-inset-top,0px))] z-40 sm:right-4 sm:top-4 sm:px-3 sm:py-1.5 sm:text-xs"
        aria-label="Switch to static portfolio"
      >
        <BookOpen className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        <span className="hidden sm:inline">Static mode</span>
        <span className="sm:hidden">Static</span>
      </Button>

      <div className="fixed left-2 top-[max(0.5rem,env(safe-area-inset-top,0px))] z-40 sm:left-4 sm:top-4">
        <div className="flex items-start gap-2">
          <Button
            variant="floating"
            size="sm"
            onClick={() => setInventoryOpen((v) => !v)}
            className="sm:px-3 sm:py-1.5 sm:text-xs"
            aria-label="Toggle inventory"
          >
            <Backpack className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            <span>Inventory</span>
          </Button>
          {import.meta.env.DEV && (
            <Button
              variant="floating"
              size="sm"
              onClick={() => setDevSwitcherOpen((v) => !v)}
              className="sm:px-3 sm:py-1.5 sm:text-xs"
              aria-label="Open dev scene switcher"
            >
              <Bug className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              <span>Dev</span>
            </Button>
          )}
        </div>
        {inventoryOpen && (
          <Panel className="mt-2 w-52 bg-[#fbfbf9]/95 p-2 backdrop-blur-sm">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]">
              Equipment
            </p>
            {bridge.inventory.ownedItemIds.includes('glasses') ? (
              <label className="flex cursor-pointer items-center justify-between gap-2 rounded border border-[#1a1a1a]/40 bg-white/50 px-2 py-1.5 text-xs font-bold uppercase tracking-wide text-[#1a1a1a]">
                <span>Glasses</span>
                <input
                  type="checkbox"
                  checked={bridge.equipment.equippedItemIds.includes('glasses')}
                  onChange={() => bridgeActions.toggleItemEquipped('glasses')}
                  className="h-3.5 w-3.5 accent-[#1a1a1a]"
                />
              </label>
            ) : bridge.inventory.ownedItemIds.length === 0 ? (
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#1a1a1a]/60">
                No items yet
              </p>
            ) : null}
            {bridge.inventory.ownedItemIds.includes('circuit') && (
              <div className="mt-1 rounded border border-[#1a1a1a]/40 bg-white/50 px-2 py-1.5 text-xs font-bold uppercase tracking-wide text-[#1a1a1a]">
                Circuit
              </div>
            )}
          </Panel>
        )}
        {import.meta.env.DEV && devSwitcherOpen && (
          <Panel className="mt-2 w-64 bg-[#fbfbf9]/95 p-2 backdrop-blur-sm">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]">
              Dev scene switcher
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => jumpToDevTarget(null)}
                className="rounded border border-[#1a1a1a]/40 bg-white/60 px-2 py-1.5 text-left text-[11px] font-bold uppercase tracking-wide text-[#1a1a1a] hover:bg-white"
              >
                City
              </button>
              {getAllMiniGames().map((miniGame) => (
                <button
                  key={miniGame.id}
                  type="button"
                  onClick={() => jumpToDevTarget(miniGame.id)}
                  className="rounded border border-[#1a1a1a]/40 bg-white/60 px-2 py-1.5 text-left text-[11px] font-bold uppercase tracking-wide text-[#1a1a1a] hover:bg-white"
                >
                  {miniGame.name}
                </button>
              ))}
            </div>
          </Panel>
        )}
      </div>

      {/* Game area: scales down on narrow viewports; leaves room for hints + safe areas */}
      <div className="flex min-h-0 flex-1 w-full flex-col items-center justify-center px-1 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-[max(1rem,env(safe-area-inset-top,0px))] sm:px-3 md:px-4 md:pb-24 md:pt-2">
        <div
          className={`relative max-w-[1000px] shrink-0 shadow-[12px_12px_0px_0px_rgba(26,26,26,1)] ${gameShellLayout.shellClassName}`}
          style={gameShellLayout.shellStyle}
        >
          <div
            className={`relative w-full overflow-hidden rounded-lg border-4 border-[#1a1a1a] bg-[#fbfbf9] ${gameShellLayout.frameClassName}`}
            style={gameShellLayout.frameStyle}
          >
            <div className="absolute inset-0">
              {/* Paper Texture Overlay */}
              <div className="pointer-events-none absolute inset-0 z-[5] bg-[url('https://www.transparenttextures.com/patterns/felt.png')] opacity-[0.03]" />
              <Game
                onInteract={handleInteract}
                isPaused={isGameInputBlocked}
                activeMiniGameId={bridge.activeMiniGameId}
                presentationMode={presentationMode}
                onClose={closeOverlay}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Overlay */}
      {bridge.status === GameState.IN_MINIGAME &&
        activeMiniGame &&
        activeMiniGame.type === MiniGameType.REACT_OVERLAY &&
        ActiveOverlayComponent && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-2 backdrop-blur-sm animate-in fade-in duration-300 sm:items-center sm:p-4">
          <OverlayCard
            title={activeMiniGame.name}
            description={activeMiniGame.description}
            onClose={closeOverlay}
          >
            <ActiveOverlayComponent />
          </OverlayCard>
        </div>
      )}

      {bridge.loadingMiniGameId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <Card tone="paper" className="px-5 py-4 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#1a1a1a]">
              Loading scene
            </p>
          </Card>
        </div>
      )}

      {/* Floating UI Hints (desktop / tablet) */}
      {bridge.status === GameState.EXPLORING && !presentationMiniGameId && (
        <Panel className="fixed bottom-[max(1rem,env(safe-area-inset-bottom,0px))] left-1/2 z-40 w-[min(calc(100%_-_1.5rem),26rem)] -translate-x-1/2 bg-[#fbfbf9]/85 px-3 py-2 text-center opacity-80 backdrop-blur-sm transition-opacity hover:opacity-100 md:bottom-6 md:w-auto md:max-w-lg md:px-4">
          <p className="text-[10px] font-bold uppercase leading-snug tracking-widest text-[#1a1a1a] md:hidden">
            {TEXTS.navigation.hintsCompact}
          </p>
          <p className="hidden text-sm font-bold uppercase tracking-widest text-[#1a1a1a] md:block">
            {TEXTS.navigation.hints}
          </p>
        </Panel>
      )}
    </div>
  );
}
