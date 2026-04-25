import { PHASER_SCENE_KEYS } from '../../config/featureIds';
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

    if (state.mode.kind === 'exploring') {
      this.eventBus.emit({ type: 'SceneTransitionRequested', targetContext: null });
      this.sceneManager.exitTo(PHASER_SCENE_KEYS.main);
      this.previousState = state;
      return;
    }

    if (state.mode.kind === 'phaserScene') {
      this.eventBus.emit({ type: 'SceneTransitionRequested', targetContext: state.mode.miniGameId });
      this.sceneManager.enter(state.mode.miniGameId);
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

    const previousMode = this.previousState.mode;
    const currentMode = state.mode;
    const modeChanged =
      previousMode.kind !== currentMode.kind ||
      (previousMode.kind !== 'exploring' &&
        currentMode.kind !== 'exploring' &&
        previousMode.miniGameId !== currentMode.miniGameId);

    if (!modeChanged) return;

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
