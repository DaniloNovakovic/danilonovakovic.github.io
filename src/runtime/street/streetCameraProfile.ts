export interface StreetCameraViewport {
  displayWidth: number;
  displayHeight: number;
}

export interface StreetCameraProfile {
  zoom: number;
  followOffsetY: number;
}

export const DEFAULT_STREET_CAMERA_PROFILE: StreetCameraProfile = {
  zoom: 1,
  followOffsetY: 100
};

export const MOBILE_STREET_CAMERA_PROFILE: StreetCameraProfile = {
  zoom: 1,
  followOffsetY: 76
};

const MOBILE_MAX_DISPLAY_WIDTH = 767;

export function getStreetCameraProfile({
  displayWidth,
  displayHeight
}: StreetCameraViewport): StreetCameraProfile {
  const isPortraitPhone =
    Number.isFinite(displayWidth) &&
    Number.isFinite(displayHeight) &&
    displayWidth > 0 &&
    displayHeight > 0 &&
    displayWidth <= MOBILE_MAX_DISPLAY_WIDTH &&
    displayHeight > displayWidth;

  return isPortraitPhone ? MOBILE_STREET_CAMERA_PROFILE : DEFAULT_STREET_CAMERA_PROFILE;
}
