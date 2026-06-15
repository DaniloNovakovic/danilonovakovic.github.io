import {
  BRIDGE_STAGE_SOURCE,
  projectPointToBridgeWalkRail,
  resolveBridgeStageObject,
  resolveBridgeStageObjectPlacement,
  resolveBridgeStagePlateBounds,
  resolveBridgeStageSpot,
  sampleBridgeWalkRail,
  type BridgeStageCompositionSource,
  type BridgeStageObject,
  type BridgeStageObjectId,
  type BridgeStagePlate,
  type BridgeStagePoint,
  type BridgeStageSpot,
  type BridgeStageSpotId,
  type BridgeWalkRailPoint
} from './stageComposition';

export type StageAuthoringSelection =
  | { kind: 'rail-point'; index: number }
  | { kind: 'spot'; id: BridgeStageSpotId }
  | { kind: 'object'; id: BridgeStageObjectId }
  | { kind: 'plate'; id: string };

export const STAGE_AUTHORING_OFFSET_SLIDER_WINDOW_PX = 200;
export const STAGE_AUTHORING_OFFSET_LIMIT_PX = 500;

export function clampStageAuthoringOffset(value: number): number {
  return Math.min(
    STAGE_AUTHORING_OFFSET_LIMIT_PX,
    Math.max(-STAGE_AUTHORING_OFFSET_LIMIT_PX, Math.round(value))
  );
}
export const STAGE_AUTHORING_DRAG_THRESHOLD_PX = 5;
const STAGE_AUTHORING_CAMERA_FOCUS_MARGIN_PX = 48;
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

  if (bestSelection) return bestSelection;

  let plateSelection: StageAuthoringSelection | null = null;
  let bestPlateDepth = Number.NEGATIVE_INFINITY;

  source.plates.forEach((plate) => {
    const bounds = resolveBridgeStagePlateBounds(plate);
    if (
      worldX < bounds.left ||
      worldX > bounds.left + bounds.width ||
      worldY < bounds.top ||
      worldY > bounds.top + bounds.height
    ) {
      return;
    }
    if (plate.depth >= bestPlateDepth) {
      bestPlateDepth = plate.depth;
      plateSelection = { kind: 'plate', id: plate.id };
    }
  });

  return plateSelection;
}

export function serializeStageAuthoringSelection(
  selection: StageAuthoringSelection | null
): string | null {
  if (!selection) return null;
  switch (selection.kind) {
    case 'rail-point':
      return `rail-point:${selection.index}`;
    case 'spot':
      return `spot:${selection.id}`;
    case 'object':
      return `object:${selection.id}`;
    case 'plate':
      return `plate:${selection.id}`;
    default:
      return assertNever(selection);
  }
}

export function areStageAuthoringSelectionsEqual(
  left: StageAuthoringSelection | null | undefined,
  right: StageAuthoringSelection | null | undefined
): boolean {
  return serializeStageAuthoringSelection(left ?? null) ===
    serializeStageAuthoringSelection(right ?? null);
}

export type StageAuthoringPointerMode = 'idle' | 'pan' | 'drag-marker' | 'pending';

export interface StageAuthoringDragAnchor {
  worldX: number;
  worldY: number;
  targetX: number;
  targetY: number;
}

export interface ApplyStageAuthoringDragOptions {
  offsetOnly?: boolean;
  dragAnchor?: StageAuthoringDragAnchor;
}

export interface StageAuthoringPointerState {
  mode: StageAuthoringPointerMode;
  moved: boolean;
  offsetOnly: boolean;
  selection: StageAuthoringSelection | null;
  startScrollX: number;
  startScrollY: number;
  startX: number;
  startY: number;
  dragAnchor?: ApplyStageAuthoringDragOptions['dragAnchor'];
}

export type StageAuthoringPointerIntent =
  | { kind: 'pick'; selection: StageAuthoringSelection }
  | { kind: 'drag'; selection: StageAuthoringSelection; worldX: number; worldY: number; offsetOnly: boolean };

export function createIdleStageAuthoringPointerState(): StageAuthoringPointerState {
  return {
    mode: 'idle',
    moved: false,
    offsetOnly: false,
    selection: null,
    startScrollX: 0,
    startScrollY: 0,
    startX: 0,
    startY: 0
  };
}

