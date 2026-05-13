import { beforeEach, describe, expect, it } from 'vitest';
import { STAMPEDE_SKETCH_RIDGE_STAMP_ID } from '@/game/bridge/ridgeProgressIds';
import { bridgeActions, bridgeStore } from '@/game/bridge/store';
import {
  STAMPEDE_FIRST_CLEAR_GLIDE_PIPS,
  claimStampedeFirstClearReward,
  getStampedeFirstClearRewardStatus
} from './rewards';

describe('stampede durable rewards', () => {
  beforeEach(() => {
    bridgeActions.resetProgress();
  });

  it('awards the first-clear stamp and one glide pip once', () => {
    expect(claimStampedeFirstClearReward()).toBe('earned');
    expect(bridgeStore.getState().progress.ridge.stampIds).toEqual([
      STAMPEDE_SKETCH_RIDGE_STAMP_ID
    ]);
    expect(bridgeStore.getState().progress.ridge.mobility.glidePips).toBe(
      STAMPEDE_FIRST_CLEAR_GLIDE_PIPS
    );

    expect(claimStampedeFirstClearReward()).toBe('alreadyOwned');
    expect(bridgeStore.getState().progress.ridge.stampIds).toEqual([
      STAMPEDE_SKETCH_RIDGE_STAMP_ID
    ]);
    expect(bridgeStore.getState().progress.ridge.mobility.glidePips).toBe(
      STAMPEDE_FIRST_CLEAR_GLIDE_PIPS
    );
  });

  it('derives reward status from the Stampede stamp id', () => {
    expect(getStampedeFirstClearRewardStatus({ stampIds: [] })).toBe('earned');
    expect(getStampedeFirstClearRewardStatus({
      stampIds: [STAMPEDE_SKETCH_RIDGE_STAMP_ID]
    })).toBe('alreadyOwned');
  });
});
