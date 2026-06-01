import type { RidgeBridgeBeatState } from '@/game/bridge/store';
import { BRIDGE_TEXTURE_KEYS } from './assets';

/**
 * Bridge Stage Source coordinates are plain Phaser world pixels.
 *
 * `x` grows left-to-right and `y` grows top-to-bottom. Lower `y` values are
 * visually farther back/up the screen; higher `y` values are closer to the
 * foreground.
 */
export interface BridgeStagePoint {
  x: number;
  y: number;
}

/**
 * Rectangular authoring bounds in Bridge Stage Source space.
 *
 * For a longer or shorter Bridge scene, change these bounds together with the
 * rail end point and any far-right Stage Spots. `cameraBounds.width` can be
 * smaller than `canvas.width` when the camera should stop before the full
 * authoring canvas ends.
 */
export interface BridgeStageBounds extends BridgeStagePoint {
  width: number;
  height: number;
}

/**
 * Pseudo-3D rendering hint sampled from the Walk Rail.
 *
 * These values do not move the player along the path. They only adjust how the
 * player is presented at that rail position.
 */
export interface BridgeRailPerspectiveCue {
  /** Player sprite scale at this part of the rail. Smaller reads farther away. */
  scale: number;
  /** Phaser display depth. Larger values draw in front of smaller values. */
  depth: number;
  /** Vertical camera follow nudge for this rail point. Usually keep subtle. */
  cameraFollowOffsetY: number;
}

/**
 * One editable control point on the Primary Walk Rail.
 *
 * This is the main thing to tweak when the visible walking line feels wrong.
 * Keep `progress` values sorted from `0` to `1`; insert new points between
 * neighboring progress values when the rail needs a bend or dip.
 */
export interface BridgeWalkRailPoint extends BridgeStagePoint {
  /** Normalized left-to-right distance along the rail. Start is `0`, end is `1`. */
  progress: number;
  /** Presentation cue blended between this point and the next point. */
  cue: BridgeRailPerspectiveCue;
}

/**
 * The one-dimensional player route for the Bridge.
 *
 * Player input changes rail progress. Runtime position is then sampled from
 * these points, so the player stays locked to this authored line.
 */
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
  /** Stable name used by runtime code, debugger buttons, and Stage Objects. */
  id: BridgeStageSpotId;
  /** Where this spot attaches to the Primary Walk Rail. */
  railProgress: number;
  /** Optional visual offset from the sampled rail point. Useful for props/NPCs. */
  offset?: BridgeStagePoint;
  /** Optional offset for interaction prompt placement, relative to the spot. */
  promptOffset?: BridgeStagePoint;
  /** Optional interaction radius override. Defaults to BRIDGE_STAGE_DEFAULT_INTERACT_RADIUS. */
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
  /** Stable name for a large background, midground, or foreground plate. */
  id: string;
  textureKey: string;
  /** Top-level Phaser world placement for the plate. */
  x: number;
  y: number;
  /** Display depth. Negative/background values draw behind the player rail. */
  depth: number;
  /** Phaser origin tuple. `[0, 0]` means x/y is the top-left corner. */
  origin: readonly [number, number];
  scale: number;
  /** Optional parallax factor. Lower x values move slower than the camera. */
  scrollFactor?: readonly [number, number];
}

export type BridgeStageObjectId =
  | 'bridge-draftsperson'
  | 'toy-car'
  | 'completed-bridge'
  | 'handoff-note';

export interface BridgeStageObject {
  /** Stable name for a runtime object or debugger row. */
  id: BridgeStageObjectId;
  kind: 'image' | 'procedural-bridge' | 'text-note';
  textureKey?: string;
  /** Stage Spot that owns this object's placement. Tweak the spot before this. */
  spotId: BridgeStageSpotId;
  /** Display depth relative to plates, player cue depth, and occluders. */
  depth: number;
  scale?: number;
  origin?: readonly [number, number];
}

export interface BridgeStageOccluder {
  /** Debug name for a foreground mask/hint region. */
  id: string;
  /** Polygon points in source space. Used by the debugger and future cover logic. */
  points: readonly BridgeStagePoint[];
  /** Depth this occluder represents. Player depths below this read as behind it. */
  depth: number;
}

/**
 * Single source of truth for Bridge spatial authoring.
 *
 * Edit this shape for normal Bridge staging work:
 * - `primaryWalkRail.points`: the path the player walks on.
 * - `spots`: named anchors for NPCs, props, prompts, teleports, and gates.
 * - `plates`: large authored art layers and parallax pieces.
 * - `objects`: runtime objects attached to named Stage Spots.
 * - `occluders`: foreground regions used to debug/express visual overlap.
 *
 * Helper functions below should usually stay boring; they sample and resolve
 * this data for Phaser, tests, and the Ridge Stage Debugger.
 */
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

/**
 * Runtime view of the Bridge for the current story beat.
 *
 * This controls gates and visibility, not the authored geometry itself. If the
 * rail line or object placement looks wrong, edit `BRIDGE_STAGE_SOURCE` instead.
 */
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


const HORIZONTAL_LINE_BASELINE = 520;

/**
 * Bridge Stage Composition Source.
 *
 * Quick tweak guide:
 * 1. Walking line feels off: edit `primaryWalkRail.points`.
 * 2. NPC/prop is in the wrong place: edit its `spot` railProgress/offset.
 * 3. Prompt appears awkwardly: edit that spot's `promptOffset`.
 * 4. Background/foreground plate is misaligned: edit `plates`.
 * 5. Something should render in front/behind: edit `cue.depth`, object `depth`,
 *    plate `depth`, or occluder `depth`.
 *
 * Keep rail `progress` values ascending from `0` to `1`. The player can only
 * move along this rail; all Stage Spots attach to it by `railProgress`.
 */
