import { ArrowLeft, BookOpen, Backpack, Bug } from 'lucide-react';
import Game from './Game';
import { bridgeActions, useBridgeState, type OpenOverlayOptions } from '@/game/bridge/store';
import {
  getPhaserScenePresentationMode,
  type PhaserScenePresentationMode
} from '@/game/sharedSceneRuntime/phaserScenePresentation';
import { DEV_SWITCHER_OVERLAY_ID, INVENTORY_OVERLAY_ID, type OverlayId } from '@/game/overlays/overlayIds';
import { OverlayHost } from '@/game/overlays/OverlayHost';
import { SceneUiHost } from '@/game/sceneUi/SceneUiHost';
import {
  isSceneId,
  OVERWORLD_SCENE_ID,
  POTASSIUM_SCENE_ID,
  STAMPEDE_SKETCH_SCENE_ID,
  type SceneId
} from '@/game/scenes/sceneIds';
import { Button, Card, Panel } from '@/shared/ui';
import { getInteractiveGameShellLayout } from './gameShellLayout';
import { getSceneHeaderChrome } from './sceneHeaderChrome';
import { getNotebookRuntimeShellProfile } from './notebookShellProfile';
import { PotassiumNotebookShell } from './PotassiumNotebookShell';
import { StampedeNotebookShell } from './StampedeNotebookShell';
import { useResizeObserver } from '@/shared/hooks/useResizeObserver';
import { useMessages } from '@/shared/i18n';

interface InteractiveAppProps {
  onSwitchToStatic: () => void;
}

