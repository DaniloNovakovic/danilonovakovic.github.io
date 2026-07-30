/**
 * Pure full-game console types. No Phaser, React, DOM, or bridge store.
 */

import type { RidgeObservation, RidgeRouteBeat } from '../ridge/types';
import type { GameSceneId, PortfolioOverlayId } from './content/overworldSpots';

export type GameItemId = 'glasses' | 'circuit';
export type GameSecretId = 'banana-peel-clue';
export type GameFacing = 'left' | 'right';

export type GameMode =
  | 'overworld'
  | 'basement'
  | 'hobbies'
  | 'potassium'
  | 'ridge'
  | 'overlay';

export type PotassiumPhase = 'lobby' | 'wave' | 'draft' | 'won' | 'lost';

export interface NearbyThing {
  id: string;
  label: string;
  distance: number;
  prompt: string;
  kind: 'building' | 'secret' | 'hatch' | 'crt' | 'pickup' | 'exit' | 'computer' | 'npc' | 'prop';
  /** World anchor for Phaser interact prompts (optional for headless). */
  promptX?: number;
  promptY?: number;
}

export interface OverlaySummary {
  id: PortfolioOverlayId | 'games' | 'inventory';
  title: string;
  blurb: string;
}

export interface OverworldSlice {
  playerX: number;
  playerY: number;
  facing: GameFacing;
  bananaFirstPeelPending: boolean;
}

export interface BasementSlice {
  playerX: number;
  facing: GameFacing;
}

export interface HobbiesSlice {
  playerX: number;
  facing: GameFacing;
}

export interface PotassiumSlice {
  phase: PotassiumPhase;
  wave: number;
  maxWaves: number;
  lives: number;
  score: number;
  draftChoices: readonly string[];
}

export interface GameWorldState {
  mode: GameMode;
  /** Scene under an open overlay, if any. */
  sceneId: GameSceneId;
  overlay: OverlaySummary | null;
  ownedItemIds: readonly GameItemId[];
  equippedItemIds: readonly GameItemId[];
  discoveredSecretIds: readonly GameSecretId[];
  overworld: OverworldSlice;
  basement: BasementSlice;
  hobbies: HobbiesSlice;
  potassium: PotassiumSlice;
  lastMessage: string | null;
  /** Ridge is hosted separately; beat mirrored for observation. */
  ridgeBeat: RidgeRouteBeat | null;
}

export interface GameObservation {
  mode: GameMode;
  sceneId: GameSceneId;
  overlay: OverlaySummary | null;
  ownedItemIds: readonly GameItemId[];
  equippedItemIds: readonly GameItemId[];
  discoveredSecretIds: readonly GameSecretId[];
  nearby: readonly NearbyThing[];
  prompt: string | null;
  lastMessage: string | null;
  hints: readonly string[];
  overworld: OverworldSlice | null;
  basement: BasementSlice | null;
  hobbies: HobbiesSlice | null;
  potassium: PotassiumSlice | null;
  ridge: RidgeObservation | null;
}

export type GameCommand =
  | { type: 'help' }
  | { type: 'look' }
  | { type: 'status' }
  | { type: 'inventory' }
  | { type: 'go'; direction: GameFacing; steps?: number }
  | { type: 'interact'; target?: string }
  | { type: 'equip'; itemId: GameItemId }
  | { type: 'unequip'; itemId: GameItemId }
  | { type: 'close' }
  | { type: 'advance' }
  | { type: 'choose'; choiceIdOrIndex: string }
  | { type: 'leave' }
  | { type: 'start' }
  | { type: 'fight' }
  | { type: 'draft'; choiceIdOrIndex: string }
  | { type: 'cheat'; action: 'give'; itemId: GameItemId }
  | { type: 'unknown'; raw: string };

export type GameSessionEvent =
  | { type: 'scene_entered'; sceneId: GameSceneId }
  | { type: 'scene_returned'; sceneId: GameSceneId }
  | { type: 'overlay_opened'; overlayId: string }
  | { type: 'overlay_closed'; overlayId: string }
  | { type: 'item_collected'; itemId: GameItemId }
  | { type: 'item_equipped'; itemId: GameItemId }
  | { type: 'item_unequipped'; itemId: GameItemId }
  | { type: 'secret_discovered'; secretId: GameSecretId }
  | { type: 'banana_peel_cancelled' }
  | { type: 'thought'; id: 'basement_cannot_see' }
  | { type: 'potassium_won' }
  | { type: 'ridge_beat_changed'; beat: RidgeRouteBeat }
  | { type: 'ridge_area_handoff'; areaId: string }
  | { type: 'ridge_route_reset' };

export interface GameCommandResult {
  ok: boolean;
  message: string;
  observation: GameObservation;
  events: readonly GameSessionEvent[];
}
