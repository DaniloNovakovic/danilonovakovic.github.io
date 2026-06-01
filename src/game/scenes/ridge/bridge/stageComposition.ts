import type { RidgeBridgeBeatState } from '@/game/bridge/store';
import { BRIDGE_TEXTURE_KEYS } from './assets';

export interface BridgeStagePoint {
  x: number;
  y: number;
}

export interface BridgeStageBounds extends BridgeStagePoint {
  width: number;
  height: number;
}

export interface BridgeRailPerspectiveCue {
  scale: number;
  depth: number;
  cameraFollowOffsetY: number;
}

export interface BridgeWalkRailPoint extends BridgeStagePoint {
  progress: number;
  cue: BridgeRailPerspectiveCue;
}

export interface BridgeWalkRail {
  id: 'primary';
  points: readonly BridgeWalkRailPoint[];
}

export type BridgeStageSpotId =
  | 'spawn'
  | 'cicka-play'
  | 'cicka-settled'
  | 'cicka-toy-car'
  | 'draftsperson'
  | 'blueprint'
  | 'bridge-left-bank'
  | 'bridge-center'
  | 'bridge-right-bank'
  | 'toy-car-test-start'
  | 'toy-car-test-end'
  | 'concert-exit'
  | 'handoff-note';

export interface BridgeStageSpot {
  id: BridgeStageSpotId;
  railProgress: number;
  offset?: BridgeStagePoint;
  promptOffset?: BridgeStagePoint;
  interactRadius?: number;
}

export interface ResolvedBridgeStageSpot extends BridgeStagePoint {
  id: BridgeStageSpotId;
  railProgress: number;
  railPoint: BridgeRailSample;
  prompt: BridgeStagePoint;
  interactRadius?: number;
}

export interface BridgeStagePlate {
  id: string;
  textureKey: string;
  x: number;
  y: number;
  depth: number;
  origin: readonly [number, number];
  scale: number;
  scrollFactor?: readonly [number, number];
}

export type BridgeStageObjectId =
  | 'bridge-draftsperson'
  | 'toy-car'
  | 'completed-bridge'
  | 'handoff-note';

export interface BridgeStageObject {
  id: BridgeStageObjectId;
  kind: 'image' | 'procedural-bridge' | 'text-note';
  textureKey?: string;
  spotId: BridgeStageSpotId;
  depth: number;
  scale?: number;
  origin?: readonly [number, number];
}

export interface BridgeStageOccluder {
  id: string;
  points: readonly BridgeStagePoint[];
  depth: number;
}

export interface BridgeStageCompositionSource {
  id: 'bridge';
  canvas: BridgeStageBounds;
  cameraBounds: BridgeStageBounds;
  primaryWalkRail: BridgeWalkRail;
  spots: readonly BridgeStageSpot[];
  plates: readonly BridgeStagePlate[];
  objects: readonly BridgeStageObject[];
  occluders: readonly BridgeStageOccluder[];
}

export interface BridgeRailSample extends BridgeStagePoint {
  progress: number;
  cue: BridgeRailPerspectiveCue;
}

export interface BridgeStagePresentationState {
  bridgeBeat: RidgeBridgeBeatState;
  crossingOpen: boolean;
  playerProgressRange: {
    min: number;
    max: number;
  };
  cickaSpotId: Extract<BridgeStageSpotId, 'cicka-play' | 'cicka-settled'>;
  toyCar:
    | {
        visible: true;
        spotId: Extract<BridgeStageSpotId, 'cicka-toy-car' | 'toy-car-test-end'>;
      }
    | {
        visible: false;
        spotId: Extract<BridgeStageSpotId, 'toy-car-test-start'>;
      };
  completedBridgeVisible: boolean;
  blockedBridgeVisible: boolean;
  handoffNoteVisible: boolean;
}

const BRIDGE_CANVAS = {
  x: 0,
  y: 0,
  width: 2600,
  height: 600
} as const;

