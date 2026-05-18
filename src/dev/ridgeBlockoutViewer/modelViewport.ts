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

export function findViewerRoomForPoint(
  rooms: readonly RidgeViewerRoom[],
  point: { x: number; y: number }
): RidgeViewerRoom | undefined {
  return rooms.find((room) => isPointInsideRoom(room, point)) ??
    rooms.reduce<{ room: RidgeViewerRoom; distanceSquared: number } | undefined>((best, room) => {
      const distanceSquared = getDistanceSquaredToRoom(room, point);
      return !best || distanceSquared < best.distanceSquared
        ? { room, distanceSquared }
        : best;
    }, undefined)?.room;
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

function isPointInsideRoom(
  room: RidgeViewerRoom,
  point: { x: number; y: number }
): boolean {
  return (
    point.x >= room.x &&
    point.x <= room.x + room.width &&
    point.y >= room.y &&
    point.y <= room.y + room.height
  );
}

function getDistanceSquaredToRoom(
  room: RidgeViewerRoom,
  point: { x: number; y: number }
): number {
  const dx = point.x < room.x
    ? room.x - point.x
    : point.x > room.x + room.width
      ? point.x - (room.x + room.width)
      : 0;
  const dy = point.y < room.y
    ? room.y - point.y
    : point.y > room.y + room.height
      ? point.y - (room.y + room.height)
      : 0;
  return dx * dx + dy * dy;
}
