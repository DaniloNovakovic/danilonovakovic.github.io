import { bridgeStore, type BridgeState } from '@/game/bridge/store';
import { SceneManager } from './SceneManager';
import { SceneTransitionCoordinator } from './SceneTransitionCoordinator';
import { SceneLifecycleEventBus } from './events';

export class SceneLifecycleController {
  private unsubscribeStore?: () => void;
  private previousState?: BridgeState;
  private readonly sceneManager: SceneManager;
  private readonly eventBus: SceneLifecycleEventBus;
  private readonly transitionCoordinator: SceneTransitionCoordinator;

  constructor(
    sceneManager: SceneManager,
    eventBus: SceneLifecycleEventBus = new SceneLifecycleEventBus()
  ) {
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

  getEvents(): SceneLifecycleEventBus {
    return this.eventBus;
  }

  sync(state: BridgeState): void {
    const previousState = this.previousState;
    const isInitialSync = !previousState;
    const sceneChanged = isInitialSync || previousState.activeSceneId !== state.activeSceneId;
    const overlayChanged = isInitialSync || previousState.activeOverlayId !== state.activeOverlayId;
    const pauseChanged = isInitialSync || previousState.isPaused !== state.isPaused;

    this.emitStateEvents(state, overlayChanged, pauseChanged);
    if (pauseChanged) {
      this.sceneManager.applyPause('all', state.isPaused);
    }

    if (!sceneChanged) {
      this.previousState = state;
      return;
    }

    this.transitionCoordinator.request(state.activeSceneId);
    this.previousState = state;
  }

  private emitStateEvents(state: BridgeState, overlayChanged: boolean, pauseChanged: boolean): void {
    if (!this.previousState) {
      this.eventBus.emit({ type: 'PauseChanged', paused: state.isPaused });
      if (state.activeOverlayId) {
        this.eventBus.emit({ type: 'OverlayOpened', overlayId: state.activeOverlayId });
      }
      return;
    }

    if (pauseChanged) {
      this.eventBus.emit({ type: 'PauseChanged', paused: state.isPaused });
    }

    if (!overlayChanged) return;

    const previousOverlayId = this.previousState.activeOverlayId;
    const currentOverlayId = state.activeOverlayId;

    if (previousOverlayId) {
      this.eventBus.emit({
        type: 'OverlayClosed',
        activeSceneId: state.activeSceneId
      });
    }

    if (currentOverlayId) {
      this.eventBus.emit({ type: 'OverlayOpened', overlayId: currentOverlayId });
    }
  }
}
