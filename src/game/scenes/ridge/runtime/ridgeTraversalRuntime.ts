import type { InputCommandFrame } from '@/game/core/input/commands';
import type {
  RidgeBlockoutCollider,
  RidgeBlockoutGeometry
} from '../blockout';
import {
  canMantleLedge,
  canStepUp,
  chooseFallRecovery,
  clamp,
  getClimbProgressDelta,
  getFrameRateIndependentLerpAlpha,
  getLedgeTop,
  getPointOnTraversalSegment,
  isMantleTargetCollider,
  isPointNearTraversalLine,
  isTraversalPathOccludedBySolid,
  lerp,
  projectPointToSegmentT,
  resolveWalkableRampSurfaceY,
  shouldMaintainClimbAttachment,
  type RidgeSafePosition
} from './traversalComfort';

export interface RidgeTraversalBody {
  readonly width: number;
  readonly height: number;
  readonly bottom: number;
  readonly velocity: {
    x: number;
    y: number;
  };
  readonly touching: {
    down: boolean;
  };
  readonly blocked: {
    down: boolean;
  };
  setAllowGravity(allowGravity: boolean): void;
}

export interface RidgeTraversalPlayer {
  x: number;
  y: number;
  readonly body: RidgeTraversalBody;
  setVelocityX(velocityX: number): void;
  setVelocityY(velocityY: number): void;
}

export type RidgeTraversalAssistName =
  | 'grounding'
  | 'climb'
  | 'climb-release'
  | 'ramp'
  | 'drop'
  | 'step-up'
  | 'mantle'
  | 'fall-recovery'
  | 'safe-capture';

export interface RidgeTraversalRuntimeState {
  activeClimbZoneId: string | null;
  lastSafePosition?: RidgeSafePosition;
  mantleTargetCount: number;
  solidBlockerCount: number;
}

export interface RidgeTraversalPrimeGroundingResult {
  grounded: boolean;
  appliedAssists: readonly RidgeTraversalAssistName[];
  state: RidgeTraversalRuntimeState;
}

export interface RidgeTraversalUpdateFrame {
  player: RidgeTraversalPlayer;
  commands: InputCommandFrame;
  deltaMs: number;
}

export interface RidgeTraversalFrameResult {
  appliedAssists: readonly RidgeTraversalAssistName[];
  state: RidgeTraversalRuntimeState;
}

export interface RidgeTraversalRuntime {
  primeGrounding(player: RidgeTraversalPlayer): RidgeTraversalPrimeGroundingResult;
  update(frame: RidgeTraversalUpdateFrame): RidgeTraversalFrameResult;
  getState(): RidgeTraversalRuntimeState;
}

export interface RidgeTraversalRuntimeOptions {
  geometry: RidgeBlockoutGeometry;
  initialSafePosition?: RidgeSafePosition;
}

const RIDGE_RAMP_SNAP = {
  maxSnapDownY: 28,
  maxSnapUpY: 32
} as const;
const RIDGE_CLIMB_ATTACH_DISTANCE = 22;
const RIDGE_DROP_ATTACH_DISTANCE = 28;
const RIDGE_MANTLE_HORIZONTAL_DISTANCE = 32;
const RIDGE_MANTLE_MIN_VERTICAL_DELTA = 24;
const RIDGE_MANTLE_MAX_VERTICAL_DELTA = 96;
const RIDGE_MANTLE_MIN_VELOCITY_Y = -20;
const RIDGE_STEP_UP_MAX_HEIGHT = 18;
const RIDGE_STEP_UP_HORIZONTAL_DISTANCE = 22;
const RIDGE_CLIMB_PROGRESS_PER_SECOND = 0.36;
const RIDGE_DROP_LERP_ALPHA_AT_60FPS = 0.08;
const RIDGE_FALL_RECOVERY_THRESHOLD_Y = 48;

export function createRidgeTraversalRuntime(
  options: RidgeTraversalRuntimeOptions
): RidgeTraversalRuntime {
  return new RidgeTraversalRuntimeImpl(options);
}

class RidgeTraversalRuntimeImpl implements RidgeTraversalRuntime {
  private readonly geometry: RidgeBlockoutGeometry;
  private readonly solidBlockers: readonly RidgeBlockoutCollider[];
  private readonly mantleTargets: readonly RidgeBlockoutCollider[];
  private activeClimbZoneId: string | null = null;
  private lastSafePosition?: RidgeSafePosition;

