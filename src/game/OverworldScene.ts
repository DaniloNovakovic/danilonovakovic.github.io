import * as Phaser from 'phaser';
import { HOBBIES } from '../config/hobbies';

export class OverworldScene extends Phaser.Scene {
  player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!: { a: Phaser.Input.Keyboard.Key, d: Phaser.Input.Keyboard.Key };
  interactKey!: Phaser.Input.Keyboard.Key;
  buildings!: Phaser.GameObjects.Group;
  interactPrompt!: Phaser.GameObjects.Text;
  
  private onInteract?: (area: string) => void;
  private isPaused: boolean = false;

  constructor() {
    super({ key: 'MainScene' });
  }

  init(data: { onInteract: (area: string) => void, isPaused: boolean }) {
    this.onInteract = data.onInteract;
    this.isPaused = data.isPaused;
  }

  updateInteractCallback(callback: (area: string) => void) {
    this.onInteract = callback;
  }

  setPaused(paused: boolean) {
    this.isPaused = paused;
    if (this.input.keyboard) {
      if (paused) {
        this.input.keyboard.enabled = false;
        if (this.input.keyboard.clearCaptures) {
          this.input.keyboard.clearCaptures();
        }
        if (this.player) this.player.setVelocityX(0);
      } else {
        this.input.keyboard.enabled = true;
        if (this.input.keyboard.addCapture) {
          this.input.keyboard.addCapture([16, 32, 37, 38, 39, 40, 65, 68, 69]);
        }
      }
    }
  }