export const BRIDGE_STAGE_SOURCE: BridgeStageCompositionSource = {
  id: 'bridge',
  canvas: BRIDGE_CANVAS,
  cameraBounds: {
    ...BRIDGE_CANVAS,
    width: 2320
  },
  primaryWalkRail: {
    id: 'primary',
    points: [
      {
        progress: 0,
        x: 140,
        y: 500,
        cue: { scale: 0.94, depth: 30, cameraFollowOffsetY: 0 }
      },
      {
        progress: 0.09,
        x: 320,
        y: 494,
        cue: { scale: 0.95, depth: 30, cameraFollowOffsetY: 0 }
      },
      {
        progress: 0.18,
        x: 520,
        y: 500,
        cue: { scale: 0.98, depth: 31, cameraFollowOffsetY: 2 }
      },
      {
        progress: 0.38,
        x: 1040,
        y: 492,
        cue: { scale: 0.96, depth: 30, cameraFollowOffsetY: -6 }
      },
      {
        progress: 0.48,
        x: 1275,
        y: 500,
        cue: { scale: 1, depth: 31, cameraFollowOffsetY: 0 }
      },
      {
        progress: 0.56,
        x: 1410,
        y: 500,
        cue: { scale: 1, depth: 31, cameraFollowOffsetY: 0 }
      },
      {
        progress: 0.67,
        x: 1638,
        y: 488,
        cue: { scale: 0.96, depth: 30, cameraFollowOffsetY: -12 }
      },
      {
        progress: 0.78,
        x: 1865,
        y: 500,
        cue: { scale: 1, depth: 31, cameraFollowOffsetY: 0 }
      },
      {
        progress: 0.88,
        x: 2050,
        y: 500,
        cue: { scale: 1, depth: 31, cameraFollowOffsetY: 0 }
      },
      {
        progress: 1,
        x: 2360,
        y: 500,
        cue: { scale: 0.98, depth: 30, cameraFollowOffsetY: 0 }
      }
    ]
  },
  spots: [
    { id: 'spawn', railProgress: 0 },
    {
      id: 'cicka-play',
      railProgress: 0.18,
      promptOffset: { x: 0, y: -116 },
      interactRadius: 86
    },
    { id: 'cicka-settled', railProgress: 0.88 },
    { id: 'cicka-toy-car', railProgress: 0.18, offset: { x: 72, y: -2 } },
    {
      id: 'draftsperson',
      railProgress: 0.48,
      promptOffset: { x: 260, y: -96 },
      interactRadius: 86
    },
    { id: 'blueprint', railProgress: 0.48, offset: { x: -130, y: -70 } },
    { id: 'bridge-left-bank', railProgress: 0.56 },
    { id: 'bridge-center', railProgress: 0.67 },
    { id: 'bridge-right-bank', railProgress: 0.78 },
    { id: 'toy-car-test-start', railProgress: 0.48, offset: { x: -152, y: -26 } },
    { id: 'toy-car-test-end', railProgress: 0.78, offset: { x: 120, y: -4 } },
    {
      id: 'concert-exit',
      railProgress: 1,
      promptOffset: { x: 0, y: -126 },
      interactRadius: 104
    },
    { id: 'handoff-note', railProgress: 1, offset: { x: 70, y: -130 } }
  ],
  plates: [
    {
      id: 'far-mountains-left',
      textureKey: BRIDGE_TEXTURE_KEYS.layeredFarMountains,
      x: -80,
      y: -12,
      depth: -82,
      origin: [0, 0],
      scale: 0.82,
      scrollFactor: [0.16, 1]
    },
    {
      id: 'far-mountains-right',
      textureKey: BRIDGE_TEXTURE_KEYS.layeredFarMountains,
      x: 1260,
      y: -12,
      depth: -82,
      origin: [0, 0],
      scale: 0.82,
      scrollFactor: [0.16, 1]
    },
    {
      id: 'close-stage',
      textureKey: BRIDGE_TEXTURE_KEYS.layeredCloseStage,
      x: 0,
      y: -207,
      depth: 3,
      origin: [0, 0],
      scale: 1.25
    }
  ],
  objects: [
    {
      id: 'bridge-draftsperson',
      kind: 'image',
      textureKey: BRIDGE_TEXTURE_KEYS.bridgeBuilder,
      spotId: 'draftsperson',
      depth: 24,
      scale: 0.76
    },
    {
      id: 'toy-car',
      kind: 'image',
      textureKey: BRIDGE_TEXTURE_KEYS.modularToyCar,
      spotId: 'cicka-toy-car',
      depth: 25,
      scale: 0.78
    },
    {
      id: 'completed-bridge',
      kind: 'procedural-bridge',
      spotId: 'bridge-center',
      depth: 10
    },
    {
      id: 'handoff-note',
      kind: 'text-note',
      spotId: 'handoff-note',
      depth: 24
    }
  ],
  occluders: [
    {
      id: 'near-bank-lip',
      depth: 32,
      points: [
        { x: 1320, y: 520 },
        { x: 1435, y: 506 },
        { x: 1888, y: 506 },
        { x: 2028, y: 522 }
      ]
    }
  ]
} as const;

