/** Clamp `value` to the inclusive range `[min, max]`. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Linear interpolation from `from` to `to` at parameter `t` (typically 0–1). */
export function linear(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}
