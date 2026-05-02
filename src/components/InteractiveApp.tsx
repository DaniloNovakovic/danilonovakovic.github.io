import { useCallback, useState } from 'react';
import { BookOpen, Backpack } from 'lucide-react';
import Game from './Game';
import { GameState } from '../runtime/gameState';
import {
  getMiniGameById,
  getOverlayParentId,
  getReactOverlayMiniGameById
} from '../runtime/miniGameRegistry';
import { MiniGameType } from '../runtime/types';
import { TEXTS } from '../config/content';
import { isMiniGameId } from '../config/featureIds';
import { bridgeActions, useBridgeState } from '../shared/bridge/store';
import { OverlayCard } from './overlays/OverlayCard';
import { Button, Card, Panel } from '../ui';

interface InteractiveAppProps {
  onSwitchToStatic: () => void;
}

export default function InteractiveApp({ onSwitchToStatic }: InteractiveAppProps) {
  const bridge = useBridgeState();
  const [inventoryOpen, setInventoryOpen] = useState(false);

  const handleInteract = (area: string) => {
    if (!isMiniGameId(area)) return;
    bridgeActions.requestInteraction(area);
  };

  const closeOverlay = useCallback(() => {
    bridgeActions.closeActiveMode(getOverlayParentId);
  }, []);

  const activeMiniGame = bridge.activeMiniGameId ? getMiniGameById(bridge.activeMiniGameId) : undefined;
  const activeOverlayMiniGame = getReactOverlayMiniGameById(bridge.activeMiniGameId);
  const ActiveOverlayComponent = activeOverlayMiniGame?.component;
  const isGameInputBlocked = bridge.isPaused || bridge.loadingMiniGameId !== null;

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
            ) : (
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#1a1a1a]/60">
                No items yet
              </p>
            )}
          </Panel>
        )}
      </div>

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
                isPaused={isGameInputBlocked}
                activeMiniGameId={bridge.activeMiniGameId}
                onClose={closeOverlay}
              />
            </div>
          </div>
        </div>

        {/* Mobile hints (gesture-based) */}
        {bridge.status === GameState.EXPLORING && (
          <div className="mt-8 flex w-full flex-col items-center gap-2 md:hidden">
            <div className="mt-2 w-full max-w-lg shrink-0 px-1 text-center">
              <p className="text-[11px] font-bold uppercase leading-snug tracking-widest text-[#1a1a1a] opacity-80">
                {TEXTS.navigation.hintsCompact}
              </p>
            </div>
          </div>
        )}
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
      {bridge.status === GameState.EXPLORING && (
        <Panel className="fixed bottom-6 left-1/2 z-40 hidden w-auto max-w-lg -translate-x-1/2 bg-[#fbfbf9]/80 px-4 py-2 opacity-60 backdrop-blur-sm transition-opacity hover:opacity-100 md:block">
          <p className="text-sm font-bold uppercase tracking-widest text-[#1a1a1a]">
            {TEXTS.navigation.hints}
          </p>
        </Panel>
      )}
    </div>
  );
}
