import type { CSSProperties } from 'react';
import type { PhaserScenePresentationMode } from '@/game/sharedSceneRuntime/phaserScenePresentation';

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
/** Wide shells drop the 600px card cap and grow with the screen up to this. */
const WIDE_MAX_GAME_HEIGHT = '960px';
const CARD_MAX_CONTENT_WIDTH = `${PHASER_DESIGN_WIDTH}px`;
const WIDE_MAX_CONTENT_WIDTH = '1600px';
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

/**
 * `card` is the centered notebook card every scene used to share. `wide` is
 * for side-view exploration (Ridge): the frame fills the content row instead.
 */
export type InteractiveGameShellSize = 'card' | 'wide';

interface InteractiveGameShellLayout {
  /** Max width of the shell's centre grid column (header, game, footer). */
  maxContentWidth: string;
  shellClassName: string;
  shellStyle: GameShellStyle;
  frameClassName: string;
  frameStyle: GameFrameStyle;
}

interface PresentationSizing {
  mobileMaxWidth: string;
  mobileWidthPerHeight: string;
  mobileAspect: string;
  desktopWidthPerHeight: string;
  desktopAspect: string;
  cardHeightCap: string;
}

const PRESENTATION_SIZING: Record<PhaserScenePresentationMode, PresentationSizing> = {
  'portrait-cover': {
    mobileMaxWidth: MOBILE_PORTRAIT_MAX_WIDTH,
    mobileWidthPerHeight: PORTRAIT_WIDTH_PER_HEIGHT,
    mobileAspect: MOBILE_PORTRAIT_ASPECT_RATIO,
    desktopWidthPerHeight: DESIGN_WIDTH_PER_HEIGHT,
    desktopAspect: DESIGN_ASPECT_RATIO,
    cardHeightCap: DESKTOP_MAX_GAME_HEIGHT
  },
  'full-board': {
    mobileMaxWidth: FULL_BOARD_MAX_WIDTH,
    mobileWidthPerHeight: DESIGN_WIDTH_PER_HEIGHT,
    mobileAspect: DESIGN_ASPECT_RATIO,
    desktopWidthPerHeight: DESIGN_WIDTH_PER_HEIGHT,
    desktopAspect: DESIGN_ASPECT_RATIO,
    cardHeightCap: DESKTOP_MAX_GAME_HEIGHT
  },
  'vertical-board': {
    mobileMaxWidth: VERTICAL_BOARD_MAX_WIDTH,
    mobileWidthPerHeight: PORTRAIT_WIDTH_PER_HEIGHT,
    mobileAspect: VERTICAL_BOARD_ASPECT_RATIO,
    desktopWidthPerHeight: PORTRAIT_WIDTH_PER_HEIGHT,
    desktopAspect: VERTICAL_BOARD_ASPECT_RATIO,
    cardHeightCap: VERTICAL_BOARD_DESKTOP_MAX_HEIGHT
  }
};

export function getInteractiveGameShellLayout(
  presentationMode: PhaserScenePresentationMode,
  contentRowHeight?: number,
  size: InteractiveGameShellSize = 'card'
): InteractiveGameShellLayout {
  const sizing = PRESENTATION_SIZING[presentationMode];
  const measuredRowHeight =
    contentRowHeight && contentRowHeight > 0 ? contentRowHeight : null;
  const desktopHeightCap = size === 'wide' ? WIDE_MAX_GAME_HEIGHT : sizing.cardHeightCap;
  // The measured row already excludes header/footer, so it keeps short
  // landscape screens from overflowing; 88dvh is the fallback before it lands.
  const desktopFrameMaxHeight = measuredRowHeight
    ? `min(${DESKTOP_VIEWPORT_HEIGHT_LIMIT}, ${desktopHeightCap}, ${formatPixels(measuredRowHeight)})`
    : `min(${DESKTOP_VIEWPORT_HEIGHT_LIMIT}, ${desktopHeightCap})`;
  const mobileHeightCappedWidth = measuredRowHeight
    ? `min(${sizing.mobileMaxWidth}, ${formatPixels(measuredRowHeight * Number(sizing.mobileWidthPerHeight))})`
    : sizing.mobileMaxWidth;

  return {
    maxContentWidth: size === 'wide' ? WIDE_MAX_CONTENT_WIDTH : CARD_MAX_CONTENT_WIDTH,
    shellClassName: 'w-full max-w-[var(--mobile-game-shell-height-capped-width)] md:w-[var(--desktop-game-shell-width)] md:max-w-none',
    shellStyle: {
      '--mobile-game-shell-max-width': sizing.mobileMaxWidth,
      '--mobile-game-shell-height-capped-width': mobileHeightCappedWidth,
      '--desktop-game-shell-width':
        `min(100%, calc(${desktopFrameMaxHeight} * ${sizing.desktopWidthPerHeight}))`
    },
    frameClassName: 'aspect-[var(--mobile-game-frame-aspect)] md:aspect-[var(--desktop-game-frame-aspect)] md:max-h-[var(--desktop-game-frame-max-height)]',
    frameStyle: {
      '--mobile-game-frame-aspect': sizing.mobileAspect,
      '--desktop-game-frame-aspect': sizing.desktopAspect,
      '--desktop-game-frame-max-height': desktopFrameMaxHeight
    }
  };
}

function formatPixels(value: number): string {
  return `${Number(value.toFixed(2))}px`;
}
