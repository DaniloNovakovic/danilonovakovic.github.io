import { describe, expect, it } from 'vitest';
import { pickStampedeBark } from './barks';

describe('chick magnet barks', () => {
  it('lets the rarer chick speak first, then the other', () => {
    const first = pickStampedeBark([
      { id: 'nerd', kind: 'nerd', x: 0, y: 0 },
      { id: 'bar', kind: 'bartender', x: 12, y: 0 },
      { id: 'other-nerd', kind: 'nerd', x: 4, y: 0 }
    ], 5_000, 0, { x: 0, y: 0 });
    const next = pickStampedeBark([
      { id: 'nerd', kind: 'nerd', x: 0, y: 0 }
    ], first?.nextBarkAtMs ?? 0, first?.nextBarkAtMs ?? 0);

    expect(first?.id).toBe('bar');
    expect(first?.line).toBe('Last call.');
    expect(next?.id).toBe('nerd');
    expect(next?.line).toBe('Well, actually.');
  });

  it('stays quiet until the gap has passed', () => {
    expect(pickStampedeBark([
      { id: 'rooster', kind: 'rooster', x: 0, y: 0 }
    ], 1_000, 2_000)).toBeNull();
  });

  it('picks the closer bird when two of the same type are ready', () => {
    const pick = pickStampedeBark([
      { id: 'far', kind: 'rooster', x: 240, y: 0 },
      { id: 'near', kind: 'rooster', x: 20, y: 0 }
    ], 1_000, 0, { x: 0, y: 0 });
    expect(pick?.id).toBe('near');
    expect(pick?.line).toBe('Square up.');
  });
});