  constructor(options: RidgeTraversalRuntimeOptions) {
    this.geometry = options.geometry;
    this.solidBlockers = options.geometry.gridColliders.filter(isSolidCollider);
    this.mantleTargets = options.geometry.colliders.filter(isMantleTargetCollider);
    this.lastSafePosition = options.initialSafePosition;
  }

  primeGrounding(player: RidgeTraversalPlayer): RidgeTraversalPrimeGroundingResult {
    const bottomY = getPlayerBottomY(player);
    const ramp = resolveWalkableRampSurfaceY(
      this.geometry.assistZones,
      { x: player.x, y: bottomY },
      RIDGE_RAMP_SNAP
    );
    const climb = this.geometry.assistZones.find((zone) =>
      zone.kind === 'climb' &&
      isPointNearTraversalLine(zone, { x: player.x, y: bottomY }, RIDGE_CLIMB_ATTACH_DISTANCE)
    );

    if (!ramp && !climb) {
      return {
        grounded: false,
        appliedAssists: [],
        state: this.getState()
      };
    }

    markBodyGrounded(player.body);
    return {
      grounded: true,
      appliedAssists: ['grounding'],
      state: this.getState()
    };
  }

  update(frame: RidgeTraversalUpdateFrame): RidgeTraversalFrameResult {
    const appliedAssists: RidgeTraversalAssistName[] = [];
    const didClimb = this.applyClimbAssist(frame, appliedAssists);

    if (!didClimb) {
      this.releaseClimbAttachment(frame.player, appliedAssists);
      this.applyRampAssist(frame.player, frame.commands, appliedAssists);
      this.applyDropAssist(frame.player, frame.deltaMs, appliedAssists);
      this.applyStepUpAssist(frame.player, frame.commands, appliedAssists);
      this.applyMantleAssist(frame.player, frame.commands, appliedAssists);
    }

    this.recoverFromWorldBottom(frame.player, appliedAssists);
    this.captureLastSafePosition(frame.player, appliedAssists);

    return {
      appliedAssists,
      state: this.getState()
    };
  }

  getState(): RidgeTraversalRuntimeState {
    return {
      activeClimbZoneId: this.activeClimbZoneId,
      lastSafePosition: this.lastSafePosition
        ? { ...this.lastSafePosition }
        : undefined,
      mantleTargetCount: this.mantleTargets.length,
      solidBlockerCount: this.solidBlockers.length
    };
  }

  private applyRampAssist(
    player: RidgeTraversalPlayer,
    commands: InputCommandFrame,
    appliedAssists: RidgeTraversalAssistName[]
  ): boolean {
    if (commands.jump) return false;

    const body = player.body;
    const bottomY = getPlayerBottomY(player);
    const ramp = resolveWalkableRampSurfaceY(
      this.geometry.assistZones,
      { x: player.x, y: bottomY },
      RIDGE_RAMP_SNAP
    );
    if (!ramp || body.velocity.y < -60) return false;

    const target = { x: player.x, y: ramp.y - body.height / 2 };
    if (this.isAssistPathOccluded(player, target)) return false;

    player.y = target.y;
    player.setVelocityY(0);
    markBodyGrounded(body);
    appliedAssists.push('ramp');
    return true;
  }

  private applyClimbAssist(
    frame: RidgeTraversalUpdateFrame,
    appliedAssists: RidgeTraversalAssistName[]
  ): boolean {
    const { player, commands, deltaMs } = frame;
    const zone = this.geometry.assistZones.find((candidate) =>
      candidate.kind === 'climb' &&
      isPointNearTraversalLine(
        candidate,
        { x: player.x, y: getPlayerBottomY(player) },
        RIDGE_CLIMB_ATTACH_DISTANCE
      )
    );
    const isAttached = this.activeClimbZoneId !== null;
    if (!zone) return false;
    if (
      commands.verticalAxis === 0 &&
      !shouldMaintainClimbAttachment({
        attached: isAttached,
        jump: commands.jump,
        horizontalAxis: commands.moveAxis,
        nearClimbLine: true
      })
    ) {
      return false;
    }
    if (commands.jump) return false;

    const currentT = projectPointToSegmentT(
      { x: player.x, y: getPlayerBottomY(player) },
      zone
    );
    const nextT = clamp(
      currentT + getClimbProgressDelta({
        verticalAxis: commands.verticalAxis,
        fromY: zone.from.y,
        toY: zone.to.y,
        progressPerSecond: RIDGE_CLIMB_PROGRESS_PER_SECOND,
        deltaMs
      }),
      0,
      1
    );
    const point = getPointOnTraversalSegment(zone, nextT);
    const target = { x: point.x, y: point.y - player.body.height / 2 };
    if (this.isAssistPathOccluded(player, target)) return false;

    this.activeClimbZoneId = zone.id;
    player.body.setAllowGravity(false);
    player.x = target.x;
    player.y = target.y;
    player.setVelocityX(0);
    player.setVelocityY(0);
    markBodyGrounded(player.body);
    appliedAssists.push('climb');
    return true;
  }

