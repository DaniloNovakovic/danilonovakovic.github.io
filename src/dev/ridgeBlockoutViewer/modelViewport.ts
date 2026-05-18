import type { RidgeViewerRoom } from './model';
import type { ModelViewport } from './types';

export function clampModelZoom(value: number): number {
  return Math.min(1.2, Math.max(0.05, roundForTransform(value)));
}

export function clampPreviewZoom(value: number): number {
  return Math.min(1.6, Math.max(0.65, roundForTransform(value)));
}

export function roundForTransform(value: number): number {
  return Math.round(value * 100) / 100;
}

export function getWorldTransform(view: ModelViewport): string {
  return `translate(${view.panX} ${view.panY}) scale(${view.zoom})`;
}

export function fitRoomToViewport({
  padding = 180,
  room,
  viewportHeight,
  viewportWidth
}: {
  padding?: number;
  room: RidgeViewerRoom;
  viewportHeight: number;
  viewportWidth: number;
}): ModelViewport {
  const zoom = clampModelZoom(
    Math.min(
      viewportWidth / (room.width + padding),
      viewportHeight / (room.height + padding)
    )
  );

  return {
    zoom,
    panX: roundForTransform(viewportWidth / 2 - (room.x + room.width / 2) * zoom),
    panY: roundForTransform(viewportHeight / 2 - (room.y + room.height / 2) * zoom)
  };
}
