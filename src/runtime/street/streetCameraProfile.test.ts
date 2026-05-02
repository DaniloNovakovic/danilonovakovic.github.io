import { describe, expect, it } from 'vitest';
import {
  DEFAULT_STREET_CAMERA_PROFILE,
  getStreetCameraProfile,
  MOBILE_STREET_CAMERA_PROFILE
} from './streetCameraProfile';

describe('getStreetCameraProfile', () => {
  it('uses portrait viewport tuning for portrait phone displays', () => {
    expect(getStreetCameraProfile({ displayWidth: 390, displayHeight: 844 })).toEqual({
      ...MOBILE_STREET_CAMERA_PROFILE,
      zoom: 1
    });
  });

  it('uses the default profile for desktop and tablet displays', () => {
    expect(getStreetCameraProfile({ displayWidth: 768, displayHeight: 461 })).toEqual(
      DEFAULT_STREET_CAMERA_PROFILE
    );
    expect(getStreetCameraProfile({ displayWidth: 1000, displayHeight: 600 })).toEqual(
      DEFAULT_STREET_CAMERA_PROFILE
    );
  });

  it('does not over-zoom landscape displays', () => {
    expect(getStreetCameraProfile({ displayWidth: 667, displayHeight: 375 })).toEqual(
      DEFAULT_STREET_CAMERA_PROFILE
    );
  });
});
