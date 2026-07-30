import type { RidgeStageRegistry } from '../types';
import { createBridgeStage, type BridgeDialogueCatalog } from './bridgeStage';
import { createConcertStage, type ConcertDialogueCatalog } from './concertStage';
import { createDanceStage, type DanceDialogueCatalog } from './danceStage';
import { createRelayStage, type RelayDialogueCatalog } from './relayStage';

export interface RidgeRouteDialogueCatalog {
  bridge: BridgeDialogueCatalog;
  concert: ConcertDialogueCatalog;
  dance: DanceDialogueCatalog;
  relay: RelayDialogueCatalog;
}

/** Build the full first-playable Compact Ridge Stage registry. */
export function createRidgeRouteStages(
  catalog: RidgeRouteDialogueCatalog
): RidgeStageRegistry {
  return {
    bridge: createBridgeStage(catalog.bridge),
    concert: createConcertStage(catalog.concert),
    danceFestival: createDanceStage(catalog.dance),
    relay: createRelayStage(catalog.relay)
  };
}
