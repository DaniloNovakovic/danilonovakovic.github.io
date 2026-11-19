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
  /** Ease into a close-up, or back to following the target with `null` (eased over the close-up's own `durationMs`). */
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
  const player = followTarget as Phaser.GameObjects.Sprite;
  const focusPoint = new Phaser.Math.Vector2();
  let focused: SideViewCameraFocus | null = null;
  /** The glide back from a close-up to the normal follow framing. */
  let release: Phaser.Tweens.Tween | undefined;
  /** Side padding of the bounds last applied. */
  let currentPaddingX = 0;

  const resolveFraming = () => {
    const viewport = getSceneViewport(scene, designSize);
    const profile = resolveProfile(viewport);
    const zoom = profile.zoom * (focused?.zoom ?? 1);
    const viewHeight = camera.height / zoom;
    return {
      zoom,
      viewHeight,
      paddingX: getHorizontalCoverCropPadding({ viewport, designSize, zoom }),
      followOffsetY: focused ? (focused.screenY - 0.5) * viewHeight : profile.followOffsetY,
      // A close-up can seat the ground higher than the world allows; the
      // blank paper under the street fills the gap.
      extraBottom: focused
        ? Math.max(0, focused.y + (1 - focused.screenY) * viewHeight - (worldBounds.y + worldBounds.height))
        : 0
    };
  };

  const setBounds = (paddingX: number, extraBottom: number) => {
    currentPaddingX = paddingX;
    camera.setBounds(
      worldBounds.x - paddingX,
      worldBounds.y,
      worldBounds.width + paddingX * 2,
      worldBounds.height + extraBottom
    );
  };

  const cancelRelease = () => {
    release?.remove();
    release = undefined;
  };

  const applyFraming = (zoomDurationMs: number) => {
    cancelRelease();
    const framing = resolveFraming();
    setBounds(framing.paddingX, framing.extraBottom);
    if (zoomDurationMs > 0) camera.zoomTo(framing.zoom, zoomDurationMs, 'Sine.easeInOut', true);
    else camera.setZoom(framing.zoom);
    camera.setFollowOffset(0, framing.followOffsetY);
  };

  const followPlayer = () => camera.startFollow(player, true, lerp.x, lerp.y);

  /** Where the normal follow settles at `zoom`: the player, clamped to the world. */
  const restingCenter = (zoom: number, paddingX: number, followOffsetY: number) => {
    const fit = (want: number, min: number, size: number, view: number) =>
      size <= view ? min + size / 2 : Phaser.Math.Clamp(want, min + view / 2, min + size - view / 2);
    return {
      x: fit(player.x, worldBounds.x - paddingX, worldBounds.width + paddingX * 2, camera.width / zoom),
      y: fit(player.y - followOffsetY, worldBounds.y, worldBounds.height, camera.height / zoom)
    };
  };

  /**
   * Glide from the close-up to where the normal follow will rest, zoom in
   * lockstep, then hand back to the follow. Letting the follow find its own way
   * back reads as two moves: it first heads below the street (the player's
   * framing aims lower than the world allows), then the floor pushes it up.
   */
  const releaseFocus = (durationMs: number) => {
    const framing = resolveFraming();
    const deepExtra = camera.getBounds().height - worldBounds.height;
    if (durationMs <= 0) {
      followPlayer();
      applyFraming(0);
      return;
    }
    cancelRelease();
    camera.zoomEffect.reset();
    const fromZoom = camera.zoom;
    const from = { x: camera.midPoint.x, y: camera.midPoint.y };
    const paddingX = Math.max(currentPaddingX, framing.paddingX);
    camera.setFollowOffset(0, 0);
    focusPoint.set(from.x, from.y);
    camera.startFollow(focusPoint, true, 1, 1);
    release = scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: durationMs,
      ease: 'Sine.easeInOut',
      onUpdate: (tween) => {
        const t = tween.getValue() ?? 0;
        // The view's edges blend between two in-bounds framings, so these
        // bounds never clamp mid-glide; they only shrink back to the world.
        setBounds(paddingX, Math.max(0, deepExtra) * (1 - t));
        camera.setZoom(Phaser.Math.Linear(fromZoom, framing.zoom, t));
        const to = restingCenter(framing.zoom, framing.paddingX, framing.followOffsetY);
        focusPoint.set(Phaser.Math.Linear(from.x, to.x, t), Phaser.Math.Linear(from.y, to.y, t));
      },
      onComplete: () => {
        release = undefined;
        followPlayer();
        applyFraming(0);
      }
    });
  };

  const refresh = () => {
    // A resize mid-glide just lands it.
    if (release) release.complete();
    else applyFraming(0);
  };

  const focus = (target: SideViewCameraFocus | null) => {
    const durationMs = target?.durationMs ?? focused?.durationMs ?? 0;
    const wasFocused = focused !== null;
    focused = target;
    if (!target) {
      if (wasFocused) releaseFocus(durationMs);
      else applyFraming(0);
      return;
    }
    focusPoint.set(target.x, target.y);
    // The follow lerp eases the pan alongside the zoom.
    camera.startFollow(focusPoint, true, lerp.x, lerp.y);
    applyFraming(durationMs);
  };

  const destroy = () => {
    cancelRelease();
    scene.scale.off(Phaser.Scale.Events.RESIZE, refresh);
  };

  followPlayer();
  refresh();
  scene.scale.on(Phaser.Scale.Events.RESIZE, refresh);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, destroy);

  return { refresh, focus, destroy };
}
