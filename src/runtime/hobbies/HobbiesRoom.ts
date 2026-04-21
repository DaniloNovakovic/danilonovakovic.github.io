/**
 * HobbiesRoom — builds the visual layout of the hobbies interior room.
 * Source of truth for positions remains in src/config/hobbiesRoomLayout.ts;
 * this module reads from it and emits Phaser game objects.
 */
import * as Phaser from 'phaser';
import { HOBBY_REACT_OVERLAY_IDS, type HobbyReactOverlayId } from '../../config/featureIds';
import {
  HOBBIES_EXIT_X,
  HOBBY_STATION_LAYOUT
} from '../../config/hobbiesRoomLayout';
import { TEXTS } from '../../config/content';
import { TextureGenerator } from '../textures/TextureGenerator';
import {
  HOBBIES_FLOOR_Y,
  HOBBIES_ROOM_HEIGHT,
  HOBBIES_ROOM_WIDTH
} from '../config';
import { createUiText } from '../text/createUiText';

const hobbyLabel = (id: HobbyReactOverlayId): string =>
  (TEXTS.hobbies as Record<HobbyReactOverlayId, string>)[id];

/**
 * Generates hobby item textures, draws room background, stations, and exit door.
 * Must be called from HobbiesScene.create() before the player sprite is added.
 */
export function buildHobbiesRoom(scene: Phaser.Scene): void {
  const width = HOBBIES_ROOM_WIDTH;
  const height = HOBBIES_ROOM_HEIGHT;
  const floorY = HOBBIES_FLOOR_Y;

  for (const hobbyId of HOBBY_REACT_OVERLAY_IDS) {
    TextureGenerator.generateHobbyItem(scene, hobbyId);
  }

  // Background fill
  scene.add.rectangle(width / 2, height / 2, width, height, 0xf4f1ea);

  // Room walls, floor and ceiling
  const bg = scene.add.graphics();
  bg.lineStyle(6, 0x1a1a1a, 1);
  bg.fillStyle(0xfbfbf9, 1);
  bg.fillRect(50, 50, 900, 500);
  bg.strokeRect(50, 50, 900, 500);

  // Baseboard hatching
  bg.lineStyle(2, 0x1a1a1a, 0.2);
  for (let y = 500; y < 550; y += 15) {
    bg.beginPath();
    bg.moveTo(50, y);
    bg.lineTo(950, y);
    bg.strokePath();
  }

  // Floor line
  bg.lineStyle(4, 0x1a1a1a, 1);
  bg.beginPath();
  bg.moveTo(50, 500);
  bg.lineTo(950, 500);
  bg.strokePath();

  // Wainscoting / chair rail
  bg.lineStyle(2, 0x1a1a1a, 0.3);
  bg.beginPath();
  bg.moveTo(50, 420);
  bg.lineTo(950, 420);
  bg.strokePath();
  for (let x = 80; x < 950; x += 40) {
    bg.beginPath();
    bg.moveTo(x, 420);
    bg.lineTo(x, 500);
    bg.strokePath();
  }

  // Left window
  bg.lineStyle(4, 0x1a1a1a, 1);
  bg.strokeRect(150, 150, 120, 120);
  bg.lineStyle(2, 0x1a1a1a, 0.5);
  bg.beginPath();
  bg.moveTo(210, 150);
  bg.lineTo(210, 270);
  bg.strokePath();
  bg.beginPath();
  bg.moveTo(150, 210);
  bg.lineTo(270, 210);
  bg.strokePath();

  // Right window
  bg.lineStyle(4, 0x1a1a1a, 1);
  bg.strokeRect(730, 150, 120, 120);
  bg.lineStyle(2, 0x1a1a1a, 0.5);
  bg.beginPath();
  bg.moveTo(790, 150);
  bg.lineTo(790, 270);
  bg.strokePath();
  bg.beginPath();
  bg.moveTo(730, 210);
  bg.lineTo(850, 210);
  bg.strokePath();

  // Stations
  for (const station of HOBBY_STATION_LAYOUT) {
    const texKey = `hobby_${station.id}`;
    if (station.spriteMode === 'floor') {
      scene.add
        .sprite(station.x, floorY + station.yOffsetFromFloor, texKey)
        .setOrigin(0.5, 1);
    } else {
      scene.add
        .sprite(station.x, floorY + station.yOffsetFromFloor, texKey)
        .setOrigin(0.5, 0.5);
    }
    createUiText(scene, station.x, floorY - 140, hobbyLabel(station.id), {
      fontSize: '20px',
      color: '#1a1a1a',
      fontStyle: 'bold'
    })
      .setOrigin(0.5);
  }

  // Exit door
  const exitX = HOBBIES_EXIT_X;
  const exitDoor = scene.add.graphics();
  exitDoor.lineStyle(4, 0x1a1a1a, 1);
  exitDoor.fillStyle(0xfbfbf9, 1);
  exitDoor.fillRect(exitX - 30, floorY - 100, 60, 100);
  exitDoor.strokeRect(exitX - 30, floorY - 100, 60, 100);
  exitDoor.strokeCircle(exitX + 20, floorY - 50, 3);
  createUiText(scene, exitX, floorY - 120, TEXTS.navigation.exit, {
    fontSize: '16px',
    color: '#1a1a1a'
  })
    .setOrigin(0.5);
}
