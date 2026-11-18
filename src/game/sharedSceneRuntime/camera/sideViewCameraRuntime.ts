import * as Phaser from 'phaser';
import {
  getHorizontalCoverCropPadding,
  type SideViewCameraDesignSize,
  type SideViewCameraViewportSize
} from './sideViewCameraMath';

export type { SideViewCameraDesignSize, SideViewCameraViewportSize };

export interface SideViewCameraWorldBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SideViewCameraProfile {
  zoom: number;
  followOffsetY: number;
}

export interface SideViewCameraRuntimeOptions {
  scene: Phaser.Scene;
  followTarget: Phaser.GameObjects.GameObject;
  worldBounds: SideViewCameraWorldBounds;
  designSize: SideViewCameraDesignSize;
  resolveProfile: (viewport: SideViewCameraViewportSize) => SideViewCameraProfile;
  lerp?: {
    x: number;
    y: number;
  };
}

/** Extra wait after a zoom-out before the bounds tighten back to the world. */
const BOUNDS_RESTORE_SETTLE_MS = 500;

/**
 * A framed close-up, e.g. two people talking: the camera eases toward a world
 * point, zooms in, and seats that point at `screenY` of the view height.
 */
export interface SideViewCameraFocus {
  x: number;
  y: number;
  /** Multiplies the profile zoom. */
  zoom: number;
  /** 0 = top of the view, 1 = bottom. */
  screenY: number;
  /** 0 snaps the zoom (reduced motion). */
  durationMs: number;
}

export interface SideViewCameraRuntime {
  refresh(): void;
  /** Ease into a close-up, or back to following the target with `null`. */
  focus(target: SideViewCameraFocus | null): void;
  destroy(): void;
}

function getSceneViewport(scene: Phaser.Scene, designSize: SideViewCameraDesignSize): SideViewCameraViewportSize {
  const parentSize = scene.scale.parentSize;
  return {
    width: parentSize.width || scene.scale.gameSize.width || designSize.width,
    height: parentSize.height || scene.scale.gameSize.height || designSize.height
  };
}

export function createSideViewCameraRuntime({
  scene,
  followTarget,
  worldBounds,
  designSize,
  resolveProfile,
  lerp = { x: 0.08, y: 0.08 }
}: SideViewCameraRuntimeOptions): SideViewCameraRuntime {
  const camera = scene.cameras.main;
  const focusPoint = new Phaser.Math.Vector2();
  let focused: SideViewCameraFocus | null = null;
  /** Releasing keeps the deeper bounds until the zoom-out lands, so the view does not jump. */
  let boundsRestore: Phaser.Time.TimerEvent | undefined;

  const applyFraming = (zoomDurationMs: number) => {
    const viewport = getSceneViewport(scene, designSize);
    const profile = resolveProfile(viewport);
    const zoom = profile.zoom * (focused?.zoom ?? 1);
    const cropPaddingX = getHorizontalCoverCropPadding({
      viewport,
      designSize,
      zoom
    });
    const viewHeight = camera.height / zoom;
    // A close-up can seat the ground higher than the world allows; the
    // blank paper under the street fills the gap.
    const extraBottom = focused
      ? Math.max(0, focused.y + (1 - focused.screenY) * viewHeight - (worldBounds.y + worldBounds.height))
      : 0;

    const setBounds = (bottomExtra: number) =>
      camera.setBounds(
        worldBounds.x - cropPaddingX,
        worldBounds.y,
        worldBounds.width + cropPaddingX * 2,
        worldBounds.height + bottomExtra
      );
    boundsRestore?.remove();
    boundsRestore = undefined;
    const keepDeepBounds = !focused && zoomDurationMs > 0 && camera.getBounds().height > worldBounds.height;
    if (keepDeepBounds) {
      // The follow lerp trails the zoom a little; wait for the pan to settle too.
      boundsRestore = scene.time.delayedCall(zoomDurationMs + BOUNDS_RESTORE_SETTLE_MS, () => {
        boundsRestore = undefined;
        setBounds(0);
      });
    } else {
      setBounds(extraBottom);
    }
    if (zoomDurationMs > 0) camera.zoomTo(zoom, zoomDurationMs, 'Sine.easeInOut', true);
    else camera.setZoom(zoom);
    camera.setFollowOffset(0, focused ? (focused.screenY - 0.5) * viewHeight : profile.followOffsetY);
  };

  const refresh = () => applyFraming(0);

  const focus = (target: SideViewCameraFocus | null) => {
    const durationMs = target?.durationMs ?? focused?.durationMs ?? 0;
    focused = target;
    if (target) focusPoint.set(target.x, target.y);
    // The follow lerp eases the pan alongside the zoom.
    camera.startFollow(
      target ? focusPoint : (followTarget as Phaser.GameObjects.Sprite),
      true,
      lerp.x,
      lerp.y
    );
    applyFraming(durationMs);
  };

  const destroy = () => {
    boundsRestore?.remove();
    scene.scale.off(Phaser.Scale.Events.RESIZE, refresh);
  };

  camera.startFollow(
    followTarget as Phaser.GameObjects.Sprite,
    true,
    lerp.x,
    lerp.y
  );
  refresh();
  scene.scale.on(Phaser.Scale.Events.RESIZE, refresh);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, destroy);

  return { refresh, focus, destroy };
}
