import * as Phaser from 'phaser';
import type { HobbyReactOverlayId, MiniGameId } from '../../config/featureIds';

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
    pg.moveTo(18, 45); pg.lineTo(18, 60);
    pg.moveTo(30, 45); pg.lineTo(30, 60);
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
    
    const bFill = 0xfbfbf9;
    const bLine = 0x1a1a1a;
    
    bg.fillStyle(bFill, 1);
    bg.lineStyle(5, bLine, 1);
    
    if (id === 'profile') {
      // Cozy House
      bg.beginPath(); bg.moveTo(20, 150); bg.lineTo(125, 50); bg.lineTo(230, 150); bg.closePath();
      bg.fillPath(); bg.strokePath();
      bg.fillRect(40, 150, 170, 150); bg.strokeRect(40, 150, 170, 150);
      bg.strokeRect(100, 220, 50, 80); // door
      bg.strokeRect(60, 180, 30, 30); bg.strokeRect(160, 180, 30, 30); // windows
    } else if (id === 'experiences') {
      // Office Building
      bg.fillRect(50, 20, 150, 280); bg.strokeRect(50, 20, 150, 280);
      for(let y=40; y<250; y+=40) {
        bg.strokeRect(70, y, 30, 20); bg.strokeRect(110, y, 30, 20); bg.strokeRect(150, y, 30, 20);
      }
      bg.strokeRect(100, 260, 50, 40); // entrance
    } else if (id === 'projects') {
      // High-tech Lab/Workshop
      bg.fillRect(30, 100, 190, 200); bg.strokeRect(30, 100, 190, 200);
      bg.beginPath(); bg.moveTo(30, 100); bg.lineTo(60, 50); bg.lineTo(190, 50); bg.lineTo(220, 100); bg.strokePath();
      bg.strokeCircle(125, 150, 30); // logo/window
      bg.strokeRect(100, 220, 50, 80);
      bg.lineStyle(2, bLine, 0.5);
      bg.beginPath(); bg.moveTo(40, 120); bg.lineTo(80, 120); bg.moveTo(40, 130); bg.lineTo(70, 130); bg.strokePath();
    } else if (id === 'abilities') {
      // Dojo / School
      bg.fillRect(40, 120, 170, 180); bg.strokeRect(40, 120, 170, 180);
      bg.beginPath(); bg.moveTo(20, 120); bg.lineTo(125, 70); bg.lineTo(230, 120); bg.strokePath();
      bg.beginPath(); bg.moveTo(40, 90); bg.lineTo(125, 40); bg.lineTo(210, 90); bg.strokePath();
      bg.strokeRect(100, 220, 50, 80);
    } else if (id === 'hobbies') {
      // Park / Playground
      bg.fillStyle(bFill, 1);
      bg.fillRect(40, 200, 170, 100);
      bg.lineStyle(4, bLine, 1);
      bg.strokeRect(40, 200, 170, 100); // sandbox/area
      
      bg.beginPath(); bg.moveTo(60, 200); bg.lineTo(60, 100); bg.lineTo(190, 150); bg.lineTo(190, 250); bg.closePath();
      bg.fillPath(); bg.strokePath(); // slide
      
      bg.fillCircle(125, 120, 25);
      bg.strokeCircle(125, 120, 25); // tree top
      bg.beginPath(); bg.moveTo(125, 145); bg.lineTo(125, 200); bg.strokePath(); // tree trunk
      bg.strokeRect(100, 240, 50, 60); // entrance to the park
    } else if (id === 'contact') {
      // Comms Tower / Post Office
      bg.fillRect(60, 150, 130, 150); bg.strokeRect(60, 150, 130, 150);
      bg.beginPath(); bg.moveTo(125, 150); bg.lineTo(125, 20); bg.strokePath();
      bg.strokeCircle(125, 40, 15); bg.strokeCircle(125, 40, 25);
      bg.strokeRect(100, 240, 50, 60);
    } else {
      bg.fillRect(30, 100, 190, 200); bg.strokeRect(30, 100, 190, 200);
      bg.strokeRect(100, 200, 50, 100);
    }

    // Sketchy Cross-hatching shading on the right side
    bg.lineStyle(2, bLine, 0.3);
    for(let i=0; i<150; i+=12) {
      bg.beginPath(); bg.moveTo(180, 120 + i); bg.lineTo(210, 140 + i); bg.strokePath();
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
      // Keyboard base
      bg.beginPath(); bg.moveTo(10, 90); bg.lineTo(110, 90); bg.lineTo(100, 80); bg.lineTo(20, 80); bg.closePath();
      bg.fillPath(); bg.strokePath();
      // Screen stand/connection
      bg.strokeRect(45, 80, 30, 5);
      // Screen details (sketchy lines for code)
      bg.lineStyle(2, hLine, 0.4);
      for (let i = 0; i < 4; i++) {
        bg.beginPath(); bg.moveTo(35, 40 + i * 8); bg.lineTo(85, 40 + i * 8); bg.strokePath();
      }
    } else if (id === 'art') {
      // Easel and Canvas
      // Legs
      bg.beginPath(); bg.moveTo(60, 10); bg.lineTo(20, 110); bg.strokePath();
      bg.beginPath(); bg.moveTo(60, 10); bg.lineTo(100, 110); bg.strokePath();
      bg.beginPath(); bg.moveTo(60, 10); bg.lineTo(60, 110); bg.strokePath();
      // Canvas
      bg.fillRect(25, 30, 70, 50);
      bg.strokeRect(25, 30, 70, 50);
      // Drawing on canvas (a little mountain/sketch)
      bg.lineStyle(2, hLine, 0.6);
      bg.beginPath(); bg.moveTo(35, 70); bg.lineTo(50, 50); bg.lineTo(60, 60); bg.lineTo(80, 40); bg.strokePath();
    } else if (id === 'music') {
      // Guitar
      // Body
      bg.beginPath(); bg.arc(60, 80, 25, 0, Math.PI * 2); bg.fillPath(); bg.strokePath();
      bg.beginPath(); bg.arc(60, 55, 18, 0, Math.PI * 2); bg.fillPath(); bg.strokePath();
      // Sound hole
      bg.fillStyle(hLine, 1);
      bg.fillCircle(60, 65, 6);
      // Neck
      bg.fillStyle(hFill, 1);
      bg.fillRect(55, 15, 10, 35);
      bg.strokeRect(55, 15, 10, 35);
      // Headstock
      bg.fillRect(52, 5, 16, 10);
      bg.strokeRect(52, 5, 16, 10);
      // Strings
      bg.lineStyle(1, hLine, 0.5);
      bg.beginPath(); bg.moveTo(57, 15); bg.lineTo(57, 85); bg.strokePath();
      bg.beginPath(); bg.moveTo(60, 15); bg.lineTo(60, 85); bg.strokePath();
      bg.beginPath(); bg.moveTo(63, 15); bg.lineTo(63, 85); bg.strokePath();
    } else if (id === 'fitness') {
      // Punching Bag
      bg.fillRect(35, 20, 50, 80);
      bg.strokeRect(35, 20, 50, 80);
      // Chains
      bg.beginPath(); bg.moveTo(45, 20); bg.lineTo(60, 0); bg.strokePath();
      bg.beginPath(); bg.moveTo(75, 20); bg.lineTo(60, 0); bg.strokePath();
      // Wraps / Banding
      bg.lineStyle(2, hLine, 0.5);
      bg.beginPath(); bg.moveTo(35, 40); bg.lineTo(85, 40); bg.strokePath();
      bg.beginPath(); bg.moveTo(35, 65); bg.lineTo(85, 65); bg.strokePath();
    }

    bg.generateTexture(key, 120, 120);
    bg.destroy();
  }
}
