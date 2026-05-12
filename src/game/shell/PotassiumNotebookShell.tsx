import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowLeft, BookOpen } from 'lucide-react';
import Game from './Game';
import { SceneUiHost } from '@/game/sceneUi/SceneUiHost';
import type { OpenOverlayOptions } from '@/game/bridge/store';
import type { OverlayId } from '@/game/overlays/overlayIds';
import { OverlayHost } from '@/game/overlays/OverlayHost';
import type { PhaserScenePresentationMode } from '@/game/sharedSceneRuntime/phaserScenePresentation';
import { POTASSIUM_SCENE_ID, type SceneId } from '@/game/scenes/sceneIds';
import {
  Button,
  Card,
  ControlMat,
  NotebookPageFrame,
  NotebookShellStage,
  SceneHintSlip
} from '@/shared/ui';
import { useMessages } from '@/shared/i18n';
import type { NotebookRuntimeShellProfile } from './notebookShellProfile';
import { useSceneControlMatPointerBridge } from './useSceneControlMatPointerBridge';

const POTASSIUM_BOARD_SAFE_ASPECT = '0.75';
const NOTEBOOK_STAGE_MAX_WIDTH = 1180;
// The page frame is positioned inside ControlMat, so viewport-safe center math
// needs the same top offset that the mat uses on screen.
const CONTROL_MAT_TOP_OFFSET_PX = 64;

interface PotassiumBoardFrameLayout {
  aspect: string;
  centerY: number;
  relativeCenterY: number;
  style: CSSProperties;
  width: number;
}

interface PotassiumNotebookShellProps {
  activeSceneId: SceneId;
  isGameInputBlocked: boolean;
  isScenePanelOpen: boolean;
  loadingSceneId: SceneId | null;
  onEnterScene: (sceneId: SceneId) => void;
  onOpenOverlay: (overlayId: OverlayId, options?: OpenOverlayOptions) => void;
  onReturnToOverworld: () => void;
  onSwitchToStatic: () => void;
  presentationMode: PhaserScenePresentationMode;
  profile: NotebookRuntimeShellProfile;
  sceneHintText: string;
}

export function PotassiumNotebookShell({
  activeSceneId,
  isGameInputBlocked,
  isScenePanelOpen,
  loadingSceneId,
  onEnterScene,
  onOpenOverlay,
  onReturnToOverworld,
  onSwitchToStatic,
  presentationMode,
  profile,
  sceneHintText
}: PotassiumNotebookShellProps) {
  const messages = useMessages();
  const gameFrameRef = useRef<HTMLDivElement>(null);
  const frameLayout = usePotassiumBoardFrameLayout();
  const controlMatHandlers = useSceneControlMatPointerBridge({
    disabled: isGameInputBlocked || isScenePanelOpen,
    frameRef: gameFrameRef,
    ownerSceneId: POTASSIUM_SCENE_ID
  });

  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-[#f4f1ea]">
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
              aria-label={messages.gameShell.backToCity}
              className="pointer-events-auto min-h-11 px-3 font-mono text-sm uppercase tracking-widest"
              icon={<ArrowLeft className="h-4 w-4" aria-hidden />}
              onClick={onReturnToOverworld}
              size="sm"
              variant="floating"
            >
              {messages.gameShell.back}
            </Button>
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
        footer={<SceneHintSlip label={sceneHintText} />}
        panel={<SceneUiHost placement="panel" />}
      >
        <ControlMat
          {...controlMatHandlers}
          aria-label="Potassium input mat"
          className="touch-none"
          data-testid="potassium-control-mat"
          debugOutline={import.meta.env.DEV}
          label={profile.controlMatLabel}
          showGuide={false}
          style={{ bottom: '0.75rem', top: CONTROL_MAT_TOP_OFFSET_PX }}
        >
          <NotebookPageFrame
            data-board-safe-aspect={POTASSIUM_BOARD_SAFE_ASPECT}
            data-frame-aspect={frameLayout.aspect}
            data-frame-center-y={frameLayout.centerY}
            data-frame-relative-center-y={frameLayout.relativeCenterY}
            data-frame-width={frameLayout.width}
            data-testid="potassium-notebook-page-frame"
            profile={profile.profile}
            className="potassium-notebook-page-frame absolute left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-[12px_12px_0px_0px_rgba(26,26,26,1)]"
            style={frameLayout.style}
          >
            <div ref={gameFrameRef} className="absolute inset-0" data-testid="potassium-notebook-game-frame">
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

function usePotassiumBoardFrameLayout(): PotassiumBoardFrameLayout {
  const [viewport, setViewport] = useState(readViewportSize);

  useEffect(() => {
    const updateViewport = () => setViewport(readViewportSize());
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  const isShort = viewport.height <= 420;
  const isDesktopLike = viewport.width >= 768 && !isShort;
  const isTabletLike = viewport.width >= 640 && !isShort;
  const aspect = isShort ? 1.05 : isDesktopLike ? 1.2 : isTabletLike ? 0.95 : Number(POTASSIUM_BOARD_SAFE_ASPECT);
  const shellWidth = Math.min(viewport.width - 16, NOTEBOOK_STAGE_MAX_WIDTH);
  const horizontalReserve = isShort ? 128 : isDesktopLike ? 144 : isTabletLike ? 80 : 48;
  const headerBottom = isShort ? 56 : isDesktopLike ? 128 : 120;
  const footerTop = isShort ? viewport.height - 32 : viewport.height - 88;
  const maxWidth = Math.max(220, shellWidth - horizontalReserve);
  const maxHeight = Math.max(180, footerTop - headerBottom);
  const width = Math.floor(Math.min(maxWidth, maxHeight * aspect));
  const height = width / aspect;
  const safeCenterY = (headerBottom + footerTop) / 2;
  const halfHeight = height / 2;
  const minCenterY = headerBottom + halfHeight;
  const maxCenterY = footerTop - halfHeight;
  const centerY = Math.round(
    minCenterY <= maxCenterY
      ? clamp(safeCenterY, minCenterY, maxCenterY)
      : Math.max(safeCenterY, minCenterY)
  );
  const relativeCenterY = centerY - CONTROL_MAT_TOP_OFFSET_PX;

  return {
    aspect: String(aspect),
    centerY,
    relativeCenterY,
    style: {
      aspectRatio: `${aspect} / 1`,
      top: relativeCenterY,
      width
    },
    width
  };
}

function readViewportSize() {
  return {
    width: typeof window === 'undefined' ? 1024 : window.innerWidth,
    height: typeof window === 'undefined' ? 768 : window.innerHeight
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
