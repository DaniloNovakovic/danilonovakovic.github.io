import { describe, expect, it } from 'vitest';
import {
  createPotassiumProjectileControl,
  POTASSIUM_PROJECTILE_CONTROL_DEFAULTS
} from './potassiumSlipProjectileControl';

const launchPad = { x: 500, y: 538, radius: 44 };

function createControl() {
  return createPotassiumProjectileControl({
    launchPad,
    ...POTASSIUM_PROJECTILE_CONTROL_DEFAULTS
  });
}

describe('potassium slip projectile control', () => {
  it('begins aiming with reset and recall visual commands', () => {
    const control = createControl();

    expect(control.beginAiming(7)).toEqual([
      { type: 'setRecallVisual', active: false },
      { type: 'resetBananaForAim' }
    ]);
    expect(control.getSnapshot()).toEqual({ state: 'aiming', pointerId: 7 });
  });

  it('releases below threshold by cancelling without launch velocity', () => {
    const control = createControl();
    control.beginAiming(7);

    expect(control.release({
      pointer: { x: 510, y: 538 },
      banana: launchPad,
      maxSpeed: 760
    })).toEqual([
      { type: 'clearAim' },
      { type: 'clearTether' }
    ]);
    expect(control.getSnapshot().state).toBe('idle');
  });

  it('releases above threshold with clamped launch velocity and random spin command', () => {
    const control = createControl();
    control.beginAiming(7);

    expect(control.release({
      pointer: { x: 630, y: 538 },
      banana: launchPad,
      maxSpeed: 760
    })).toEqual([
      { type: 'setBananaVelocity', x: 760, y: 0 },
      { type: 'setBananaAngularVelocityRandom', min: -520, max: 520 },
      { type: 'clearAim' },
      { type: 'clearTether' },
      { type: 'setRecallVisual', active: false }
    ]);
    expect(control.getSnapshot()).toEqual({ state: 'idle', pointerId: null });
  });

  it('begins recall and transitions to aiming when banana returns to launch zone', () => {
    const control = createControl();

    expect(control.beginRecall(9)).toEqual([{ type: 'setRecallVisual', active: true }]);
    expect(control.update({
      banana: { x: 505, y: 536 },
      velocity: { x: -100, y: 80 },
      activePointer: { id: 4, x: 520, y: 530 }
    })).toEqual([
      { type: 'moveBananaToLaunchPad', speed: 720 },
      { type: 'setBananaAngularVelocityFromX', multiplier: 2, min: -520, max: 520 },
      { type: 'drawRecallTether' },
      { type: 'setBananaPosition', x: 500, y: 538 },
      { type: 'setBananaVelocity', x: 0, y: 0 },
      { type: 'setRecallVisual', active: false },
      { type: 'resetBananaForAim' }
    ]);
    expect(control.getSnapshot()).toEqual({ state: 'aiming', pointerId: 9 });
  });

  it('applies idle drag and stopping thresholds', () => {
    const control = createControl();

    expect(control.applyIdleDrag({
      velocity: { x: 20, y: 0 },
      deltaMs: 16.67
    })).toEqual([
      { type: 'setBananaVelocity', x: 0, y: 0 },
      { type: 'setBananaAngularVelocity', value: 0 }
    ]);

    expect(control.applyIdleDrag({
      velocity: { x: 100, y: 0 },
      deltaMs: 16.67
    })).toEqual([
      { type: 'setBananaVelocity', x: 99.75, y: 0 }
    ]);
  });

  it('uses launch-zone radius checks without Phaser', () => {
    const control = createControl();

    expect(control.isInLaunchZone({ x: 500, y: 538 })).toBe(true);
    expect(control.isInLaunchZone({ x: 545, y: 538 })).toBe(false);
    expect(control.isInLaunchZone({ x: 534, y: 538 }, 34)).toBe(true);
  });
});
