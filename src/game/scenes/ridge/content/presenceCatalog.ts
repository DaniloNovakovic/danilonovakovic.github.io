import type { RidgeActorId } from '@/game/core/ridge';
import { getMessages } from '@/shared/i18n';

export interface RidgePresenceCatalog {
  /** Short role tag under a resident's name. */
  roles: Partial<Record<RidgeActorId, string>>;
  /** Lines a resident mutters as the player walks past. */
  barks: Readonly<Record<string, readonly string[]>>;
}

/** Wires i18n presence copy into the Ridge world chrome. */
export function loadRidgePresenceCatalog(): RidgePresenceCatalog {
  const { roles, barks } = getMessages().scenes.ridge.presence;
  return { roles, barks };
}
