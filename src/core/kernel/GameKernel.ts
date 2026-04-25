import { PHASER_SCENE_KEYS } from '../../config/featureIds';
import { modesEqual } from '../../runtime/gameState';
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
    const previousState = this.previousState;
    const isInitialSync = !previousState;
    const modeChanged = isInitialSync || !modesEqual(previousState.mode, state.mode);
    const pauseChanged = isInitialSync || previousState.isPaused !== state.isPaused;

    this.emitStateEvents(state, modeChanged, pauseChanged);
    if (pauseChanged) {
      this.sceneManager.applyPause('all', state.isPaused);
    }

    if (!modeChanged) {
      this.previousState = state;
      return;
    }

    this.syncSceneTransition(state);
    this.previousState = state;
  }

  private syncSceneTransition(state: BridgeState): void {
    if (state.mode.kind === 'exploring') {
      this.eventBus.emit({ type: 'SceneTransitionRequested', targetContext: null });
      this.sceneManager.exitTo(PHASER_SCENE_KEYS.main);
      return;
    }

    if (state.mode.kind === 'phaserScene') {
      this.eventBus.emit({ type: 'SceneTransitionRequested', targetContext: state.mode.miniGameId });
      this.sceneManager.enter(state.mode.miniGameId);
    }
  }

  private emitStateEvents(state: BridgeState, modeChanged: boolean, pauseChanged: boolean): void {
    if (!this.previousState) {
      this.eventBus.emit({ type: 'PauseChanged', paused: state.isPaused });
      if (state.mode.kind === 'reactOverlay') {
        this.eventBus.emit({ type: 'OverlayOpened', miniGameId: state.mode.miniGameId });
      }
      return;
    }

    if (pauseChanged) {
      this.eventBus.emit({ type: 'PauseChanged', paused: state.isPaused });
    }

    if (!modeChanged) return;

    const previousMode = this.previousState.mode;
    const currentMode = state.mode;

    if (previousMode.kind === 'reactOverlay') {
      this.eventBus.emit({
        type: 'OverlayClosed',
        toContext: currentMode.kind === 'exploring' ? null : currentMode.miniGameId
      });
    }

    if (currentMode.kind === 'reactOverlay') {
      this.eventBus.emit({ type: 'OverlayOpened', miniGameId: currentMode.miniGameId });
    }
  }
}
