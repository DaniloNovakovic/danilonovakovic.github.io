import { bridgeActions, type ScreenCrack } from '@/game/bridge/store';
import {
  DEBUGGING_TOOLS_ITEM_ID,
  HOBBIES_FLOOR_Y,
  HOBBIES_PLAYER_START_OFFSET_Y,
  OUT_OF_BOUNDS_STREET_ARRIVAL,
  OUT_OF_BOUNDS_TOOLBOX_X,
  SCREEN_DESTROYER_TOTAL_HITS,
  STREET_FIGHT_TOTAL_SMASHES
} from '@/game/core/console';
import { HOBBIES_SCENE_ID, OVERWORLD_SCENE_ID, PHASER_SCENE_KEYS, type SceneId } from '@/game/scenes/sceneIds';
import { placeNextSceneStart } from '@/game/sharedSceneRuntime/sceneResumePolicy';

/**
 * Dev-only jump points into the Out of Bounds arc. Every escape fact is derived
 * from bridge state (owning the Debugging Tools, crack count, dent count), so a
 * checkpoint is just that state plus where Danilo starts. It is applied on page
 * load (`?oob=<id>`), before Phaser boots, so every scene starts fresh.
 */
const OUT_OF_BOUNDS_CHECKPOINT_PARAM = 'oob';

export type OutOfBoundsCheckpointId = 'pickup' | 'street' | 'destroyer' | 'unplugged';

export interface OutOfBoundsCheckpoint {
  id: OutOfBoundsCheckpointId;
  sceneId: SceneId;
  start: { sceneKey: string; x: number; y: number };
  ownsDebuggingTools: boolean;
  cracks: number;
  dents: number;
}

const STREET_START = { sceneKey: PHASER_SCENE_KEYS.overworld, ...OUT_OF_BOUNDS_STREET_ARRIVAL };

export const OUT_OF_BOUNDS_CHECKPOINTS: readonly OutOfBoundsCheckpoint[] = [
  {
    id: 'pickup',
    sceneId: HOBBIES_SCENE_ID,
    // Just right of the toolbox, close enough to interact.
    start: {
      sceneKey: PHASER_SCENE_KEYS.hobbies,
      x: OUT_OF_BOUNDS_TOOLBOX_X + 90,
      y: HOBBIES_FLOOR_Y - HOBBIES_PLAYER_START_OFFSET_Y
    },
    ownsDebuggingTools: false,
    cracks: 0,
    dents: 0
  },
  {
    id: 'street',
    sceneId: OVERWORLD_SCENE_ID,
    start: STREET_START,
    ownsDebuggingTools: true,
    cracks: 0,
    dents: 0
  },
  {
    id: 'destroyer',
    sceneId: OVERWORLD_SCENE_ID,
    start: STREET_START,
    ownsDebuggingTools: true,
    cracks: STREET_FIGHT_TOTAL_SMASHES,
    dents: 0
  },
  {
    id: 'unplugged',
    sceneId: OVERWORLD_SCENE_ID,
    start: STREET_START,
    ownsDebuggingTools: true,
    cracks: STREET_FIGHT_TOTAL_SMASHES,
    dents: SCREEN_DESTROYER_TOTAL_HITS
  }
];

/** Smash points spread left and right of the middle, like a real fight. */
function smashes(count: number, seedOffset: number): ScreenCrack[] {
  return Array.from({ length: count }, (_, i) => ({
    x: i % 2 === 0 ? 0.3 : 0.7,
    y: 0.35 + ((i * 7) % 5) * 0.08,
    seed: seedOffset + i
  }));
}

export function findOutOfBoundsCheckpoint(id: string | null): OutOfBoundsCheckpoint | undefined {
  return OUT_OF_BOUNDS_CHECKPOINTS.find((checkpoint) => checkpoint.id === id);
}

/** Reset progress, then set up the escape state the checkpoint needs and enter its scene. */
export function applyOutOfBoundsCheckpoint(checkpoint: OutOfBoundsCheckpoint): void {
  bridgeActions.resetProgress();
  if (checkpoint.ownsDebuggingTools) bridgeActions.collectItem(DEBUGGING_TOOLS_ITEM_ID);
  smashes(checkpoint.cracks, 0).forEach((crack) => bridgeActions.crackScreen(crack));
  smashes(checkpoint.dents, 1000).forEach((dent) => bridgeActions.dentScreen(dent));
  const { sceneKey, x, y } = checkpoint.start;
  placeNextSceneStart(sceneKey, { x, y });
  bridgeActions.enterScene(checkpoint.sceneId);
}

/** The URL that reloads the interactive app at this checkpoint. */
export function outOfBoundsCheckpointUrl(id: OutOfBoundsCheckpointId, href: string): string {
  const url = new URL(href);
  url.searchParams.set('mode', 'interactive');
  url.searchParams.set(OUT_OF_BOUNDS_CHECKPOINT_PARAM, id);
  return url.toString();
}

/**
 * Applies `?oob=<id>` once, on load, and drops the param so a plain reload
 * plays normally. Dev builds only.
 */
export function applyOutOfBoundsCheckpointFromUrl(): void {
  if (!import.meta.env.DEV || typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  const checkpoint = findOutOfBoundsCheckpoint(url.searchParams.get(OUT_OF_BOUNDS_CHECKPOINT_PARAM));
  if (!checkpoint) return;
  applyOutOfBoundsCheckpoint(checkpoint);
  url.searchParams.delete(OUT_OF_BOUNDS_CHECKPOINT_PARAM);
  window.history.replaceState({}, '', url.toString());
}
