import { describe, expect, it } from 'vitest';
import type { InputCommandFrame } from '@/game/core/input/commands';
import type {
  RidgeBlockoutAssistZone,
  RidgeBlockoutCollider,
  RidgeBlockoutGeometry
} from '../blockout';
import {
  createRidgeTraversalRuntime,
  type RidgeTraversalBody,
  type RidgeTraversalPlayer
} from './ridgeTraversalRuntime';

interface TestTraversalBody extends RidgeTraversalBody {
  allowGravity: boolean;
}

interface TestTraversalPlayer extends RidgeTraversalPlayer {
  readonly body: TestTraversalBody;
}

const baseBounds = {
  x: 0,
  y: 0,
  width: 1000,
  height: 1000
};

describe('Ridge traversal runtime', () => {
  it('primes grounding before the player controller reads ramp and climb state', () => {
    const runtime = createRidgeTraversalRuntime({
      geometry: makeGeometry({
        assistZones: [
          makeAssistZone({
            id: 'outskirts-ramp',
            kind: 'ramp',
            from: { x: 0, y: 100 },
            to: { x: 100, y: 100 }
          })
        ]
      })
    });
    const player = makePlayer({ x: 50, y: 80, height: 40 });

    const result = runtime.primeGrounding(player);

    expect(result.grounded).toBe(true);
    expect(result.appliedAssists).toEqual(['grounding']);
    expect(player.body.touching.down).toBe(true);
    expect(player.body.blocked.down).toBe(true);
  });

  it('snaps walkable ramps and captures the new safe position', () => {
    const runtime = createRidgeTraversalRuntime({
      geometry: makeGeometry({
        assistZones: [
          makeAssistZone({
            id: 'stair-ramp',
            kind: 'ramp',
            from: { x: 0, y: 100 },
            to: { x: 100, y: 100 }
          })
        ]
      })
    });
    const player = makePlayer({ x: 50, y: 75, height: 40, velocityY: 20 });

    const result = runtime.update({
      player,
      commands: command(),
      deltaMs: 1000 / 60
    });

    expect(result.appliedAssists).toContain('ramp');
    expect(result.appliedAssists).toContain('safe-capture');
    expect(player.y).toBe(80);
    expect(player.body.velocity.y).toBe(0);
    expect(result.state.lastSafePosition).toEqual({ x: 50, y: 80 });
  });

  it('runs climb before other assists and releases attachment when climb intent ends', () => {
    const climb = makeAssistZone({
      id: 'cord-climb',
      kind: 'climb',
      from: { x: 100, y: 200 },
      to: { x: 100, y: 100 },
      width: 80,
      height: 160
    });
    const ramp = makeAssistZone({
      id: 'overlapping-ramp',
      kind: 'ramp',
      from: { x: 0, y: 200 },
      to: { x: 200, y: 200 },
      width: 260,
      height: 120
    });
    const runtime = createRidgeTraversalRuntime({
      geometry: makeGeometry({ assistZones: [climb, ramp] })
    });
    const player = makePlayer({ x: 100, y: 180, height: 40 });

    const climbResult = runtime.update({
      player,
      commands: command({ verticalAxis: -1 }),
      deltaMs: 1000 / 60
    });

    expect(climbResult.appliedAssists).toContain('climb');
    expect(climbResult.appliedAssists).not.toContain('ramp');
    expect(climbResult.state.activeClimbZoneId).toBe('cord-climb');
    expect(player.body.allowGravity).toBe(false);
    expect(player.y).toBeCloseTo(179.4);

    const releaseResult = runtime.update({
      player,
      commands: command({ jump: true }),
      deltaMs: 1000 / 60
    });

    expect(releaseResult.appliedAssists).toContain('climb-release');
    expect(releaseResult.state.activeClimbZoneId).toBeNull();
    expect(player.body.allowGravity).toBe(true);
  });

  it('steers falling players toward authored drop lines', () => {
    const runtime = createRidgeTraversalRuntime({
      geometry: makeGeometry({
        assistZones: [
          makeAssistZone({
            id: 'fold-drop',
            kind: 'drop',
            from: { x: 100, y: 50 },
            to: { x: 100, y: 150 },
            width: 100,
            height: 160
          })
        ]
      })
    });
    const player = makePlayer({ x: 80, y: 100, velocityY: 40 });

    const result = runtime.update({
      player,
      commands: command(),
      deltaMs: 1000 / 60
    });

    expect(result.appliedAssists).toContain('drop');
    expect(player.x).toBeCloseTo(81.6);
  });

  it('steps onto small grounded ledges', () => {
    const runtime = createRidgeTraversalRuntime({
      geometry: makeGeometry({
        colliders: [
          makeCollider({
            id: 'short-step',
            kind: 'platform',
            x: 72,
            y: 100,
            width: 20,
            height: 20
          })
        ]
      })
    });
    const player = makePlayer({
      x: 50,
      y: 80,
      height: 40,
      touchingDown: true
    });

    const result = runtime.update({
      player,
      commands: command({ moveAxis: 1 }),
      deltaMs: 1000 / 60
    });

    expect(result.appliedAssists).toContain('step-up');
    expect(player.x).toBe(68);
    expect(player.y).toBe(70);
  });

  it('mantles onto reachable platform targets while airborne', () => {
    const runtime = createRidgeTraversalRuntime({
      geometry: makeGeometry({
        colliders: [
          makeCollider({
            id: 'reachable-platform',
            kind: 'platform',
            x: 100,
            y: 90,
            width: 40,
            height: 20
          })
        ]
      })
    });
    const player = makePlayer({ x: 50, y: 110, height: 40, velocityY: 10 });

    const result = runtime.update({
      player,
      commands: command({ moveAxis: 1 }),
      deltaMs: 1000 / 60
    });

    expect(result.appliedAssists).toContain('mantle');
    expect(player.x).toBe(96);
    expect(player.y).toBe(60);
  });

  it('rejects assist paths that cross solid walls', () => {
    const runtime = createRidgeTraversalRuntime({
      geometry: makeGeometry({
        gridColliders: [
          makeCollider({
            id: 'solid-wall',
            kind: 'solid',
            x: 50,
            y: 77.5,
            width: 5,
            height: 5
          })
        ],
        assistZones: [
          makeAssistZone({
            id: 'blocked-ramp',
            kind: 'ramp',
            from: { x: 0, y: 100 },
            to: { x: 100, y: 100 }
          })
        ]
      })
    });
    const player = makePlayer({ x: 50, y: 75, height: 40, velocityY: 20 });

    const result = runtime.update({
      player,
      commands: command(),
      deltaMs: 1000 / 60
    });

    expect(result.appliedAssists).not.toContain('ramp');
    expect(player.y).toBe(75);
    expect(result.state.solidBlockerCount).toBe(1);
  });

  it('recovers from the bottom band using the last captured safe position', () => {
    const runtime = createRidgeTraversalRuntime({
      geometry: makeGeometry()
    });
    const player = makePlayer({
      x: 20,
      y: 20,
      touchingDown: true
    });

    const captureResult = runtime.update({
      player,
      commands: command(),
      deltaMs: 1000 / 60
    });
    expect(captureResult.appliedAssists).toContain('safe-capture');
    expect(captureResult.state.lastSafePosition).toEqual({ x: 20, y: 20 });

    player.x = 300;
    player.y = 980;
    player.body.touching.down = false;
    player.body.blocked.down = false;
    player.body.velocity.y = 300;

    const recoveryResult = runtime.update({
      player,
      commands: command(),
      deltaMs: 1000 / 60
    });

    expect(recoveryResult.appliedAssists).toContain('fall-recovery');
    expect(player.x).toBe(20);
    expect(player.y).toBe(20);
    expect(player.body.velocity.x).toBe(0);
    expect(player.body.velocity.y).toBe(0);
  });

  it('keeps solid terrain out of mantle targets', () => {
    const runtime = createRidgeTraversalRuntime({
      geometry: makeGeometry({
        gridColliders: [
          makeCollider({
            id: 'solid-hash-ledge',
            kind: 'solid',
            x: 100,
            y: 90,
            width: 40,
            height: 20
          })
        ]
      })
    });
    const player = makePlayer({ x: 50, y: 110, height: 40, velocityY: 10 });

    const result = runtime.update({
      player,
      commands: command({ moveAxis: 1 }),
      deltaMs: 1000 / 60
    });

    expect(result.appliedAssists).not.toContain('mantle');
    expect(result.state.mantleTargetCount).toBe(0);
    expect(player.x).toBe(50);
    expect(player.y).toBe(110);
  });
});

