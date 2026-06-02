import { useMemo } from 'react';
import { bridgeActions, useBridgeState, type OpenOverlayOptions } from '@/game/bridge/store';
import {
  getPhaserScenePresentationMode,
  type PhaserScenePresentationMode
} from '@/game/sharedSceneRuntime/phaserScenePresentation';
import type { OverlayId } from '@/game/overlays/overlayIds';
import {
  isSceneId,
  OVERWORLD_SCENE_ID,
  POTASSIUM_SCENE_ID,
  type SceneId
} from '@/game/scenes/sceneIds';
import { getInteractiveGameShellLayout } from './gameShellLayout';
import { getSceneHeaderChrome } from './sceneHeaderChrome';
import { getNotebookRuntimeShellProfile } from './notebookShellProfile';
import { useResizeObserver } from '@/shared/hooks/useResizeObserver';
import { useMessages } from '@/shared/i18n';

export function useInteractiveAppShell() {
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
  const shouldShowFooterHint =
    shouldShowSceneUiStatus || shouldReserveSceneHint || shouldShowNavigationHint;
  const sceneHeaderChrome = getSceneHeaderChrome(presentationSceneId);
  const notebookShellProfile = getNotebookRuntimeShellProfile(presentationSceneId);

  const actions = useMemo(() => ({
    enterScene: (sceneId: SceneId) => bridgeActions.enterScene(sceneId),
    openOverlay: (overlayId: OverlayId, options?: OpenOverlayOptions) =>
      bridgeActions.openOverlay(overlayId, options),
    returnToOverworld: () => bridgeActions.returnToOverworld(),
    returnToScene: (sceneId: SceneId) => {
      if (sceneId === OVERWORLD_SCENE_ID) {
        bridgeActions.returnToOverworld();
        return;
      }
      bridgeActions.enterScene(sceneId);
    }
  }), []);

  return {
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
    shouldShowNavigationHint,
    sceneHeaderChrome,
    notebookShellProfile,
    ...actions
  };
}

export type InteractiveAppShellState = ReturnType<typeof useInteractiveAppShell>;
