import { DataTexture, MeshToonMaterial, NearestFilter, RedFormat, type MeshToonMaterialParameters } from 'three';

/** Night lab (#144): deep navy, near-black ink, warm light strips, pink aliens. Our own colours. */
export const NIGHT_LAB = {
  background: 0x141a33,
  wall: 0x5468a8,
  floor: 0x2a3566,
  ceiling: 0x34407a,
  strip: 0xffd36e,
  crate: 0x57c4b8,
  glass: 0x9fb4ff,
  fluid: 0x7fe0c8,
  steel: 0x8b8fa8,
  cable: 0x1d2340,
  skin: 0xc8b4c6,
  brain: 0xff9fbf,
  paper: 0xf4efe2,
  alert: 0xff5b4a,
  ink: 0x0b0e1c,
  panel: 'rgba(11,14,28,.6)'
} as const;

export type Toon = (color: number, extra?: MeshToonMaterialParameters) => MeshToonMaterial;

/**
 * Flat fills with one soft shadow tone: the ink carries the form. Plain
 * colours are shared, so a room has a handful of materials, not hundreds.
 */
export function makeToon(): Toon {
  const gradient = new DataTexture(new Uint8Array([205, 255]), 2, 1, RedFormat);
  gradient.minFilter = gradient.magFilter = NearestFilter;
  gradient.needsUpdate = true;
  const shared = new Map<number, MeshToonMaterial>();
  return (color, extra) => {
    if (extra) return new MeshToonMaterial({ color, gradientMap: gradient, ...extra });
    let material = shared.get(color);
    if (!material) {
      material = new MeshToonMaterial({ color, gradientMap: gradient });
      shared.set(color, material);
    }
    return material;
  };
}

/** Deterministic randomness, so the shattered glass lands the same way every time. */
export function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
