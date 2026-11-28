import { aimMiss, type View } from './aim';
import type { CellCenter, RealWorldRoom } from './labRoom';
import { startPatrol, stepPatrol, type Patrol, type Route } from './patrol';
import { startGuard, stepGuard, type Guard, type GuardPlan } from './stealth';
import type { Noise } from './throwables';

/**
 * The run across the ship deck (#145), from the storeroom to the blaster in
 * its cage: the cleaning drone that opens the storeroom's door, the aliens on
 * their rounds, the checkpoints, getting caught, and getting there.
 */

/** Where you start again when caught: the latest one reached, never one of a lower rank. */
export interface Checkpoint {
  id: string;
  rank: number;
  area: { x0: number; z0: number; x1: number; z1: number };
  spawn: CellCenter;
}

export interface DronePlan {
  docks: readonly CellCenter[];
  /** The service door's inside face; it opens for a drone this close. */
  door: CellCenter;
  /** Out through the door: where the round starts. */
  corridor: CellCenter;
  beat: Route;
}

export interface EscapePlan {
  room: RealWorldRoom;
  guards: readonly GuardPlan[];
  checkpoints: readonly Checkpoint[];
  drones: DronePlan;
  /** In front of the armoury cage: get this close and you've made it. */
  cage: CellCenter & { reach: number };
}

/** The drone you woke: which dock it came from, rolling out of the storeroom or out on its round. */
export interface Drone {
  dock: number;
  phase: 'rolling' | 'cleaning';
  patrol: Patrol;
}

export interface Escape {
  guards: Guard[];
  /** Null while both drones are asleep. */
  drone: Drone | null;
  /** The storeroom door: once a drone opens it, it stays open. */
  doorOpen: boolean;
  checkpoint: number;
  caught: boolean;
  /** At the cage: the end of this stretch. */
  reached: boolean;
}

/** A drone opens the door from this close. */
const DOOR_REACH = 1.1;
/** A drone's pause in front of the door while it slides open. */
const DOOR_WAIT = 1.2;
const DRONE_SPEED = 0.9;

export const startEscape = (plan: EscapePlan): Escape => ({
  guards: plan.guards.map(startGuard),
  drone: null,
  doorOpen: false,
  checkpoint: 0,
  caught: false,
  reached: false
});

/** A woken drone's way out: off the dock, to the door, through it. */
function rollOut(plan: DronePlan, dock: number): Route {
  const from = plan.docks[dock];
  const { door, corridor } = plan;
  return {
    mode: 'once',
    speed: DRONE_SPEED,
    turnSpeed: 2.4,
    posts: [
      { x: from.x, z: from.z },
      { x: from.x, z: door.z },
      { x: door.x + DOOR_REACH * 0.9, z: door.z, wait: DOOR_WAIT },
      corridor
    ]
  };
}

/** Wake a sleeping drone: it rolls off for the door. Only one goes; the other sleeps on. */
export function wakeDrone(plan: EscapePlan, escape: Escape, dock: number): Escape {
  if (escape.drone || !plan.drones.docks[dock]) return escape;
  return { ...escape, drone: { dock, phase: 'rolling', patrol: startPatrol(rollOut(plan.drones, dock)) } };
}

function stepDrone(plan: DronePlan, drone: Drone, dt: number): Drone {
  if (drone.phase === 'cleaning') return { ...drone, patrol: stepPatrol(plan.beat, drone.patrol, dt) };
  const patrol = stepPatrol(rollOut(plan, drone.dock), drone.patrol, dt);
  return patrol.done ? { ...drone, phase: 'cleaning', patrol: startPatrol(plan.beat) } : { ...drone, patrol };
}

/** The sleeping drone under the crosshair and within reach, if any. */
export function aimedDock(plan: EscapePlan, escape: Escape, view: View): number | null {
  if (escape.drone) return null;
  let best: number | null = null;
  let bestMiss = 0.6;
  plan.drones.docks.forEach((dock, index) => {
    const aim = aimMiss(view, { x: dock.x, y: 0.45, z: dock.z }, 3.2);
    if (aim && aim.miss < bestMiss) {
      best = index;
      bestMiss = aim.miss;
    }
  });
  return best;
}

const inside = ({ area }: Checkpoint, { x, z }: CellCenter) =>
  x >= area.x0 && x <= area.x1 && z >= area.z0 && z <= area.z1;

/** The checkpoint to start again from after passing `player`. */
export function checkpointAt(plan: EscapePlan, current: number, player: CellCenter): number {
  const index = plan.checkpoints.findIndex((checkpoint) => inside(checkpoint, player));
  if (index < 0 || index === current) return current;
  return plan.checkpoints[index].rank >= plan.checkpoints[current].rank ? index : current;
}

/**
 * One frame on the deck: the drone rolls (and opens the door), the aliens look
 * for `player` (null: not on the deck yet) and listen for `noises` (things
 * Danilo threw clattering down), checkpoints are passed, and either
 * one of them has caught you or you've reached the cage. Then it all holds
 * still until `retry`.
 */
export function stepEscape(
  plan: EscapePlan,
  escape: Escape,
  player: CellCenter | null,
  dt: number,
  noises: readonly Noise[] = []
): Escape {
  if (escape.caught || escape.reached) return escape;
  const drone = escape.drone && stepDrone(plan.drones, escape.drone, dt);
  const { door } = plan.drones;
  const doorOpen =
    escape.doorOpen || (!!drone && Math.hypot(drone.patrol.x - door.x, drone.patrol.z - door.z) <= DOOR_REACH);
  const guards = escape.guards.map((guard, i) =>
    stepGuard(plan.room, plan.guards[i], guard, player, doorOpen, dt, noises)
  );
  const caught = guards.some((guard) => guard.state === 'caught');
  const checkpoint = player && !caught ? checkpointAt(plan, escape.checkpoint, player) : escape.checkpoint;
  const reached = !caught && !!player && Math.hypot(player.x - plan.cage.x, player.z - plan.cage.z) <= plan.cage.reach;
  return { guards, drone, doorOpen, checkpoint, caught, reached };
}

/** Start again after being caught: the aliens back on their rounds, you at the latest checkpoint. */
export function retry(plan: EscapePlan, escape: Escape): { escape: Escape; spawn: CellCenter } {
  return {
    escape: { ...escape, guards: plan.guards.map(startGuard), caught: false },
    spawn: plan.checkpoints[escape.checkpoint].spawn
  };
}