export function beginStageAuthoringPointer(input: {
  hit: StageAuthoringSelection | null;
  offsetOnly: boolean;
  scrollX: number;
  scrollY: number;
  pointerX: number;
  pointerY: number;
}): StageAuthoringPointerState {
  return {
    mode: input.hit ? 'pending' : 'pan',
    moved: false,
    offsetOnly: input.offsetOnly,
    selection: input.hit,
    startScrollX: input.scrollX,
    startScrollY: input.scrollY,
    startX: input.pointerX,
    startY: input.pointerY
  };
}

export function advanceStageAuthoringPointer(
  state: StageAuthoringPointerState,
  input: {
    pointerX: number;
    pointerY: number;
    worldX: number;
    worldY: number;
    zoom: number;
    source?: BridgeStageCompositionSource;
  }
): {
  state: StageAuthoringPointerState;
  intents: StageAuthoringPointerIntent[];
  panScroll?: { scrollX: number; scrollY: number };
} {
  if (state.mode === 'idle') {
    return { state, intents: [] };
  }

  const distance = Math.hypot(input.pointerX - state.startX, input.pointerY - state.startY);
  let nextState = state;
  const intents: StageAuthoringPointerIntent[] = [];

  if (state.mode === 'pending' && distance >= STAGE_AUTHORING_DRAG_THRESHOLD_PX) {
    const plateDragAnchor = state.selection?.kind === 'plate' && input.source
      ? (() => {
          const selection = state.selection;
          if (!selection || selection.kind !== 'plate') return undefined;
          const plate = input.source.plates.find((candidate) => candidate.id === selection.id);
          if (!plate) return undefined;
          return {
            worldX: input.worldX,
            worldY: input.worldY,
            targetX: plate.x,
            targetY: plate.y
          } satisfies StageAuthoringDragAnchor;
        })()
      : undefined;
    nextState = {
      ...state,
      mode: 'drag-marker',
      dragAnchor: plateDragAnchor
    };
    if (nextState.selection) {
      intents.push({ kind: 'pick', selection: nextState.selection });
    }
  }

  if (nextState.mode === 'pan') {
    return {
      state: { ...nextState, moved: true },
      intents,
      panScroll: {
        scrollX: nextState.startScrollX - ((input.pointerX - nextState.startX) / input.zoom),
        scrollY: nextState.startScrollY - ((input.pointerY - nextState.startY) / input.zoom)
      }
    };
  }

  if (nextState.mode === 'drag-marker' && nextState.selection) {
    intents.push({
      kind: 'drag',
      selection: nextState.selection,
      worldX: input.worldX,
      worldY: input.worldY,
      offsetOnly: nextState.offsetOnly
    });
    return { state: { ...nextState, moved: true }, intents };
  }

  return { state: nextState, intents };
}

export function finishStageAuthoringPointer(
  state: StageAuthoringPointerState
): { state: StageAuthoringPointerState; intents: StageAuthoringPointerIntent[] } {
  const intents: StageAuthoringPointerIntent[] = [];
  if (state.mode === 'pending' && state.selection && !state.moved) {
    intents.push({ kind: 'pick', selection: state.selection });
  }
  return { state: createIdleStageAuthoringPointerState(), intents };
}

export function resolveStageAuthoringTargetPoint(
  source: BridgeStageCompositionSource,
  selection: StageAuthoringSelection
): BridgeStagePoint {
  switch (selection.kind) {
    case 'rail-point': {
      const point = source.primaryWalkRail.points[selection.index];
      if (!point) return { x: 0, y: 0 };
      return { x: point.x, y: point.y };
    }
    case 'spot':
      return resolveBridgeStageSpot(source, selection.id);
    case 'object':
      return resolveBridgeStageObjectPlacement(source, selection.id).contactPoint;
    case 'plate': {
      const plate = source.plates.find((candidate) => candidate.id === selection.id);
      if (!plate) return { x: 0, y: 0 };
      const bounds = resolveBridgeStagePlateBounds(plate);
      return { x: bounds.centerX, y: bounds.centerY };
    }
    default:
      return assertNever(selection);
  }
}

export function resolveStageAuthoringDragOrigin(
  source: BridgeStageCompositionSource,
  selection: StageAuthoringSelection
): BridgeStagePoint {
  if (selection.kind === 'plate') {
    const plate = source.plates.find((candidate) => candidate.id === selection.id);
    if (!plate) return { x: 0, y: 0 };
    return { x: plate.x, y: plate.y };
  }
  return resolveStageAuthoringTargetPoint(source, selection);
}

