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
