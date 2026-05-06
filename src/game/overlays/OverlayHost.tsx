import { useBridgeState, bridgeActions } from '@/game/bridge/store';
import { ModalShell } from '@/shared/ui';
import { getOverlayDefinition } from './overlayRegistry';

export function OverlayHost() {
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
          openOverlay={bridgeActions.openOverlay}
          titleId={titleId}
          descriptionId={descriptionId}
        />
      )}
    </ModalShell>
  );
}
