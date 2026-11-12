import { describe, expect, it } from 'vitest';
import { getMessages } from '@/shared/i18n';
import { createStampedeResultViewModel } from './resultPresentation';

describe('stampede result presentation view model', () => {
  const copy = getMessages().scenes.stampedeSketch.result;

  it('offers to keep going endlessly after a clear', () => {
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
        id: 'keepGoing',
        label: copy.actions.keepGoing,
        priority: 'primary'
      },
      {
        id: 'backToRidge',
        label: copy.actions.backToRidge,
        priority: 'secondary'
      },
      {
        id: 'retry',
        label: copy.actions.retry,
        priority: 'secondary'
      }
    ]);
  });

  it('reports an endless run with its uncapped time and the best on record', () => {
    const view = createStampedeResultViewModel({
      phase: 'failed',
      elapsedMs: 212_000,
      durationMs: 150_000,
      contacts: 3,
      endless: { bestMs: 240_000, newBest: false }
    });

    expect(view.title).toBe(copy.title.endless);
    expect(view.rewardNote).toBe(copy.endless.best('4:00'));
    expect(view.stats).toEqual([
      { id: 'time', label: copy.stats.time, value: '3:32' },
      { id: 'best', label: copy.stats.best, value: '4:00' }
    ]);
    expect(view.actions.map((action) => action.id)).toEqual(['retry', 'backToRidge']);
  });

  it('celebrates a new endless best', () => {
    const view = createStampedeResultViewModel({
      phase: 'failed',
      elapsedMs: 300_000,
      durationMs: 150_000,
      contacts: 3,
      endless: { bestMs: 300_000, newBest: true }
    });

    expect(view.rewardNote).toBe(copy.endless.newBest);
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
