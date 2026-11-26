import { POTASSIUM_SCENE_ID, STAMPEDE_SKETCH_SCENE_ID } from '@/game/scenes/sceneIds';
import { PotassiumNotebookShell } from './PotassiumNotebookShell';
import { StampedeNotebookShell } from './StampedeNotebookShell';
import { InteractiveAppDefaultShell } from './InteractiveAppDefaultShell';
import { useInteractiveAppShell } from './useInteractiveAppShell';
import { useLayoutEffect } from 'react';
import { applyOutOfBoundsCheckpointFromUrl } from '@/game/overlays/devSwitcher/outOfBoundsCheckpoints';

interface InteractiveAppProps {
  onSwitchToStatic: () => void;
}

export default function InteractiveApp({ onSwitchToStatic }: InteractiveAppProps) {
  // Dev only: `?oob=<checkpoint>` sets up the Out of Bounds arc. A layout effect runs before
  // Phaser boots (a passive effect) without changing game state during render.
  useLayoutEffect(() => {
    applyOutOfBoundsCheckpointFromUrl();
  }, []);
  const shell = useInteractiveAppShell();
  const {
    bridge,
    notebookShellProfile,
    isGameInputBlocked,
    presentationMode,
    sceneHintText,
    enterScene,
    openOverlay,
    returnToOverworld
  } = shell;

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

  return <InteractiveAppDefaultShell shell={shell} onSwitchToStatic={onSwitchToStatic} />;
}
