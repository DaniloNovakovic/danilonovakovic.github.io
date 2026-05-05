import { describe, expect, it } from 'vitest';
import { getInteractiveGameShellLayout } from './gameShellLayout';

describe('getInteractiveGameShellLayout', () => {
  it('uses portrait mobile sizing for side-view scenes', () => {
    const layout = getInteractiveGameShellLayout('portrait-cover');

    expect(layout.shellClassName).toContain('max-w-[var(--mobile-game-shell-height-capped-width)]');
    expect(layout.frameClassName).toContain('aspect-[var(--mobile-game-frame-aspect)]');
    expect(layout.shellStyle['--mobile-game-shell-max-width']).toBe('450px');
    expect(layout.shellStyle['--mobile-game-shell-height-capped-width']).toBe('450px');
    expect(layout.shellStyle['--mobile-game-shell-max-width']).not.toContain('7.75rem');
    expect(layout.shellStyle['--desktop-game-shell-width']).toContain('* 1.666667');
    expect(layout.frameStyle['--mobile-game-frame-aspect']).toBe('3 / 4');
  });

  it('caps portrait mobile width by measured content row height', () => {
    const layout = getInteractiveGameShellLayout('portrait-cover', 320);

    expect(layout.shellStyle['--mobile-game-shell-max-width']).toBe('450px');
    expect(layout.shellStyle['--mobile-game-shell-height-capped-width']).toBe('min(450px, 240px)');
    expect(layout.shellStyle['--mobile-game-shell-height-capped-width']).not.toContain('7.75rem');
  });

  it('uses landscape mobile sizing for full-board scenes', () => {
    const layout = getInteractiveGameShellLayout('full-board');

    expect(layout.shellStyle['--mobile-game-shell-max-width']).toBe('1000px');
    expect(layout.shellStyle['--mobile-game-shell-height-capped-width']).toBe('1000px');
    expect(layout.shellStyle['--mobile-game-shell-max-width']).not.toContain('7.75rem');
    expect(layout.frameStyle['--mobile-game-frame-aspect']).toBe('1000 / 600');
  });

  it('caps full-board mobile width by measured content row height', () => {
    const layout = getInteractiveGameShellLayout('full-board', 320);

    expect(layout.shellStyle['--mobile-game-shell-height-capped-width']).toBe('min(1000px, 533.33px)');
  });

  it('uses portrait sizing for vertical-board scenes', () => {
    const layout = getInteractiveGameShellLayout('vertical-board');

    expect(layout.shellStyle['--mobile-game-shell-max-width']).toBe('560px');
    expect(layout.shellStyle['--mobile-game-shell-height-capped-width']).toBe('560px');
    expect(layout.shellStyle['--mobile-game-shell-max-width']).not.toContain('7.75rem');
    expect(layout.shellStyle['--desktop-game-shell-width']).toBe(
      'min(100%, calc(min(88dvh, 680px) * 0.75))'
    );
    expect(layout.frameStyle['--mobile-game-frame-aspect']).toBe('3 / 4');
    expect(layout.frameStyle['--desktop-game-frame-aspect']).toBe('3 / 4');
    expect(layout.frameStyle['--desktop-game-frame-max-height']).toBe('min(88dvh, 680px)');
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
