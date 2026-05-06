import type { OverlayId } from '@/game/overlays/overlayIds';
import type { SceneId } from '@/game/scenes/sceneIds';
import type { ContextId } from './types';

export type SceneLifecycleEvent =
  | { type: 'SceneTransitionRequested'; targetContext: ContextId | null }
  | { type: 'OverlayOpened'; overlayId: OverlayId }
  | { type: 'OverlayClosed'; activeSceneId: SceneId }
  | { type: 'PauseChanged'; paused: boolean };

export type SceneLifecycleEventListener = (event: SceneLifecycleEvent) => void;

export class SceneLifecycleEventBus {
  private readonly listeners = new Set<SceneLifecycleEventListener>();

  subscribe(listener: SceneLifecycleEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event: SceneLifecycleEvent): void {
    this.listeners.forEach((listener) => listener(event));
  }
}

export class SceneLifecycleEventQueue {
  private readonly pending: SceneLifecycleEvent[] = [];

  enqueue(event: SceneLifecycleEvent): void {
    this.pending.push(event);
  }

  flushTo(eventBus: SceneLifecycleEventBus): void {
    while (this.pending.length > 0) {
      const event = this.pending.shift();
      if (event) eventBus.emit(event);
    }
  }

  clear(): void {
    this.pending.length = 0;
  }

  get size(): number {
    return this.pending.length;
  }
}
