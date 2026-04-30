/**
 * Canonical portfolio / minigame identifiers. Keep registry, Phaser scenes, and textures aligned to these values.
 */
export const MINI_GAME_IDS = [
  'profile',
  'experiences',
  'projects',
  'abilities',
  'hobbies',
  'basement',
  'potassium',
  'contact',
  'games',
  'art',
  'music',
  'fitness',
  'dancing'
] as const;

export type MiniGameId = (typeof MINI_GAME_IDS)[number];

/** React hobby overlays opened from inside the Hobbies Phaser room. */
export const HOBBY_REACT_OVERLAY_IDS = ['games', 'art', 'music', 'fitness', 'dancing'] as const;

export type HobbyReactOverlayId = (typeof HOBBY_REACT_OVERLAY_IDS)[number];

export function isMiniGameId(id: string): id is MiniGameId {
  return (MINI_GAME_IDS as readonly string[]).includes(id);
}

export function isHobbyReactOverlayId(id: string): id is HobbyReactOverlayId {
  return (HOBBY_REACT_OVERLAY_IDS as readonly string[]).includes(id);
}

/** Overworld building + interior Phaser feature id (must match registry). */
export const HOBBIES_FEATURE_ID = 'hobbies' satisfies MiniGameId;
export const BASEMENT_FEATURE_ID = 'basement' satisfies MiniGameId;
export const POTASSIUM_FEATURE_ID = 'potassium' satisfies MiniGameId;

/** Phaser scene keys (must match `Scene` constructor `super({ key })` and registry `id` for PHASER_SCENE entries). */
export const PHASER_SCENE_KEYS = {
  main: 'MainScene',
  hobbies: 'hobbies',
  basement: 'basement',
  potassium: 'potassium'
} as const;
