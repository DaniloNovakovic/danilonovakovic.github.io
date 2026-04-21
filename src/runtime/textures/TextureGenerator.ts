import * as Phaser from 'phaser';
import type { HobbyReactOverlayId, MiniGameId } from '../../config/featureIds';
import { drawOverworldBuildingArt } from './buildingTextures';

export class TextureGenerator {
  static generatePlayer(scene: Phaser.Scene) {
    const pg = scene.make.graphics({ x: 0, y: 0 });
    const pFill = 0xfbfbf9;
    const pLine = 0x1a1a1a;

    // Shadow
    pg.fillStyle(0x000000, 0.1);
    pg.fillEllipse(24, 60, 20, 6);

    pg.fillStyle(pFill, 1);
    pg.lineStyle(3, pLine, 1);

    // Legs
    pg.beginPath();
    pg.moveTo(18, 45);
    pg.lineTo(18, 60);
    pg.moveTo(30, 45);
    pg.lineTo(30, 60);
    pg.strokePath();

    // Backpack
    pg.fillRect(8, 28, 8, 16);
    pg.strokeRect(8, 28, 8, 16);

    // Body (Hoodie)
    pg.fillRect(14, 24, 20, 22);
    pg.strokeRect(14, 24, 20, 22);

    // Head
    pg.fillCircle(24, 16, 12);
    pg.strokeCircle(24, 16, 12);

    // Eyes (facing right)
    pg.fillStyle(pLine, 1);
    pg.fillCircle(26, 14, 2);
    pg.fillCircle(32, 14, 2);

    pg.generateTexture('player_idle', 48, 65);
    pg.destroy();
  }

  static generateBuilding(scene: Phaser.Scene, id: MiniGameId) {
    const bg = scene.make.graphics({ x: 0, y: 0 });
    const key = `building_${id}`;
    const bLine = 0x1a1a1a;

    drawOverworldBuildingArt(bg, id);

    // Sketchy Cross-hatching shading on the right side
    bg.lineStyle(2, bLine, 0.3);
    for (let i = 0; i < 150; i += 12) {
      bg.beginPath();
      bg.moveTo(180, 120 + i);
      bg.lineTo(210, 140 + i);
      bg.strokePath();
    }

    bg.generateTexture(key, 250, 310);
    bg.destroy();
  }

  static generateHobbyItem(scene: Phaser.Scene, id: HobbyReactOverlayId) {
    const bg = scene.make.graphics({ x: 0, y: 0 });
    const key = `hobby_${id}`;
    const hLine = 0x1a1a1a;
    const hFill = 0xfbfbf9;

    bg.fillStyle(hFill, 1);
    bg.lineStyle(4, hLine, 1);

    if (id === 'games') {
      // Laptop / Computer
      bg.fillRect(20, 30, 80, 50);
      bg.strokeRect(20, 30, 80, 50);
      bg.beginPath();
      bg.moveTo(10, 90);
      bg.lineTo(110, 90);
      bg.lineTo(100, 80);
      bg.lineTo(20, 80);
      bg.closePath();
      bg.fillPath();
      bg.strokePath();
      bg.strokeRect(45, 80, 30, 5);
      bg.lineStyle(2, hLine, 0.4);
      for (let i = 0; i < 4; i++) {
        bg.beginPath();
        bg.moveTo(35, 40 + i * 8);
        bg.lineTo(85, 40 + i * 8);
        bg.strokePath();
      }
    } else if (id === 'art') {
      bg.beginPath();
      bg.moveTo(60, 10);
      bg.lineTo(20, 110);
      bg.strokePath();
      bg.beginPath();
      bg.moveTo(60, 10);
      bg.lineTo(100, 110);
      bg.strokePath();
      bg.beginPath();
      bg.moveTo(60, 10);
      bg.lineTo(60, 110);
      bg.strokePath();
      bg.fillRect(25, 30, 70, 50);
      bg.strokeRect(25, 30, 70, 50);
      bg.lineStyle(2, hLine, 0.6);
      bg.beginPath();
      bg.moveTo(35, 70);
      bg.lineTo(50, 50);
      bg.lineTo(60, 60);
      bg.lineTo(80, 40);
      bg.strokePath();
    } else if (id === 'music') {
      bg.beginPath();
      bg.arc(60, 80, 25, 0, Math.PI * 2);
      bg.fillPath();
      bg.strokePath();
      bg.beginPath();
      bg.arc(60, 55, 18, 0, Math.PI * 2);
      bg.fillPath();
      bg.strokePath();
      bg.fillStyle(hLine, 1);
      bg.fillCircle(60, 65, 6);
      bg.fillStyle(hFill, 1);
      bg.fillRect(55, 15, 10, 35);
      bg.strokeRect(55, 15, 10, 35);
      bg.fillRect(52, 5, 16, 10);
      bg.strokeRect(52, 5, 16, 10);
      bg.lineStyle(1, hLine, 0.5);
      bg.beginPath();
      bg.moveTo(57, 15);
      bg.lineTo(57, 85);
      bg.strokePath();
      bg.beginPath();
      bg.moveTo(60, 15);
      bg.lineTo(60, 85);
      bg.strokePath();
      bg.beginPath();
      bg.moveTo(63, 15);
      bg.lineTo(63, 85);
      bg.strokePath();
    } else if (id === 'fitness') {
      bg.fillRect(35, 20, 50, 80);
      bg.strokeRect(35, 20, 50, 80);
      bg.beginPath();
      bg.moveTo(45, 20);
      bg.lineTo(60, 0);
      bg.strokePath();
      bg.beginPath();
      bg.moveTo(75, 20);
      bg.lineTo(60, 0);
      bg.strokePath();
      bg.lineStyle(2, hLine, 0.5);
      bg.beginPath();
      bg.moveTo(35, 40);
      bg.lineTo(85, 40);
      bg.strokePath();
      bg.beginPath();
      bg.moveTo(35, 65);
      bg.lineTo(85, 65);
      bg.strokePath();
    } else if (id === 'dancing') {
      // Simple dancing figure (arms up, motion lines)
      bg.lineStyle(4, hLine, 1);
      bg.strokeCircle(60, 55, 14);
      bg.beginPath();
      bg.moveTo(60, 69);
      bg.lineTo(60, 100);
      bg.strokePath();
      bg.beginPath();
      bg.moveTo(60, 78);
      bg.lineTo(35, 48);
      bg.strokePath();
      bg.beginPath();
      bg.moveTo(60, 78);
      bg.lineTo(85, 48);
      bg.strokePath();
      bg.beginPath();
      bg.moveTo(60, 100);
      bg.lineTo(45, 115);
      bg.strokePath();
      bg.beginPath();
      bg.moveTo(60, 100);
      bg.lineTo(75, 115);
      bg.strokePath();
      bg.lineStyle(2, hLine, 0.35);
      bg.beginPath();
      bg.moveTo(95, 35);
      bg.lineTo(105, 25);
      bg.strokePath();
      bg.beginPath();
      bg.moveTo(98, 50);
      bg.lineTo(112, 45);
      bg.strokePath();
    }

    bg.generateTexture(key, 120, 120);
    bg.destroy();
  }
}
