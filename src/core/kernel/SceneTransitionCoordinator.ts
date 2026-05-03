import { PHASER_SCENE_KEYS } from '../../config/featureIds';
import type { RuntimeMode } from '../../runtime/gameState';
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
      void this.sceneManager.exitTo(PHASER_SCENE_KEYS.main, guard).catch(() => undefined);
      return;
    }

    if (mode.kind === 'phaserScene') {
      this.eventBus.emit({ type: 'SceneTransitionRequested', targetContext: mode.miniGameId });
      void this.sceneManager.enter(mode.miniGameId, guard).catch(() => undefined);
    }
  }

  invalidate(): void {
    this.nextRequestId();
  }

  private nextRequestId(): number {
    this.requestId += 1;
    return this.requestId;
  }
}
