import { PHASER_SCENE_KEYS } from '../../config/featureIds';
import { getMiniGameById } from '../../game/miniGameRegistry';
import { MiniGameType } from '../../game/types';
import { bridgeStore, type BridgeState } from '../../shared/bridge/store';
import { SceneManager } from './SceneManager';
import { KernelEventBus } from './events';

export class GameKernel {
  private unsubscribeStore?: () => void;
  private previousState?: BridgeState;
  private readonly sceneManager: SceneManager;
  private readonly eventBus: KernelEventBus;

  constructor(sceneManager: SceneManager, eventBus: KernelEventBus = new KernelEventBus()) {
    this.sceneManager = sceneManager;
    this.eventBus = eventBus;
  }

  start(): void {
    this.unsubscribeStore = bridgeStore.subscribe(() => {
      this.sync(bridgeStore.getState());
    });
    this.sync(bridgeStore.getState());
  }

  stop(): void {
    this.unsubscribeStore?.();
    this.sceneManager.dispose();
  }

  getEvents(): KernelEventBus {
    return this.eventBus;
  }

  sync(state: BridgeState): void {
    this.emitStateEvents(state);
    this.sceneManager.applyPause('all', state.isPaused);

    if (!state.activeMiniGameId) {
      this.eventBus.emit({ type: 'SceneTransitionRequested', targetContext: null });
      this.sceneManager.exitTo(PHASER_SCENE_KEYS.main);
      this.previousState = state;
      return;
    }

    const activeMiniGame = getMiniGameById(state.activeMiniGameId);
    if (activeMiniGame?.type === MiniGameType.PHASER_SCENE) {
      this.eventBus.emit({ type: 'SceneTransitionRequested', targetContext: activeMiniGame.id });
      this.sceneManager.enter(activeMiniGame.id);
    }
    this.previousState = state;
  }

  private emitStateEvents(state: BridgeState): void {
    if (!this.previousState) {
      this.eventBus.emit({ type: 'PauseChanged', paused: state.isPaused });
      return;
    }

    if (this.previousState.isPaused !== state.isPaused) {
      this.eventBus.emit({ type: 'PauseChanged', paused: state.isPaused });
    }

    const previousId = this.previousState.activeMiniGameId;
    const currentId = state.activeMiniGameId;
    if (!previousId && currentId) {
      const active = getMiniGameById(currentId);
      if (active?.type === MiniGameType.REACT_OVERLAY) {
        this.eventBus.emit({ type: 'OverlayOpened', miniGameId: currentId });
      }
    } else if (previousId && !currentId) {
      this.eventBus.emit({ type: 'OverlayClosed', toContext: null });
    }
  }
}
