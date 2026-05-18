import type {
  RidgeBlockoutViewerModel,
  RidgeViewerAnchor,
  RidgeViewerRoom
} from './model';

export type TeleportGroup = {
  room: RidgeViewerRoom;
  anchors: readonly RidgeViewerAnchor[];
};

export function getTeleportGroups(model: RidgeBlockoutViewerModel): readonly TeleportGroup[] {
  return model.rooms
    .map((room) => ({
      room,
      anchors: model.anchors
        .filter((anchor) => anchor.roomId === room.id)
        .sort(compareTeleportAnchors)
    }))
    .filter((group) => group.anchors.length > 0);
}

function compareTeleportAnchors(left: RidgeViewerAnchor, right: RidgeViewerAnchor): number {
  const priorityDelta = getTeleportAnchorPriority(left) - getTeleportAnchorPriority(right);
  if (priorityDelta !== 0) return priorityDelta;
  return getTeleportAnchorLabel(left).localeCompare(getTeleportAnchorLabel(right));
}

function getTeleportAnchorPriority(anchor: RidgeViewerAnchor): number {
  if (anchor.kind === 'player_spawn') return 0;
  if (anchor.kind === 'exit') return 1;
  if (anchor.attrId || anchor.label) return 2;
  return 3;
}

export function getTeleportAnchorLabel(anchor: RidgeViewerAnchor): string {
  return anchor.label ?? anchor.attrId ?? anchor.targetRoomId ?? anchor.kind;
}
