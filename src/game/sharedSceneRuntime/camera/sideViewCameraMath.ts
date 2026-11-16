export interface SideViewCameraDesignSize {
  width: number;
  height: number;
}

export interface SideViewCameraViewportSize {
  width: number;
  height: number;
}

export function getHorizontalCoverCropPadding({
  viewport,
  designSize,
  zoom
}: {
  viewport: SideViewCameraViewportSize;
  designSize: SideViewCameraDesignSize;
  zoom: number;
}): number {
  if (
    !Number.isFinite(viewport.width) ||
    !Number.isFinite(viewport.height) ||
    !Number.isFinite(designSize.width) ||
    !Number.isFinite(designSize.height) ||
    !Number.isFinite(zoom) ||
    viewport.width <= 0 ||
    viewport.height <= 0 ||
    designSize.width <= 0 ||
    designSize.height <= 0 ||
    zoom <= 0
  ) {
    return 0;
  }

  const scale = Math.max(viewport.width / designSize.width, viewport.height / designSize.height);
  const renderedWidth = designSize.width * scale;
  const hiddenCssWidth = Math.max(0, renderedWidth - viewport.width) / 2;

  return hiddenCssWidth / scale / zoom;
}

export interface CoverVisibleRegion {
  /** Design (canvas) pixels actually on screen after the cover crop. */
  width: number;
  height: number;
  /** Design pixels per CSS pixel, for converting DOM chrome sizes. */
  canvasPerCss: number;
}

/**
 * The game canvas is scaled to cover its frame (Phaser ENVELOP) and centred,
 * so a portrait phone only shows a middle slice of it. Returns the size of
 * that on-screen slice in design pixels.
 */
export function getCoverVisibleRegion({
  viewport,
  designSize
}: {
  viewport: SideViewCameraViewportSize;
  designSize: SideViewCameraDesignSize;
}): CoverVisibleRegion {
  const valid =
    Number.isFinite(viewport.width) &&
    Number.isFinite(viewport.height) &&
    viewport.width > 0 &&
    viewport.height > 0 &&
    designSize.width > 0 &&
    designSize.height > 0;
  if (!valid) return { width: designSize.width, height: designSize.height, canvasPerCss: 1 };

  const scale = Math.max(viewport.width / designSize.width, viewport.height / designSize.height);
  return {
    width: Math.min(designSize.width, viewport.width / scale),
    height: Math.min(designSize.height, viewport.height / scale),
    canvasPerCss: 1 / scale
  };
}
