import { lazy, Suspense, useMemo } from 'react';
import { useBridgeState, bridgeActions } from '@/game/bridge/store';
import { ModalShell } from '@/shared/ui';
import { getOverlayDefinition } from './overlayRegistry';

export function OverlayHost() {
  const { activeOverlay } = useBridgeState();
  const ActiveOverlayComponent = useMemo(
    () => activeOverlay ? lazy(getOverlayDefinition(activeOverlay.id).load) : null,
    [activeOverlay]
  );

  if (!activeOverlay || !ActiveOverlayComponent) return null;

  const closeOverlay = () => bridgeActions.closeOverlay();

  return (
    <ModalShell
      onClose={closeOverlay}
      closeOnEscape={activeOverlay.closeOnEscape}
      closeOnBackdrop={activeOverlay.closeOnBackdrop}
    >
      {({ titleId, descriptionId }) => (
        <Suspense fallback={null}>
          <ActiveOverlayComponent
            params={activeOverlay.params}
            close={closeOverlay}
            openOverlay={bridgeActions.openOverlay}
            titleId={titleId}
            descriptionId={descriptionId}
          />
        </Suspense>
      )}
    </ModalShell>
  );
}
