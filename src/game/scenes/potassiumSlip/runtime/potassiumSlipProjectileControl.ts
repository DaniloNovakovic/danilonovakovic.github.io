export type PotassiumProjectileControlState = 'idle' | 'aiming' | 'recalling';
export type PotassiumRecallMode = 'direct' | 'elastic';

export interface PotassiumPoint {
  x: number;
  y: number;
}

export interface PotassiumProjectileControlConfig {
  launchPad: PotassiumPoint & { radius: number };
  launchPower: number;
  launchMaxDrag: number;
  mainMaxSpeed: number;
  recallSpeed: number;
  recallMode: PotassiumRecallMode;
  recallElasticPull: number;
  recallElasticMaxSpeed: number;
  stopSpeed: number;
  dragFactor: number;
}

export interface PotassiumProjectileControlSnapshot {
  state: PotassiumProjectileControlState;
  pointerId: number | null;
}

export type PotassiumProjectileControlCommand =
  | { type: 'clearAim' }
  | { type: 'clearTether' }
  | { type: 'drawAim'; from: PotassiumPoint; to: PotassiumPoint }
  | { type: 'drawRecallTether' }
  | { type: 'setRecallVisual'; active: boolean }
  | { type: 'resetBananaForAim' }
  | { type: 'setBananaPosition'; x: number; y: number }
  | { type: 'setBananaVelocity'; x: number; y: number }
  | { type: 'setBananaAngularVelocity'; value: number }
  | { type: 'setBananaAngularVelocityFromX'; multiplier: number; min: number; max: number }
  | { type: 'setBananaAngularVelocityRandom'; min: number; max: number }
  | { type: 'moveBananaToLaunchPad'; speed: number };

export interface PotassiumProjectileControl {
  getSnapshot(): PotassiumProjectileControlSnapshot;
  isAiming(): boolean;
  isRecalling(): boolean;
  beginAiming(pointerId: number): PotassiumProjectileControlCommand[];
  beginRecall(pointerId: number): PotassiumProjectileControlCommand[];
  release(input: {
    pointer: PotassiumPoint;
    banana: PotassiumPoint;
    maxSpeed: number;
  }): PotassiumProjectileControlCommand[];
  cancel(): PotassiumProjectileControlCommand[];
  update(input: {
    banana: PotassiumPoint;
    velocity: PotassiumPoint;
    activePointer: PotassiumPoint & { id: number };
  }): PotassiumProjectileControlCommand[];
  applyIdleDrag(input: {
    velocity: PotassiumPoint;
    deltaMs: number;
  }): PotassiumProjectileControlCommand[];
  isInLaunchZone(point: PotassiumPoint, radius?: number): boolean;
  reset(): void;
}

export const POTASSIUM_PROJECTILE_CONTROL_DEFAULTS = {
  launchPower: 6.2,
  launchMaxDrag: 130,
  mainMaxSpeed: 760,
  recallSpeed: 720,
  recallMode: 'direct' as const,
  recallElasticPull: 980,
  recallElasticMaxSpeed: 780,
  stopSpeed: 45,
  dragFactor: 0.9975
};

