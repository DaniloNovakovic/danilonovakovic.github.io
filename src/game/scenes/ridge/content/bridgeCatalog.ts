import type { BridgeDialogueCatalog } from '@/game/core/ridge';
import { getMessages } from '@/shared/i18n';

/** Wires i18n copy into the pure Bridge stage catalog. */
export function loadBridgeDialogueCatalog(): BridgeDialogueCatalog {
  const bridge = getMessages().scenes.ridge.bridge;
  return {
    speakers: {
      prompt: bridge.speakers.prompt,
      cicka: bridge.speakers.cicka,
      bridgeDraftsperson: bridge.speakers.bridgeDraftsperson
    },
    lines: { ...bridge.dialogue }
  };
}
