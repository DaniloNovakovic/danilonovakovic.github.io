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
});
