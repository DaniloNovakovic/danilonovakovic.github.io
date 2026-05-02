import * as Phaser from 'phaser';
import {
  GAME_DESIGN_HEIGHT,
  GAME_DESIGN_WIDTH
} from './config';
import { createUiText } from './text/createUiText';
import { bridgeActions } from '../shared/bridge/store';
import { TextureGenerator } from './textures/TextureGenerator';

type GameState = 'START' | 'PLAYING' | 'GAME_OVER';

type Ripeness = 'green' | 'yellow' | 'brown';

const RIPENESS_CONFIG: Record<Ripeness, { drag: number; speed: number; next: Ripeness }> = {
  green: { drag: 1200, speed: 380, next: 'yellow' },
  yellow: { drag: 600, speed: 620, next: 'brown' },
  brown: { drag: 150, speed: 950, next: 'green' }
};

const SPAWN_INTERVAL_INITIAL = 1600;
const SPAWN_INTERVAL_MIN = 350;
const LIVES_INITIAL = 3;

export class PotassiumSlipScene extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private enemies!: Phaser.Physics.Arcade.Group;
  private bgGrid!: Phaser.GameObjects.TileSprite;
  
  private gameState: GameState = 'START';
  private ripeness: Ripeness = 'yellow';
  private score: number = 0;
  private lives: number = LIVES_INITIAL;
  
  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private ripenessText!: Phaser.GameObjects.Text;
  private overlayText!: Phaser.GameObjects.Text;
  private subOverlayText!: Phaser.GameObjects.Text;
  
  private spawnTimer?: Phaser.Time.TimerEvent;
  private ripenessTimer?: Phaser.Time.TimerEvent;
  
  private onClose?: () => void;
  private isPaused: boolean = false;

  constructor() {
    super({ key: 'potassium' });
  }

  preload(): void {
    TextureGenerator.generatePotassiumAssets(this);
  }

  init(data: { onClose: () => void; isPaused?: boolean }): void {
    this.onClose = data.onClose;
    this.isPaused = data.isPaused ?? false;
    this.score = 0;
    this.lives = LIVES_INITIAL;
    this.ripeness = 'yellow';
    this.gameState = 'START';
  }

  create(): void {
    this.physics.world.setBounds(0, 0, GAME_DESIGN_WIDTH, GAME_DESIGN_HEIGHT);
    this.physics.world.gravity.set(0, 0); // Disable global gravity for this top-down scene
    
    // Background Grid
    const gridG = this.make.graphics({ x: 0, y: 0 });
    gridG.lineStyle(1, 0x1a1a1a, 0.05);
    gridG.strokeRect(0, 0, 64, 64);
    gridG.generateTexture('bg_grid', 64, 64);
    gridG.destroy();

    this.bgGrid = this.add.tileSprite(
      GAME_DESIGN_WIDTH / 2, 
      GAME_DESIGN_HEIGHT / 2, 
      GAME_DESIGN_WIDTH, 
      GAME_DESIGN_HEIGHT, 
      'bg_grid'
    );
    this.bgGrid.setDepth(0);
    this.cameras.main.setBackgroundColor('#f7f5ea');

    // Player (Banana Peel)
    this.player = this.physics.add.sprite(
      GAME_DESIGN_WIDTH / 2, 
      GAME_DESIGN_HEIGHT - 100, 
      'banana_peel_yellow'
    );
    this.player.setCollideWorldBounds(true);
    this.player.body.setAllowGravity(false); // Double ensure no gravity
    this.player.setDepth(20);

    // Enemy Group
    this.enemies = this.physics.add.group();

    // UI
    const uiStyle = { fontSize: '24px', color: '#1a1a1a', fontStyle: 'bold' };
    this.scoreText = createUiText(this, 30, 30, 'Score: 0', uiStyle).setDepth(1000);
    this.livesText = createUiText(this, 30, 70, 'Lives: ' + LIVES_INITIAL, { ...uiStyle, color: '#ef4444' }).setDepth(1000);
    this.ripenessText = createUiText(this, GAME_DESIGN_WIDTH - 30, 30, 'State: Yellow', uiStyle).setOrigin(1, 0).setDepth(1000);

    this.overlayText = createUiText(this, GAME_DESIGN_WIDTH / 2, GAME_DESIGN_HEIGHT / 2 - 40, 'POTASSIUM SLIP', {
      fontSize: '48px',
      color: '#1a1a1a',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(1010);

    this.subOverlayText = createUiText(this, GAME_DESIGN_WIDTH / 2, GAME_DESIGN_HEIGHT / 2 + 60, 'CLICK OR TAP TO START\n(Slip the stakeholders!)', {
      fontSize: '24px',
      color: '#1a1a1a',
      align: 'center'
    }).setOrigin(0.5).setDepth(1010);

    this.updateRipenessPhysics();

    // Collisions
    this.physics.add.overlap(this.player, this.enemies, (p, e) => {
      this.handleSlip(p as Phaser.Types.Physics.Arcade.GameObjectWithBody, e as Phaser.Types.Physics.Arcade.GameObjectWithBody);
    });

    // Input
    this.input.on('pointerdown', () => {
      if (this.gameState === 'START') {
        this.startGame();
      } else if (this.gameState === 'GAME_OVER') {
        this.onClose?.();
      }
    });

    this.input.keyboard?.on('keydown-E', () => {
      if (this.gameState === 'GAME_OVER') {
        this.onClose?.();
      }
    });

    this.input.keyboard?.on('keydown-ESC', () => {
      this.onClose?.();
    });
  }

  update(): void {
    if (this.isPaused) return;

    // Consume mobile taps from bridge
    const { interactTap } = bridgeActions.consumeTouchOneShots();

    if (this.gameState === 'PLAYING') {
      this.bgGrid.tilePositionY -= 2; // Scroll background

      // Move player towards pointer with dead-zone to prevent jitter
      const pointer = this.input.activePointer;
      if (pointer.isDown) {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, pointer.x, pointer.y);
        if (dist < 8) {
          this.player.setVelocity(0, 0);
        } else {
          this.physics.moveToObject(this.player, pointer, RIPENESS_CONFIG[this.ripeness].speed);
        }
      }

      // Check for enemies passing the bottom
      this.enemies.getChildren().forEach((gameObject) => {
        const enemy = gameObject as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
        if (enemy.y > GAME_DESIGN_HEIGHT + 60) {
          this.handleEnemyEscape(enemy);
        }
      });
    } else {
      this.player.setVelocity(0, 0);
      
      // If a mobile tap occurred while in START or GAME_OVER, trigger the logic
      if (interactTap) {
        if (this.gameState === 'START') {
          this.startGame();
        } else if (this.gameState === 'GAME_OVER') {
          this.onClose?.();
        }
      }
    }
  }

  private startGame(): void {
    this.gameState = 'PLAYING';
    this.overlayText.setVisible(false);
    this.subOverlayText.setVisible(false);
    this.score = 0;
    this.lives = LIVES_INITIAL;
    this.scoreText.setText('Score: 0');
    this.livesText.setText('Lives: ' + LIVES_INITIAL);
    
    this.startSpawning();
    this.startRipenessCycle();
  }

  private startSpawning(): void {
    if (this.spawnTimer) this.spawnTimer.destroy();
    
    const delay = Math.max(
      SPAWN_INTERVAL_MIN,
      SPAWN_INTERVAL_INITIAL - (this.score * 15)
    );

    this.spawnTimer = this.time.addEvent({
      delay: delay,
      callback: () => {
        this.spawnEnemy();
        this.startSpawning(); // Recursive for dynamic delay
      },
      callbackScope: this
    });
  }

  private spawnEnemy(): void {
    if (this.gameState !== 'PLAYING') return;

    const x = Phaser.Math.Between(50, GAME_DESIGN_WIDTH - 50);
    const types = ['deadline', 'scope_creeper', 'bug'];
    const type = Phaser.Utils.Array.GetRandom(types);
    
    let enemy: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    
    if (type === 'deadline') {
      enemy = this.enemies.create(x, -50, 'enemy_deadline');
      enemy.setVelocityY(Phaser.Math.Between(250, 400));
    } else if (type === 'scope_creeper') {
      enemy = this.enemies.create(x, -50, 'enemy_scope_creeper');
      enemy.setVelocityY(Phaser.Math.Between(150, 250));
      // Zig zag
      const zigZagTween = this.tweens.add({
        targets: enemy,
        x: x + (x > GAME_DESIGN_WIDTH / 2 ? -150 : 150),
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      enemy.once(Phaser.GameObjects.Events.DESTROY, () => zigZagTween.stop());
    } else {
      enemy = this.enemies.create(x, -50, 'enemy_bug');
      enemy.setVelocityY(Phaser.Math.Between(300, 500));
      // Erratic movement
      const moveTimer = this.time.addEvent({
        delay: 500,
        callback: () => {
          if (enemy.active) {
            enemy.setVelocityX(Phaser.Math.Between(-200, 200));
          }
        },
        loop: true
      });
      enemy.once(Phaser.GameObjects.Events.DESTROY, () => moveTimer.destroy());
    }

    enemy.body.setAllowGravity(false);
    enemy.setDepth(50);
  }

  private handleSlip(_playerObject: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile, enemyObject: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile): void {
    if (this.gameState !== 'PLAYING') return;
    const enemy = enemyObject as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    if (enemy.getData('slipping')) return;

    enemy.setData('slipping', true);
    this.score += 1;
    this.scoreText.setText('Score: ' + this.score);

    // Visual feedback
    enemy.body.enable = false;
    this.tweens.add({
      targets: enemy,
      angle: 720,
      scale: 0,
      alpha: 0,
      x: enemy.x + Phaser.Math.Between(-100, 100),
      y: enemy.y + Phaser.Math.Between(-100, 100),
      duration: 600,
      ease: 'Back.easeIn',
      onComplete: () => {
        enemy.destroy();
      }
    });

    // Flash the player
    this.tweens.add({
      targets: this.player,
      alpha: 0.5,
      duration: 50,
      yoyo: true,
      repeat: 1
    });
  }

  private handleEnemyEscape(enemy: Phaser.GameObjects.GameObject): void {
    enemy.destroy();
    this.lives -= 1;
    this.livesText.setText('Lives: ' + this.lives);
    
    this.cameras.main.shake(200, 0.01);

    if (this.lives <= 0) {
      this.gameOver();
    }
  }

  private startRipenessCycle(): void {
    if (this.ripenessTimer) this.ripenessTimer.destroy();
    
    this.ripenessTimer = this.time.addEvent({
      delay: 10000,
      callback: () => {
        this.ripeness = RIPENESS_CONFIG[this.ripeness].next;
        this.updateRipenessPhysics();
        this.startRipenessCycle();
      },
      callbackScope: this
    });
  }

  private updateRipenessPhysics(): void {
    const config = RIPENESS_CONFIG[this.ripeness];
    if (this.player) {
      this.player.setDrag(config.drag);
      this.player.setTexture(`banana_peel_${this.ripeness}`);
    }
    
    if (this.ripenessText) {
      this.ripenessText.setText('State: ' + this.ripeness.charAt(0).toUpperCase() + this.ripeness.slice(1));
      
      // Feedback
      this.tweens.add({
        targets: this.ripenessText,
        scale: 1.5,
        duration: 200,
        yoyo: true,
        ease: 'Sine.easeOut'
      });
    }
  }

  private gameOver(): void {
    this.gameState = 'GAME_OVER';
    if (this.spawnTimer) this.spawnTimer.destroy();
    if (this.ripenessTimer) this.ripenessTimer.destroy();
    
    this.enemies.clear(true, true);
    
    this.overlayText.setText('GAME OVER').setVisible(true);
    this.subOverlayText.setText(`Final Score: ${this.score}\n\n[E] RETURN TO CITY`).setVisible(true);
  }

  setPaused(paused: boolean): void {
    this.isPaused = paused;
    if (paused) {
      this.physics.world.pause();
      this.time.paused = true;
      this.tweens.pauseAll();
    } else {
      this.physics.world.resume();
      this.time.paused = false;
      this.tweens.resumeAll();
    }
  }

  getResumeCapturePosition(): { x: number; y: number } | null {
    return null; // Top-down doesn't need to resume in overworld position
  }
}