export function isWorldPointInsideCameraView(
  view: { x: number; y: number; right: number; bottom: number },
  point: BridgeStagePoint,
  margin: number = STAGE_AUTHORING_CAMERA_FOCUS_MARGIN_PX
): boolean {
  return point.x >= view.x + margin &&
    point.x <= view.right - margin &&
    point.y >= view.y + margin &&
    point.y <= view.bottom - margin;
}

export interface StageAuthoringField {
  field: string;
  inputMax: number;
  inputMin: number;
  label: string;
  max: number;
  min: number;
  step: number;
  value: number;
}

export interface StageAuthoringTargetOption {
  key: string;
  label: string;
  selection: StageAuthoringSelection;
}

export const STAGE_AUTHORING_SYNC_SECTIONS = [
  'primary-walk-rail-points',
  'spots',
  'plates',
  'objects'
] as const;

export type StageAuthoringSyncSection = typeof STAGE_AUTHORING_SYNC_SECTIONS[number];

export function applyStageAuthoringDrag(
  draft: BridgeStageCompositionSource,
  selection: StageAuthoringSelection,
  worldX: number,
  worldY: number,
  options: ApplyStageAuthoringDragOptions = {}
): BridgeStageCompositionSource {
  const next = cloneBridgeStageCompositionSource(draft);
  const roundedX = Math.round(worldX);
  const roundedY = Math.round(worldY);

  switch (selection.kind) {
    case 'rail-point': {
      const point = next.primaryWalkRail.points[selection.index];
      if (!point) return next;
      point.x = roundedX;
      point.y = roundedY;
      return next;
    }
    case 'spot': {
      const spot = next.spots.find((candidate) => candidate.id === selection.id);
      if (!spot) return next;
      if (options.offsetOnly) {
        const railPoint = sampleBridgeWalkRail(next.primaryWalkRail, spot.railProgress);
        spot.offset = {
          x: clampStageAuthoringOffset(roundedX - railPoint.x),
          y: clampStageAuthoringOffset(roundedY - railPoint.y)
        };
        return next;
      }
      const projected = projectPointToBridgeWalkRail(next.primaryWalkRail, {
        x: roundedX,
        y: roundedY
      });
      spot.railProgress = projected.progress;
      spot.offset = {
        x: clampStageAuthoringOffset(roundedX - projected.x),
        y: clampStageAuthoringOffset(roundedY - projected.y)
      };
      return next;
    }
    case 'object': {
      const object = next.objects.find((candidate) => candidate.id === selection.id);
      if (!object) return next;
      const spot = resolveBridgeStageSpot(next, object.spotId);
      const anchorX = object.depthAnchorOffset?.x ?? 0;
      const anchorY = object.depthAnchorOffset?.y ?? 0;
      object.offset = {
        x: clampStageAuthoringOffset(roundedX - spot.x - anchorX),
        y: clampStageAuthoringOffset(roundedY - spot.y - anchorY)
      };
      return next;
    }
    case 'plate': {
      const plate = next.plates.find((candidate) => candidate.id === selection.id);
      if (!plate) return next;
      if (options.dragAnchor) {
        plate.x = Math.round(
          options.dragAnchor.targetX + (worldX - options.dragAnchor.worldX)
        );
        plate.y = Math.round(
          options.dragAnchor.targetY + (worldY - options.dragAnchor.worldY)
        );
        return next;
      }
      plate.x = roundedX;
      plate.y = roundedY;
      return next;
    }
    default:
      return assertNever(selection);
  }
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
    case 'plate': {
      const plate = source.plates.find((candidate) => candidate.id === selection.id);
      if (!plate) return '';
      return formatPlateSnippet(plate);
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
    case 'plate': {
      const plate = committed.plates.find((candidate) => candidate.id === selection.id);
      if (!plate) return next;
      next.plates = next.plates.map((candidate) => (
        candidate.id === selection.id ? clonePlate(plate) : candidate
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
          [axis]: clampStageAuthoringOffset(value)
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
          [axis]: clampStageAuthoringOffset(value)
        };
      }
      return next;
    }
    case 'plate': {
      const plate = next.plates.find((candidate) => candidate.id === selection.id);
      if (!plate) return next;
      if (field === 'x' || field === 'y') {
        plate[field] = Math.round(value);
        return next;
      }
      if (field === 'scale') {
        plate.scale = clampPlateScale(value);
        return next;
      }
      if (field === 'scrollFactor.x' || field === 'scrollFactor.y') {
        const axis = field === 'scrollFactor.x' ? 0 : 1;
        const current = plate.scrollFactor ?? [1, 1];
        plate.scrollFactor = axis === 0
          ? [clampScrollFactor(value), current[1] ?? 1]
          : [current[0] ?? 1, clampScrollFactor(value)];
      }
      return next;
    }
    default:
      return assertNever(selection);
  }
}

