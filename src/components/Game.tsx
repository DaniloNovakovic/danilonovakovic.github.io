import { useEffect, useRef } from 'react';
import * as Phaser from 'phaser';
import { HOBBIES } from '../config/hobbies';

interface GameProps {
  onInteract: (area: string) => void;
  isPaused: boolean;
}

export default function Game({ onInteract, isPaused }: GameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const interactCallbackRef = useRef(onInteract);
  const isPausedRef = useRef(isPaused);

  useEffect(() => {
    interactCallbackRef.current = onInteract;
  }, [onInteract]);

  useEffect(() => {
    isPausedRef.current = isPaused;
    if (gameRef.current) {
      const scene = gameRef.current.scene.getScene('MainScene') as any;
      if (scene && scene.input.keyboard) {
        if (isPaused) {
          scene.input.keyboard.enabled = false;
          // This stops Phaser from calling preventDefault() on all keys
          if (scene.input.keyboard.clearCaptures) {
            scene.input.keyboard.clearCaptures();
          }
          if (scene.player) scene.player.setVelocityX(0);
        } else {
          scene.input.keyboard.enabled = true;
          // Re-add captures for game keys so they don't scroll the page etc.
          if (scene.input.keyboard.addCapture) {
            scene.input.keyboard.addCapture([16, 32, 37, 38, 39, 40, 65, 68, 69]);
          }
        }
      }
    }
  }, [isPaused]);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    class MainScene extends Phaser.Scene {
      player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
      cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
      wasd!: { a: Phaser.Input.Keyboard.Key, d: Phaser.Input.Keyboard.Key };
      interactKey!: Phaser.Input.Keyboard.Key;
      buildings!: Phaser.GameObjects.Group;
      interactPrompt!: Phaser.GameObjects.Text;

      constructor() {
        super({ key: 'MainScene' });
      }

      preload() {
        // Create player texture (hand-drawn B&W style)
        const pg = this.make.graphics({ x: 0, y: 0 });
        pg.lineStyle(4, 0x1a1a1a, 1);
        // Body with sketchy lines
        pg.beginPath();
        pg.moveTo(8, 20);
        pg.lineTo(24, 20);
        pg.lineTo(24, 60);
        pg.lineTo(8, 60);
        pg.closePath();
        pg.strokePath();
        // Head
        pg.strokeCircle(16, 10, 10);
        pg.generateTexture('player_idle', 32, 65);

        // Building textures (rich sketch style)
        const createBuilding = (key: string) => {
          const bg = this.make.graphics({ x: 0, y: 0 });
          bg.lineStyle(6, 0x1a1a1a, 1);
          
          // Main structure
          bg.strokeRect(4, 4, 240, 300);
          
          // Roof details (shingles)
          bg.lineStyle(3, 0x1a1a1a, 0.7);
          for(let y=10; y<60; y+=10) {
            bg.beginPath();
            bg.moveTo(4, y);
            for(let x=4; x<244; x+=20) {
               bg.lineTo(x+10, y + (Math.random()*4));
               bg.lineTo(x+20, y);
            }
            bg.strokePath();
          }

          // Door with handle
          bg.lineStyle(4, 0x1a1a1a, 1);
          bg.strokeRect(100, 200, 50, 100); 
          bg.strokeCircle(140, 250, 3);
          
          // Windows
          bg.strokeRect(30, 80, 50, 50);
          bg.strokeRect(170, 80, 50, 50);
          bg.beginPath();
          bg.moveTo(30, 105); bg.lineTo(80, 105);
          bg.moveTo(55, 80); bg.lineTo(55, 130);
          bg.moveTo(170, 105); bg.lineTo(220, 105);
          bg.moveTo(195, 80); bg.lineTo(195, 130);
          bg.strokePath();

          // Sign
          bg.lineStyle(6, 0x1a1a1a, 1);
          bg.strokeRect(40, 40, 170, 50);
          
          bg.generateTexture(key, 250, 310);
        };

        HOBBIES.forEach((h) => createBuilding(`building_${h.id}`));
      }

      create() {
        // World bounds (long street)
        this.physics.world.setBounds(0, 0, 3000, 600);

        // --- BACKGROUND PARALLAX (Mountains) ---
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
          
          this.add.text(h.x, 65, h.name.toUpperCase(), {
            fontFamily: '"Comic Sans MS", cursive, sans-serif',
            fontSize: '24px',
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
      }

      update() {
        if (isPausedRef.current) {
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
          isMoving = true;
        } else if (this.cursors.right.isDown || this.wasd.d.isDown) {
          this.player.setVelocityX(speed);
          isMoving = true;
        } else {
          this.player.setVelocityX(0);
        }

        // Bobbing animation when moving
        if (isMoving) {
          this.player.setAngle(Math.sin(this.time.now / 100) * 5);
          this.player.setY(400 + Math.sin(this.time.now / 50) * 2);
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
            interactCallbackRef.current(canInteractWith);
          }
        } else {
          this.interactPrompt.setVisible(false);
        }
      }
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: 1000,
      height: 600,
      backgroundColor: '#fbfbf9', // Paper off-white
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 1000 },
          debug: false
        }
      },
      scene: [MainScene]
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div className="w-full h-full flex justify-center items-center rounded-lg overflow-hidden border-4 border-neutral-800 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] bg-[#fbfbf9]">
      <div ref={containerRef} className="w-[1000px] h-[600px] outline-none" />
    </div>
  );
}

