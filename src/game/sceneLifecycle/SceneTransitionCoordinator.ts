import { OVERWORLD_SCENE_ID, type SceneId } from '@/game/scenes/sceneIds';
import { SceneManager, type SceneTransitionGuard } from './SceneManager';
import { SceneLifecycleEventBus } from './events';

export class SceneTransitionCoordinator {
  private readonly sceneManager: SceneManager;
  private readonly eventBus: SceneLifecycleEventBus;
  private requestId = 0;

  constructor(sceneManager: SceneManager, eventBus: SceneLifecycleEventBus) {
    this.sceneManager = sceneManager;
    this.eventBus = eventBus;
  }

  request(sceneId: SceneId): void {
    const requestId = this.nextRequestId();
    const guard: SceneTransitionGuard = {
      isCurrent: () => requestId === this.requestId
    };

    if (sceneId === OVERWORLD_SCENE_ID) {
      this.eventBus.emit({ type: 'SceneTransitionRequested', targetContext: null });
      this.runTransition(this.sceneManager.exitTo(OVERWORLD_SCENE_ID, guard));
      return;
    }

    this.eventBus.emit({ type: 'SceneTransitionRequested', targetContext: sceneId });
    this.runTransition(this.sceneManager.enter(sceneId, guard));
  }

  invalidate(): void {
    this.nextRequestId();
  }

  private nextRequestId(): number {
    this.requestId += 1;
    return this.requestId;
  }

  private runTransition(transition: Promise<void>): void {
    void transition.catch((error: unknown) => {
      console.warn('Scene transition failed', error);
    });
  }
}
