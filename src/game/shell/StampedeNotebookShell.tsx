import { SceneUiHost } from '@/game/sceneUi/SceneUiHost';
import type { OpenOverlayOptions } from '@/game/bridge/store';
import type { OverlayId } from '@/game/overlays/overlayIds';
import type { PhaserScenePresentationMode } from '@/game/sharedSceneRuntime/phaserScenePresentation';
import { RIDGE_SCENE_ID, type SceneId } from '@/game/scenes/sceneIds';
import { STAMPEDE_ARENA } from '@/game/scenes/stampedeSketch/runtime/movement';
import { useMessages } from '@/shared/i18n';
import type { NotebookRuntimeShellProfile } from './notebookShellProfile';
import { NotebookRuntimeShell } from './NotebookRuntimeShell';
import {
  NOTEBOOK_CONTROL_MAT_TOP_OFFSET_PX,
  useNotebookFocusPageFrameLayout
} from './notebookFocusLayout';

const STAMPEDE_ARENA_WIDTH = STAMPEDE_ARENA.right - STAMPEDE_ARENA.left;
const STAMPEDE_ARENA_HEIGHT = STAMPEDE_ARENA.bottom - STAMPEDE_ARENA.top;
const STAMPEDE_ARENA_ASPECT = STAMPEDE_ARENA_WIDTH / STAMPEDE_ARENA_HEIGHT;

interface StampedeNotebookShellProps {
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
}

export function StampedeNotebookShell({
  activeSceneId,
  isGameInputBlocked,
  isScenePanelOpen,
  loadingSceneId,
  onEnterScene,
  onOpenOverlay,
  onReturnToOverworld,
  onSwitchToStatic,
  presentationMode,
  profile
}: StampedeNotebookShellProps) {
  const messages = useMessages();
  const frameLayout = useNotebookFocusPageFrameLayout(STAMPEDE_ARENA_ASPECT);

  return (
    <NotebookRuntimeShell
      activeSceneId={activeSceneId}
      backAriaLabel={messages.gameShell.backToRidge}
      controlMat={{
        ariaLabel: 'Stampede input mat',
        className: 'touch-none',
        showDragIndicator: true,
        style: { bottom: '0.75rem', top: NOTEBOOK_CONTROL_MAT_TOP_OFFSET_PX },
        testId: 'stampede-control-mat'
      }}
      footer={<SceneUiHost placement="status" />}
      isGameInputBlocked={isGameInputBlocked}
      isScenePanelOpen={isScenePanelOpen}
      loadingSceneId={loadingSceneId}
      onBack={() => onEnterScene(RIDGE_SCENE_ID)}
      onEnterScene={onEnterScene}
      onOpenOverlay={onOpenOverlay}
      onReturnToOverworld={onReturnToOverworld}
      onSwitchToStatic={onSwitchToStatic}
      pageFrame={{
        attributes: {
          'data-arena-aspect': STAMPEDE_ARENA_ASPECT,
          'data-frame-aspect': frameLayout.aspect,
          'data-frame-center-y': frameLayout.centerY,
          'data-frame-relative-center-y': frameLayout.relativeCenterY,
          'data-frame-width': frameLayout.width
        },
        className: 'stampede-notebook-page-frame absolute left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-[12px_12px_0px_0px_rgba(26,26,26,1)]',
        gameFrameTestId: 'stampede-notebook-game-frame',
        style: frameLayout.style,
        testId: 'stampede-notebook-page-frame'
      }}
      presentationMode={presentationMode}
      profile={profile}
      shortHeaderCenter={<SceneUiHost placement="status" />}
    />
  );
}
