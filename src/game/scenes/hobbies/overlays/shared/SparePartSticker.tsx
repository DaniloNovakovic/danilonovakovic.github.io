import { useMessages } from '@/shared/i18n';
import { RewardSticker } from './RewardSticker';
import type { SparePartId, SparePartOutcome } from './useSparePartReward';

interface SparePartStickerProps {
  partId: SparePartId;
  outcome: SparePartOutcome | null;
  onDismiss: () => void;
}

/** Reward sticker for a spare Circuit part; renders nothing until a win. */
export function SparePartSticker({ partId, outcome, onDismiss }: SparePartStickerProps) {
  const copy = useMessages().miniGames.sparePart;
  if (!outcome) return null;
  const found = outcome === 'found';
  return (
    <RewardSticker
      icon={partId}
      title={found ? copy.foundTitle : copy.replayTitle}
      label={copy.names[partId]}
      body={found ? copy.foundHint : copy.replayHint}
      dismissLabel={copy.dismiss}
      onDismiss={onDismiss}
    />
  );
}
