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
    expect(layout.shellStyle['--desktop-game-shell-width']).toBe('min(100%, calc(min(88dvh, 680px) * 0.75))');
    expect(layout.frameStyle['--mobile-game-frame-aspect']).toBe('3 / 4');
    expect(layout.frameStyle['--desktop-game-frame-aspect']).toBe('3 / 4');
    expect(layout.frameStyle['--desktop-game-frame-max-height']).toBe('min(88dvh, 680px)');
  });

  it('keeps desktop sizing tied to the Phaser design resolution', () => {
    const layout = getInteractiveGameShellLayout('portrait-cover');

    // The card budgets its two 4px borders (16px) so the canvas inside shows at exactly 1000px:
    // any other size resamples every frame, and moving line art goes blurry.
    expect(layout.shellStyle['--desktop-game-shell-width']).toBe('min(100%, calc(min(88dvh, 616px) * 1.666667))');
    expect(layout.frameStyle['--desktop-game-frame-aspect']).toBe('1000 / 600');
    expect(layout.frameStyle['--desktop-game-frame-max-height']).toBe('min(88dvh, 616px)');
  });
});

describe('getInteractiveGameShellLayout sizing', () => {
  it('caps the desktop frame by the measured content row so short screens do not overflow', () => {
    const layout = getInteractiveGameShellLayout('portrait-cover', 326);

    expect(layout.frameStyle['--desktop-game-frame-max-height']).toBe('min(88dvh, 616px, 326px)');
    expect(layout.shellStyle['--desktop-game-shell-width']).toBe(
      'min(100%, calc(min(88dvh, 616px, 326px) * 1.666667))'
    );
  });

  it('keeps a card column that fits the 1000px canvas plus the frame borders', () => {
    expect(getInteractiveGameShellLayout('portrait-cover').maxContentWidth).toBe('1016px');
  });

  it('lets the wide shell grow past the 600px card cap', () => {
    const layout = getInteractiveGameShellLayout('portrait-cover', 950, 'wide');

    expect(layout.maxContentWidth).toBe('1600px');
    expect(layout.frameStyle['--desktop-game-frame-max-height']).toBe('min(88dvh, 960px, 950px)');
    expect(layout.frameStyle['--desktop-game-frame-aspect']).toBe('1000 / 600');
    expect(layout.frameStyle['--mobile-game-frame-aspect']).toBe('3 / 4');
  });

  it('fills the phone content row in focus, and matches wide from md up', () => {
    const focus = getInteractiveGameShellLayout('portrait-cover', 950, 'focus');
    const wide = getInteractiveGameShellLayout('portrait-cover', 950, 'wide');

    expect(focus.frameClassName).toContain('h-full');
    expect(focus.frameClassName).not.toContain('--mobile-game-frame-aspect');
    expect(focus.frameClassName).toContain('md:aspect-[var(--desktop-game-frame-aspect)]');
    expect(focus.shellClassName).toContain('md:w-[var(--desktop-game-shell-width)]');
    expect(focus.maxContentWidth).toBe(wide.maxContentWidth);
    expect(focus.frameStyle).toEqual(wide.frameStyle);
    expect(focus.shellStyle).toEqual(wide.shellStyle);
  });
});
