import type { OpenOverlayOptions } from '@/game/bridge/store';
import type { OverlayId } from '@/game/overlays/overlayIds';
import type { PhaserScenePresentationMode } from '@/game/sharedSceneRuntime/phaserScenePresentation';
import type { SceneId } from '@/game/scenes/sceneIds';
import { SceneHintSlip } from '@/shared/ui';
import { useMessages } from '@/shared/i18n';
import type { NotebookRuntimeShellProfile } from './notebookShellProfile';
import { NotebookRuntimeShell } from './NotebookRuntimeShell';
import {
  NOTEBOOK_CONTROL_MAT_TOP_OFFSET_PX,
  useNotebookFocusPageFrameLayout
} from './notebookFocusLayout';

const POTASSIUM_BOARD_WIDTH = 450;
const POTASSIUM_BOARD_HEIGHT = 600;
const POTASSIUM_BOARD_ASPECT = POTASSIUM_BOARD_WIDTH / POTASSIUM_BOARD_HEIGHT;
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
  const frameLayout = usePotassiumBoardFrameLayout();

  return (
    <NotebookRuntimeShell
      activeSceneId={activeSceneId}
      backAriaLabel={messages.gameShell.backToCity}
      controlMat={{
        ariaLabel: 'Potassium input mat',
        className: 'touch-none',
        style: { bottom: '0.75rem', top: NOTEBOOK_CONTROL_MAT_TOP_OFFSET_PX },
        testId: 'potassium-control-mat'
      }}
      footer={<SceneHintSlip label={sceneHintText} />}
      isGameInputBlocked={isGameInputBlocked}
      isScenePanelOpen={isScenePanelOpen}
      loadingSceneId={loadingSceneId}
      onBack={onReturnToOverworld}
      onEnterScene={onEnterScene}
      onOpenOverlay={onOpenOverlay}
      onReturnToOverworld={onReturnToOverworld}
      onSwitchToStatic={onSwitchToStatic}
      pageFrame={{
        attributes: {
          'data-board-aspect': POTASSIUM_BOARD_ASPECT,
          'data-frame-aspect': frameLayout.aspect,
          'data-frame-center-y': frameLayout.centerY,
          'data-frame-relative-center-y': frameLayout.relativeCenterY,
          'data-frame-width': frameLayout.width
        },
        className: 'potassium-notebook-page-frame absolute left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-[12px_12px_0px_0px_rgba(26,26,26,1)]',
        gameFrameTestId: 'potassium-notebook-game-frame',
        style: frameLayout.style,
        testId: 'potassium-notebook-page-frame'
      }}
      presentationMode={presentationMode}
      profile={profile}
    />
  );
}

function usePotassiumBoardFrameLayout() {
  return useNotebookFocusPageFrameLayout(POTASSIUM_BOARD_ASPECT);
}
