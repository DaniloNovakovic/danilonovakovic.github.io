import { modesEqual } from '../../runtime/gameState';
import { bridgeStore, type BridgeState } from '@shared/bridge/store';
import { SceneManager } from './SceneManager';
import { SceneTransitionCoordinator } from './SceneTransitionCoordinator';
import { KernelEventBus } from './events';

export class GameKernel {
  private unsubscribeStore?: () => void;
  private previousState?: BridgeState;
  private readonly sceneManager: SceneManager;
  private readonly eventBus: KernelEventBus;
  private readonly transitionCoordinator: SceneTransitionCoordinator;

  constructor(sceneManager: SceneManager, eventBus: KernelEventBus = new KernelEventBus()) {
    this.sceneManager = sceneManager;
    this.eventBus = eventBus;
    this.transitionCoordinator = new SceneTransitionCoordinator(sceneManager, eventBus);
  }

  start(): void {
    this.unsubscribeStore = bridgeStore.subscribe(() => {
      this.sync(bridgeStore.getState());
    });
    this.sync(bridgeStore.getState());
  }

  stop(): void {
    this.unsubscribeStore?.();
    this.transitionCoordinator.invalidate();
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

    this.transitionCoordinator.request(state.mode);
    this.previousState = state;
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
