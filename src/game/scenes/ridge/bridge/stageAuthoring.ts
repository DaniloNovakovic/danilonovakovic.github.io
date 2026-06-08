import {
  BRIDGE_STAGE_SOURCE,
  resolveBridgeStageObjectPlacement,
  resolveBridgeStageSpot,
  type BridgeStageCompositionSource,
  type BridgeStageObject,
  type BridgeStageObjectId,
  type BridgeStageSpot,
  type BridgeStageSpotId,
  type BridgeWalkRailPoint
} from './stageComposition';

export type StageAuthoringSelection =
  | { kind: 'rail-point'; index: number }
  | { kind: 'spot'; id: BridgeStageSpotId }
  | { kind: 'object'; id: BridgeStageObjectId };

export const STAGE_AUTHORING_OFFSET_SLIDER_WINDOW_PX = 200;
const RAIL_POINT_PICK_RADIUS_PX = 14;
const SPOT_PICK_RADIUS_PX = 12;
const OBJECT_PICK_HALF_SIZE_PX = 8;

export function cloneBridgeStageCompositionSource(
  source: BridgeStageCompositionSource = BRIDGE_STAGE_SOURCE
): BridgeStageCompositionSource {
  return structuredClone(source) as BridgeStageCompositionSource;
}

export function hitTestStageAuthoringTargets(
  source: BridgeStageCompositionSource,
  worldX: number,
  worldY: number
): StageAuthoringSelection | null {
  let bestSelection: StageAuthoringSelection | null = null;
  let bestDistanceSquared = Number.POSITIVE_INFINITY;

  const consider = (
    selection: StageAuthoringSelection,
    targetX: number,
    targetY: number,
    radius: number
  ): void => {
    const dx = worldX - targetX;
    const dy = worldY - targetY;
    const distanceSquared = (dx * dx) + (dy * dy);
    if (distanceSquared > radius * radius) return;
    if (distanceSquared < bestDistanceSquared) {
      bestDistanceSquared = distanceSquared;
      bestSelection = selection;
    }
  };

  source.objects.forEach((object) => {
    const placement = resolveBridgeStageObjectPlacement(source, object.id);
    consider(
      { kind: 'object', id: object.id },
      placement.contactPoint.x,
      placement.contactPoint.y,
      OBJECT_PICK_HALF_SIZE_PX
    );
  });

  source.spots.forEach((spot) => {
    const resolved = resolveBridgeStageSpot(source, spot.id);
    consider({ kind: 'spot', id: spot.id }, resolved.x, resolved.y, SPOT_PICK_RADIUS_PX);
  });

  source.primaryWalkRail.points.forEach((point, index) => {
    consider({ kind: 'rail-point', index }, point.x, point.y, RAIL_POINT_PICK_RADIUS_PX);
  });

  return bestSelection;
}

export function formatStageAuthoringSnippet(
  source: BridgeStageCompositionSource,
  selection: StageAuthoringSelection
): string {
  switch (selection.kind) {
    case 'rail-point': {
      const point = source.primaryWalkRail.points[selection.index];
      if (!point) return '';
      return formatRailPointSnippet(point);
    }
    case 'spot': {
      const spot = source.spots.find((candidate) => candidate.id === selection.id);
      if (!spot) return '';
      return formatSpotSnippet(spot);
    }
    case 'object': {
      const object = source.objects.find((candidate) => candidate.id === selection.id);
      if (!object) return '';
      return formatObjectSnippet(object);
    }
    default:
      return assertNever(selection);
  }
}

export function resetStageAuthoringSelection(
  committed: BridgeStageCompositionSource,
  draft: BridgeStageCompositionSource,
  selection: StageAuthoringSelection
): BridgeStageCompositionSource {
  const next = cloneBridgeStageCompositionSource(draft);

  switch (selection.kind) {
    case 'rail-point': {
      const point = committed.primaryWalkRail.points[selection.index];
      if (!point) return next;
      next.primaryWalkRail.points = next.primaryWalkRail.points.map((candidate, index) => (
        index === selection.index ? cloneRailPoint(point) : candidate
      ));
      return next;
    }
    case 'spot': {
      const spot = committed.spots.find((candidate) => candidate.id === selection.id);
      if (!spot) return next;
      next.spots = next.spots.map((candidate) => (
        candidate.id === selection.id ? cloneSpot(spot) : candidate
      ));
      return next;
    }
    case 'object': {
      const object = committed.objects.find((candidate) => candidate.id === selection.id);
      if (!object) return next;
      next.objects = next.objects.map((candidate) => (
        candidate.id === selection.id ? cloneObject(object) : candidate
      ));
      return next;
    }
    default:
      return assertNever(selection);
  }
}