  private releaseClimbAttachment(
    player: RidgeTraversalPlayer,
    appliedAssists: RidgeTraversalAssistName[]
  ): void {
    if (!this.activeClimbZoneId) return;
    this.activeClimbZoneId = null;
    player.body.setAllowGravity(true);
    appliedAssists.push('climb-release');
  }

  private applyDropAssist(
    player: RidgeTraversalPlayer,
    deltaMs: number,
    appliedAssists: RidgeTraversalAssistName[]
  ): boolean {
    if (player.body.velocity.y <= 0) return false;

    const zone = this.geometry.assistZones.find((candidate) =>
      candidate.kind === 'drop' &&
      isPointNearTraversalLine(candidate, { x: player.x, y: player.y }, RIDGE_DROP_ATTACH_DISTANCE)
    );
    if (!zone) return false;

    const t = projectPointToSegmentT({ x: player.x, y: player.y }, zone);
    const point = getPointOnTraversalSegment(zone, t);
    const target = {
      x: lerp(
        player.x,
        point.x,
        getFrameRateIndependentLerpAlpha(RIDGE_DROP_LERP_ALPHA_AT_60FPS, deltaMs)
      ),
      y: player.y
    };
    if (this.isAssistPathOccluded(player, target)) return false;

    player.x = target.x;
    appliedAssists.push('drop');
    return true;
  }

  private applyStepUpAssist(
    player: RidgeTraversalPlayer,
    commands: InputCommandFrame,
    appliedAssists: RidgeTraversalAssistName[]
  ): boolean {
    if (commands.moveAxis === 0 || !isBodyGrounded(player.body)) return false;

    const direction = Math.sign(commands.moveAxis);
    const bottomY = getPlayerBottomY(player);
    const candidate = findClosestLedge(
      this.geometry.colliders,
      player.x,
      direction,
      RIDGE_STEP_UP_HORIZONTAL_DISTANCE
    )?.collider;
    if (!candidate) return false;

    const topY = getColliderTop(candidate);
    if (!canStepUp({
      playerBottomY: bottomY,
      obstacleTopY: topY,
      maxStepHeight: RIDGE_STEP_UP_MAX_HEIGHT
    })) {
      return false;
    }

    const target = {
      x: player.x + direction * 18,
      y: topY - player.body.height / 2
    };
    if (this.isAssistPathOccluded(player, target)) return false;

    player.x = target.x;
    player.y = target.y;
    player.setVelocityY(0);
    markBodyGrounded(player.body);
    appliedAssists.push('step-up');
    return true;
  }

