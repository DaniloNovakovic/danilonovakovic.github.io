import { useState } from 'react';
import { sceneUiSurfaceCapturesPointer } from '@/game/sceneUi/registry';
import { ArrowLeft, BookOpen, Bug } from 'lucide-react';
import Game from './Game';
import { BackpackButton } from './BackpackButton';
import { useBackpackHotkey } from './useBackpack';
import { bridgeActions, type ScreenCrack } from '@/game/bridge/store';
import { DEV_SWITCHER_OVERLAY_ID } from '@/game/overlays/overlayIds';
import { OverlayHost } from '@/game/overlays/OverlayHost';
import { SceneUiHost } from '@/game/sceneUi/SceneUiHost';
import { Button, Card, Panel } from '@/shared/ui';
import type { InteractiveAppShellState } from './useInteractiveAppShell';
import { shellDamage } from './screenDestroyerShell';
import { ScreenDestroyerCard } from './ScreenDestroyerCard';
import { TapeStrip, UnpluggedHandOff } from './UnpluggedHandOff';
import { RealWorldTakeover } from './RealWorldTakeover';
import { requestFullscreenQuietly } from './realWorldBrowser';

interface InteractiveAppDefaultShellProps {
  shell: InteractiveAppShellState;
  onSwitchToStatic: () => void;
}

export function InteractiveAppDefaultShell({ shell, onSwitchToStatic }: InteractiveAppDefaultShellProps) {
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
    sceneHeaderChrome,
    enterScene,
    openOverlay,
    returnToOverworld,
    returnToScene
  } = shell;
  useBackpackHotkey(bridge);
  // Out of Bounds screen destroyer (#164): the card cracks and falls away (the header buttons with it),
  // then the screen shatters into black.
  const peel = shellDamage(bridge.screenDamage);
  // Woken into the real world (ADR-0007): shell-local, so a reload is the only reset.
  const [awake, setAwake] = useState(false);
  // The footer hint is card chrome too: it goes with the card.
  const showFooter = shouldShowFooterHint && !peel.cardGone;
  const wakeUp = () => {
    requestFullscreenQuietly();
    setAwake(true);
  };

  return (
    <div
      className="relative grid h-[100dvh] h-dvh w-full overflow-x-hidden bg-[#f4f1ea]"
      style={{
        gridTemplateRows: showFooter ? 'auto minmax(0, 1fr) auto' : 'auto minmax(0, 1fr)',
        gridTemplateColumns: `minmax(20px, 1fr) minmax(0, ${gameShellLayout.maxContentWidth}) minmax(20px, 1fr)`,
        rowGap: '0.75rem',
        columnGap: '0.75rem',
        paddingBlockStart: 'max(0.5rem, env(safe-area-inset-top, 0px))',
        paddingBlockEnd: 'max(0.75rem, env(safe-area-inset-bottom, 0px))'
      }}
    >
      <header className="col-start-2 row-start-1 min-w-0">
        <nav className="flex min-w-0 items-center justify-between gap-2" aria-label={messages.gameShell.controlsLabel}>
          <div
            className={`flex min-w-0 items-center gap-2 ${peel.leftClassName}`}
            style={peel.leftStyle}
            aria-hidden={peel.cardGone || undefined}
            inert={peel.cardGone || undefined}
          >
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
            <BackpackButton bridge={bridge} />
          </div>
          {/* The way out: taped on while the card breaks, until the page falls into black. */}
          {!peel.blackout && (
            <StaticModeButton taped={peel.torn} onClick={onSwitchToStatic} labels={messages.gameShell} />
          )}
        </nav>
      </header>

      <main ref={contentRowRef} className="col-start-2 row-start-2 flex min-h-0 min-w-0 items-center justify-center">
        <div
          data-testid="interactive-game-shell"
          className={`relative shrink-0 ${peel.shellClassName} ${gameShellLayout.shellClassName}`}
          style={gameShellLayout.shellStyle}
        >
          {/* With the card gone the frame keeps its size (no resampled canvas), just not its ink. */}
          <div
            className={`relative w-full overflow-hidden rounded-lg border-4 ${peel.frameClassName} ${gameShellLayout.frameClassName}`}
            style={gameShellLayout.frameStyle}
          >
            <div className="absolute inset-0">
              <div className="pointer-events-none absolute inset-0 z-[5] bg-[url('https://www.transparenttextures.com/patterns/felt.png')] opacity-[0.03]" />
              <Game
                onEnterScene={enterScene}
                onOpenOverlay={openOverlay}
                isPaused={isGameInputBlocked || awake}
                activeSceneId={bridge.activeSceneId}
                presentationMode={presentationMode}
                onReturnToOverworld={returnToOverworld}
                isScenePointerCaptured={sceneUiSurfaceCapturesPointer(bridge.sceneUi.panel?.id)}
                chrome={peel.gameChrome}
              />
            </div>
          </div>
          {peel.torn && <ScreenDestroyerCard cracks={bridge.screenDamage.cardCracks} gone={peel.cardGone} />}
          <SceneUiHost placement="panel" />
        </div>
      </main>

      {showFooter && <ShellFooter showSceneUiStatus={shouldShowSceneUiStatus} hint={sceneHintText} />}

      <OverlayHost />

      <PastThePage
        blackout={peel.blackout}
        awake={awake}
        onWakeUp={wakeUp}
        onGiveUp={onSwitchToStatic}
        lastSmash={bridge.screenDamage.cracks.at(-1) ?? null}
      />

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

/** The way out, taped onto the page (and lifted over the cracks) once the card starts to break. */
function StaticModeButton({
  taped,
  onClick,
  labels
}: {
  taped: boolean;
  onClick: () => void;
  labels: { switchToStatic: string; staticMode: string; static: string };
}) {
  return (
    <span className={taped ? 'relative z-[80]' : 'contents'}>
      <Button
        variant="floating"
        size="sm"
        onClick={onClick}
        className="sm:px-3 sm:py-1.5 sm:text-xs"
        aria-label={labels.switchToStatic}
      >
        <BookOpen className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        <span className="hidden sm:inline">{labels.staticMode}</span>
        <span className="sm:hidden">{labels.static}</span>
      </Button>
      {taped && <TapeStrip />}
    </span>
  );
}

function ShellFooter({ showSceneUiStatus, hint }: { showSceneUiStatus: boolean; hint: string | null }) {
  return (
    <footer className="col-start-2 row-start-3 min-w-0">
      <Panel className="mx-auto w-full max-w-lg bg-[#fbfbf9]/85 px-3 py-2 text-center opacity-80 backdrop-blur-sm transition-opacity hover:opacity-100 md:px-4">
        {showSceneUiStatus ? (
          <SceneUiHost placement="status" />
        ) : (
          <p className="text-[10px] font-bold uppercase leading-snug tracking-widest text-[#1a1a1a] md:text-xs">
            {hint}
          </p>
        )}
      </Panel>
    </footer>
  );
}

/** Out of Bounds (#164): the screen shattered into black, then (on Wake up) the real world. */
function PastThePage({
  blackout,
  awake,
  onWakeUp,
  onGiveUp,
  lastSmash
}: {
  blackout: boolean;
  awake: boolean;
  onWakeUp: () => void;
  onGiveUp: () => void;
  lastSmash: ScreenCrack | null;
}) {
  if (awake) return <RealWorldTakeover onGiveUp={onGiveUp} />;
  return blackout ? <UnpluggedHandOff onWakeUp={onWakeUp} lastSmash={lastSmash} /> : null;
}
