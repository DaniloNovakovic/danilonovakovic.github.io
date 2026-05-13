import {
  bridgeActions,
  bridgeStore,
  type BridgeRidgeProgressState
} from '@/game/bridge/store';
import { STAMPEDE_SKETCH_RIDGE_STAMP_ID } from '@/game/bridge/ridgeProgressIds';
import type { StampedeRewardStatus } from './resultPresentation';

export const STAMPEDE_FIRST_CLEAR_GLIDE_PIPS = 1;

export function getStampedeFirstClearRewardStatus(
  ridgeProgress: Pick<BridgeRidgeProgressState, 'stampIds'>
): StampedeRewardStatus {
  return ridgeProgress.stampIds.includes(STAMPEDE_SKETCH_RIDGE_STAMP_ID)
    ? 'alreadyOwned'
    : 'earned';
}

export function claimStampedeFirstClearReward(): StampedeRewardStatus {
  const status = getStampedeFirstClearRewardStatus(
    bridgeStore.getState().progress.ridge
  );
  if (status === 'alreadyOwned') return status;

  bridgeActions.awardRidgeStamp(STAMPEDE_SKETCH_RIDGE_STAMP_ID);
  bridgeActions.awardRidgeGlidePip(STAMPEDE_FIRST_CLEAR_GLIDE_PIPS);
  return status;
}
