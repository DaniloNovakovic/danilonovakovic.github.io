import { bridgeActions, useBridgeState } from '@/game/bridge/store';
import { getSceneUiSurfaceDefinition } from './registry';
import type { SceneUiActionId } from './types';
import { cn } from '@/shared/ui/utils';

interface SceneUiHostProps {
  placement: 'status' | 'panel';
}

export function SceneUiHost({ placement }: SceneUiHostProps) {
  const { sceneUi } = useBridgeState();
  const request = placement === 'status' ? sceneUi.status : sceneUi.panel;
  if (!request) return null;

  const surface = getSceneUiSurfaceDefinition(request.id);
  const Surface = surface.component;
  const dispatchAction = (action: SceneUiActionId, params?: unknown) => {
    bridgeActions.dispatchSceneUiAction(request.ownerSceneId, action, params);
  };

  if (placement === 'status') {
    return (
      <Surface
        ownerSceneId={request.ownerSceneId}
        params={request.params}
        dispatchAction={dispatchAction}
      />
    );
  }

  const isOverlayPanel = surface.panelChrome === 'overlay';

  return (
    <div
      data-testid={isOverlayPanel ? 'scene-ui-panel-overlay' : 'scene-ui-panel-default'}
      className={cn(
        'absolute z-30 flex justify-center overflow-visible',
        isOverlayPanel
          ? 'pointer-events-none left-1/2 top-1/2 max-h-[min(82dvh,calc(100dvh-7rem))] w-[min(46rem,calc(100vw-1rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto overflow-x-visible p-1 sm:p-2'
          : 'inset-0 items-center p-2 sm:p-3'
      )}
    >
      <div className="pointer-events-auto flex w-full justify-center">
        <Surface
          ownerSceneId={request.ownerSceneId}
          params={request.params}
          dispatchAction={dispatchAction}
        />
      </div>
    </div>
  );
}
