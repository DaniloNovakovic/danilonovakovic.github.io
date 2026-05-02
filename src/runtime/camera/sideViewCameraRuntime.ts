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

export interface SideViewCameraRuntime {
  refresh(): void;
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
  const refresh = () => {
    const viewport = getSceneViewport(scene, designSize);
    const profile = resolveProfile(viewport);
    const cropPaddingX = getHorizontalCoverCropPadding({
      viewport,
      designSize,
      zoom: profile.zoom
    });

    scene.cameras.main.setBounds(
      worldBounds.x - cropPaddingX,
      worldBounds.y,
      worldBounds.width + cropPaddingX * 2,
      worldBounds.height
    );
    scene.cameras.main.setZoom(profile.zoom);
    scene.cameras.main.setFollowOffset(0, profile.followOffsetY);
  };

  const destroy = () => {
    scene.scale.off(Phaser.Scale.Events.RESIZE, refresh);
  };

  scene.cameras.main.startFollow(
    followTarget as Phaser.GameObjects.Sprite,
    true,
    lerp.x,
    lerp.y
  );
  refresh();
  scene.scale.on(Phaser.Scale.Events.RESIZE, refresh);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, destroy);

  return { refresh, destroy };
}
