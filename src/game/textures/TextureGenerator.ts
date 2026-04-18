import * as Phaser from 'phaser';

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

  static generateBuilding(scene: Phaser.Scene, id: string) {
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
      bg.lineStyle(4, bLine, 1);
      bg.strokeRect(40, 200, 170, 100); // sandbox/area
      bg.beginPath(); bg.moveTo(60, 200); bg.lineTo(60, 100); bg.lineTo(190, 150); bg.lineTo(190, 250); bg.strokePath(); // slide
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
}