export function listStageAuthoringTargetOptions(
  source: BridgeStageCompositionSource
): StageAuthoringTargetOption[] {
  const plates = source.plates.map((plate) => {
    const selection = { kind: 'plate', id: plate.id } as const;
    return {
      key: serializeStageAuthoringSelection(selection) ?? `plate:${plate.id}`,
      label: `Plate ${plate.id}`,
      selection
    };
  });
  const railPoints = source.primaryWalkRail.points.map((point, index) => {
    const selection = { kind: 'rail-point', index } as const;
    return {
      key: serializeStageAuthoringSelection(selection) ?? `rail-point:${index}`,
      label: `Rail point ${index} @ ${Math.round(point.x)}, ${Math.round(point.y)}`,
      selection
    };
  });
  const spots = source.spots.map((spot) => {
    const selection = { kind: 'spot', id: spot.id } as const;
    return {
      key: serializeStageAuthoringSelection(selection) ?? `spot:${spot.id}`,
      label: `Spot ${spot.id}`,
      selection
    };
  });
  const objects = source.objects.map((object) => {
    const selection = { kind: 'object', id: object.id } as const;
    return {
      key: serializeStageAuthoringSelection(selection) ?? `object:${object.id}`,
      label: `Object ${object.id}`,
      selection
    };
  });

  return [...plates, ...railPoints, ...spots, ...objects];
}

export function listStageAuthoringFields(
  source: BridgeStageCompositionSource,
  selection: StageAuthoringSelection
): StageAuthoringField[] {
  switch (selection.kind) {
    case 'rail-point': {
      const point = source.primaryWalkRail.points[selection.index];
      if (!point) return [];
      return [
        createWorldAxisField('x', Math.round(point.x), source.canvas.x, source.canvas.width),
        createWorldAxisField('y', Math.round(point.y), source.canvas.y, source.canvas.height)
      ];
    }
    case 'spot': {
      const spot = source.spots.find((candidate) => candidate.id === selection.id);
      if (!spot) return [];
      return [
        {
          field: 'railProgress',
          label: 'railProgress',
          inputMin: 0,
          inputMax: 1,
          min: 0,
          max: 1,
          step: 0.001,
          value: spot.railProgress
        },
        createOffsetField('offset.x', spot.offset?.x ?? 0),
        createOffsetField('offset.y', spot.offset?.y ?? 0)
      ];
    }
    case 'object': {
      const object = resolveBridgeStageObject(source, selection.id);
      return [
        createOffsetField('offset.x', object.offset?.x ?? 0),
        createOffsetField('offset.y', object.offset?.y ?? 0)
      ];
    }
    case 'plate': {
      const plate = source.plates.find((candidate) => candidate.id === selection.id);
      if (!plate) return [];
      return [
        createWorldAxisField('x', Math.round(plate.x), source.canvas.x, source.canvas.width),
        createWorldAxisField('y', Math.round(plate.y), source.canvas.y, source.canvas.height),
        {
          field: 'scale',
          label: 'scale',
          inputMin: 0.25,
          inputMax: 3,
          min: 0.25,
          max: 3,
          step: 0.01,
          value: plate.scale
        },
        {
          field: 'scrollFactor.x',
          label: 'scrollFactor.x',
          inputMin: 0,
          inputMax: 1,
          min: 0,
          max: 1,
          step: 0.001,
          value: plate.scrollFactor?.[0] ?? 1
        },
        {
          field: 'scrollFactor.y',
          label: 'scrollFactor.y',
          inputMin: 0,
          inputMax: 1,
          min: 0,
          max: 1,
          step: 0.001,
          value: plate.scrollFactor?.[1] ?? 1
        }
      ];
    }
    default:
      return assertNever(selection);
  }
}

