/**
 * The street fight's rules (#163), pure so they're tested: where the hammer
 * reaches, and how a pigeon lobs its egg so standing still gets you hit.
 */

/** How far in front of Danilo the hammer connects (a little behind too), and how high. */
export const HAMMER_REACH = { front: 120, back: 24, high: 120 } as const;

export interface FightPoint {
  x: number;
  y: number;
}

/** In front of Danilo (the way he last walked), or just behind, within the hammer's reach. */
export function inHammerReach(danilo: FightPoint, facingLeft: boolean, target: FightPoint): boolean {
  const ahead = (target.x - danilo.x) * (facingLeft ? -1 : 1);
  return (
    ahead >= -HAMMER_REACH.back && ahead <= HAMMER_REACH.front && Math.abs(target.y - danilo.y) <= HAMMER_REACH.high
  );
}

/**
 * The sideways speed that makes something dropped at `from` (falling from
 * `startVy` under `gravity`) arrive at `to`. A pigeon aims at where Danilo is
 * standing when it lets go: keep still and it lands on him.
 */
export function lobVelocityX(from: FightPoint, to: FightPoint, gravity: number, startVy: number): number {
  const fall = Math.max(10, to.y - from.y);
  const seconds = (-startVy + Math.sqrt(startVy ** 2 + 2 * gravity * fall)) / gravity;
  return (to.x - from.x) / seconds;
}
