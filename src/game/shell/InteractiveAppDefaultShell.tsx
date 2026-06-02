import { ArrowLeft, BookOpen, Bug } from 'lucide-react';
import Game from './Game';
import { bridgeActions } from '@/game/bridge/store';
import { DEV_SWITCHER_OVERLAY_ID } from '@/game/overlays/overlayIds';
import { OverlayHost } from '@/game/overlays/OverlayHost';
import { SceneUiHost } from '@/game/sceneUi/SceneUiHost';
import { Button, Card, Panel } from '@/shared/ui';
import type { InteractiveAppShellState } from './useInteractiveAppShell';

interface InteractiveAppDefaultShellProps {
  shell: InteractiveAppShellState;
  onSwitchToStatic: () => void;
}

export function InteractiveAppDefaultShell({
  shell,
  onSwitchToStatic
}: InteractiveAppDefaultShellProps) {
  const {
    bridge,
    messages,
    contentRowRef,
    presentationMode,
    gameShellLayout,
    isGameInputBlocked,
    sceneHintText,
    shouldShowFooterHint,
    shouldShowSceneUiStatus,
    shouldReserveSceneHint,
    sceneHeaderChrome,
    enterScene,
    openOverlay,
    returnToOverworld,
    returnToScene
  } = shell;

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
              import.meta.env.DEV && (
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
              )
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
