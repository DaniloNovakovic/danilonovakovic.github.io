import { bridgeActions, useBridgeState } from '@/game/bridge/store';
import { getSceneUiSurfaceDefinition } from './registry';
import type { SceneUiActionId } from './types';

interface SceneUiHostProps {
  placement: 'status' | 'panel';
}

export function SceneUiHost({ placement }: SceneUiHostProps) {
  const { sceneUi } = useBridgeState();
  const request = placement === 'status' ? sceneUi.status : sceneUi.panel;
  if (!request) return null;

  const Surface = getSceneUiSurfaceDefinition(request.id).component;
  const dispatchAction = (action: SceneUiActionId) => {
    bridgeActions.dispatchSceneUiAction(request.ownerSceneId, action);
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

  return (
    <div className="absolute inset-0 z-20 overflow-y-auto overscroll-contain p-2 sm:p-3">
      <div className="flex min-h-full items-start justify-center py-2 sm:items-center sm:py-0">
        <Surface
          ownerSceneId={request.ownerSceneId}
          params={request.params}
          dispatchAction={dispatchAction}
        />
      </div>
    </div>
  );
}
