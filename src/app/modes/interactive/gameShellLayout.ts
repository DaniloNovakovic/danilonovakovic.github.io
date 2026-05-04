import type { CSSProperties } from 'react';
import type { PhaserScenePresentationMode } from '../../../runtime/phaserScenePresentation';

const PHASER_DESIGN_WIDTH = 1000;
const PHASER_DESIGN_HEIGHT = 600;
const MOBILE_PORTRAIT_ASPECT_RATIO = '3 / 4';
const MOBILE_PORTRAIT_MAX_WIDTH = '450px';
const VERTICAL_BOARD_MAX_WIDTH = '560px';
const VERTICAL_BOARD_ASPECT_RATIO = '3 / 4';
const FULL_BOARD_MAX_WIDTH = `${PHASER_DESIGN_WIDTH}px`;
const DESKTOP_MAX_GAME_HEIGHT = `${PHASER_DESIGN_HEIGHT}px`;
const VERTICAL_BOARD_DESKTOP_MAX_HEIGHT = '680px';
const DESKTOP_VIEWPORT_HEIGHT_LIMIT = '88dvh';
const DESIGN_ASPECT_RATIO = `${PHASER_DESIGN_WIDTH} / ${PHASER_DESIGN_HEIGHT}`;
const DESIGN_WIDTH_PER_HEIGHT = '1.666667';
const PORTRAIT_WIDTH_PER_HEIGHT = '0.75';

type GameShellStyle = CSSProperties & {
  '--mobile-game-shell-max-width': string;
  '--mobile-game-shell-height-capped-width': string;
  '--desktop-game-shell-width': string;
};

type GameFrameStyle = CSSProperties & {
  '--mobile-game-frame-aspect': string;
  '--desktop-game-frame-aspect': string;
  '--desktop-game-frame-max-height': string;
};

interface InteractiveGameShellLayout {
  shellClassName: string;
  shellStyle: GameShellStyle;
  frameClassName: string;
  frameStyle: GameFrameStyle;
}

export function getInteractiveGameShellLayout(
  presentationMode: PhaserScenePresentationMode,
  contentRowHeight?: number
): InteractiveGameShellLayout {
  const mobileMaxWidth =
    presentationMode === 'full-board'
      ? FULL_BOARD_MAX_WIDTH
      : presentationMode === 'vertical-board'
        ? VERTICAL_BOARD_MAX_WIDTH
        : MOBILE_PORTRAIT_MAX_WIDTH;
  const desktopWidthPerHeight =
    presentationMode === 'vertical-board' ? PORTRAIT_WIDTH_PER_HEIGHT : DESIGN_WIDTH_PER_HEIGHT;
  const mobileWidthPerHeight =
    presentationMode === 'full-board' ? DESIGN_WIDTH_PER_HEIGHT : PORTRAIT_WIDTH_PER_HEIGHT;
  const mobileAspect =
    presentationMode === 'full-board'
      ? DESIGN_ASPECT_RATIO
      : presentationMode === 'vertical-board'
        ? VERTICAL_BOARD_ASPECT_RATIO
        : MOBILE_PORTRAIT_ASPECT_RATIO;
  const desktopAspect =
    presentationMode === 'vertical-board' ? VERTICAL_BOARD_ASPECT_RATIO : DESIGN_ASPECT_RATIO;
  const desktopHeightLimit =
    presentationMode === 'vertical-board' ? VERTICAL_BOARD_DESKTOP_MAX_HEIGHT : DESKTOP_MAX_GAME_HEIGHT;
  const desktopFrameMaxHeight =
    presentationMode === 'vertical-board'
      ? `min(${DESKTOP_VIEWPORT_HEIGHT_LIMIT}, ${VERTICAL_BOARD_DESKTOP_MAX_HEIGHT})`
      : `min(${DESKTOP_VIEWPORT_HEIGHT_LIMIT}, ${DESKTOP_MAX_GAME_HEIGHT})`;

  return {
    shellClassName: 'w-full max-w-[var(--mobile-game-shell-height-capped-width)] md:w-[var(--desktop-game-shell-width)] md:max-w-none',
    shellStyle: {
      '--mobile-game-shell-max-width': mobileMaxWidth,
      '--mobile-game-shell-height-capped-width':
        contentRowHeight && contentRowHeight > 0
          ? `min(${mobileMaxWidth}, ${formatPixels(contentRowHeight * Number(mobileWidthPerHeight))})`
          : mobileMaxWidth,
      '--desktop-game-shell-width':
        `min(100%, calc(min(${DESKTOP_VIEWPORT_HEIGHT_LIMIT}, ${desktopHeightLimit}) * ${desktopWidthPerHeight}))`
    },
    frameClassName: 'aspect-[var(--mobile-game-frame-aspect)] md:aspect-[var(--desktop-game-frame-aspect)] md:max-h-[var(--desktop-game-frame-max-height)]',
    frameStyle: {
      '--mobile-game-frame-aspect': mobileAspect,
      '--desktop-game-frame-aspect': desktopAspect,
      '--desktop-game-frame-max-height': desktopFrameMaxHeight
    }
  };
}

function formatPixels(value: number): string {
  return `${Number(value.toFixed(2))}px`;
}
