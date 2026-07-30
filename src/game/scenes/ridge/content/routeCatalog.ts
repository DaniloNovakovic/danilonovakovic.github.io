import {
  loadRouteCatalogFromMessages,
  type RidgeRouteDialogueCatalog
} from '@/game/core/ridge';
import { getMessages } from '@/shared/i18n';

/** Wires i18n copy into the full first-playable Ridge route catalog. */
export function loadRidgeRouteDialogueCatalog(): RidgeRouteDialogueCatalog {
  return loadRouteCatalogFromMessages(getMessages().scenes.ridge);
}
