import { Suspense } from 'react';
import { useBridgeState, bridgeActions } from '@/game/bridge/store';
import { DialogCard, ModalShell } from '@/shared/ui';
import { getOverlayDefinition } from './overlayRegistry';

export function OverlayHost() {
  const { activeOverlayId } = useBridgeState();
  if (!activeOverlayId) return null;

  const overlay = getOverlayDefinition(activeOverlayId);
  const ActiveOverlayComponent = overlay.component;
  const closeOverlay = () => bridgeActions.closeOverlay();

  return (
    <ModalShell
      title={overlay.title}
      hasDescription={Boolean(overlay.description)}
      onClose={closeOverlay}
    >
      {({ titleId, descriptionId }) => (
        <DialogCard
          title={overlay.title}
          description={overlay.description}
          onClose={closeOverlay}
          titleId={titleId}
          descriptionId={descriptionId}
        >
          <Suspense fallback={null}>
            <ActiveOverlayComponent />
          </Suspense>
        </DialogCard>
      )}
    </ModalShell>
  );
}
