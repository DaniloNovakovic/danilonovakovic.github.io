/** Where the eye looks: `yaw` as for walking (0 towards -z), `pitch` up is positive. */
export interface View {
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
}

export interface Point3 {
  x: number;
  y: number;
  z: number;
}

export function lookDirection({ yaw, pitch }: View): Point3 {
  return {
    x: -Math.sin(yaw) * Math.cos(pitch),
    y: Math.sin(pitch),
    z: -Math.cos(yaw) * Math.cos(pitch)
  };
}

/**
 * How far the look ray passes from `point` and how far along it, or null
 * when the point is behind the eye or out of `reach`.
 */
export function aimMiss(view: View, point: Point3, reach: number): { miss: number; along: number } | null {
  const look = lookDirection(view);
  const dx = point.x - view.x;
  const dy = point.y - view.y;
  const dz = point.z - view.z;
  const along = dx * look.x + dy * look.y + dz * look.z;
  const squared = dx * dx + dy * dy + dz * dz;
  if (along <= 0 || squared > reach * reach) return null;
  return { miss: Math.sqrt(Math.max(0, squared - along * along)), along };
}