export const BRIDGE_STAGE_DEFAULT_INTERACT_RADIUS = 86;

export function sampleBridgeWalkRail(
  rail: BridgeWalkRail,
  progress: number
): BridgeRailSample {
  const clampedProgress = clamp01(progress);
  const points = rail.points;
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) {
    throw new Error(`Walk Rail "${rail.id}" must define at least two points.`);
  }
  if (clampedProgress <= first.progress) {
    return toRailSample(first, clampedProgress);
  }
  if (clampedProgress >= last.progress) {
    return toRailSample(last, clampedProgress);
  }

  for (let index = 0; index < points.length - 1; index += 1) {
    const from = points[index];
    const to = points[index + 1];
    if (!from || !to) continue;
    if (clampedProgress < from.progress || clampedProgress > to.progress) continue;

    const span = to.progress - from.progress;
    const pct = span === 0 ? 0 : (clampedProgress - from.progress) / span;
    return {
      progress: clampedProgress,
      x: lerp(from.x, to.x, pct),
      y: lerp(from.y, to.y, pct),
      cue: {
        scale: lerp(from.cue.scale, to.cue.scale, pct),
        depth: lerp(from.cue.depth, to.cue.depth, pct),
        cameraFollowOffsetY: lerp(from.cue.cameraFollowOffsetY, to.cue.cameraFollowOffsetY, pct)
      }
    };
  }

  return toRailSample(last, clampedProgress);
}

export function resolveBridgeStageSpot(
  source: BridgeStageCompositionSource,
  spotId: BridgeStageSpotId
): ResolvedBridgeStageSpot {
  const spot = source.spots.find((candidate) => candidate.id === spotId);
  if (!spot) {
    throw new Error(`Unknown Bridge Stage Spot: ${spotId}`);
  }

  const railPoint = sampleBridgeWalkRail(source.primaryWalkRail, spot.railProgress);
  const x = railPoint.x + (spot.offset?.x ?? 0);
  const y = railPoint.y + (spot.offset?.y ?? 0);
  return {
    id: spot.id,
    railProgress: spot.railProgress,
    railPoint,
    x,
    y,
    prompt: {
      x: x + (spot.promptOffset?.x ?? 0),
      y: y + (spot.promptOffset?.y ?? 0)
    },
    interactRadius: spot.interactRadius
  };
}

export function resolveBridgeStageObject(
  source: BridgeStageCompositionSource,
  objectId: BridgeStageObjectId
): BridgeStageObject {
  const object = source.objects.find((candidate) => candidate.id === objectId);
  if (!object) {
    throw new Error(`Unknown Bridge Stage Object: ${objectId}`);
  }
  return object;
}

