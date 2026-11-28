import type { CellCenter, RealWorldRoom } from './labRoom';
import { distanceTo, footprintsOf, isSolidAt } from './labRoom';
import { angleBetween, startPatrol, stepPatrol, turnTowards, yawTowards, type Patrol, type Route } from './patrol';

/**
 * Light and shadow (#145): the light strips throw pools of light, the dark
 * between them is where you hide. An alien sees you from far off in a pool,
 * and only right up close in the dark. Seeing you fills its alert meter,
 * quickly when you're near and lit; out of sight, the meter drains. Full is
 * caught.
 */
export const STEALTH = {
  /** How lit the darkest corner is, 0..1. */
  ambient: 0.15,
  /** Full light this close under a strip; none past `poolReach`. */
  poolCore: 1,
  poolReach: 2.3,
  /** Alert per second at the far edge of its sight, and right up close. */
  fillAtEdge: 0.6,
  fillUpClose: 2.2,
  /** Alert lost per second out of sight. */
  drain: 0.4,
  /** Past this, it stops and turns to look. */
  suspicious: 0.3,
  /** This close, it notices you whichever way it faces: you're in its way. */
  touch: 0.9,
  /** Furniture taller than this blocks a line of sight. */
  blocksSight: 1.5,
  /** Steps along a line of sight. */
  sightStep: 0.2
} as const;

export type GuardKind = 'researcher' | 'officer';

/**
 * How far each sees into full light (it scales down with the light), how
 * wide, and how quickly it makes up its mind: the officer is trained for it.
 */
export const SIGHT: Readonly<Record<GuardKind, { range: number; halfAngle: number; alertness: number }>> = {
  researcher: { range: 8, halfAngle: 0.75, alertness: 1 },
  officer: { range: 10, halfAngle: 0.65, alertness: 1.5 }
};

const smooth = (t: number) => t * t * (3 - 2 * t);

/** How lit (x, z) is, from `STEALTH.ambient` in the dark to 1 under a strip. */
export function lightAt(room: RealWorldRoom, x: number, z: number): number {
  let pool = 0;
  for (const strip of room.strips ?? []) {
    const d = Math.hypot(x - strip.x, z - strip.z);
    if (d >= STEALTH.poolReach) continue;
    const t = d <= STEALTH.poolCore ? 1 : 1 - (d - STEALTH.poolCore) / (STEALTH.poolReach - STEALTH.poolCore);
    pool = Math.max(pool, smooth(t));
  }
  return STEALTH.ambient + (1 - STEALTH.ambient) * pool;
}

/** How far `kind` sees someone standing in `light`. */
export const sightRange = (kind: GuardKind, light: number) => SIGHT[kind].range * light;

/** Nothing in between: no wall, no shut door, nothing tall. */
export function hasLineOfSight(room: RealWorldRoom, doorsOpen: boolean, from: CellCenter, to: CellCenter): boolean {
  const distance = Math.hypot(to.x - from.x, to.z - from.z);
  const steps = Math.ceil(distance / STEALTH.sightStep);
  const tall = footprintsOf(room).filter((footprint) => footprint.top > STEALTH.blocksSight);
  for (let i = 1; i < steps; i++) {
    const x = from.x + ((to.x - from.x) * i) / steps;
    const z = from.z + ((to.z - from.z) * i) / steps;
    if (isSolidAt(room.walls, x, z, doorsOpen)) return false;
    if (tall.some((footprint) => distanceTo(footprint, x, z) === 0)) return false;
  }
  return true;
}

/** Where an alien stands and which way it faces. */
export interface Eye {
  x: number;
  z: number;
  yaw: number;
}

/** How fast `kind`, at `eye`, fills its alert on the player at `player`, per second; 0 if it can't see them. */
export function noticeRate(
  room: RealWorldRoom,
  doorsOpen: boolean,
  kind: GuardKind,
  eye: Eye,
  player: CellCenter
): number {
  const distance = Math.hypot(player.x - eye.x, player.z - eye.z);
  const { alertness } = SIGHT[kind];
  if (distance < STEALTH.touch)
    return hasLineOfSight(room, doorsOpen, eye, player) ? STEALTH.fillUpClose * alertness : 0;
  const range = sightRange(kind, lightAt(room, player.x, player.z));
  if (distance > range) return 0;
  const off = Math.abs(angleBetween(eye.yaw, yawTowards(eye.x, eye.z, player.x, player.z)));
  if (off > SIGHT[kind].halfAngle) return 0;
  if (!hasLineOfSight(room, doorsOpen, eye, player)) return 0;
  const closeness = 1 - distance / range;
  return (STEALTH.fillAtEdge + (STEALTH.fillUpClose - STEALTH.fillAtEdge) * closeness) * alertness;
}

/** An alien on the deck: who it is and its round. */
export interface GuardPlan {
  kind: GuardKind;
  route: Route;
}

/** Walking its round; stopped and turned to look (something's there); caught you. */
export type GuardState = 'patrol' | 'suspicious' | 'caught';

export interface Guard {
  patrol: Patrol;
  /** 0..1; full is caught. */
  alert: number;
  state: GuardState;
  /** Where it last saw you. */
  lookAt: CellCenter | null;
}

export const startGuard = (plan: GuardPlan): Guard => ({
  patrol: startPatrol(plan.route),
  alert: 0,
  state: 'patrol',
  lookAt: null
});

function nextState(guard: Guard, alert: number): GuardState {
  if (alert >= 1) return 'caught';
  if (alert >= STEALTH.suspicious || (guard.state === 'suspicious' && alert > 0)) return 'suspicious';
  return 'patrol';
}

/**
 * One frame: look for the player (null: not on this deck), fill or drain the
 * alert, and walk the round, or stand and turn towards where it saw them.
 * Caught stays caught.
 */
export function stepGuard(
  room: RealWorldRoom,
  plan: GuardPlan,
  guard: Guard,
  player: CellCenter | null,
  doorsOpen: boolean,
  dt: number
): Guard {
  if (guard.state === 'caught') return guard;
  const rate = player ? noticeRate(room, doorsOpen, plan.kind, guard.patrol, player) : 0;
  const alert = rate ? Math.min(1, guard.alert + rate * dt) : Math.max(0, guard.alert - STEALTH.drain * dt);
  const lookAt = rate && player ? { x: player.x, z: player.z } : guard.lookAt;
  const state = nextState(guard, alert);
  if (state === 'patrol') return { patrol: stepPatrol(plan.route, guard.patrol, dt), alert, state, lookAt };
  const { patrol } = guard;
  const towards = lookAt ? yawTowards(patrol.x, patrol.z, lookAt.x, lookAt.z) : patrol.yaw;
  const turn = state === 'caught' ? Math.PI : plan.route.turnSpeed * dt;
  return { patrol: { ...patrol, yaw: turnTowards(patrol.yaw, towards, turn), moving: false }, alert, state, lookAt };
}
