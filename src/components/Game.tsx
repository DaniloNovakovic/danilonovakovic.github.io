import { useEffect, useRef } from 'react';
import * as Phaser from 'phaser';

interface GameProps {
  onInteract: (area: string) => void;
}

export default function Game({ onInteract }: GameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const interactCallbackRef = useRef(onInteract);

  // Keep callback fresh to avoid stale closures if onInteract changes
  useEffect(() => {
    interactCallbackRef.current = onInteract;
  }, [onInteract]);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    class MainScene extends Phaser.Scene {
      player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
      cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
      wasd!: { w: Phaser.Input.Keyboard.Key, a: Phaser.Input.Keyboard.Key, s: Phaser.Input.Keyboard.Key, d: Phaser.Input.Keyboard.Key };
      interactKey!: Phaser.Input.Keyboard.Key;
      zoneSprites!: Phaser.Physics.Arcade.Sprite[];

      constructor() {
        super({ key: 'MainScene' });
      }

      preload() {
        // Generate a simple placeholder texture for the player
        const graphics = this.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(0xffd700, 1);
        graphics.fillCircle(16, 16, 16);
        graphics.generateTexture('player', 32, 32);

        // Function to create a zone texture
        const createZoneTexture = (key: string, color: number) => {
          const g = this.make.graphics({ x:0, y:0 });
          g.fillStyle(color, 1);
          g.fillRect(0, 0, 80, 80);
          g.lineStyle(4, 0xffffff, 0.8);
          g.strokeRect(0, 0, 80, 80);
          g.generateTexture(key, 80, 80);
        };

        createZoneTexture('drawingZone', 0xff6666); // Red
        createZoneTexture('guitarZone', 0x66ff66);  // Green
        createZoneTexture('gamesZone', 0x6666ff);   // Blue
        createZoneTexture('muayThaiZone', 0xffa500);// Orange
        createZoneTexture('dancingZone', 0xcc66ff); // Purple
        createZoneTexture('codingZone', 0x00cccc);  // Cyan

        // Path texture
        const path = this.make.graphics({ x:0, y:0 });
        path.fillStyle(0xdcdcdc, 0.6);
        path.fillRect(0, 0, 50, 50);
        path.generateTexture('path', 50, 50);
      }

      create() {
        // Add decorative paths on the floor
        // Horizontal path
        this.add.tileSprite(400, 300, 600, 50, 'path');
        // Vertical path
        this.add.tileSprite(400, 300, 50, 400, 'path');

        // Setup zones
        const zones = [
          { key: 'drawingZone', name: 'drawing', x: 200, y: 150 },
          { key: 'guitarZone', name: 'guitar', x: 600, y: 150 },
          { key: 'gamesZone', name: 'games', x: 100, y: 300 },
          { key: 'muayThaiZone', name: 'muay thai', x: 700, y: 300 },
          { key: 'dancingZone', name: 'dancing', x: 200, y: 450 },
          { key: 'codingZone', name: 'coding', x: 600, y: 450 },
        ];

        this.zoneSprites = [];

        zones.forEach(z => {
          // Label above the zone
          this.add.text(z.x, z.y - 50, z.name.toUpperCase(), { 
            fontSize: '14px', 
            color: '#fff', 
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 3
          }).setOrigin(0.5);

          const sprite = this.physics.add.sprite(z.x, z.y, z.key);
          sprite.setImmovable(true);
          sprite.setName(z.name);
          this.zoneSprites.push(sprite);
        });

        // Setup player on top of paths
        this.player = this.physics.add.sprite(400, 300, 'player');
        this.player.setCollideWorldBounds(true);

        // Input
        if (this.input.keyboard) {
          this.cursors = this.input.keyboard.createCursorKeys();
          this.wasd = {
            w: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            a: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            s: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            d: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
          };
          this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        }

        // Text prompt
        this.add.text(400, 50, 'Use WASD/Arrows to move', {
          fontSize: '16px',
          color: '#ffffff',
          backgroundColor: '#00000088',
          padding: { x: 10, y: 5 }
        }).setOrigin(0.5);

        // Interaction text (hidden by default)
        const interactPrompt = this.add.text(0, 0, 'Press Space', { fontSize: '14px', color: '#ffffff' }).setOrigin(0.5).setVisible(false);

        this.events.on('update', () => {
          let canInteractWith: string | null = null;
          let interactPos: {x: number, y: number} | null = null;

          for (const zone of this.zoneSprites) {
            if (this.physics.overlap(this.player, zone)) {
              canInteractWith = zone.name;
              interactPos = { x: zone.x, y: zone.y - 60 };
              break;
            }
          }

          if (canInteractWith && interactPos) {
            interactPrompt.setPosition(interactPos.x, interactPos.y).setVisible(true);
            if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
              interactCallbackRef.current(canInteractWith);
            }
          } else {
            interactPrompt.setVisible(false);
          }
        });
      }

      update() {
        const speed = 250;
        let vx = 0;
        let vy = 0;

        if (this.cursors.left.isDown || this.wasd.a.isDown) vx = -speed;
        else if (this.cursors.right.isDown || this.wasd.d.isDown) vx = speed;

        if (this.cursors.up.isDown || this.wasd.w.isDown) vy = -speed;
        else if (this.cursors.down.isDown || this.wasd.s.isDown) vy = speed;

        // Normalize diagonal movement
        if (vx !== 0 && vy !== 0) {
          vx *= 0.7071;
          vy *= 0.7071;
        }

        this.player.setVelocity(vx, vy);
      }
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: 800,
      height: 600,
      backgroundColor: '#87CEEB',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
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
    <div className="w-full h-full flex justify-center items-center bg-gray-900 rounded-lg overflow-hidden shadow-2xl border border-gray-700">
      <div ref={containerRef} className="w-[800px] h-[600px] outline-none" />
    </div>
  );
}