export const BRIDGE_STAGE_SOURCE: BridgeStageCompositionSource = {
  id: 'bridge',
  /** Full authored stage size. Extend this when the Bridge area needs more room. */
  canvas: BRIDGE_CANVAS,
  /** Camera travel area. Usually same origin/height as canvas, with a tuned width. */
  cameraBounds: {
    ...BRIDGE_CANVAS,
    width: 2320
  },
  /** The visible/debuggable walking line. This is the first place to tweak. */
  primaryWalkRail: {
    id: 'primary',
    points: [
      {
        progress: 0,
        x: 120,
        y: HORIZONTAL_LINE_BASELINE,
        cue: { scale: 0.94, depth: 30, cameraFollowOffsetY: 0 }
      },
      {
        progress: 0.09,
        x: 320,
        y: HORIZONTAL_LINE_BASELINE,
        cue: { scale: 0.95, depth: 30, cameraFollowOffsetY: 0 }
      },
      {
        progress: 0.18,
        x: 520,
        y: HORIZONTAL_LINE_BASELINE - 2,
        cue: { scale: 0.98, depth: 31, cameraFollowOffsetY: 2 }
      },
      {
        progress: 0.38,
        x: 1040,
        y: HORIZONTAL_LINE_BASELINE,
        cue: { scale: 0.96, depth: 30, cameraFollowOffsetY: -6 }
      },
      {
        progress: 0.48,
        x: 1275,
        y: HORIZONTAL_LINE_BASELINE,
        cue: { scale: 1, depth: 31, cameraFollowOffsetY: 0 }
      },
      {
        progress: 0.56,
        x: 1410,
        y: HORIZONTAL_LINE_BASELINE - 10,
        cue: { scale: 1, depth: 31, cameraFollowOffsetY: 0 }
      },
      {
        progress: 0.67,
        x: 1638,
        y: HORIZONTAL_LINE_BASELINE - 10,
        cue: { scale: 0.96, depth: 30, cameraFollowOffsetY: -12 }
      },
      {
        progress: 0.78,
        x: 1865,
        y: HORIZONTAL_LINE_BASELINE - 10,
        cue: { scale: 1, depth: 31, cameraFollowOffsetY: 0 }
      },
      {
        progress: 0.88,
        x: 2050,
        y: HORIZONTAL_LINE_BASELINE ,
        cue: { scale: 1, depth: 31, cameraFollowOffsetY: 0 }
      },
      {
        progress: 1,
        x: 2200,
        y: HORIZONTAL_LINE_BASELINE,
        cue: { scale: 0.98, depth: 30, cameraFollowOffsetY: 0 }
      }
    ]
  },
  /** Named anchors attached to the rail. Runtime objects and dev teleports use these. */
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
    { id: 'toy-car-test-end', railProgress: 0.78, offset: { x: 120, y: 4 } },
    {
      id: 'concert-exit',
      railProgress: 1,
      promptOffset: { x: 0, y: -126 },
      interactRadius: 104
    },
    { id: 'handoff-note', railProgress: 1, offset: { x: 70, y: -130 } }
  ],
  /** Large visual layers. Move these when the image plates do not line up. */
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
  /** Rendered Bridge props/NPCs. Their placement comes from `spotId`. */
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
  /** Foreground overlap hints. These are currently most useful in the debugger. */
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

/** Default trigger size for Stage Spots that do not specify their own radius. */
export const BRIDGE_STAGE_DEFAULT_INTERACT_RADIUS = 86;

/**
 * Sample the Primary Walk Rail at a normalized progress value.
 *
 * This interpolates both position and perspective cue between neighboring rail
 * points. It is the core conversion from "player is 43% across the rail" to
 * "player is at x/y with this scale/depth."
 */
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

/**
 * Resolve a named Stage Spot to absolute world coordinates.
 *
 * Spots stay attached to the rail, so moving the rail naturally carries nearby
 * NPCs/props with it. Use `offset` only when an anchor should sit beside the
 * rail instead of directly on it.
 */
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

/** Look up a Stage Object definition by id. Placement comes from its `spotId`. */
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

/**
 * Convert story beat state into Bridge presentation rules.
 *
 * This decides which rail range is playable, where Cicka/toy car should appear,
 * and whether the completed bridge/handoff note are visible.
 */
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

/** True once the player is allowed to cross past the left bank gate. */
export function isBridgeCrossingOpen(bridgeBeat: RidgeBridgeBeatState): boolean {
  return bridgeBeat === 'bridge_complete' || bridgeBeat === 'concert_handoff';
}

/** True once the toy car has been shared with Cicka or the bridge is complete. */
export function hasCickaSharedToyCar(bridgeBeat: RidgeBridgeBeatState): boolean {
  return (
    bridgeBeat === 'toy_car_shared' ||
    isBridgeCrossingOpen(bridgeBeat)
  );
}

/**
 * Find the nearest rail sample for an arbitrary world point.
 *
 * Used for resume/dev placement so older saved coordinates or debugger teleports
 * can snap back onto the authored Walk Rail.
 */
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

/** Total pixel length of the authored Walk Rail polyline. Useful for debug readouts. */
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

/** Return the Stage Spot whose `railProgress` is closest to the given progress. */
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
