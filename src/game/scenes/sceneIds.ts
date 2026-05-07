export const SCENE_IDS = [
  'overworld',
  'hobbies',
  'basement',
  'potassium',
  'ridge',
  'stampedeSketch'
] as const;

export type SceneId = (typeof SCENE_IDS)[number];

export const OVERWORLD_SCENE_ID = 'overworld' satisfies SceneId;
export const HOBBIES_SCENE_ID = 'hobbies' satisfies SceneId;
export const BASEMENT_SCENE_ID = 'basement' satisfies SceneId;
export const POTASSIUM_SCENE_ID = 'potassium' satisfies SceneId;
export const RIDGE_SCENE_ID = 'ridge' satisfies SceneId;
export const STAMPEDE_SKETCH_SCENE_ID = 'stampedeSketch' satisfies SceneId;

export const PHASER_SCENE_KEYS = {
  overworld: 'MainScene',
  hobbies: HOBBIES_SCENE_ID,
  basement: BASEMENT_SCENE_ID,
  potassium: POTASSIUM_SCENE_ID,
  ridge: RIDGE_SCENE_ID,
  stampedeSketch: STAMPEDE_SKETCH_SCENE_ID
} as const;

export function isSceneId(id: string | null | undefined): id is SceneId {
  return id !== null && id !== undefined && (SCENE_IDS as readonly string[]).includes(id);
}
