import type { RidgeBlockoutViewerModel } from './model';
import type { Selection } from './types';

export function getSelectionDetails(
  model: RidgeBlockoutViewerModel,
  selection: Selection
): readonly [string, string][] | null {
  if (selection.type === 'room') {
    const room = model.rooms.find((candidate) => candidate.id === selection.id);
    return room
      ? [
        ['Type', 'room'],
        ['Id', room.id],
        ['Title', room.title],
        ['Theme', room.theme ?? 'none'],
        ['Mood', room.mood ?? 'none']
      ]
      : null;
  }

  if (selection.type === 'anchor') {
    const anchor = model.anchors.find((candidate) => candidate.id === selection.id);
    return anchor
      ? [
        ['Type', 'anchor'],
        ['Symbol', anchor.symbol],
        ['Kind', anchor.kind],
        ['Room', anchor.roomId],
        ['Id', anchor.attrId ?? 'none'],
        ['Target', anchor.targetRoomId ?? 'none'],
        ['Requires', anchor.requires ?? 'none'],
        ['Movement', anchor.movement ?? 'none']
      ]
      : null;
  }

  if (selection.type === 'shortcut') {
    const shortcut = model.shortcuts.find((candidate) => candidate.id === selection.id);
    return shortcut
      ? [
        ['Type', 'shortcut'],
        ['Id', shortcut.id],
        ['From', shortcut.fromRoomId],
        ['To', shortcut.toRoomId],
        ['Required', shortcut.requiredStampId ?? 'none'],
        ['Empty progress', shortcut.lockedAvailable ? 'available' : 'locked'],
        ['Stampede progress', shortcut.unlockedAvailable ? 'available' : 'locked']
      ]
      : null;
  }

  if (selection.type === 'collider') {
    const collider = model.colliders.find((candidate) => candidate.id === selection.id);
    return collider
      ? [
        ['Type', 'collider'],
        ['Id', collider.id],
        ['Kind', collider.kind],
        ['Room', collider.roomId ?? 'generated'],
        ['Movement', collider.movement ?? 'none']
      ]
      : null;
  }

  if (selection.type === 'rect') {
    const [roomId, rectId] = selection.id.split(':');
    const rect = model.rects.find((candidate) =>
      candidate.roomId === roomId && candidate.id === rectId
    );
    return rect
      ? [
        ['Type', 'rect'],
        ['Id', rect.id],
        ['Room', rect.roomId],
        ['Attrs', Object.entries(rect.attrs).map(([key, value]) => `${key}=${value}`).join(', ') || 'none']
      ]
      : null;
  }

  const routePool = selection.type === 'route' ? model.routes : model.futureRoutes;
  const link = routePool.flatMap((route) => route.links).find((candidate) =>
    candidate.id === selection.id
  );

  return link
    ? [
      ['Type', selection.type],
      ['Route', link.routeId],
      ['From', link.fromRoomId],
      ['To', link.toRoomId],
      ['Movement', link.movement ?? 'promise']
    ]
    : null;
}
