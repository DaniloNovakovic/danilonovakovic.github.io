import { describe, expect, it, vi } from 'vitest';
import type * as Phaser from 'phaser';
import { refreshPhaserScale } from './refreshPhaserScale';

describe('refreshPhaserScale', () => {
  it('reads the parent size before refreshing so a container resize is not one step behind', () => {
    const calls: string[] = [];
    const game = {
      scale: {
        getParentBounds: vi.fn(() => {
          calls.push('bounds');
          return true;
        }),
        refresh: vi.fn(() => {
          calls.push('refresh');
        })
      }
    } as unknown as Phaser.Game;

    refreshPhaserScale(game);

    expect(calls).toEqual(['bounds', 'refresh']);
  });

  it('nudges the canvas onto whole CSS pixels so the browser does not resample every frame', () => {
    // Vertically centred layouts land the canvas at e.g. top=173.5875: half a pixel off-grid blurs everything.
    const canvas = {
      style: { translate: '1px 1px' },
      getBoundingClientRect: vi.fn(() => ({ left: 228.25, top: 173.5875 }))
    };
    const game = {
      canvas,
      scale: { getParentBounds: vi.fn(), refresh: vi.fn() }
    } as unknown as Phaser.Game;

    refreshPhaserScale(game);

    // Measured with the old nudge cleared, then moved to x=228, y=174.
    expect(canvas.getBoundingClientRect).toHaveBeenCalledTimes(1);
    expect(canvas.style.translate).toBe('-0.25px 0.4125px');
  });
});
