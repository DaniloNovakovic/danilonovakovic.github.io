import { useCallback } from 'react';
import { BookOpen, Backpack, Bug } from 'lucide-react';
import Game from './Game';
import { GameState } from '@game/runtime/gameState';
import {
  getMiniGameById,
  getAllMiniGames,
  getOverlayParentId,
  getReactOverlayMiniGameById
} from '@game/runtime/miniGameRegistry';
import { MiniGameType } from '@game/runtime/types';
import { TEXTS } from '@game/registry/content';
import { isMiniGameId } from '@game/registry/featureIds';
import { bridgeActions, useBridgeState } from '@game/bridge/store';
import {
  getPhaserScenePresentationMode,
  type PhaserScenePresentationMode
} from '@game/runtime/phaserScenePresentation';
import { Button, Card, DialogCard, ModalShell, Panel } from '@shared/ui';
import { getInteractiveGameShellLayout } from './gameShellLayout';
import { useResizeObserver } from '@shared/hooks/useResizeObserver';

interface InteractiveAppProps {
  onSwitchToStatic: () => void;
}

export default function InteractiveApp({ onSwitchToStatic }: InteractiveAppProps) {
  const bridge = useBridgeState();
  const { ref: contentRowRef, height: contentRowHeight } = useResizeObserver<HTMLElement>();

  const handleInteract = (area: string) => {
    if (!isMiniGameId(area)) return;
    bridgeActions.requestInteraction(area);
  };

  const closeOverlay = useCallback(() => {
    bridgeActions.closeActiveMode(getOverlayParentId);
  }, []);

  const jumpToDevTarget = (area: string | null) => {
    bridgeActions.closeUiDialog();
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
  const gameShellLayout = getInteractiveGameShellLayout(presentationMode, contentRowHeight);
  const shouldReserveSceneHint = presentationMiniGameId === 'potassium';
  const sceneHintText = bridge.sceneHintText ?? 'Drag toward a target • Hold to recall';
  const shouldShowNavigationHint = bridge.status === GameState.EXPLORING && !presentationMiniGameId;
  const shouldShowFooterHint = shouldReserveSceneHint || shouldShowNavigationHint;

  return (
    <div
      className="relative grid min-h-[100dvh] min-h-dvh w-full overflow-x-hidden bg-[#f4f1ea]"
      style={{
        gridTemplateRows: shouldShowFooterHint ? 'auto minmax(0, 1fr) auto' : 'auto minmax(0, 1fr)',
        gridTemplateColumns: 'minmax(20px, 1fr) minmax(0, 1000px) minmax(20px, 1fr)',
        rowGap: '0.75rem',
        columnGap: '0.75rem',
        paddingBlockStart: 'max(0.5rem, env(safe-area-inset-top, 0px))',
        paddingBlockEnd: 'max(0.75rem, env(safe-area-inset-bottom, 0px))'
      }}
    >
      <header className="col-start-2 row-start-1 min-w-0">
        <nav
          className="flex min-w-0 items-center justify-between gap-2"
          aria-label="Interactive controls"
        >
          <div className="flex min-w-0 items-center gap-2">
            <Button
              variant="floating"
              size="sm"
              onClick={() => bridgeActions.openUiDialog('inventory')}
              className="sm:px-3 sm:py-1.5 sm:text-xs"
              aria-haspopup="dialog"
              aria-expanded={bridge.activeUiDialogId === 'inventory'}
              aria-label="Open inventory"
            >
              <Backpack className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              <span>Inventory</span>
            </Button>
            {import.meta.env.DEV && (
              <Button
                variant="floating"
                size="sm"
                onClick={() => bridgeActions.openUiDialog('devSwitcher')}
                className="sm:px-3 sm:py-1.5 sm:text-xs"
                aria-haspopup="dialog"
                aria-expanded={bridge.activeUiDialogId === 'devSwitcher'}
                aria-label="Open dev scene switcher"
              >
                <Bug className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                <span>Dev</span>
              </Button>
            )}
          </div>
          <Button
            variant="floating"
            size="sm"
            onClick={onSwitchToStatic}
            className="sm:px-3 sm:py-1.5 sm:text-xs"
            aria-label="Switch to static portfolio"
          >
            <BookOpen className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            <span className="hidden sm:inline">Static mode</span>
            <span className="sm:hidden">Static</span>
          </Button>
        </nav>
      </header>

      <main ref={contentRowRef} className="col-start-2 row-start-2 flex min-h-0 min-w-0 items-center justify-center">
        <div
          data-testid="interactive-game-shell"
          className={`relative shrink-0 shadow-[12px_12px_0px_0px_rgba(26,26,26,1)] ${gameShellLayout.shellClassName}`}
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
      </main>

      {shouldShowFooterHint && (
        <footer className="col-start-2 row-start-3 min-w-0">
          <Panel className="mx-auto w-full max-w-lg bg-[#fbfbf9]/85 px-3 py-2 text-center opacity-80 backdrop-blur-sm transition-opacity hover:opacity-100 md:px-4">
            {shouldReserveSceneHint ? (
              <p className="text-[10px] font-bold uppercase leading-snug tracking-widest text-[#1a1a1a] md:text-xs">
                {sceneHintText}
              </p>
            ) : (
              <>
                <p className="text-[10px] font-bold uppercase leading-snug tracking-widest text-[#1a1a1a] md:hidden">
                  {TEXTS.navigation.hintsCompact}
                </p>
                <p className="hidden text-sm font-bold uppercase tracking-widest text-[#1a1a1a] md:block">
                  {TEXTS.navigation.hints}
                </p>
              </>
            )}
          </Panel>
        </footer>
      )}

      {/* Interactive Overlay */}
      {bridge.status === GameState.IN_MINIGAME &&
        activeMiniGame &&
        activeMiniGame.type === MiniGameType.REACT_OVERLAY &&
        ActiveOverlayComponent && (
        <ModalShell
          title={activeMiniGame.name}
          hasDescription={Boolean(activeMiniGame.description)}
          onClose={closeOverlay}
        >
          {({ titleId, descriptionId }) => (
            <DialogCard
              title={activeMiniGame.name}
              description={activeMiniGame.description}
              onClose={closeOverlay}
              titleId={titleId}
              descriptionId={descriptionId}
            >
              <ActiveOverlayComponent />
            </DialogCard>
          )}
        </ModalShell>
      )}

      {bridge.activeUiDialogId === 'inventory' && (
        <ModalShell title="Inventory" onClose={() => bridgeActions.closeUiDialog()}>
          {({ titleId }) => (
            <DialogCard title="Inventory" onClose={() => bridgeActions.closeUiDialog()} titleId={titleId}>
              <div className="grid gap-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]">
                  Equipment
                </p>
                {bridge.inventory.ownedItemIds.includes('glasses') ? (
                  <label className="flex cursor-pointer items-center justify-between gap-2 rounded border border-[#1a1a1a]/40 bg-white/50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#1a1a1a]">
                    <span>Glasses</span>
                    <input
                      type="checkbox"
                      checked={bridge.equipment.equippedItemIds.includes('glasses')}
                      onChange={() => bridgeActions.toggleItemEquipped('glasses')}
                      className="h-4 w-4 accent-[#1a1a1a]"
                    />
                  </label>
                ) : bridge.inventory.ownedItemIds.length === 0 ? (
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#1a1a1a]/60">
                    No items yet
                  </p>
                ) : null}
                {bridge.inventory.ownedItemIds.includes('circuit') && (
                  <div className="rounded border border-[#1a1a1a]/40 bg-white/50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#1a1a1a]">
                    Circuit
                  </div>
                )}
              </div>
            </DialogCard>
          )}
        </ModalShell>
      )}

      {import.meta.env.DEV && bridge.activeUiDialogId === 'devSwitcher' && (
        <ModalShell title="Dev scene switcher" onClose={() => bridgeActions.closeUiDialog()}>
          {({ titleId }) => (
            <DialogCard title="Dev scene switcher" onClose={() => bridgeActions.closeUiDialog()} titleId={titleId}>
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
            </DialogCard>
          )}
        </ModalShell>
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

    </div>
  );
}