export default function InteractiveApp({ onSwitchToStatic }: InteractiveAppProps) {
  const bridge = useBridgeState();
  const messages = useMessages();
  const { ref: contentRowRef, height: contentRowHeight } = useResizeObserver<HTMLElement>();

  const startSceneParam = new URLSearchParams(window.location.search).get('startScene');
  const initialStartSceneId = startSceneParam && isSceneId(startSceneParam) ? startSceneParam : null;
  const presentationSceneId =
    bridge.activeSceneId === OVERWORLD_SCENE_ID && initialStartSceneId
      ? initialStartSceneId
      : bridge.activeSceneId;
  const presentationMode: PhaserScenePresentationMode =
    getPhaserScenePresentationMode(presentationSceneId);
  const gameShellLayout = getInteractiveGameShellLayout(presentationMode, contentRowHeight);
  const isGameInputBlocked = bridge.isPaused || bridge.loadingSceneId !== null;
  const shouldReserveSceneHint = presentationSceneId === POTASSIUM_SCENE_ID;
  const sceneHintText = bridge.sceneHintText ?? messages.potassiumSlip.hints.start;
  const shouldShowNavigationHint =
    bridge.activeSceneId === OVERWORLD_SCENE_ID && bridge.activeOverlayId === null;
  const shouldShowSceneUiStatus = bridge.sceneUi.status !== null;
  const shouldShowFooterHint = shouldShowSceneUiStatus || shouldReserveSceneHint || shouldShowNavigationHint;
  const sceneHeaderChrome = getSceneHeaderChrome(presentationSceneId);
  const notebookShellProfile = getNotebookRuntimeShellProfile(presentationSceneId);

  const enterScene = (sceneId: SceneId) => bridgeActions.enterScene(sceneId);
  const openOverlay = (overlayId: OverlayId, options?: OpenOverlayOptions) => bridgeActions.openOverlay(overlayId, options);
  const returnToOverworld = () => bridgeActions.returnToOverworld();
  const returnToScene = (sceneId: SceneId) => {
    if (sceneId === OVERWORLD_SCENE_ID) {
      bridgeActions.returnToOverworld();
      return;
    }

    bridgeActions.enterScene(sceneId);
  };

  if (notebookShellProfile?.ownerSceneId === POTASSIUM_SCENE_ID) {
    return (
      <PotassiumNotebookShell
        activeSceneId={bridge.activeSceneId}
        isGameInputBlocked={isGameInputBlocked}
        isScenePanelOpen={bridge.sceneUi.panel !== null}
        loadingSceneId={bridge.loadingSceneId}
        onEnterScene={enterScene}
        onOpenOverlay={openOverlay}
        onReturnToOverworld={returnToOverworld}
        onSwitchToStatic={onSwitchToStatic}
        presentationMode={presentationMode}
        profile={notebookShellProfile}
        sceneHintText={sceneHintText}
      />
    );
  }

  if (notebookShellProfile?.ownerSceneId === STAMPEDE_SKETCH_SCENE_ID) {
    return (
      <StampedeNotebookShell
        activeSceneId={bridge.activeSceneId}
        isGameInputBlocked={isGameInputBlocked}
        isScenePanelOpen={bridge.sceneUi.panel !== null}
        loadingSceneId={bridge.loadingSceneId}
        onEnterScene={enterScene}
        onOpenOverlay={openOverlay}
        onReturnToOverworld={returnToOverworld}
        onSwitchToStatic={onSwitchToStatic}
        presentationMode={presentationMode}
        profile={notebookShellProfile}
      />
    );
  }

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
          aria-label={messages.gameShell.controlsLabel}
        >
          <div className="flex min-w-0 items-center gap-2">
            {sceneHeaderChrome.left === 'back' ? (
              <Button
                variant="floating"
                size="sm"
                onClick={() => returnToScene(sceneHeaderChrome.targetSceneId)}
                className="sm:px-3 sm:py-1.5 sm:text-xs"
                aria-label={messages.gameShell[sceneHeaderChrome.ariaLabelKey]}
              >
                <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                <span>{messages.gameShell.back}</span>
              </Button>
            ) : (
              <>
                <Button
                  variant="floating"
                  size="sm"
                  onClick={() => bridgeActions.openOverlay(INVENTORY_OVERLAY_ID)}
                  className="sm:px-3 sm:py-1.5 sm:text-xs"
                  aria-haspopup="dialog"
                  aria-expanded={bridge.activeOverlayId === INVENTORY_OVERLAY_ID}
                  aria-label={messages.gameShell.openInventory}
                >
                  <Backpack className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                  <span>{messages.gameShell.inventory}</span>
                </Button>
                {import.meta.env.DEV && (
                  <Button
                    variant="floating"
                    size="sm"
                    onClick={() => bridgeActions.openOverlay(DEV_SWITCHER_OVERLAY_ID)}
                    className="sm:px-3 sm:py-1.5 sm:text-xs"
                    aria-haspopup="dialog"
                    aria-expanded={bridge.activeOverlayId === DEV_SWITCHER_OVERLAY_ID}
                    aria-label={messages.gameShell.openDevSwitcher}
                  >
                    <Bug className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                    <span>{messages.gameShell.dev}</span>
                  </Button>
                )}
              </>
            )}
          </div>
          <Button
            variant="floating"
            size="sm"
            onClick={onSwitchToStatic}
            className="sm:px-3 sm:py-1.5 sm:text-xs"
            aria-label={messages.gameShell.switchToStatic}
          >
            <BookOpen className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            <span className="hidden sm:inline">{messages.gameShell.staticMode}</span>
            <span className="sm:hidden">{messages.gameShell.static}</span>
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
              <div className="pointer-events-none absolute inset-0 z-[5] bg-[url('https://www.transparenttextures.com/patterns/felt.png')] opacity-[0.03]" />
              <Game
                onEnterScene={enterScene}
                onOpenOverlay={openOverlay}
                isPaused={isGameInputBlocked}
                activeSceneId={bridge.activeSceneId}
                presentationMode={presentationMode}
                onReturnToOverworld={returnToOverworld}
              />
            </div>
          </div>
          <SceneUiHost placement="panel" />
        </div>
      </main>

      {shouldShowFooterHint && (
        <footer className="col-start-2 row-start-3 min-w-0">
          <Panel className="mx-auto w-full max-w-lg bg-[#fbfbf9]/85 px-3 py-2 text-center opacity-80 backdrop-blur-sm transition-opacity hover:opacity-100 md:px-4">
            {shouldShowSceneUiStatus ? (
              <SceneUiHost placement="status" />
            ) : shouldReserveSceneHint ? (
              <p className="text-[10px] font-bold uppercase leading-snug tracking-widest text-[#1a1a1a] md:text-xs">
                {sceneHintText}
              </p>
            ) : (
              <>
                <p className="text-[10px] font-bold uppercase leading-snug tracking-widest text-[#1a1a1a] md:hidden">
                  {messages.navigation.hintsCompact}
                </p>
                <p className="hidden text-sm font-bold uppercase tracking-widest text-[#1a1a1a] md:block">
                  {messages.navigation.hints}
                </p>
              </>
            )}
          </Panel>
        </footer>
      )}

      <OverlayHost />

      {bridge.loadingSceneId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <Card tone="paper" className="px-5 py-4 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#1a1a1a]">
              {messages.gameShell.loadingScene}
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