export function updateStageAuthoringDraft(
  draft: BridgeStageCompositionSource,
  selection: StageAuthoringSelection,
  field: string,
  value: number
): BridgeStageCompositionSource {
  const next = cloneBridgeStageCompositionSource(draft);

  switch (selection.kind) {
    case 'rail-point': {
      const point = next.primaryWalkRail.points[selection.index];
      if (!point) return next;
      if (field === 'x' || field === 'y') {
        point[field] = value;
      }
      return next;
    }
    case 'spot': {
      const spot = next.spots.find((candidate) => candidate.id === selection.id);
      if (!spot) return next;
      if (field === 'railProgress') {
        spot.railProgress = clamp01(value);
        return next;
      }
      if (field === 'offset.x' || field === 'offset.y') {
        const axis = field === 'offset.x' ? 'x' : 'y';
        spot.offset = {
          x: spot.offset?.x ?? 0,
          y: spot.offset?.y ?? 0,
          [axis]: value
        };
        return next;
      }
      return next;
    }
    case 'object': {
      const object = next.objects.find((candidate) => candidate.id === selection.id);
      if (!object) return next;
      if (field === 'offset.x' || field === 'offset.y') {
        const axis = field === 'offset.x' ? 'x' : 'y';
        object.offset = {
          x: object.offset?.x ?? 0,
          y: object.offset?.y ?? 0,
          [axis]: value
        };
      }
      return next;
    }
    default:
      return assertNever(selection);
  }
}

function formatRailPointSnippet(point: BridgeWalkRailPoint): string {
  return [
    '{',
    `  progress: ${formatNumber(point.progress)},`,
    `  x: ${Math.round(point.x)},`,
    `  y: ${Math.round(point.y)},`,
    '  cue: {',
    `    scale: ${formatNumber(point.cue.scale)},`,
    `    depth: ${Math.round(point.cue.depth)},`,
    `    cameraFollowOffsetY: ${Math.round(point.cue.cameraFollowOffsetY)}`,
    '  }',
    '}'
  ].join('\n');
}

function formatSpotSnippet(spot: BridgeStageSpot): string {
  const lines = [
    '{',
    `  id: '${spot.id}',`,
    `  railProgress: ${formatNumber(spot.railProgress)}`
  ];

  if (spot.offset) {
    lines.push(`  offset: { x: ${Math.round(spot.offset.x)}, y: ${Math.round(spot.offset.y)} },`);
  }
  if (spot.promptOffset) {
    lines.push(
      `  promptOffset: { x: ${Math.round(spot.promptOffset.x)}, y: ${Math.round(spot.promptOffset.y)} },`
    );
  }
  if (spot.interactRadius !== undefined) {
    lines.push(`  interactRadius: ${Math.round(spot.interactRadius)},`);
  }

  lines.push('}');
  return lines.join('\n');
}

function formatObjectSnippet(object: BridgeStageObject): string {
  const lines = ['{', `  id: '${object.id}',`, `  kind: '${object.kind}',`];

  if (object.kind === 'image') {
    lines.push(`  textureKey: '${object.textureKey}',`);
  }
  if (object.kind === 'procedural-bridge') {
    lines.push(`  leftSpotId: '${object.leftSpotId}',`);
    lines.push(`  rightSpotId: '${object.rightSpotId}',`);
    lines.push(`  deckInset: ${Math.round(object.deckInset)},`);
  }

  lines.push(`  spotId: '${object.spotId}',`);

  if (object.offset) {
    lines.push(`  offset: { x: ${Math.round(object.offset.x)}, y: ${Math.round(object.offset.y)} },`);
  }
  if (object.scale !== undefined) {
    lines.push(`  scale: ${formatNumber(object.scale)},`);
  }
  if (object.depthAnchorOffset) {
    lines.push(
      `  depthAnchorOffset: { x: ${Math.round(object.depthAnchorOffset.x)}, y: ${Math.round(object.depthAnchorOffset.y)} },`
    );
  }
  if (object.origin) {
    lines.push(`  origin: [${object.origin[0]}, ${object.origin[1]}],`);
  }
  if ('depthMode' in object && object.depthMode === 'fixed') {
    lines.push(`  depthMode: 'fixed',`);
    lines.push(`  depth: ${Math.round(object.depth)},`);
  } else if ('depthMode' in object && object.depthMode === 'rail-relative') {
    lines.push(`  depthMode: 'rail-relative',`);
    if (object.depthOffset !== undefined) {
      lines.push(`  depthOffset: ${Math.round(object.depthOffset)},`);
    }
  } else if ('depthOffset' in object && object.depthOffset !== undefined) {
    lines.push(`  depthOffset: ${Math.round(object.depthOffset)},`);
  }

  lines.push('}');
  return lines.join('\n');
}

function cloneRailPoint(point: BridgeWalkRailPoint): BridgeWalkRailPoint {
  return {
    progress: point.progress,
    x: point.x,
    y: point.y,
    cue: { ...point.cue }
  };
}

function cloneSpot(spot: BridgeStageSpot): BridgeStageSpot {
  return {
    ...spot,
    offset: spot.offset ? { ...spot.offset } : undefined,
    promptOffset: spot.promptOffset ? { ...spot.promptOffset } : undefined
  };
}

function cloneObject(object: BridgeStageObject): BridgeStageObject {
  return {
    ...object,
    offset: object.offset ? { ...object.offset } : undefined,
    depthAnchorOffset: object.depthAnchorOffset ? { ...object.depthAnchorOffset } : undefined,
    origin: object.origin ? [...object.origin] as [number, number] : undefined
  } as BridgeStageObject;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(3);
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function assertNever(value: never): never {
  throw new Error(`Unhandled stage authoring value: ${JSON.stringify(value)}`);
}