export function createPotassiumProjectileControl(
  config: PotassiumProjectileControlConfig
): PotassiumProjectileControl {
  let state: PotassiumProjectileControlState = 'idle';
  let pointerId: number | null = null;

  const setIdle = (): PotassiumProjectileControlCommand[] => {
    state = 'idle';
    pointerId = null;
    return [{ type: 'clearAim' }, { type: 'clearTether' }];
  };

  return {
    getSnapshot() {
      return { state, pointerId };
    },
    isAiming() {
      return state === 'aiming';
    },
    isRecalling() {
      return state === 'recalling';
    },
    beginAiming(nextPointerId) {
      state = 'aiming';
      pointerId = nextPointerId;
      return [
        { type: 'setRecallVisual', active: false },
        { type: 'resetBananaForAim' }
      ];
    },
    beginRecall(nextPointerId) {
      state = 'recalling';
      pointerId = nextPointerId;
      return [{ type: 'setRecallVisual', active: true }];
    },
    release(input) {
      const dragVector = {
        x: input.pointer.x - input.banana.x,
        y: input.pointer.y - input.banana.y
      };
      const rawDragLength = length(dragVector);
      if (rawDragLength < 18) {
        return setIdle();
      }

      const dragLength = clamp(rawDragLength, 20, config.launchMaxDrag);
      const speed = clamp(dragLength * config.launchPower, 210, input.maxSpeed);
      const normalized = normalize(dragVector);
      const commands: PotassiumProjectileControlCommand[] = [
        { type: 'setBananaVelocity', x: normalized.x * speed, y: normalized.y * speed },
        { type: 'setBananaAngularVelocityRandom', min: -520, max: 520 },
        ...setIdle(),
        { type: 'setRecallVisual', active: false }
      ];
      return commands;
    },
    cancel() {
      return setIdle();
    },
    update(input) {
      if (state === 'recalling') {
        const commands: PotassiumProjectileControlCommand[] = [];
        if (config.recallMode === 'direct') {
          commands.push({ type: 'moveBananaToLaunchPad', speed: config.recallSpeed });
        } else {
          commands.push(...resolveElasticRecallCommands(config, input.banana, input.velocity));
        }
        commands.push({ type: 'setBananaAngularVelocityFromX', multiplier: 2, min: -520, max: 520 });
        commands.push({ type: 'drawRecallTether' });
        if (
          input.banana.y >= config.launchPad.y - 4 &&
          distance(input.banana, config.launchPad) <= 52
        ) {
          commands.push(
            { type: 'setBananaPosition', x: config.launchPad.x, y: config.launchPad.y },
            { type: 'setBananaVelocity', x: 0, y: 0 }
          );
        }
        if (this.isInLaunchZone(input.banana, 34)) {
          commands.push(...this.beginAiming(pointerId ?? input.activePointer.id));
        }
        return commands;
      }

      const commands: PotassiumProjectileControlCommand[] = [{ type: 'clearTether' }];
      if (state === 'aiming') {
        commands.push({ type: 'clearAim' });
        commands.push({ type: 'drawAim', from: input.banana, to: input.activePointer });
      }
      return commands;
    },
    applyIdleDrag(input) {
      if (state === 'aiming' || state === 'recalling') return [];
      const speed = length(input.velocity);
      if (speed <= config.stopSpeed) {
        return [
          { type: 'setBananaVelocity', x: 0, y: 0 },
          { type: 'setBananaAngularVelocity', value: 0 }
        ];
      }
      const frameFactor = Math.pow(config.dragFactor, input.deltaMs / 16.67);
      return [{
        type: 'setBananaVelocity',
        x: input.velocity.x * frameFactor,
        y: input.velocity.y * frameFactor
      }];
    },
    isInLaunchZone(point, radius = config.launchPad.radius) {
      return distance(point, config.launchPad) <= radius;
    },
    reset() {
      state = 'idle';
      pointerId = null;
    }
  };
}

function resolveElasticRecallCommands(
  config: PotassiumProjectileControlConfig,
  banana: PotassiumPoint,
  velocity: PotassiumPoint
): PotassiumProjectileControlCommand[] {
  const toPad = {
    x: config.launchPad.x - banana.x,
    y: config.launchPad.y - banana.y
  };
  if (lengthSquared(toPad) <= 1) {
    return [{ type: 'setBananaVelocity', x: 0, y: 0 }];
  }
  const normal = normalize(toPad);
  const nextVelocity = {
    x: velocity.x + normal.x * config.recallElasticPull * (1 / 60),
    y: velocity.y + normal.y * config.recallElasticPull * (1 / 60)
  };
  const nextSpeed = length(nextVelocity);
  if (nextSpeed > config.recallElasticMaxSpeed) {
    const scaled = normalize(nextVelocity);
    return [{
      type: 'setBananaVelocity',
      x: scaled.x * config.recallElasticMaxSpeed,
      y: scaled.y * config.recallElasticMaxSpeed
    }];
  }
  return [{ type: 'setBananaVelocity', x: nextVelocity.x, y: nextVelocity.y }];
}

function length(point: PotassiumPoint): number {
  return Math.sqrt(lengthSquared(point));
}

function lengthSquared(point: PotassiumPoint): number {
  return point.x * point.x + point.y * point.y;
}

function distance(a: PotassiumPoint, b: PotassiumPoint): number {
  return length({ x: a.x - b.x, y: a.y - b.y });
}

function normalize(point: PotassiumPoint): PotassiumPoint {
  const pointLength = length(point);
  if (pointLength <= 0) return { x: 0, y: 0 };
  return { x: point.x / pointLength, y: point.y / pointLength };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
