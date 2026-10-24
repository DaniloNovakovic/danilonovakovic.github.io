import { bridgeActions, isItemOwned } from '@/game/bridge/store';
import type { StampedeRewardStatus } from './resultPresentation';

export function getStampedeFirstClearRewardStatus(): StampedeRewardStatus {
  return isItemOwned('glasses') ? 'alreadyOwned' : 'earned';
}

export function claimStampedeFirstClearReward(): StampedeRewardStatus {
  const status = getStampedeFirstClearRewardStatus();
  if (status === 'alreadyOwned') return status;

  bridgeActions.collectGlasses();
  return status;
}
