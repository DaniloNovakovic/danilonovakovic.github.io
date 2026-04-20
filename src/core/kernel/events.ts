import type { ContextId } from './types';

export type KernelEvent =
  | { type: 'SceneTransitionRequested'; targetContext: ContextId | null }
  | { type: 'OverlayOpened'; miniGameId: string }
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
