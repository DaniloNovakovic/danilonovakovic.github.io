/**
 * StreetEnvironment — builds background/foreground scenery for the overworld.
 * Extracted from OverworldScene so the scene is a thin orchestrator.
 */
import * as Phaser from 'phaser';
import { EnvironmentBuilder } from '../../../../runtime/textures/EnvironmentBuilder';
import {
  GAME_DESIGN_HEIGHT,
  GAME_DESIGN_WIDTH,
  OVERWORLD_GROUND_ZONE,
  OVERWORLD_WIDTH
} from '../../../../runtime/config';
import { getStreetCameraProfile } from './streetCameraProfile';
import { createSideViewCameraRuntime } from '../../../../runtime/camera/sideViewCameraRuntime';

export interface StreetEnvironmentHandles {
  groundZone: Phaser.GameObjects.Zone;
}

export function buildStreetEnvironment(scene: Phaser.Scene): StreetEnvironmentHandles {
  const worldWidth = OVERWORLD_WIDTH;

  EnvironmentBuilder.buildMountains(scene);
  EnvironmentBuilder.buildTrees(scene);
  EnvironmentBuilder.buildGround(scene, worldWidth);

  const groundZone = scene.add.zone(
    worldWidth / 2,
    OVERWORLD_GROUND_ZONE.centerY,
    worldWidth,
    OVERWORLD_GROUND_ZONE.height
  );
  scene.physics.add.existing(groundZone, true);

  return { groundZone };
}

export function buildStreetForeground(scene: Phaser.Scene): void {
  const worldWidth = OVERWORLD_WIDTH;
  EnvironmentBuilder.buildGrass(scene, worldWidth);
  EnvironmentBuilder.buildClouds(scene, worldWidth);
}

export function setupStreetCamera(
  scene: Phaser.Scene,
  followTarget: Phaser.GameObjects.GameObject
): void {
  createSideViewCameraRuntime({
    scene,
    followTarget,
    worldBounds: {
      x: 0,
      y: 0,
      width: OVERWORLD_WIDTH,
      height: GAME_DESIGN_HEIGHT
    },
    designSize: {
      width: GAME_DESIGN_WIDTH,
      height: GAME_DESIGN_HEIGHT
    },
    resolveProfile: ({ width, height }) => getStreetCameraProfile({
      displayWidth: width,
      displayHeight: height
    })
  });
}
