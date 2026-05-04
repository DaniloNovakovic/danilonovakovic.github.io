import * as Phaser from 'phaser';

export class EnvironmentBuilder {
  static buildMountains(scene: Phaser.Scene) {
    for(let i=0; i<4; i++) {
      const m = scene.add.graphics();
      m.lineStyle(2, 0x1a1a1a, 0.2);
      m.beginPath();
      const startX = i * 800;
      m.moveTo(startX, 550);
      m.lineTo(startX + 400, 200 + Math.random()*200);
      m.lineTo(startX + 800, 550);
      m.strokePath();
      for(let j=0; j<20; j++) {
        m.moveTo(startX + 300 + j*10, 300 + j*5);
        m.lineTo(startX + 320 + j*10, 350 + j*5);
      }
      m.strokePath();
      m.setScrollFactor(0.2);
    }
  }

  static buildTrees(scene: Phaser.Scene) {
    for(let i=0; i<15; i++) {
      const t = scene.add.graphics();
      const tx = Phaser.Math.Between(100, 2900);
      t.lineStyle(3, 0x1a1a1a, 0.5);
      t.beginPath();
      t.moveTo(tx, 550);
      t.lineTo(tx, 450);
      t.moveTo(tx - 20, 500); t.lineTo(tx, 450); t.lineTo(tx + 20, 500);
      t.moveTo(tx - 15, 475); t.lineTo(tx, 430); t.lineTo(tx + 15, 475);
      t.moveTo(tx - 10, 450); t.lineTo(tx, 410); t.lineTo(tx + 10, 450);
      t.strokePath();
      t.setScrollFactor(0.5);
    }
  }

  static buildGround(scene: Phaser.Scene, width: number) {
    const ground = scene.add.graphics();
    ground.lineStyle(4, 0x1a1a1a, 1);
    ground.beginPath();
    ground.moveTo(0, 550);
    for(let i=0; i<width; i+=20) {
      ground.lineTo(i, 550 + (Math.random() * 4 - 2));
    }
    ground.strokePath();
    return ground;
  }

  static buildGrass(scene: Phaser.Scene, width: number) {
    for(let i=0; i<50; i++) {
      const gx = Phaser.Math.Between(0, width);
      const gy = Phaser.Math.Between(560, 590);
      const grass = scene.add.graphics();
      grass.lineStyle(2, 0x1a1a1a, 0.8);
      grass.beginPath();
      grass.moveTo(gx, gy);
      grass.lineTo(gx - 5, gy - 20);
      grass.moveTo(gx, gy);
      grass.lineTo(gx + 5, gy - 15);
      grass.strokePath();
      grass.setScrollFactor(1.5);
      grass.setDepth(10);
    }
  }

  static buildClouds(scene: Phaser.Scene, width: number) {
    for(let i=0; i<15; i++) {
      const cx = Phaser.Math.Between(100, width - 100);
      const cy = Phaser.Math.Between(50, 200);
      const cloud = scene.add.graphics();
      cloud.lineStyle(2, 0x1a1a1a, 0.3);
      cloud.strokeEllipse(cx, cy, Phaser.Math.Between(50, 150), Phaser.Math.Between(20, 60));
      cloud.setScrollFactor(0.5);
    }
  }
}
