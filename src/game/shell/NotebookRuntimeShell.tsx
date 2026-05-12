import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ArrowLeft, BookOpen } from 'lucide-react';
import Game from './Game';
import { SceneUiHost } from '@/game/sceneUi/SceneUiHost';
import type { OpenOverlayOptions } from '@/game/bridge/store';
import type { OverlayId } from '@/game/overlays/overlayIds';
import { OverlayHost } from '@/game/overlays/OverlayHost';
import type { PhaserScenePresentationMode } from '@/game/sharedSceneRuntime/phaserScenePresentation';
import type { SceneId } from '@/game/scenes/sceneIds';
import {
  Button,
  Card,
  ControlMat,
  ControlMatDragIndicator,
  NotebookPageFrame,
  NotebookShellStage
} from '@/shared/ui';
import { useMessages } from '@/shared/i18n';
import type { NotebookRuntimeShellProfile } from './notebookShellProfile';
import { useSceneControlMatPointerBridge } from './useSceneControlMatPointerBridge';

interface NotebookRuntimePageFrameConfig {
  attributes?: Record<string, number | string>;
  className?: string;
  gameFrameTestId: string;
  style: CSSProperties;
  testId: string;
}

interface NotebookRuntimeControlMatConfig {
  ariaLabel: string;
  className?: string;
  showDragIndicator?: boolean;
  style?: CSSProperties;
  testId: string;
}

interface NotebookRuntimeShellProps {
  activeSceneId: SceneId;
  backAriaLabel: string;
  controlMat: NotebookRuntimeControlMatConfig;
  footer?: ReactNode;
  isGameInputBlocked: boolean;
  isScenePanelOpen: boolean;
  loadingSceneId: SceneId | null;
  onBack: () => void;
  onEnterScene: (sceneId: SceneId) => void;
  onOpenOverlay: (overlayId: OverlayId, options?: OpenOverlayOptions) => void;
  onReturnToOverworld: () => void;
  onSwitchToStatic: () => void;
  pageFrame: NotebookRuntimePageFrameConfig;
  presentationMode: PhaserScenePresentationMode;
  profile: NotebookRuntimeShellProfile;
  shortHeaderCenter?: ReactNode;
}

export function NotebookRuntimeShell({
  activeSceneId,
  backAriaLabel,
  controlMat,
  footer,
  isGameInputBlocked,
  isScenePanelOpen,
  loadingSceneId,
  onBack,
  onEnterScene,
  onOpenOverlay,
  onReturnToOverworld,
  onSwitchToStatic,
  pageFrame,
  presentationMode,
  profile,
  shortHeaderCenter
}: NotebookRuntimeShellProps) {
  const messages = useMessages();
  const gameFrameRef = useRef<HTMLDivElement>(null);
  const isShortViewport = useIsShortViewport();
  const controlMatHandlers = useSceneControlMatPointerBridge({
    disabled: isGameInputBlocked || isScenePanelOpen,
    frameRef: gameFrameRef,
    ownerSceneId: profile.ownerSceneId,
    showPointerVisual: Boolean(controlMat.showDragIndicator)
  });
  const { pointerVisual, ...pointerHandlers } = controlMatHandlers;

  return (
    <div className="relative flex min-h-dvh w-full justify-center overflow-hidden bg-[#f4f1ea]">
      <NotebookShellStage
        data-testid="notebook-game-shell"
        profile={profile.profile}
        layout={profile.layout}
        footerMode={profile.footerMode}
        header={
          <nav
            aria-label={messages.gameShell.controlsLabel}
            className="pointer-events-none absolute left-4 right-4 top-3 z-40 flex items-center justify-between gap-3"
            data-scene-control-ignore="true"
          >
            <Button
              aria-label={backAriaLabel}
              className="pointer-events-auto min-h-11 px-3 font-mono text-sm uppercase tracking-widest"
              icon={<ArrowLeft className="h-4 w-4" aria-hidden />}
              onClick={onBack}
              size="sm"
              variant="floating"
            >
              {messages.gameShell.back}
            </Button>
            {shortHeaderCenter && isShortViewport ? (
              <div className="pointer-events-none flex min-w-0 flex-1 justify-center px-2">
                <div className="w-[min(24rem,100%)]">{shortHeaderCenter}</div>
              </div>
            ) : null}
            <Button
              aria-label={messages.gameShell.switchToStatic}
              className="pointer-events-auto min-h-11 px-3 font-mono text-sm uppercase tracking-widest"
              icon={<BookOpen className="h-4 w-4" aria-hidden />}
              onClick={onSwitchToStatic}
              size="sm"
              variant="floating"
            >
              <span className="hidden sm:inline">{messages.gameShell.staticMode}</span>
              <span className="sm:hidden">{messages.gameShell.static}</span>
            </Button>
          </nav>
        }
        footer={footer}
        panel={<SceneUiHost placement="panel" />}
      >
        <ControlMat
          {...pointerHandlers}
          aria-label={controlMat.ariaLabel}
          className={controlMat.className}
          data-testid={controlMat.testId}
          debugOutline={import.meta.env.DEV}
          label={profile.controlMatLabel}
          showGuide={false}
          style={controlMat.style}
        >
          <NotebookPageFrame
            {...pageFrame.attributes}
            data-testid={pageFrame.testId}
            profile={profile.profile}
            className={pageFrame.className}
            style={pageFrame.style}
          >
            <div ref={gameFrameRef} className="absolute inset-0" data-testid={pageFrame.gameFrameTestId}>
              <Game
                activeSceneId={activeSceneId}
                chrome="bare"
                isPaused={isGameInputBlocked}
                onEnterScene={onEnterScene}
                onOpenOverlay={onOpenOverlay}
                onReturnToOverworld={onReturnToOverworld}
                presentationMode={presentationMode}
              />
            </div>
          </NotebookPageFrame>
          {controlMat.showDragIndicator ? (
            <ControlMatDragIndicator
              data-testid={`${controlMat.testId}-drag-indicator`}
              state={pointerVisual}
            />
          ) : null}
        </ControlMat>
      </NotebookShellStage>

      <OverlayHost />

      {loadingSceneId && (
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

function useIsShortViewport() {
  const [isShortViewport, setIsShortViewport] = useState(readIsShortViewport);

  useEffect(() => {
    const updateViewport = () => setIsShortViewport(readIsShortViewport());
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  return isShortViewport;
}

function readIsShortViewport() {
  return typeof window !== 'undefined' && window.innerHeight <= 420;
}
