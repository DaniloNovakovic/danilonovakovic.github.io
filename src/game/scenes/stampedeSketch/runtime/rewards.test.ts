import { beforeEach, describe, expect, it } from 'vitest';
import { bridgeActions, bridgeStore, isItemEquipped, isItemOwned } from '@/game/bridge/store';
import {
  claimStampedeFirstClearReward,
  getStampedeFirstClearRewardStatus
} from './rewards';

describe('stampede durable rewards', () => {
  beforeEach(() => {
    bridgeActions.resetProgress();
  });

  it('awards glasses once on the first clear', () => {
    expect(claimStampedeFirstClearReward()).toBe('earned');
    expect(isItemOwned('glasses')).toBe(true);
    expect(isItemEquipped('glasses')).toBe(true);

    expect(claimStampedeFirstClearReward()).toBe('alreadyOwned');
    expect(bridgeStore.getState().inventory.ownedItemIds.filter((id) => id === 'glasses')).toHaveLength(1);
  });

  it('derives reward status from glasses ownership', () => {
    expect(getStampedeFirstClearRewardStatus()).toBe('earned');
    bridgeActions.collectGlasses();
    expect(getStampedeFirstClearRewardStatus()).toBe('alreadyOwned');
  });
});