export function resolveBridgeStagePresentation(
  bridgeBeat: RidgeBridgeBeatState,
  source: BridgeStageCompositionSource = BRIDGE_STAGE_SOURCE
): BridgeStagePresentationState {
  const crossingOpen = isBridgeCrossingOpen(bridgeBeat);
  const bridgeLeftBank = resolveBridgeStageSpot(source, 'bridge-left-bank');

  return {
    bridgeBeat,
    crossingOpen,
    playerProgressRange: {
      min: 0,
      max: crossingOpen ? 1 : bridgeLeftBank.railProgress
    },
    cickaSpotId: crossingOpen ? 'cicka-settled' : 'cicka-play',
    toyCar: resolveToyCarPresentation(bridgeBeat),
    completedBridgeVisible: crossingOpen,
    blockedBridgeVisible: !crossingOpen,
    handoffNoteVisible: bridgeBeat === 'concert_handoff'
  };
}

export function isBridgeCrossingOpen(bridgeBeat: RidgeBridgeBeatState): boolean {
  return bridgeBeat === 'bridge_complete' || bridgeBeat === 'concert_handoff';
}

export function hasCickaSharedToyCar(bridgeBeat: RidgeBridgeBeatState): boolean {
  return (
    bridgeBeat === 'toy_car_shared' ||
    isBridgeCrossingOpen(bridgeBeat)
  );
}

export function projectPointToBridgeWalkRail(
  rail: BridgeWalkRail,
  point: BridgeStagePoint
): BridgeRailSample {
  const points = rail.points;
  const first = points[0];
  if (!first) {
    throw new Error(`Walk Rail "${rail.id}" must define at least two points.`);
  }

  let bestProgress = first.progress;
  let bestDistanceSq = Number.POSITIVE_INFINITY;

  for (let index = 0; index < points.length - 1; index += 1) {
    const from = points[index];
    const to = points[index + 1];
    if (!from || !to) continue;

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const lengthSq = dx * dx + dy * dy;
    const pct = lengthSq === 0
      ? 0
      : clamp01(((point.x - from.x) * dx + (point.y - from.y) * dy) / lengthSq);
    const x = lerp(from.x, to.x, pct);
    const y = lerp(from.y, to.y, pct);
    const distanceSq = (point.x - x) ** 2 + (point.y - y) ** 2;
    if (distanceSq < bestDistanceSq) {
      bestDistanceSq = distanceSq;
      bestProgress = lerp(from.progress, to.progress, pct);
    }
  }

  return sampleBridgeWalkRail(rail, bestProgress);
}

export function getBridgeWalkRailLength(rail: BridgeWalkRail): number {
  let length = 0;
  for (let index = 0; index < rail.points.length - 1; index += 1) {
    const from = rail.points[index];
    const to = rail.points[index + 1];
    if (!from || !to) continue;
    length += Math.hypot(to.x - from.x, to.y - from.y);
  }
  return length;
}

export function getNearestBridgeStageSpotId(
  source: BridgeStageCompositionSource,
  progress: number
): BridgeStageSpotId {
  let nearest = source.spots[0];
  let nearestDelta = Number.POSITIVE_INFINITY;

  source.spots.forEach((spot) => {
    const delta = Math.abs(spot.railProgress - progress);
    if (delta < nearestDelta) {
      nearest = spot;
      nearestDelta = delta;
    }
  });

  if (!nearest) {
    throw new Error(`Bridge Stage Source "${source.id}" must define at least one Stage Spot.`);
  }
  return nearest.id;
}

function resolveToyCarPresentation(
  bridgeBeat: RidgeBridgeBeatState
): BridgeStagePresentationState['toyCar'] {
  if (!hasCickaSharedToyCar(bridgeBeat)) {
    return {
      visible: true,
      spotId: 'cicka-toy-car'
    };
  }
  if (bridgeBeat === 'toy_car_shared') {
    return {
      visible: false,
      spotId: 'toy-car-test-start'
    };
  }
  return {
    visible: true,
    spotId: 'toy-car-test-end'
  };
}

function toRailSample(
  point: BridgeWalkRailPoint,
  progress: number
): BridgeRailSample {
  return {
    x: point.x,
    y: point.y,
    progress,
    cue: { ...point.cue }
  };
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function lerp(from: number, to: number, pct: number): number {
  return from + (to - from) * pct;
}
