import { PHASER_SCENE_KEYS } from '@game/registry/featureIds';
import type { RuntimeMode } from '../runtime/gameState';
import { SceneManager, type SceneTransitionGuard } from './SceneManager';
import { KernelEventBus } from './events';

export class SceneTransitionCoordinator {
  private readonly sceneManager: SceneManager;
  private readonly eventBus: KernelEventBus;
  private requestId = 0;

  constructor(sceneManager: SceneManager, eventBus: KernelEventBus) {
    this.sceneManager = sceneManager;
    this.eventBus = eventBus;
  }

  request(mode: RuntimeMode): void {
    const requestId = this.nextRequestId();
    const guard: SceneTransitionGuard = {
      isCurrent: () => requestId === this.requestId
    };

    if (mode.kind === 'exploring') {
      this.eventBus.emit({ type: 'SceneTransitionRequested', targetContext: null });
      this.runTransition(this.sceneManager.exitTo(PHASER_SCENE_KEYS.main, guard));
      return;
    }

    if (mode.kind === 'phaserScene') {
      this.eventBus.emit({ type: 'SceneTransitionRequested', targetContext: mode.miniGameId });
      this.runTransition(this.sceneManager.enter(mode.miniGameId, guard));
    }
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
