import { describe, expect, it } from 'vitest';
import { getMessages } from '@/shared/i18n';
import { createStampedeResultViewModel } from './resultPresentation';

describe('stampede result presentation view model', () => {
  const copy = getMessages().scenes.stampedeSketch.result;

  it('prioritizes returning to Ridge after a clear', () => {
    const view = createStampedeResultViewModel({
      phase: 'cleared',
      elapsedMs: 75_000,
      durationMs: 75_000,
      contacts: 1,
      rewardStatus: 'earned'
    });

    expect(view.title).toBe(copy.title.cleared);
    expect(view.eyebrow).toBe(copy.eyebrow.cleared);
    expect(view.body).toBe(copy.body.cleared);
    expect(view.rewardNote).toBe(copy.rewardNote.earned);
    expect(view.actions).toEqual([
      {
        id: 'backToRidge',
        label: copy.actions.backToRidge,
        priority: 'primary'
      },
      {
        id: 'retry',
        label: copy.actions.retry,
        priority: 'secondary'
      }
    ]);
  });

  it('marks repeat clears as already rewarded', () => {
    const view = createStampedeResultViewModel({
      phase: 'cleared',
      elapsedMs: 75_000,
      durationMs: 75_000,
      contacts: 0,
      rewardStatus: 'alreadyOwned'
    });

    expect(view.rewardNote).toBe(copy.rewardNote.alreadyOwned);
  });

  it('prioritizes retry after a failure', () => {
    const view = createStampedeResultViewModel({
      phase: 'failed',
      elapsedMs: 42_400,
      durationMs: 75_000,
      contacts: 3
    });

    expect(view.title).toBe(copy.title.failed);
    expect(view.eyebrow).toBe(copy.eyebrow.failed);
    expect(view.body).toBe(copy.body.failed);
    expect(view.rewardNote).toBe(copy.rewardNote.failed);
    expect(view.actions).toEqual([
      {
        id: 'retry',
        label: copy.actions.retry,
        priority: 'primary'
      },
      {
        id: 'backToRidge',
        label: copy.actions.backToRidge,
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
        label: copy.stats.time,
        value: '1:02'
      },
      {
        id: 'contacts',
        label: copy.stats.contacts,
        value: '2'
      }
    ]);
  });
});
