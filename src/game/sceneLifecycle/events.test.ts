import { describe, expect, it } from 'vitest';
import {
  SceneLifecycleEventBus,
  SceneLifecycleEventQueue,
  type SceneLifecycleEvent
} from './events';

describe('SceneLifecycleEventQueue', () => {
  it('flushes queued events in insertion order', () => {
    const bus = new SceneLifecycleEventBus();
    const queue = new SceneLifecycleEventQueue();
    const received: SceneLifecycleEvent[] = [];
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
