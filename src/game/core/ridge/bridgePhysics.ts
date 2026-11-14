import { bridgeNodeById, type BridgeBeam, type BridgeDesign, type BridgeNode } from './bridgeBuilder';

export type BridgeTestStatus = 'running' | 'crossed' | 'failed';

export interface PhysicsNode extends BridgeNode {
  previousX: number;
  previousY: number;
}

export interface PhysicsBeam extends BridgeBeam {
  restLength: number;
  stress: number;
  overstressFor: number;
  broken: boolean;
}

export interface CarWheel {
  x: number;
  y: number;
  previousX: number;
  previousY: number;
  grounded: boolean;
}

export interface BridgeSimulation {
  nodes: PhysicsNode[];
  beams: PhysicsBeam[];
  car: {
    rear: CarWheel;
    front: CarWheel;
  };
  elapsed: number;
  status: BridgeTestStatus;
  maxStress: number;
  brokenBeamIds: string[];
}

const FIXED_STEP = 1 / 120;
const GRAVITY = 480;
const WHEEL_RADIUS = 10;
const CHASSIS_LENGTH = 42;
const CAR_SPEED = 78;
const MAX_TEST_SECONDS = 20;
const SOLVER_ITERATIONS = 12;

export function createBridgeSimulation(design: BridgeDesign): BridgeSimulation {
  return {
    nodes: design.nodes.map((node) => ({
      ...node,
      previousX: node.x,
      previousY: node.y
    })),
    beams: design.beams.map((beam) => {
      const a = bridgeNodeById(design, beam.a);
      const b = bridgeNodeById(design, beam.b);
      return {
        ...beam,
        restLength: Math.hypot(a.x - b.x, a.y - b.y),
        stress: 0,
        overstressFor: 0,
        broken: false
      };
    }),
    car: {
      rear: createWheel(28, 200),
      front: createWheel(70, 200)
    },
    elapsed: 0,
    status: 'running',
    maxStress: 0,
    brokenBeamIds: []
  };
}

export function stepBridgeSimulation(simulation: BridgeSimulation, dt = FIXED_STEP): void {
  if (simulation.status !== 'running') return;
  const step = Math.min(dt, 1 / 30);
  simulation.elapsed += step;
  integrateBridge(simulation, step);
  integrateCar(simulation.car, step);

  for (let iteration = 0; iteration < SOLVER_ITERATIONS; iteration += 1) {
    for (const beam of simulation.beams) solveBeam(simulation.nodes, beam);
    solveChassis(simulation.car);
    for (const wheel of [simulation.car.rear, simulation.car.front]) {
      collideWithBanks(wheel);
      for (const beam of simulation.beams) collideWithBeam(simulation.nodes, wheel, beam);
    }
  }

  updateBeamStress(simulation, step);
  updateTestStatus(simulation);
}

export function runBridgeCarTest(design: BridgeDesign): BridgeSimulation {
  const simulation = createBridgeSimulation(design);
  const maximumSteps = Math.ceil(MAX_TEST_SECONDS / FIXED_STEP);
  for (let index = 0; index < maximumSteps && simulation.status === 'running'; index += 1) {
    stepBridgeSimulation(simulation);
  }
  return simulation;
}

function createWheel(x: number, y: number): CarWheel {
  return { x, y, previousX: x, previousY: y, grounded: false };
}

function integrateBridge(simulation: BridgeSimulation, dt: number): void {
  for (const node of simulation.nodes) {
    if (node.pinned) continue;
    const x = node.x;
    const y = node.y;
    node.x += (node.x - node.previousX) * 0.992;
    node.y += (node.y - node.previousY) * 0.992 + GRAVITY * dt * dt;
    node.previousX = x;
    node.previousY = y;
  }
}

function integrateCar(car: BridgeSimulation['car'], dt: number): void {
  for (const wheel of [car.rear, car.front]) {
    const x = wheel.x;
    const y = wheel.y;
    const velocityX = (wheel.x - wheel.previousX) * 0.996;
    const targetVelocity = CAR_SPEED * dt;
    const drive = clamp(targetVelocity - velocityX, -95 * dt * dt, 95 * dt * dt);
    wheel.x += velocityX + drive;
    wheel.y += (wheel.y - wheel.previousY) * 0.996 + GRAVITY * dt * dt;
    wheel.previousX = x;
    wheel.previousY = y;
    wheel.grounded = false;
  }
}

function solveBeam(nodes: PhysicsNode[], beam: PhysicsBeam): void {
  if (beam.broken) return;
  const a = nodes.find((node) => node.id === beam.a);
  const b = nodes.find((node) => node.id === beam.b);
  if (!a || !b) return;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy) || 0.0001;
  if (beam.kind === 'cable' && length < beam.restLength) return;
  const inverseA = a.pinned ? 0 : 1;
  const inverseB = b.pinned ? 0 : 1;
  const total = inverseA + inverseB;
  if (total === 0) return;
  const stiffness = beam.kind === 'cable' ? 0.25 : 0.18;
  const correction = ((length - beam.restLength) / length) * stiffness;
  a.x += dx * correction * (inverseA / total);
  a.y += dy * correction * (inverseA / total);
  b.x -= dx * correction * (inverseB / total);
  b.y -= dy * correction * (inverseB / total);
}