  preload() {
    // Create player texture (hand-drawn B&W style, cute hacker/dev)
    const pg = this.make.graphics({ x: 0, y: 0 });
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

    // Building textures (distinctive silhouettes for each hobby)
    const createBuilding = (h: {id: string, name: string}) => {
      const bg = this.make.graphics({ x: 0, y: 0 });
      const key = `building_${h.id}`;
      
      const bFill = 0xfbfbf9;
      const bLine = 0x1a1a1a;
      
      bg.fillStyle(bFill, 1);
      bg.lineStyle(5, bLine, 1);
      
      if (h.id === 'drawing') {
        // Art studio (Easel shaped)
        bg.beginPath(); bg.moveTo(125, 20); bg.lineTo(50, 300); bg.lineTo(200, 300); bg.closePath();
        bg.fillPath(); bg.strokePath();
        bg.fillRect(80, 100, 90, 120); bg.strokeRect(80, 100, 90, 120);
        // Palette sign
        bg.fillCircle(125, 60, 20); bg.strokeCircle(125, 60, 20);
        bg.fillStyle(bLine, 1); bg.fillCircle(118, 55, 3); bg.fillCircle(132, 55, 3); bg.fillCircle(125, 65, 3);
        bg.fillStyle(bFill, 1);
        // Door
        bg.strokeRect(100, 220, 50, 80);
      } else if (h.id === 'guitar') {
        // Amp building
        bg.fillRect(40, 80, 170, 220); bg.strokeRect(40, 80, 170, 220);
        bg.strokeCircle(125, 160, 40); bg.strokeCircle(125, 160, 10);
        bg.strokeRect(50, 90, 150, 25);
        for(let i=0; i<4; i++) { bg.beginPath(); bg.moveTo(65 + i*30, 102); bg.lineTo(70 + i*30, 97); bg.strokePath(); }
        bg.strokeRect(100, 220, 50, 80);
      } else if (h.id === 'games') {
        // Arcade Cabinet
        bg.beginPath();
        bg.moveTo(50, 40); bg.lineTo(200, 40);
        bg.lineTo(200, 120); bg.lineTo(220, 150);
        bg.lineTo(220, 300); bg.lineTo(30, 300);
        bg.lineTo(30, 150); bg.lineTo(50, 120);
        bg.closePath(); bg.fillPath(); bg.strokePath();
        bg.strokeRect(70, 60, 110, 50); // screen
        bg.strokeRect(30, 140, 190, 20); // controls
        bg.fillStyle(bLine, 1); bg.fillCircle(70, 150, 6); bg.fillStyle(bFill, 1);
        bg.strokeRect(100, 220, 50, 80);
      } else if (h.id === 'muay thai') {
        // Boxing Gym
        bg.fillRect(20, 120, 210, 180); bg.strokeRect(20, 120, 210, 180);
        bg.fillRect(10, 100, 230, 20); bg.strokeRect(10, 100, 230, 20); // roof
        bg.strokeRect(180, 140, 25, 60); // punching bag
        bg.beginPath(); bg.moveTo(192, 120); bg.lineTo(192, 140); bg.strokePath();
        bg.strokeRect(95, 200, 60, 100);
      } else if (h.id === 'dancing') {
        // Boombox
        bg.fillRect(20, 120, 210, 180); bg.strokeRect(20, 120, 210, 180);
        bg.strokeRect(60, 80, 130, 40); // handle
        bg.strokeCircle(70, 200, 35); bg.strokeCircle(180, 200, 35);
        bg.strokeRect(100, 220, 50, 80);
      } else if (h.id === 'coding') {
        // PC Monitor
        bg.fillRect(30, 80, 190, 140); bg.strokeRect(30, 80, 190, 140);
        bg.strokeRect(40, 90, 170, 100); // screen
        bg.fillRect(100, 220, 50, 60); bg.strokeRect(100, 220, 50, 60); // stand
        bg.fillRect(60, 280, 130, 20); bg.strokeRect(60, 280, 130, 20); // base
        // door in the stand
        bg.strokeRect(110, 240, 30, 40);
      } else {
        // Default box
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
    };

    HOBBIES.forEach((h) => createBuilding(h));
  }

  create() {
    // World bounds (long street)
    this.physics.world.setBounds(0, 0, 3000, 600);

    // --- BACKGROUND PARALLAX (Mountains & Trees) ---
    for(let i=0; i<4; i++) {
      const m = this.add.graphics();
      m.lineStyle(2, 0x1a1a1a, 0.2); // Light gray ink
      m.beginPath();
      const startX = i * 800;
      m.moveTo(startX, 550);
      m.lineTo(startX + 400, 200 + Math.random()*200);
      m.lineTo(startX + 800, 550);
      m.strokePath();
      // Cross-hatching
      for(let j=0; j<20; j++) {
        m.moveTo(startX + 300 + j*10, 300 + j*5);
        m.lineTo(startX + 320 + j*10, 350 + j*5);
      }
      m.strokePath();
      m.setScrollFactor(0.2); // Moves very slowly
    }

    // Trees (mid-ground)
    for(let i=0; i<15; i++) {
      const t = this.add.graphics();
      const tx = Phaser.Math.Between(100, 2900);
      t.lineStyle(3, 0x1a1a1a, 0.5);
      t.beginPath();
      t.moveTo(tx, 550);
      t.lineTo(tx, 450); // trunk
      t.moveTo(tx - 20, 500); t.lineTo(tx, 450); t.lineTo(tx + 20, 500);
      t.moveTo(tx - 15, 475); t.lineTo(tx, 430); t.lineTo(tx + 15, 475);
      t.moveTo(tx - 10, 450); t.lineTo(tx, 410); t.lineTo(tx + 10, 450);
      t.strokePath();
      t.setScrollFactor(0.5);
    }

    // Ground
    const ground = this.add.graphics();
    ground.lineStyle(4, 0x1a1a1a, 1);
    ground.beginPath();
    ground.moveTo(0, 550);
    for(let i=0; i<3000; i+=20) {
      ground.lineTo(i, 550 + (Math.random() * 4 - 2));
    }
    ground.strokePath();

    const groundZone = this.add.zone(1500, 575, 3000, 50);
    this.physics.add.existing(groundZone, true);

    // Buildings setup
    this.buildings = this.add.group();
    
    HOBBIES.forEach((h) => {
      const bldg = this.add.sprite(h.x, 395, `building_${h.id}`);
      
      this.add.text(h.x, 150, h.name.toUpperCase(), {
        fontFamily: '"Comic Sans MS", cursive, sans-serif',
        fontSize: '22px',
        color: '#1a1a1a',
        fontStyle: 'bold'
      }).setOrigin(0.5).setScrollFactor(1);

      bldg.setData('name', h.id);
      this.buildings.add(bldg);
    });

    // Player
    this.player = this.physics.add.sprite(100, 400, 'player_idle');
    this.player.setCollideWorldBounds(true);
    this.player.setGravityY(800);
    this.physics.add.collider(this.player, groundZone);

    // --- FOREGROUND PARALLAX (Grass & Scribbles) ---
    for(let i=0; i<50; i++) {
      const gx = Phaser.Math.Between(0, 3000);
      const gy = Phaser.Math.Between(560, 590);
      const grass = this.add.graphics();
      grass.lineStyle(2, 0x1a1a1a, 0.8);
      grass.beginPath();
      grass.moveTo(gx, gy);
      grass.lineTo(gx - 5, gy - 20);
      grass.moveTo(gx, gy);
      grass.lineTo(gx + 5, gy - 15);
      grass.strokePath();
      grass.setScrollFactor(1.5); // Moves faster than player
      grass.setDepth(10);
    }

    // Camera
    this.cameras.main.setBounds(0, 0, 3000, 600);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setFollowOffset(0, 100); 

    // Input
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = {
        a: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        d: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
      this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    }

    // Interaction Prompt
    this.interactPrompt = this.add.text(0, 0, '[E] ENTER', {
      fontFamily: '"Comic Sans MS", cursive, sans-serif',
      fontSize: '18px',
      color: '#1a1a1a',
      backgroundColor: '#ffffff',
      padding: { x: 5, y: 2 }
    }).setOrigin(0.5).setVisible(false).setDepth(20);

    // Add background clouds (sketchy)
    for(let i=0; i<15; i++) {
      const cx = Phaser.Math.Between(100, 2900);
      const cy = Phaser.Math.Between(50, 200);
      const cloud = this.add.graphics();
      cloud.lineStyle(2, 0x1a1a1a, 0.3);
      cloud.strokeEllipse(cx, cy, Phaser.Math.Between(50, 150), Phaser.Math.Between(20, 60));
      cloud.setScrollFactor(0.5);
    }

    // Apply initial pause state
    this.setPaused(this.isPaused);
  }

  update() {
    if (this.isPaused) {
      if (this.player && this.player.body) {
        this.player.setVelocityX(0);
      }
      return;
    }

    const isSprinting = this.cursors.shift.isDown;
    const speed = isSprinting ? 600 : 300;
    let isMoving = false;

    // Horizontal movement
    if (this.cursors.left.isDown || this.wasd.a.isDown) {
      this.player.setVelocityX(-speed);
      this.player.setFlipX(true);
      isMoving = true;
    } else if (this.cursors.right.isDown || this.wasd.d.isDown) {
      this.player.setVelocityX(speed);
      this.player.setFlipX(false);
      isMoving = true;
    } else {
      this.player.setVelocityX(0);
    }

    // Bobbing animation (tilt only) when moving
    if (isMoving) {
      this.player.setAngle(Math.sin(this.time.now / 100) * 5);
    } else {
      this.player.setAngle(0);
    }

    // Jumping
    if (this.cursors.up.isDown && this.player.body.touching.down) {
      this.player.setVelocityY(-500);
    }

    // atmospheric ink particles (drifting slowly)
    if (Phaser.Math.Between(0, 100) > 95) {
      const px = this.cameras.main.scrollX + 1100;
      const py = Phaser.Math.Between(0, 600);
      const p = this.add.circle(px, py, Phaser.Math.Between(1, 3), 0x1a1a1a, 0.2);
      this.tweens.add({
        targets: p,
        x: px - 1200,
        y: py + Phaser.Math.Between(-100, 100),
        duration: Phaser.Math.Between(5000, 10000),
        onComplete: () => p.destroy()
      });
    }

    // Interaction Check
    let canInteractWith: string | null = null;
    let interactPos: {x: number, y: number} | null = null;

    const bldgs = this.buildings.getChildren() as Phaser.GameObjects.Sprite[];
    for (const bldg of bldgs) {
      // Simple distance check since buildings are background graphics, not physics bodies
      const dist = Math.abs(this.player.x - bldg.x);
      if (dist < 80 && this.player.y > 400) { // Near the door
        canInteractWith = bldg.getData('name');
        interactPos = { x: bldg.x, y: bldg.y + 40 }; // Over the door
        break;
      }
    }

    if (canInteractWith && interactPos) {
      this.interactPrompt.setPosition(interactPos.x, interactPos.y).setVisible(true);
      if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
        this.onInteract?.(canInteractWith);
      }
    } else {
      this.interactPrompt.setVisible(false);
    }
  }
}
