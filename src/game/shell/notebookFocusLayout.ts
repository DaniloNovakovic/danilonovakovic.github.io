import { useEffect, useState, type CSSProperties } from 'react';

const NOTEBOOK_STAGE_MAX_WIDTH = 1180;
export const NOTEBOOK_CONTROL_MAT_TOP_OFFSET_PX = 64;

export interface NotebookFocusFrameLayout {
  aspect: string;
  centerY: number;
  relativeCenterY: number;
  style: CSSProperties;
  width: number;
}

export function useNotebookFocusPageFrameLayout(aspect: number): NotebookFocusFrameLayout {
  const [viewport, setViewport] = useState(readViewportSize);

  useEffect(() => {
    const updateViewport = () => setViewport(readViewportSize());
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  const isShort = viewport.height <= 420;
  const isDesktopLike = viewport.width >= 768 && !isShort;
  const isTabletLike = viewport.width >= 640 && !isShort;
  const shellWidth = Math.min(viewport.width - 16, NOTEBOOK_STAGE_MAX_WIDTH);
  const horizontalReserve = isShort ? 128 : isDesktopLike ? 144 : isTabletLike ? 80 : 48;
  const headerBottom = isShort ? 56 : isDesktopLike ? 128 : 120;
  const footerTop = isShort ? viewport.height - 32 : viewport.height - 88;
  const maxWidth = Math.max(220, shellWidth - horizontalReserve);
  const maxHeight = Math.max(180, footerTop - headerBottom);
  const width = Math.floor(Math.min(maxWidth, maxHeight * aspect));
  const height = width / aspect;
  const safeCenterY = (headerBottom + footerTop) / 2;
  const halfHeight = height / 2;
  const minCenterY = headerBottom + halfHeight;
  const maxCenterY = footerTop - halfHeight;
  const centerY = Math.round(
    minCenterY <= maxCenterY
      ? clamp(safeCenterY, minCenterY, maxCenterY)
      : Math.max(safeCenterY, minCenterY)
  );
  const relativeCenterY = centerY - NOTEBOOK_CONTROL_MAT_TOP_OFFSET_PX;

  return {
    aspect: String(aspect),
    centerY,
    relativeCenterY,
    style: {
      aspectRatio: `${aspect} / 1`,
      top: relativeCenterY,
      width
    },
    width
  };
}

function readViewportSize() {
  return {
    width: typeof window === 'undefined' ? 1024 : window.innerWidth,
    height: typeof window === 'undefined' ? 768 : window.innerHeight
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
