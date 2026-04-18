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

      constructor() {
        super({ key: 'MainScene' });
      }

      preload() {
        // Generate a simple placeholder texture for the player
        const graphics = this.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(0xffd700, 1);
        graphics.fillCircle(16, 16, 16);
        graphics.generateTexture('player', 32, 32);

        // Graphics for zones
        const zoneGraphics = this.make.graphics({ x:0, y:0 });
        zoneGraphics.fillStyle(0xff6666, 1);
        zoneGraphics.fillRect(0, 0, 80, 80);
        zoneGraphics.generateTexture('drawingZone', 80, 80);

        const zoneGraphics2 = this.make.graphics({ x:0, y:0 });
        zoneGraphics2.fillStyle(0x66ff66, 1);
        zoneGraphics2.fillRect(0, 0, 80, 80);
        zoneGraphics2.generateTexture('guitarZone', 80, 80);
      }

      create() {
        // Setup player
        this.player = this.physics.add.sprite(400, 300, 'player');
        this.player.setCollideWorldBounds(true);

        // Setup zones
        const drawingZoneSprite = this.physics.add.sprite(150, 150, 'drawingZone');
        drawingZoneSprite.setImmovable(true);
        drawingZoneSprite.setName('drawing');

        const guitarZoneSprite = this.physics.add.sprite(650, 150, 'guitarZone');
        guitarZoneSprite.setImmovable(true);
        guitarZoneSprite.setName('guitar');

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

          if (this.physics.overlap(this.player, drawingZoneSprite)) {
            canInteractWith = 'drawing';
            interactPos = { x: drawingZoneSprite.x, y: drawingZoneSprite.y - 60 };
          } else if (this.physics.overlap(this.player, guitarZoneSprite)) {
            canInteractWith = 'guitar';
            interactPos = { x: guitarZoneSprite.x, y: guitarZoneSprite.y - 60 };
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
