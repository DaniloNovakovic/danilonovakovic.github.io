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
    <div className="absolute inset-0 z-20 flex items-center justify-center p-3">
      <Surface
        ownerSceneId={request.ownerSceneId}
        params={request.params}
        dispatchAction={dispatchAction}
      />
    </div>
  );
}
