/**
 * StreetEnvironment — builds background/foreground scenery for the overworld.
 * Extracted from OverworldScene so the scene is a thin orchestrator.
 */
import * as Phaser from 'phaser';
import { EnvironmentBuilder } from '../textures/EnvironmentBuilder';
import { GAME_DESIGN_HEIGHT, OVERWORLD_GROUND_ZONE, OVERWORLD_WIDTH } from '../config';

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
  const worldWidth = OVERWORLD_WIDTH;
  scene.cameras.main.setBounds(0, 0, worldWidth, GAME_DESIGN_HEIGHT);
  scene.cameras.main.startFollow(followTarget as Phaser.GameObjects.Sprite, true, 0.08, 0.08);
  scene.cameras.main.setFollowOffset(0, 100);
}
