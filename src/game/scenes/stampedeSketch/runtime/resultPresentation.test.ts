import { describe, expect, it } from 'vitest';
import { createStampedeResultViewModel } from './resultPresentation';

describe('stampede result presentation view model', () => {
  it('prioritizes returning to Ridge after a clear', () => {
    const view = createStampedeResultViewModel({
      phase: 'cleared',
      elapsedMs: 75_000,
      durationMs: 75_000,
      contacts: 1
    });

    expect(view.title).toBe('Blanket held');
    expect(view.eyebrow).toBe('Run complete');
    expect(view.body).toBe('The sketch stayed calm through the whole stampede.');
    expect(view.rewardNote).toBe('No stamp yet. Rewards are still taped over.');
    expect(view.actions).toEqual([
      {
        id: 'backToRidge',
        label: 'Back to Ridge',
        priority: 'primary'
      },
      {
        id: 'retry',
        label: 'Retry',
        priority: 'secondary'
      }
    ]);
  });

  it('prioritizes retry after a failure', () => {
    const view = createStampedeResultViewModel({
      phase: 'failed',
      elapsedMs: 42_400,
      durationMs: 75_000,
      contacts: 3
    });

    expect(view.title).toBe('Page got crowded');
    expect(view.eyebrow).toBe('Run ended');
    expect(view.body).toBe('Too many marks landed before the timer ran out.');
    expect(view.actions).toEqual([
      {
        id: 'retry',
        label: 'Retry',
        priority: 'primary'
      },
      {
        id: 'backToRidge',
        label: 'Back to Ridge',
        priority: 'secondary'
      }
    ]);
  });

  it('formats time and contacts stats with stable labels', () => {
    const view = createStampedeResultViewModel({
      phase: 'failed',
      elapsedMs: 61_100,
      durationMs: 75_000,
      contacts: 2
    });

    expect(view.stats).toEqual([
      {
        id: 'time',
        label: 'Time',
        value: '1:02'
      },
      {
        id: 'contacts',
        label: 'Contacts',
        value: '2'
      }
    ]);
  });
});
