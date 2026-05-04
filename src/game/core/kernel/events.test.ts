import { describe, expect, it } from 'vitest';
import { KernelEventBus, KernelEventQueue, type KernelEvent } from './events';

describe('KernelEventQueue', () => {
  it('flushes queued events in insertion order', () => {
    const bus = new KernelEventBus();
    const queue = new KernelEventQueue();
    const received: KernelEvent[] = [];
    bus.subscribe((event) => received.push(event));

    queue.enqueue({ type: 'PauseChanged', paused: true });
    queue.enqueue({ type: 'SceneTransitionRequested', targetContext: null });
    queue.flushTo(bus);

    expect(received).toEqual([
      { type: 'PauseChanged', paused: true },
      { type: 'SceneTransitionRequested', targetContext: null }
    ]);
    expect(queue.size).toBe(0);
  });
});
