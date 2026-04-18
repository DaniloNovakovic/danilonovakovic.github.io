import { useEffect, useRef } from 'react';
import * as Phaser from 'phaser';

interface GameProps {
  onInteract: (area: string) => void;
}

export default function Game({ onInteract }: GameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const interactCallbackRef = useRef(onInteract);

  useEffect(() => {
    interactCallbackRef.current = onInteract;
  }, [onInteract]);

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
        pg.strokeRect(4, 4, 24, 40); // Simple body
        pg.strokeCircle(16, -10, 12); // Head
        pg.generateTexture('player_idle', 32, 60);

        // Building textures (rough sketch style)
        const createBuilding = (key: string) => {
          const bg = this.make.graphics({ x: 0, y: 0 });
          bg.lineStyle(6, 0x1a1a1a, 1);
          bg.strokeRect(4, 4, 240, 300); // Building outline
          bg.strokeRect(100, 200, 50, 100); // Door
          
          // Sign
          bg.strokeRect(40, 40, 170, 50);
          bg.fillStyle(0x1a1a1a, 1);
          
          bg.generateTexture(key, 250, 310);
        };

        const hobbies = ['drawing', 'guitar', 'games', 'muay thai', 'dancing', 'coding'];
        hobbies.forEach((h) => createBuilding(`building_${h}`));
      }

      create() {
        // World bounds (long street)
        this.physics.world.setBounds(0, 0, 3000, 600);

        // Ground
        const ground = this.add.graphics();
        ground.lineStyle(4, 0x1a1a1a, 1);
        ground.beginPath();
        ground.moveTo(0, 550);
        // Wobbly hand-drawn line for ground
        for(let i=0; i<3000; i+=20) {
          ground.lineTo(i, 550 + (Math.random() * 4 - 2));
        }
        ground.strokePath();

        const groundZone = this.add.zone(1500, 575, 3000, 50);
        this.physics.add.existing(groundZone, true);

        // Buildings setup
        const hobbies = ['drawing', 'guitar', 'games', 'muay thai', 'dancing', 'coding'];
        this.buildings = this.add.group();
        
        hobbies.forEach((h, i) => {
          const xPos = 400 + (i * 400);
          const bldg = this.add.sprite(xPos, 395, `building_${h}`);
          
          // Add handwritten text
          this.add.text(xPos, 280, h.toUpperCase(), {
            fontFamily: '"Comic Sans MS", cursive, sans-serif',
            fontSize: '24px',
            color: '#1a1a1a',
            fontStyle: 'bold'
          }).setOrigin(0.5);

          bldg.setData('name', h);
          this.buildings.add(bldg);
        });

        // Player
        this.player = this.physics.add.sprite(100, 400, 'player_idle');
        this.player.setCollideWorldBounds(true);
        this.player.setGravityY(800);
        this.physics.add.collider(this.player, groundZone);

        // Camera
        this.cameras.main.setBounds(0, 0, 3000, 600);
        this.cameras.main.startFollow(this.player, true, 0.05, 0.05);
        this.cameras.main.setFollowOffset(0, 100); // Keep player lower on screen

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
        }).setOrigin(0.5).setVisible(false).setDepth(10);

        // Add some background clouds (sketchy)
        for(let i=0; i<10; i++) {
          const cloud = this.add.graphics();
          cloud.lineStyle(2, 0x1a1a1a, 0.5);
          cloud.strokeEllipse(Phaser.Math.Between(100, 2900), Phaser.Math.Between(50, 200), Phaser.Math.Between(50, 150), Phaser.Math.Between(20, 60));
        }
      }

      update() {
        const isSprinting = this.cursors.shift.isDown;
        const speed = isSprinting ? 600 : 300;

        // Horizontal movement
        if (this.cursors.left.isDown || this.wasd.a.isDown) {
          this.player.setVelocityX(-speed);
        } else if (this.cursors.right.isDown || this.wasd.d.isDown) {
          this.player.setVelocityX(speed);
        } else {
          this.player.setVelocityX(0);
        }

        // Jumping
        if (this.cursors.up.isDown && this.player.body.touching.down) {
          this.player.setVelocityY(-500);
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

