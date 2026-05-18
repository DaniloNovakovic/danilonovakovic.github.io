import { describe, expect, it, vi } from 'vitest';
import { setPauseOnPausableScenes } from './phaserGamePauseSync';

describe('setPauseOnPausableScenes', () => {
  it('applies pause only to active scenes that implement the pausable contract', () => {
    const setPaused = vi.fn();
    const game = {
      scene: {
        getScenes: vi.fn(() => [
          { scene: { key: 'ridge' }, setPaused },
          { scene: { key: 'decorative-overlay' } }
        ])
      }
    };

    setPauseOnPausableScenes(game as never, true);

    expect(game.scene.getScenes).toHaveBeenCalledWith(true);
    expect(setPaused).toHaveBeenCalledWith(true);
  });

  it('ignores a missing Phaser game during boot and teardown', () => {
    expect(() => setPauseOnPausableScenes(null, true)).not.toThrow();
  });
});