export function formatStageAuthoringSelectionLabel(selection: StageAuthoringSelection): string {
  switch (selection.kind) {
    case 'rail-point':
      return `Walk Rail point ${selection.index}`;
    case 'spot':
      return `Stage Spot ${selection.id}`;
    case 'object':
      return `Stage Object ${selection.id}`;
    case 'plate':
      return `Stage Plate ${selection.id}`;
    default:
      return assertNever(selection);
  }
}

export function serializeBridgeStageAuthoringSections(
  source: BridgeStageCompositionSource
): Record<StageAuthoringSyncSection, string> {
  const formatArrayEntries = (
    items: readonly string[],
    indentSpaces: number,
    trailingComma: boolean
  ): string => items.map((item, index) => {
    const suffix = trailingComma && index < items.length - 1 ? ',' : '';
    return `${indentMultiline(item, indentSpaces)}${suffix}`;
  }).join('\n');

  return {
    'primary-walk-rail-points': [
      '    points: [',
      formatArrayEntries(
        source.primaryWalkRail.points.map((point) => formatRailPointSnippet(point)),
        6,
        true
      ),
      '    ]'
    ].join('\n'),
    spots: [
      '  spots: [',
      formatArrayEntries(source.spots.map((spot) => formatSpotSnippet(spot)), 4, true),
      '  ],'
    ].join('\n'),
    plates: formatArrayEntries(source.plates.map((plate) => formatPlateSnippet(plate)), 4, true),
    objects: [
      '  objects: [',
      formatArrayEntries(source.objects.map((object) => formatObjectSnippet(object)), 4, true),
      '  ],'
    ].join('\n')
  };
}

export function stageAuthoringSyncMarker(id: StageAuthoringSyncSection, closing = false): string {
  return closing
    ? `/* </stage-authoring-sync:${id}> */`
    : `/* <stage-authoring-sync:${id}> */`;
}

function createWorldAxisField(
  label: 'x' | 'y',
  value: number,
  origin: number,
  span: number
): StageAuthoringField {
  return {
    field: label,
    label,
    inputMin: origin,
    inputMax: origin + span,
    min: origin,
    max: origin + span,
    step: 1,
    value
  };
}

function createOffsetField(field: 'offset.x' | 'offset.y', rawValue: number): StageAuthoringField {
  const value = clampStageAuthoringOffset(rawValue);
  const halfWindow = STAGE_AUTHORING_OFFSET_SLIDER_WINDOW_PX;
  return {
    field,
    label: field,
    inputMin: -STAGE_AUTHORING_OFFSET_LIMIT_PX,
    inputMax: STAGE_AUTHORING_OFFSET_LIMIT_PX,
    min: -halfWindow,
    max: halfWindow,
    step: 1,
    value
  };
}

function indentMultiline(value: string, spaces: number): string {
  const pad = ' '.repeat(spaces);
  return value.split('\n').map((line) => `${pad}${line}`).join('\n');
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

function formatPlateSnippet(plate: BridgeStagePlate): string {
  const lines = [
    '{',
    `  id: '${plate.id}',`,
    `  textureKey: '${plate.textureKey}',`,
    `  x: ${Math.round(plate.x)},`,
    `  y: ${Math.round(plate.y)},`,
    `  depth: ${Math.round(plate.depth)},`,
    `  origin: [${plate.origin[0]}, ${plate.origin[1]}],`,
    `  scale: ${formatNumber(plate.scale)},`
  ];

  if (plate.scrollFactor) {
    lines.push(`  scrollFactor: [${formatNumber(plate.scrollFactor[0])}, ${formatNumber(plate.scrollFactor[1])}],`);
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

function clonePlate(plate: BridgeStagePlate): BridgeStagePlate {
  return {
    ...plate,
    origin: [...plate.origin] as [number, number],
    scrollFactor: plate.scrollFactor ? [...plate.scrollFactor] as [number, number] : undefined
  };
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(3);
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function clampPlateScale(value: number): number {
  return Math.min(3, Math.max(0.25, Math.round(value * 100) / 100));
}

function clampScrollFactor(value: number): number {
  return Math.min(1, Math.max(0, Math.round(value * 1000) / 1000));
}

function assertNever(value: never): never {
  throw new Error(`Unhandled stage authoring value: ${JSON.stringify(value)}`);
}
