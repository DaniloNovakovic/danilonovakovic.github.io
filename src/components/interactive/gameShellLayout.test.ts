import { describe, expect, it } from 'vitest';
import { getInteractiveGameShellLayout } from './gameShellLayout';

describe('getInteractiveGameShellLayout', () => {
  it('uses portrait mobile sizing for side-view scenes', () => {
    const layout = getInteractiveGameShellLayout('portrait-cover');

    expect(layout.shellClassName).toContain('w-[var(--mobile-game-shell-width)]');
    expect(layout.frameClassName).toContain('aspect-[var(--mobile-game-frame-aspect)]');
    expect(layout.shellStyle['--mobile-game-shell-width']).toContain('450px');
    expect(layout.shellStyle['--mobile-game-shell-width']).toContain('7.75rem');
    expect(layout.shellStyle['--mobile-game-shell-width']).toContain('* 0.75');
    expect(layout.frameStyle['--mobile-game-frame-aspect']).toBe('3 / 4');
  });

  it('uses landscape mobile sizing for full-board scenes', () => {
    const layout = getInteractiveGameShellLayout('full-board');

    expect(layout.shellStyle['--mobile-game-shell-width']).toContain('1000px');
    expect(layout.shellStyle['--mobile-game-shell-width']).toContain('* 1.666667');
    expect(layout.frameStyle['--mobile-game-frame-aspect']).toBe('1000 / 600');
  });

  it('uses portrait sizing for vertical-board scenes', () => {
    const layout = getInteractiveGameShellLayout('vertical-board');

    expect(layout.shellStyle['--mobile-game-shell-width']).toContain('560px');
    expect(layout.shellStyle['--mobile-game-shell-width']).toContain('* 0.75');
    expect(layout.shellStyle['--desktop-game-shell-width']).toBe(
      'min(100%, calc(min(88dvh, 760px) * 0.75))'
    );
    expect(layout.frameStyle['--mobile-game-frame-aspect']).toBe('3 / 4');
    expect(layout.frameStyle['--desktop-game-frame-aspect']).toBe('3 / 4');
    expect(layout.frameStyle['--desktop-game-frame-max-height']).toBe('min(88dvh, 760px)');
  });

  it('keeps desktop sizing tied to the Phaser design resolution', () => {
    const layout = getInteractiveGameShellLayout('portrait-cover');

    expect(layout.shellStyle['--desktop-game-shell-width']).toBe(
      'min(100%, calc(min(88dvh, 600px) * 1.666667))'
    );
    expect(layout.frameStyle['--desktop-game-frame-aspect']).toBe('1000 / 600');
    expect(layout.frameStyle['--desktop-game-frame-max-height']).toBe('min(88dvh, 600px)');
  });
});
