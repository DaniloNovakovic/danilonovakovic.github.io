import type { CSSProperties } from 'react';
import type { PhaserScenePresentationMode } from '../../runtime/phaserScenePresentation';

const PHASER_DESIGN_WIDTH = 1000;
const PHASER_DESIGN_HEIGHT = 600;
const MOBILE_CHROME_RESERVE_HEIGHT = '7.75rem';
const MOBILE_PORTRAIT_ASPECT_RATIO = '3 / 4';
const MOBILE_PORTRAIT_MAX_WIDTH = '450px';
const FULL_BOARD_MAX_WIDTH = `${PHASER_DESIGN_WIDTH}px`;
const DESKTOP_MAX_GAME_HEIGHT = `${PHASER_DESIGN_HEIGHT}px`;
const DESKTOP_VIEWPORT_HEIGHT_LIMIT = '88dvh';
const DESIGN_ASPECT_RATIO = `${PHASER_DESIGN_WIDTH} / ${PHASER_DESIGN_HEIGHT}`;
const DESIGN_WIDTH_PER_HEIGHT = formatRatio(PHASER_DESIGN_WIDTH / PHASER_DESIGN_HEIGHT);
const PORTRAIT_WIDTH_PER_HEIGHT = formatRatio(3 / 4);

type GameShellStyle = CSSProperties & {
  '--mobile-game-shell-width': string;
  '--desktop-game-shell-width': string;
};

type GameFrameStyle = CSSProperties & {
  '--mobile-game-frame-aspect': string;
  '--desktop-game-frame-aspect': string;
};

interface InteractiveGameShellLayout {
  shellClassName: string;
  shellStyle: GameShellStyle;
  frameClassName: string;
  frameStyle: GameFrameStyle;
}

export function getInteractiveGameShellLayout(
  presentationMode: PhaserScenePresentationMode
): InteractiveGameShellLayout {
  const mobileMaxWidth =
    presentationMode === 'full-board' ? FULL_BOARD_MAX_WIDTH : MOBILE_PORTRAIT_MAX_WIDTH;
  const mobileWidthPerHeight =
    presentationMode === 'full-board' ? DESIGN_WIDTH_PER_HEIGHT : PORTRAIT_WIDTH_PER_HEIGHT;
  const mobileAspect =
    presentationMode === 'full-board' ? DESIGN_ASPECT_RATIO : MOBILE_PORTRAIT_ASPECT_RATIO;

  return {
    shellClassName: 'w-[var(--mobile-game-shell-width)] md:w-[var(--desktop-game-shell-width)]',
    shellStyle: {
      '--mobile-game-shell-width':
        `min(100%, ${mobileMaxWidth}, calc((100dvh - ${MOBILE_CHROME_RESERVE_HEIGHT}) * ${mobileWidthPerHeight}))`,
      '--desktop-game-shell-width':
        `min(100%, calc(min(${DESKTOP_VIEWPORT_HEIGHT_LIMIT}, ${DESKTOP_MAX_GAME_HEIGHT}) * ${DESIGN_WIDTH_PER_HEIGHT}))`
    },
    frameClassName: 'aspect-[var(--mobile-game-frame-aspect)] md:aspect-[var(--desktop-game-frame-aspect)]',
    frameStyle: {
      '--mobile-game-frame-aspect': mobileAspect,
      '--desktop-game-frame-aspect': DESIGN_ASPECT_RATIO
    }
  };
}

function formatRatio(value: number): string {
  return Number(value.toFixed(6)).toString();
}
