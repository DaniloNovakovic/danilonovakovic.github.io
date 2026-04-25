import type { MiniGameId } from '../../config/featureIds';
import type { ContextId } from './types';

export type KernelEvent =
  | { type: 'SceneTransitionRequested'; targetContext: ContextId | null }
  | { type: 'OverlayOpened'; miniGameId: MiniGameId }
  | { type: 'OverlayClosed'; toContext: ContextId | null }
  | { type: 'PauseChanged'; paused: boolean };

export type KernelEventListener = (event: KernelEvent) => void;

export class KernelEventBus {
  private readonly listeners = new Set<KernelEventListener>();

  subscribe(listener: KernelEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event: KernelEvent): void {
    this.listeners.forEach((listener) => listener(event));
  }
}

export class KernelEventQueue {
  private readonly pending: KernelEvent[] = [];

  enqueue(event: KernelEvent): void {
    this.pending.push(event);
  }

  flushTo(eventBus: KernelEventBus): void {
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
