import type { BridgeDialogueCatalog } from './bridgeStage';
import type { ConcertDialogueCatalog } from './concertStage';
import type { DanceDialogueCatalog } from './danceStage';
import type { RelayDialogueCatalog } from './relayStage';
import type { RidgeRouteDialogueCatalog } from './routeStages';

/** Plain message shape shared by i18n and the Node CLI. */
export interface RidgeRouteMessageBundle {
  bridge: {
    speakers: BridgeDialogueCatalog['speakers'];
    dialogue: Record<string, string>;
  };
  concert: {
    speakers: ConcertDialogueCatalog['speakers'];
    dialogue: Record<string, string>;
  };
  dance: {
    speakers: DanceDialogueCatalog['speakers'];
    dialogue: Record<string, string>;
  };
  relay: {
    speakers: RelayDialogueCatalog['speakers'];
    dialogue: Record<string, string>;
  };
}

export function loadRouteCatalogFromMessages(
  ridge: RidgeRouteMessageBundle
): RidgeRouteDialogueCatalog {
  return {
    bridge: {
      speakers: { ...ridge.bridge.speakers },
      lines: { ...ridge.bridge.dialogue }
    },
    concert: {
      speakers: { ...ridge.concert.speakers },
      lines: { ...ridge.concert.dialogue }
    },
    dance: {
      speakers: { ...ridge.dance.speakers },
      lines: { ...ridge.dance.dialogue }
    },
    relay: {
      speakers: { ...ridge.relay.speakers },
      lines: { ...ridge.relay.dialogue }
    }
  };
}
