import { useBridgeState, bridgeActions } from '@/game/bridge/store';
import { ModalShell } from '@/shared/ui';
import { getOverlayDefinition } from './overlayRegistry';
import type { SceneId } from '@/game/scenes/sceneIds';

interface OverlayHostProps {
  enterScene?: (sceneId: SceneId) => void;
}

export function OverlayHost({
  enterScene = bridgeActions.enterScene
}: OverlayHostProps = {}) {
  const { activeOverlay } = useBridgeState();
  const ActiveOverlayComponent = activeOverlay ? getOverlayDefinition(activeOverlay.id).component : null;

  if (!activeOverlay || !ActiveOverlayComponent) return null;

  const closeOverlay = () => bridgeActions.closeOverlay();

  return (
    <ModalShell
      onClose={closeOverlay}
      closeOnEscape={activeOverlay.closeOnEscape}
      closeOnBackdrop={activeOverlay.closeOnBackdrop}
    >
      {({ titleId, descriptionId }) => (
        <ActiveOverlayComponent
          params={activeOverlay.params}
          close={closeOverlay}
          enterScene={enterScene}
          openOverlay={bridgeActions.openOverlay}
          titleId={titleId}
          descriptionId={descriptionId}
        />
      )}
    </ModalShell>
  );
}