  private applyMantleAssist(
    player: RidgeTraversalPlayer,
    commands: InputCommandFrame,
    appliedAssists: RidgeTraversalAssistName[]
  ): boolean {
    if (commands.moveAxis === 0) return false;
    if (isBodyGrounded(player.body)) return false;
    if (player.body.velocity.y < RIDGE_MANTLE_MIN_VELOCITY_Y) return false;

    const direction = Math.sign(commands.moveAxis);
    const bottomY = getPlayerBottomY(player);
    let closest:
      | { collider: RidgeBlockoutCollider; distance: number }
      | undefined;
    for (const collider of this.mantleTargets) {
      const distance = getHorizontalLedgeDistance(collider, player.x, direction);
      if (distance < 0 || (closest && distance >= closest.distance)) continue;
      if (!canMantleLedge({
        playerX: player.x,
        playerBottomY: bottomY,
        moveAxis: commands.moveAxis,
        ledge: collider,
        maxHorizontalDistance: RIDGE_MANTLE_HORIZONTAL_DISTANCE,
        minVerticalDelta: RIDGE_MANTLE_MIN_VERTICAL_DELTA,
        maxVerticalDelta: RIDGE_MANTLE_MAX_VERTICAL_DELTA
      })) {
        continue;
      }

      closest = { collider, distance };
    }

    const target = closest?.collider;
    if (!target) return false;

    const topY = getLedgeTop(target);
    const nextPosition = {
      x: direction > 0
        ? target.x - target.width / 2 + player.body.width / 2 + 6
        : target.x + target.width / 2 - player.body.width / 2 - 6,
      y: topY - player.body.height / 2
    };
    if (this.isAssistPathOccluded(player, nextPosition)) return false;

    player.x = nextPosition.x;
    player.y = nextPosition.y;
    player.setVelocityY(0);
    markBodyGrounded(player.body);
    appliedAssists.push('mantle');
    return true;
  }

  private isAssistPathOccluded(
    player: RidgeTraversalPlayer,
    target: { x: number; y: number }
  ): boolean {
    return isTraversalPathOccludedBySolid({
      from: { x: player.x, y: player.y },
      to: target,
      bodySize: {
        width: player.body.width,
        height: player.body.height
      },
      solidRects: this.solidBlockers
    });
  }

  private recoverFromWorldBottom(
    player: RidgeTraversalPlayer,
    appliedAssists: RidgeTraversalAssistName[]
  ): boolean {
    const recovery = chooseFallRecovery({
      playerY: player.y,
      worldBottomY: this.geometry.bounds.y + this.geometry.bounds.height,
      thresholdY: RIDGE_FALL_RECOVERY_THRESHOLD_Y,
      lastSafePosition: this.lastSafePosition
    });
    if (!recovery) return false;

    player.x = recovery.x;
    player.y = recovery.y;
    player.setVelocityX(0);
    player.setVelocityY(0);
    appliedAssists.push('fall-recovery');
    return true;
  }

  private captureLastSafePosition(
    player: RidgeTraversalPlayer,
    appliedAssists: RidgeTraversalAssistName[]
  ): boolean {
    const bottomBandY = this.geometry.bounds.y +
      this.geometry.bounds.height -
      RIDGE_FALL_RECOVERY_THRESHOLD_Y;
    const bottomY = getPlayerBottomY(player);
    if (bottomY >= bottomBandY) return false;

    const ramp = resolveWalkableRampSurfaceY(
      this.geometry.assistZones,
      { x: player.x, y: bottomY },
      RIDGE_RAMP_SNAP
    );
    if (!isBodyGrounded(player.body) && !ramp) return false;

    this.lastSafePosition = { x: player.x, y: player.y };
    appliedAssists.push('safe-capture');
    return true;
  }
}

function isSolidCollider(collider: RidgeBlockoutCollider): boolean {
  return collider.kind === 'solid';
}

function getPlayerBottomY(player: RidgeTraversalPlayer): number {
  return player.body.bottom;
}

function markBodyGrounded(body: RidgeTraversalBody): void {
  body.touching.down = true;
  body.blocked.down = true;
}

function isBodyGrounded(body: RidgeTraversalBody): boolean {
  return body.touching.down || body.blocked.down;
}

function findClosestLedge(
  colliders: readonly RidgeBlockoutCollider[],
  playerX: number,
  direction: number,
  maxDistance: number
): { collider: RidgeBlockoutCollider; distance: number } | undefined {
  let closest: { collider: RidgeBlockoutCollider; distance: number } | undefined;
  for (const collider of colliders) {
    const distance = getHorizontalLedgeDistance(collider, playerX, direction);
    if (distance < 0 || distance > maxDistance) continue;
    if (!closest || distance < closest.distance) {
      closest = { collider, distance };
    }
  }
  return closest;
}

function getHorizontalLedgeDistance(
  collider: RidgeBlockoutCollider,
  playerX: number,
  direction: number
): number {
  const left = collider.x - collider.width / 2;
  const right = collider.x + collider.width / 2;
  if (direction > 0) return left - playerX;
  return playerX - right;
}

function getColliderTop(collider: RidgeBlockoutCollider): number {
  return collider.y - collider.height / 2;
}