function command(overrides: Partial<InputCommandFrame> = {}): InputCommandFrame {
  return {
    moveAxis: 0,
    verticalAxis: 0,
    sprint: false,
    jump: false,
    interact: false,
    exitContext: false,
    ...overrides
  };
}

function makeGeometry(options: {
  assistZones?: readonly RidgeBlockoutAssistZone[];
  colliders?: readonly RidgeBlockoutCollider[];
  gridColliders?: readonly RidgeBlockoutCollider[];
} = {}): RidgeBlockoutGeometry {
  const gridColliders = options.gridColliders ?? [];
  return {
    bounds: baseBounds,
    roomBounds: [],
    anchorPoints: [],
    gridColliders,
    routeConnectors: [],
    shortcutConnections: [],
    assistZones: options.assistZones ?? [],
    colliders: [
      ...gridColliders,
      ...(options.colliders ?? [])
    ]
  };
}

function makeAssistZone(options: {
  id: string;
  kind: RidgeBlockoutAssistZone['kind'];
  from: { x: number; y: number };
  to: { x: number; y: number };
  width?: number;
  height?: number;
}): RidgeBlockoutAssistZone {
  return {
    id: options.id,
    kind: options.kind,
    movement: options.kind,
    from: options.from,
    to: options.to,
    x: (options.from.x + options.to.x) / 2,
    y: (options.from.y + options.to.y) / 2,
    width: options.width ?? 160,
    height: options.height ?? 100
  };
}

function makeCollider(options: {
  id: string;
  kind: RidgeBlockoutCollider['kind'];
  x: number;
  y: number;
  width: number;
  height: number;
}): RidgeBlockoutCollider {
  return {
    id: options.id,
    kind: options.kind,
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height
  };
}

function makePlayer(options: {
  x: number;
  y: number;
  width?: number;
  height?: number;
  velocityX?: number;
  velocityY?: number;
  touchingDown?: boolean;
  blockedDown?: boolean;
}): TestTraversalPlayer {
  let playerY = options.y;
  const body: TestTraversalBody = {
    width: options.width ?? 20,
    height: options.height ?? 40,
    get bottom() {
      return playerY + body.height / 2;
    },
    velocity: {
      x: options.velocityX ?? 0,
      y: options.velocityY ?? 0
    },
    touching: {
      down: options.touchingDown ?? false
    },
    blocked: {
      down: options.blockedDown ?? false
    },
    allowGravity: true,
    setAllowGravity(allowGravity: boolean) {
      body.allowGravity = allowGravity;
    }
  };

  const player: TestTraversalPlayer = {
    x: options.x,
    get y() {
      return playerY;
    },
    set y(value: number) {
      playerY = value;
    },
    body,
    setVelocityX(velocityX: number) {
      body.velocity.x = velocityX;
    },
    setVelocityY(velocityY: number) {
      body.velocity.y = velocityY;
    }
  };

  return player;
}