function solveChassis(car: BridgeSimulation['car']): void {
  const { rear, front } = car;
  const dx = front.x - rear.x;
  const dy = front.y - rear.y;
  const length = Math.hypot(dx, dy) || 0.0001;
  const correction = ((length - CHASSIS_LENGTH) / length) * 0.72;
  rear.x += dx * correction * 0.5;
  rear.y += dy * correction * 0.5;
  front.x -= dx * correction * 0.5;
  front.y -= dy * correction * 0.5;
}

function collideWithBanks(wheel: CarWheel): void {
  const onLeftBank = wheel.x <= 70;
  const onRightBank = wheel.x >= 570;
  if ((!onLeftBank && !onRightBank) || wheel.y + WHEEL_RADIUS < 210) return;
  wheel.y = 210 - WHEEL_RADIUS;
  if (wheel.previousY > wheel.y) wheel.previousY = wheel.y;
  wheel.grounded = true;
}

function collideWithBeam(nodes: PhysicsNode[], wheel: CarWheel, beam: PhysicsBeam): void {
  if (beam.broken || beam.kind === 'cable') return;
  const a = nodes.find((node) => node.id === beam.a);
  const b = nodes.find((node) => node.id === beam.b);
  if (!a || !b) return;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared < 1 || Math.abs(dy) > Math.abs(dx) * 0.72) return;

  const projection = clamp(((wheel.x - a.x) * dx + (wheel.y - a.y) * dy) / lengthSquared, 0, 1);
  const closestX = a.x + dx * projection;
  const closestY = a.y + dy * projection;
  const length = Math.sqrt(lengthSquared);
  let normalX = -dy / length;
  let normalY = dx / length;
  if (normalY > 0) {
    normalX *= -1;
    normalY *= -1;
  }
  const signedDistance = (wheel.x - closestX) * normalX + (wheel.y - closestY) * normalY;
  const previousDistance = (wheel.previousX - closestX) * normalX + (wheel.previousY - closestY) * normalY;
  if (signedDistance >= WHEEL_RADIUS || (signedDistance < 0 && previousDistance < -1)) return;

  const penetration = WHEEL_RADIUS - signedDistance;
  const wheelWeight = 0.32;
  const inverseA = a.pinned ? 0 : 1;
  const inverseB = b.pinned ? 0 : 1;
  const total = wheelWeight + (1 - projection) ** 2 * inverseA + projection ** 2 * inverseB;
  if (total <= 0) return;

  wheel.x += normalX * penetration * (wheelWeight / total);
  wheel.y += normalY * penetration * (wheelWeight / total);
  a.x -= normalX * penetration * ((1 - projection) * inverseA / total);
  a.y -= normalY * penetration * ((1 - projection) * inverseA / total);
  b.x -= normalX * penetration * (projection * inverseB / total);
  b.y -= normalY * penetration * (projection * inverseB / total);
  wheel.grounded = true;
}

function updateBeamStress(simulation: BridgeSimulation, dt: number): void {
  simulation.maxStress = 0;
  for (const beam of simulation.beams) {
    if (beam.broken) continue;
    const a = simulation.nodes.find((node) => node.id === beam.a);
    const b = simulation.nodes.find((node) => node.id === beam.b);
    if (!a || !b) continue;
    const length = Math.hypot(a.x - b.x, a.y - b.y);
    const stretch = beam.kind === 'cable' ? Math.max(0, length - beam.restLength) : Math.abs(length - beam.restLength);
    const ratio = stretch / beam.restLength;
    beam.stress = beam.stress * 0.88 + ratio * 0.12;
    simulation.maxStress = Math.max(simulation.maxStress, beam.stress);
    const threshold = beam.kind === 'cable' ? 0.12 : 0.035;
    beam.overstressFor = beam.stress > threshold ? beam.overstressFor + dt : Math.max(0, beam.overstressFor - dt * 2);
    if (beam.overstressFor > 0.18) {
      beam.broken = true;
      simulation.brokenBeamIds.push(beam.id);
    }
  }
}

function updateTestStatus(simulation: BridgeSimulation): void {
  const { rear, front } = simulation.car;
  if (rear.y > 352 || front.y > 352 || simulation.elapsed >= MAX_TEST_SECONDS) {
    simulation.status = 'failed';
    return;
  }
  if (rear.x >= 582 && front.x >= 582 && rear.y < 230 && front.y < 230) {
    simulation.status = 'crossed';
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
