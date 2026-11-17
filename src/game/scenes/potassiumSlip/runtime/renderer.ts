import * as Phaser from 'phaser';
import { GAME_DESIGN_WIDTH } from '@/game/sharedSceneRuntime/config';
import { POTASSIUM_PROJECTILE_CONTROL_DEFAULTS } from './projectileControl';
import { createUiText, snapUiTextCoordinate } from '@/game/sharedSceneRuntime/text/createUiText';
import { getMessages } from '@/shared/i18n';
import type {
  PotassiumDraftOption,
  PotassiumEnemyHealthState,
  PotassiumEnemyKind,
  PotassiumShieldSide,
  PotassiumSkillRanks,
  PotassiumSkillRank,
  PotassiumUpgradeKind
} from './waves';
import {
  getPotassiumData,
  getPotassiumEnemyHp,
  getPotassiumEnemyKind,
  getPotassiumEnemyMaxHp,
  getPotassiumShieldSide,
  isPotassiumEnemyDying,
  POTASSIUM_DATA_KEYS,
  setPotassiumData
} from './phaserData';
import type { PotassiumWallSide } from './wallSuds';

export type PotassiumTerminalAction = 'retry' | 'return' | 'endless';

export interface PotassiumRendererRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
}

export interface PotassiumRendererSafeRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
  labelTop: number;
}

export interface PotassiumRendererLaunchPad {
  x: number;
  y: number;
  radius: number;
}

export interface PotassiumRendererLayout {
  arena: PotassiumRendererRect;
  safe: PotassiumRendererSafeRect;
  launchPad: PotassiumRendererLaunchPad;
}

export interface PotassiumUpgradeChoiceView {
  option: PotassiumDraftOption;
  title: string;
  description: string;
  color: string;
}

export interface PotassiumRendererPoint {
  x: number;
  y: number;
}

interface UpgradeChoiceButton {
  option: PotassiumDraftOption;
  panel: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  description: Phaser.GameObjects.Text;
}

interface TerminalButton {
  action: PotassiumTerminalAction;
  panel: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
}

interface BananaVisuals {
  behind: Phaser.GameObjects.Graphics;
  front: Phaser.GameObjects.Graphics;
}

export interface PotassiumEnemyAttachmentConfig {
  kind: PotassiumEnemyKind;
  label: string;
  hp: number;
  shieldSide?: PotassiumShieldSide;
}

/** Unit vectors pointing from each arena wall into the arena. */
const WALL_NORMALS: Record<PotassiumWallSide, PotassiumRendererPoint> = {
  left: { x: 1, y: 0 },
  right: { x: -1, y: 0 },
  up: { x: 0, y: 1 },
  down: { x: 0, y: -1 }
};

export class PotassiumSlipRenderer {
  private readonly scene: Phaser.Scene;
  private readonly layout: PotassiumRendererLayout;
  private fieldInk?: Phaser.GameObjects.Graphics;
  private hudText?: Phaser.GameObjects.Text;
  private scoreText?: Phaser.GameObjects.Text;
  private livesText?: Phaser.GameObjects.Text;
  private overlayText?: Phaser.GameObjects.Text;
  private subOverlayText?: Phaser.GameObjects.Text;
  private upgradeChoiceButtons: UpgradeChoiceButton[] = [];
  private upgradeChoiceBackdrop?: Phaser.GameObjects.Rectangle;
  private upgradeChoiceTitle?: Phaser.GameObjects.Text;
  private terminalButtons: TerminalButton[] = [];
  private recordsText?: Phaser.GameObjects.Text;
  private aimLine?: Phaser.GameObjects.Graphics;
  private tetherLine?: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, layout: PotassiumRendererLayout) {
    this.scene = scene;
    this.layout = layout;
  }

  ensureTextures(): void {
    if (!this.scene.textures.exists('potassium_enemy_intern')) this.createInternTexture();
    if (!this.scene.textures.exists('potassium_enemy_scope')) this.createScopeTexture();
    if (!this.scene.textures.exists('potassium_enemy_deadline')) this.createDeadlineTexture();
    if (!this.scene.textures.exists('potassium_enemy_wall')) this.createWallTexture();
    if (!this.scene.textures.exists('potassium_enemy_hard_wall')) this.createHardWallTexture();
    if (!this.scene.textures.exists('potassium_enemy_splitter')) this.createSplitterTexture();
    if (!this.scene.textures.exists('potassium_enemy_shield')) this.createShieldTexture();
    if (!this.scene.textures.exists('potassium_damage_cracked') || !this.scene.textures.exists('potassium_damage_critical')) {
      if (this.scene.textures.exists('potassium_damage_cracked')) this.scene.textures.remove('potassium_damage_cracked');
      if (this.scene.textures.exists('potassium_damage_critical')) this.scene.textures.remove('potassium_damage_critical');
      this.createDamageOverlayTextures();
    }
    if (!this.scene.textures.exists('potassium_wall_damage_cracked') || !this.scene.textures.exists('potassium_wall_damage_critical')) {
      if (this.scene.textures.exists('potassium_wall_damage_cracked')) this.scene.textures.remove('potassium_wall_damage_cracked');
      if (this.scene.textures.exists('potassium_wall_damage_critical')) this.scene.textures.remove('potassium_wall_damage_critical');
      this.createWallDamageOverlayTextures();
    }
    if (!this.scene.textures.exists('potassium_enemy_boss')) this.createBossTexture();
    if (!this.scene.textures.exists('potassium_boss_can')) this.createBossCanTexture();
    if (!this.scene.textures.exists('potassium_fire')) this.createFireTexture();
  }

  drawField(): void {
    const { arena, launchPad } = this.layout;
    this.fieldInk = this.scene.add.graphics().setDepth(1);
    this.fieldInk.fillStyle(0xfbfbf9, 1);
    this.fieldInk.fillRect(arena.left, arena.top, arena.width, arena.height);
    this.fieldInk.lineStyle(2, 0x1a1a1a, 0.2);
    for (let y = 72; y < arena.bottom - 70; y += 48) {
      this.fieldInk.beginPath();
      this.fieldInk.moveTo(arena.left + 14, y);
      this.fieldInk.lineTo(arena.right - 14, y + Phaser.Math.Between(-2, 2));
      this.fieldInk.strokePath();
    }

    this.fieldInk.lineStyle(4, 0x1a1a1a, 0.85);
    this.fieldInk.beginPath();
    this.fieldInk.moveTo(arena.left + 8, arena.top);
    this.fieldInk.lineTo(arena.left + 8, arena.bottom);
    this.fieldInk.moveTo(arena.right - 8, arena.top);
    this.fieldInk.lineTo(arena.right - 8, arena.bottom);
    this.fieldInk.strokePath();

    this.fieldInk.fillStyle(0x1a1a1a, 0.04);
    this.fieldInk.fillRect(arena.left + 12, arena.top, arena.width - 24, 52);
    this.fieldInk.fillRect(arena.left + 12, arena.bottom - 82, arena.width - 24, 82);
    this.fieldInk.lineStyle(3, 0x1a1a1a, 0.32);
    this.fieldInk.strokeCircle(launchPad.x, launchPad.y, launchPad.radius);
  }

  clearAim(): void {
    this.aimLine?.clear();
  }

  clearTether(): void {
    this.tetherLine?.clear();
  }

  clearControlFeedback(): void {
    this.clearAim();
    this.clearTether();
  }

  drawAimArrow(from: PotassiumRendererPoint, to: PotassiumRendererPoint): void {
    const aimLine = this.getAimLine();
    const angle = Phaser.Math.Angle.Between(from.x, from.y, to.x, to.y);
    const distance = Phaser.Math.Distance.Between(from.x, from.y, to.x, to.y);
    const arrowLength = Phaser.Math.Clamp(
      distance,
      24,
      POTASSIUM_PROJECTILE_CONTROL_DEFAULTS.launchMaxDrag
    );
    const endX = from.x + Math.cos(angle) * arrowLength;
    const endY = from.y + Math.sin(angle) * arrowLength;
    const headLength = 18;
    const wingA = angle + Math.PI * 0.78;
    const wingB = angle - Math.PI * 0.78;

    aimLine.lineStyle(7, 0x1a1a1a, 0.9);
    aimLine.beginPath();
    aimLine.moveTo(from.x, from.y);
    aimLine.lineTo(endX, endY);
    aimLine.strokePath();

    aimLine.lineStyle(4, 0xfacc15, 0.95);
    aimLine.beginPath();
    aimLine.moveTo(from.x, from.y);
    aimLine.lineTo(endX, endY);
    aimLine.strokePath();

    aimLine.fillStyle(0xfacc15, 0.95);
    aimLine.lineStyle(4, 0x1a1a1a, 0.95);
    aimLine.beginPath();
    aimLine.moveTo(endX, endY);
    aimLine.lineTo(endX + Math.cos(wingA) * headLength, endY + Math.sin(wingA) * headLength);
    aimLine.lineTo(endX + Math.cos(wingB) * headLength, endY + Math.sin(wingB) * headLength);
    aimLine.closePath();
    aimLine.fillPath();
    aimLine.strokePath();
  }

  drawRecallTether(from: PotassiumRendererPoint): void {
    const tetherLine = this.getTetherLine();
    this.clearAim();
    tetherLine.clear();
    tetherLine.lineStyle(3, 0x1a1a1a, 0.75);
    tetherLine.beginPath();
    tetherLine.moveTo(from.x, from.y);
    tetherLine.lineTo(this.layout.launchPad.x, this.layout.launchPad.y);
    tetherLine.strokePath();
  }

  showExplosionVisual(x: number, y: number, radius: number): void {
    const blast = this.scene.add.circle(x, y, 18, 0xf97316, 0.22)
      .setStrokeStyle(5, 0x1a1a1a, 1)
      .setDepth(940);
    this.scene.tweens.add({
      targets: blast,
      radius,
      alpha: 0,
      duration: 240,
      onComplete: () => blast.destroy()
    });
  }

  /**
   * Dishwasher suds where the sponge smacks an arena wall: a fading wet streak
   * on the wall plus a few soap bubbles that drift into the arena and pop.
   * Visual only; never touches physics bodies.
   */
  showWallSuds(x: number, y: number, side: PotassiumWallSide): void {
    const normal = WALL_NORMALS[side];
    const alongX = normal.y !== 0 ? 1 : 0;
    const alongY = normal.x !== 0 ? 1 : 0;

    const streak = this.scene.add.graphics().setDepth(5);
    streak.lineStyle(10, 0xbae6fd, 0.75);
    streak.beginPath();
    streak.moveTo(x - alongX * 30, y - alongY * 30);
    streak.lineTo(x + alongX * 30, y + alongY * 30);
    streak.strokePath();
    streak.lineStyle(3, 0xffffff, 0.9);
    streak.beginPath();
    streak.moveTo(x - alongX * 18 + normal.x * 2, y - alongY * 18 + normal.y * 2);
    streak.lineTo(x + alongX * 10 + normal.x * 2, y + alongY * 10 + normal.y * 2);
    streak.strokePath();
    this.scene.tweens.add({
      targets: streak,
      alpha: 0,
      duration: 900,
      ease: 'Sine.easeIn',
      onComplete: () => streak.destroy()
    });

    for (let index = 0; index < 7; index += 1) {
      const spread = Phaser.Math.Between(-24, 24);
      const radius = Phaser.Math.Between(5, 11);
      const bubble = this.scene.add.circle(
        x + alongX * spread + normal.x * 6,
        y + alongY * spread + normal.y * 6,
        radius,
        0xf0f9ff,
        0.92
      ).setStrokeStyle(2, 0x1a1a1a, 0.7).setDepth(95).setScale(0.4);
      const drift = Phaser.Math.Between(22, 52);
      this.scene.tweens.add({
        targets: bubble,
        x: bubble.x + normal.x * drift + alongX * spread * 0.4,
        y: bubble.y + normal.y * drift + alongY * spread * 0.4 - Phaser.Math.Between(6, 18),
        scale: 1,
        duration: Phaser.Math.Between(320, 520),
        ease: 'Sine.easeOut',
        onComplete: () => {
          this.scene.tweens.add({
            targets: bubble,
            scale: 1.35,
            alpha: 0,
            duration: 90,
            onComplete: () => bubble.destroy()
          });
        }
      });
    }
  }

  animateEnemyDeath(
    enemy: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    onComplete: () => void
  ): void {
    this.scene.tweens.add({
      targets: enemy,
      angle: enemy.angle + 720,
      scale: 0,
      alpha: 0,
      duration: 260,
      ease: 'Back.easeIn',
      onComplete
    });
  }

  createHud(): void {
    const { arena } = this.layout;
    this.hudText = createUiText(this.scene, arena.left + 24, arena.top + 11, '', {
      fontSize: '12px',
      color: '#1a1a1a',
      fontStyle: 'bold'
    }).setDepth(1000);
    this.scoreText = createUiText(this.scene, GAME_DESIGN_WIDTH / 2, arena.top + 11, '', {
      fontSize: '12px',
      color: '#1a1a1a',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0).setDepth(1000);
    this.livesText = createUiText(this.scene, arena.right - 24, arena.top + 11, '', {
      fontSize: '12px',
      color: '#1a1a1a',
      fontStyle: 'bold'
    }).setOrigin(1, 0).setDepth(1000);
  }

  updateHud(input: { waveLabel: string; score: number; lives: number }): void {
    const messages = getMessages();
    this.hudText?.setText(input.waveLabel);
    this.scoreText?.setText(messages.potassiumSlip.hud.score(input.score));
    this.livesText?.setText(messages.potassiumSlip.hud.lives(input.lives));
  }

  createStartOverlay(): void {
    const messages = getMessages();
    const { arena } = this.layout;
    this.overlayText = createUiText(this.scene, GAME_DESIGN_WIDTH / 2, 245, messages.potassiumSlip.title, {
      fontSize: '32px',
      color: '#1a1a1a',
      fontStyle: 'bold',
      wordWrap: { width: arena.width - 64, useAdvancedWrap: true }
    }).setOrigin(0.5).setDepth(1010);

    this.subOverlayText = createUiText(
      this.scene,
      GAME_DESIGN_WIDTH / 2,
      320,
      messages.potassiumSlip.instructions,
      {
        fontSize: '14px',
        color: '#1a1a1a',
        align: 'center',
        fontStyle: 'bold',
        wordWrap: { width: arena.width - 70, useAdvancedWrap: true }
      }
    ).setOrigin(0.5).setDepth(1010);
  }

  hideMainOverlay(): void {
    this.overlayText?.setVisible(false);
    this.subOverlayText?.setVisible(false);
  }

  showOutcomeOverlay(input: { title: string; score: number; titleFontSize: number }): void {
    const messages = getMessages();
    this.overlayText?.setFontSize(input.titleFontSize).setText(input.title).setPosition(GAME_DESIGN_WIDTH / 2, 255).setVisible(true);
    this.subOverlayText?.setFontSize(15).setText(messages.potassiumSlip.finalScore(input.score)).setPosition(GAME_DESIGN_WIDTH / 2, 308).setVisible(true);
  }

  showUpgradeChoices(choices: PotassiumUpgradeChoiceView[]): void {
    const messages = getMessages();
    const { arena } = this.layout;
    this.clearUpgradeChoices();
    this.upgradeChoiceBackdrop = this.scene.add.rectangle(GAME_DESIGN_WIDTH / 2, 305, arena.width - 76, 176, 0xfbfbf9, 0.96)
      .setStrokeStyle(5, 0x1a1a1a, 0.9)
      .setDepth(1200);
    this.upgradeChoiceTitle = createUiText(this.scene, GAME_DESIGN_WIDTH / 2, 238, messages.potassiumSlip.chooseUpgrade, {
      fontSize: '15px',
      color: '#1a1a1a',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5).setDepth(1201);

    const buttonWidth = 164;
    const buttonHeight = 82;
    const startX = choices.length === 1 ? GAME_DESIGN_WIDTH / 2 : GAME_DESIGN_WIDTH / 2 - 88;
    this.upgradeChoiceButtons = choices.map((choice, index) => {
      const x = startX + index * 176;
      const panel = this.scene.add.rectangle(x, 312, buttonWidth, buttonHeight, 0xffffff, 0.92)
        .setStrokeStyle(3, 0x1a1a1a, 0.75)
        .setDepth(1201);
      const label = createUiText(this.scene, x, 286, choice.title, {
        fontSize: '11px',
        color: choice.color,
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: buttonWidth - 16, useAdvancedWrap: true }
      }).setOrigin(0.5).setDepth(1202);
      const description = createUiText(this.scene, x, 326, choice.description, {
        fontSize: '8px',
        color: '#1a1a1a',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: buttonWidth - 18, useAdvancedWrap: true }
      }).setOrigin(0.5).setDepth(1202);
      return { option: choice.option, panel, label, description };
    });
  }

  getUpgradeChoiceAt(x: number, y: number): PotassiumDraftOption | undefined {
    return this.upgradeChoiceButtons.find((button) => button.panel.getBounds().contains(x, y))?.option;
  }

  clearUpgradeChoices(): void {
    this.upgradeChoiceBackdrop?.destroy();
    this.upgradeChoiceTitle?.destroy();
    this.upgradeChoiceBackdrop = undefined;
    this.upgradeChoiceTitle = undefined;
    this.upgradeChoiceButtons.forEach((button) => {
      button.panel.destroy();
      button.label.destroy();
      button.description.destroy();
    });
    this.upgradeChoiceButtons = [];
  }

  showTerminal(outcome: 'won' | 'game_over', records: string): void {
    const messages = getMessages();
    this.clearTerminal();
    const buttons: Array<{ action: PotassiumTerminalAction; label: string }> = outcome === 'won'
      ? [
        { action: 'endless', label: messages.potassiumSlip.terminal.endlessMode },
        { action: 'return', label: messages.potassiumSlip.terminal.returnToCity }
      ]
      : [
        { action: 'retry', label: messages.potassiumSlip.terminal.retry },
        { action: 'return', label: messages.potassiumSlip.terminal.returnToCity }
      ];
    const startX = GAME_DESIGN_WIDTH / 2 - 88;
    this.terminalButtons = buttons.map((button, index) => {
      const x = startX + index * 176;
      const panel = this.scene.add.rectangle(x, 360, 156, 36, 0xffffff, 0.96)
        .setStrokeStyle(3, 0x1a1a1a, 0.88)
        .setDepth(1210);
      const label = createUiText(this.scene, x, 360, button.label, {
        fontSize: '10px',
        color: '#1a1a1a',
        fontStyle: 'bold',
        align: 'center'
      }).setOrigin(0.5).setDepth(1211);
      return { action: button.action, panel, label };
    });

    this.recordsText = createUiText(this.scene, GAME_DESIGN_WIDTH / 2, 424, records, {
      fontSize: '9px',
      color: '#1a1a1a',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: this.layout.arena.width - 72, useAdvancedWrap: true }
    }).setOrigin(0.5, 0).setDepth(1210);
  }

  getTerminalActionAt(x: number, y: number): PotassiumTerminalAction | undefined {
    return this.terminalButtons.find((candidate) => candidate.panel.getBounds().contains(x, y))?.action;
  }

  clearTerminal(): void {
    this.terminalButtons.forEach((button) => {
      button.panel.destroy();
      button.label.destroy();
    });
    this.terminalButtons = [];
    this.recordsText?.destroy();
    this.recordsText = undefined;
  }

  createEnemyAttachments(
    enemy: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    config: PotassiumEnemyAttachmentConfig
  ): void {
    setPotassiumData(enemy, POTASSIUM_DATA_KEYS.damageState, 'healthy' satisfies PotassiumEnemyHealthState);
    setPotassiumData(enemy, POTASSIUM_DATA_KEYS.damageCueBaseScaleX, enemy.scaleX);
    setPotassiumData(enemy, POTASSIUM_DATA_KEYS.damageCueBaseScaleY, enemy.scaleY);
    setPotassiumData(enemy, POTASSIUM_DATA_KEYS.damageOverlay, this.createDamageOverlay(enemy));
    if (config.shieldSide) {
      setPotassiumData(enemy, POTASSIUM_DATA_KEYS.shieldSide, config.shieldSide);
      setPotassiumData(enemy, POTASSIUM_DATA_KEYS.shieldPlate, this.createShieldPlate(enemy, config.shieldSide));
    }
    if (config.kind === 'boss') {
      setPotassiumData(enemy, POTASSIUM_DATA_KEYS.labelText, this.createEnemyLabel(enemy, config.label, config.hp));
    }
  }

  positionEnemyAttachments(enemy: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody): void {
    const overlay = getPotassiumData<Phaser.GameObjects.Sprite>(enemy, POTASSIUM_DATA_KEYS.damageOverlay);
    if (overlay) {
      const state = getPotassiumData<PotassiumEnemyHealthState>(enemy, POTASSIUM_DATA_KEYS.damageState);
      const kind = getPotassiumEnemyKind(enemy);
      const isWall = kind === 'wall';
      overlay.setPosition(enemy.x, enemy.y)
        .setScale(enemy.displayWidth / (isWall ? 80 : 76), enemy.displayHeight / 62)
        .setRotation(enemy.rotation)
        .setVisible(state === 'cracked' || state === 'critical');
      overlay.setTexture(isWall
        ? state === 'critical' ? 'potassium_wall_damage_critical' : 'potassium_wall_damage_cracked'
        : state === 'critical' ? 'potassium_damage_critical' : 'potassium_damage_cracked');
    }
    const shieldPlate = getPotassiumData<Phaser.GameObjects.Rectangle>(enemy, POTASSIUM_DATA_KEYS.shieldPlate);
    const shieldSide = getPotassiumShieldSide(enemy);
    if (shieldPlate && shieldSide) {
      this.positionShieldPlate(enemy, shieldPlate, shieldSide);
    }
    const label = getPotassiumData<Phaser.GameObjects.Text>(enemy, POTASSIUM_DATA_KEYS.labelText);
    if (label) {
      const messages = getMessages();
      const hp = Math.ceil(getPotassiumEnemyHp(enemy));
      const maxHp = getPotassiumEnemyMaxHp(enemy);
      label.setText(messages.potassiumSlip.enemies.health(hp, maxHp));
      this.positionFloatingLabel(label, enemy.x, enemy.y - 34 * enemy.scale);
    }
  }

  showDamageCue(
    enemy: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    source: 'banana' | 'fire' | 'poison' | 'explosion' | 'ghost'
  ): void {
    const color = source === 'poison'
      ? 0x65a30d
      : source === 'fire'
        ? 0xf97316
        : source === 'explosion'
          ? 0xef4444
          : source === 'ghost'
            ? 0x38bdf8
            : 0x1a1a1a;
    const radius = Math.max(18, enemy.displayWidth * 0.42);
    const ring = this.scene.add.circle(enemy.x, enemy.y, radius, color, 0.08)
      .setStrokeStyle(3, color, 0.58)
      .setDepth(930);
    this.scene.tweens.add({
      targets: ring,
      radius: radius + 10,
      alpha: 0,
      duration: 180,
      ease: 'Sine.easeOut',
      onComplete: () => ring.destroy()
    });
    const baseScaleX = getPotassiumData<number>(enemy, POTASSIUM_DATA_KEYS.damageCueBaseScaleX) ?? enemy.scaleX;
    const baseScaleY = getPotassiumData<number>(enemy, POTASSIUM_DATA_KEYS.damageCueBaseScaleY) ?? enemy.scaleY;
    const previousPulse = getPotassiumData<Phaser.Tweens.Tween>(enemy, POTASSIUM_DATA_KEYS.damageCueTween);
    previousPulse?.stop();
    enemy.setScale(baseScaleX, baseScaleY);
    const pulse = this.scene.tweens.add({
      targets: enemy,
      scaleX: baseScaleX * 1.06,
      scaleY: baseScaleY * 1.06,
      duration: 55,
      yoyo: true,
      ease: 'Sine.easeOut',
      onComplete: () => {
        if (enemy.active && !isPotassiumEnemyDying(enemy)) {
          enemy.setScale(baseScaleX, baseScaleY);
        }
        setPotassiumData(enemy, POTASSIUM_DATA_KEYS.damageCueTween, undefined);
      }
    });
    setPotassiumData(enemy, POTASSIUM_DATA_KEYS.damageCueTween, pulse);
  }

  refreshProjectileVisuals(
    projectile: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    skillRanks: PotassiumSkillRanks,
    options: { isClone?: boolean; isMain?: boolean; isRecall?: boolean } = {}
  ): void {
    if (!projectile.active) return;
    const isMain = options.isMain ?? false;
    const isClone = options.isClone ?? !isMain;
    const isRecall = options.isRecall ?? false;
    projectile.setTexture(getSkillRank(skillRanks, 'poison') > 0 ? 'potassium_sponge_poison' : 'potassium_sponge');
    projectile.clearTint();
    projectile.setAlpha(isClone ? 0.82 : isRecall ? 0.68 : 1);
    this.destroyProjectileVisuals(projectile);

    const behind = this.scene.add.graphics().setDepth(projectile.depth - 1);
    const front = this.scene.add.graphics().setDepth(projectile.depth + 1);
    this.drawBananaUpgradeAccents(behind, front, skillRanks, isClone);
    setPotassiumData(projectile, POTASSIUM_DATA_KEYS.bananaVisuals, { behind, front } satisfies BananaVisuals);
    this.positionProjectileVisuals(projectile);
  }

  positionProjectileVisuals(projectile: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody): void {
    const visuals = getPotassiumData<BananaVisuals>(projectile, POTASSIUM_DATA_KEYS.bananaVisuals);
    if (!visuals) return;
    visuals.behind.setPosition(projectile.x, projectile.y).setRotation(projectile.rotation).setVisible(projectile.active);
    visuals.front.setPosition(projectile.x, projectile.y).setRotation(projectile.rotation).setVisible(projectile.active);
  }

  destroyProjectileVisuals(projectile?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody): void {
    if (!projectile) return;
    const visuals = getPotassiumData<BananaVisuals>(projectile, POTASSIUM_DATA_KEYS.bananaVisuals);
    visuals?.behind.destroy();
    visuals?.front.destroy();
    setPotassiumData(projectile, POTASSIUM_DATA_KEYS.bananaVisuals, undefined);
  }

  showGhostStatusField(input: {
    x: number;
    y: number;
    direction: 'horizontal' | 'vertical';
    poisonActive: boolean;
    durationMs: number;
  }): void {
    if (!input.poisonActive) return;
    const isHorizontal = input.direction === 'horizontal';
    const width = isHorizontal ? this.layout.arena.width - 42 : 24;
    const height = isHorizontal ? 24 : this.layout.arena.height - 128;
    const field = this.scene.add.rectangle(
      input.direction === 'horizontal' ? GAME_DESIGN_WIDTH / 2 : input.x,
      input.direction === 'horizontal' ? input.y : this.layout.arena.top + 92 + height / 2,
      width,
      height,
      0x65a30d,
      0.12
    ).setStrokeStyle(2, 0x65a30d, 0.42).setDepth(934);
    this.scene.tweens.add({
      targets: field,
      alpha: 0,
      duration: input.durationMs,
      onComplete: () => field.destroy()
    });
  }

  showGhostBeam(input: {
    x: number;
    y: number;
    direction: 'horizontal' | 'vertical';
    durationMs: number;
  }): void {
    const isHorizontal = input.direction === 'horizontal';
    const width = isHorizontal ? this.layout.arena.width - 42 : 24;
    const height = isHorizontal ? 24 : this.layout.arena.height - 128;
    const beam = this.scene.add.rectangle(
      isHorizontal ? GAME_DESIGN_WIDTH / 2 : input.x,
      isHorizontal ? input.y : this.layout.arena.top + 92 + height / 2,
      width,
      height,
      0x38bdf8,
      0.24
    ).setStrokeStyle(4, 0x1a1a1a, 0.82).setDepth(935);
    this.scene.tweens.add({
      targets: beam,
      alpha: 0,
      duration: input.durationMs,
      onComplete: () => beam.destroy()
    });
  }

  private createEnemyLabel(
    enemy: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    labelText: string,
    hp: number
  ): Phaser.GameObjects.Text {
    const messages = getMessages();
    const label = createUiText(this.scene, enemy.x, enemy.y - 34, messages.potassiumSlip.enemies.labelledHealth(labelText, hp), {
      fontSize: '9px',
      color: '#1a1a1a',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5).setDepth(900);
    enemy.once(Phaser.GameObjects.Events.DESTROY, () => label.destroy());
    return label;
  }

  private createDamageOverlay(enemy: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody): Phaser.GameObjects.Sprite {
    const kind = getPotassiumEnemyKind(enemy);
    const overlay = this.scene.add.sprite(enemy.x, enemy.y, kind === 'wall' ? 'potassium_wall_damage_cracked' : 'potassium_damage_cracked')
      .setDepth(enemy.depth + 1)
      .setOrigin(0.5)
      .setVisible(false);
    enemy.once(Phaser.GameObjects.Events.DESTROY, () => overlay.destroy());
    return overlay;
  }

  private createShieldPlate(
    enemy: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    side: PotassiumShieldSide
  ): Phaser.GameObjects.Rectangle {
    const plate = this.scene.add.rectangle(enemy.x, enemy.y, 12, 12, 0xa1a1aa, 0.9)
      .setStrokeStyle(4, 0x1a1a1a, 0.9)
      .setDepth(enemy.depth + 2);
    enemy.once(Phaser.GameObjects.Events.DESTROY, () => plate.destroy());
    this.positionShieldPlate(enemy, plate, side);
    return plate;
  }

  private positionShieldPlate(
    enemy: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    plate: Phaser.GameObjects.Rectangle,
    side: PotassiumShieldSide
  ): void {
    const width = Math.max(20, enemy.displayWidth * (side === 'bottom' ? 0.72 : 0.22));
    const height = Math.max(12, enemy.displayHeight * (side === 'bottom' ? 0.2 : 0.72));
    const offsetX = side === 'left' ? -enemy.displayWidth * 0.42 : side === 'right' ? enemy.displayWidth * 0.42 : 0;
    const offsetY = side === 'bottom' ? enemy.displayHeight * 0.42 : 0;
    plate.setPosition(enemy.x + offsetX, enemy.y + offsetY);
    plate.setSize(width, height);
  }

  private positionFloatingLabel(label: Phaser.GameObjects.Text, x: number, y: number): void {
    label.setPosition(
      snapUiTextCoordinate(Phaser.Math.Clamp(x, this.layout.safe.left, this.layout.safe.right)),
      snapUiTextCoordinate(Phaser.Math.Clamp(y, this.layout.safe.labelTop, this.layout.safe.bottom))
    );
  }

  private getAimLine(): Phaser.GameObjects.Graphics {
    if (!this.aimLine) {
      this.aimLine = this.scene.add.graphics().setDepth(950);
    }
    return this.aimLine;
  }

  private getTetherLine(): Phaser.GameObjects.Graphics {
    if (!this.tetherLine) {
      this.tetherLine = this.scene.add.graphics().setDepth(949);
    }
    return this.tetherLine;
  }

  private drawBananaUpgradeAccents(
    behind: Phaser.GameObjects.Graphics,
    front: Phaser.GameObjects.Graphics,
    skillRanks: PotassiumSkillRanks,
    isClone: boolean
  ): void {
    const scale = isClone ? 0.58 : 1;
    const alphaScale = isClone ? 0.62 : 1;
    const fireRank = getSkillRank(skillRanks, 'fire');
    const explosionRank = getSkillRank(skillRanks, 'explosion');
    const duplicateRank = getSkillRank(skillRanks, 'duplicate');
    const ghostHorizontalRank = getSkillRank(skillRanks, 'ghostHorizontal');
    const ghostVerticalRank = getSkillRank(skillRanks, 'ghostVertical');

    if (duplicateRank > 0) {
      behind.lineStyle((duplicateRank >= 2 ? 4 : 3) * scale, 0xfacc15, 0.28 * alphaScale);
      behind.strokeEllipse(-16 * scale, 8 * scale, 26 * scale, 15 * scale);
      behind.strokeEllipse(16 * scale, -7 * scale, 22 * scale, 13 * scale);
    }

    if (fireRank > 0) {
      behind.lineStyle((fireRank >= 2 ? 6 : 4) * scale, 0xf97316, 0.55 * alphaScale);
      behind.strokeCircle(0, 0, (fireRank >= 2 ? 36 : 32) * scale);
      behind.lineStyle(2 * scale, 0xfacc15, 0.42 * alphaScale);
      behind.strokeCircle(0, 0, 25 * scale);
    }

    if (ghostHorizontalRank > 0) {
      front.lineStyle((ghostHorizontalRank >= 2 ? 5 : 3) * scale, 0x38bdf8, 0.56 * alphaScale);
      front.beginPath();
      front.moveTo(-34 * scale, 0);
      front.lineTo(34 * scale, 0);
      front.strokePath();
    }

    if (ghostVerticalRank > 0) {
      front.lineStyle((ghostVerticalRank >= 2 ? 5 : 3) * scale, 0x60a5fa, 0.5 * alphaScale);
      front.beginPath();
      front.moveTo(0, -34 * scale);
      front.lineTo(0, 34 * scale);
      front.strokePath();
    }

    if (explosionRank > 0) {
      const sparkScale = explosionRank >= 2 ? 1.12 : 1;
      front.fillStyle(0xef4444, 0.86 * alphaScale);
      front.lineStyle(2 * scale, 0x1a1a1a, 0.72 * alphaScale);
      front.beginPath();
      front.moveTo(22 * scale, -28 * scale);
      front.lineTo(27 * scale * sparkScale, -14 * scale);
      front.lineTo(38 * scale, -13 * scale);
      front.lineTo(29 * scale, -6 * scale * sparkScale);
      front.lineTo(33 * scale, 6 * scale);
      front.lineTo(21 * scale, -2 * scale);
      front.lineTo(11 * scale, 6 * scale);
      front.lineTo(14 * scale, -8 * scale);
      front.lineTo(4 * scale, -16 * scale);
      front.lineTo(18 * scale, -17 * scale);
      front.closePath();
      front.fillPath();
      front.strokePath();
    }
  }

  /** Dust Bunny: a tiny fluffball that goes poof in one hit. */
  private createInternTexture(): void {
    const g = this.scene.make.graphics({ x: 0, y: 0 });
    const puffs: Array<[number, number, number]> = [
      [24, 28, 13], [13, 26, 8], [35, 26, 8], [17, 36, 7], [31, 36, 7], [24, 17, 8]
    ];
    g.fillStyle(0x1a1a1a, 1);
    g.fillEllipse(17, 10, 8, 16);
    g.fillEllipse(31, 10, 8, 16);
    puffs.forEach(([x, y, r]) => g.fillCircle(x, y, r + 2.5));
    g.fillStyle(0xe7e5e4, 1);
    g.fillEllipse(17, 10, 4, 12);
    g.fillEllipse(31, 10, 4, 12);
    puffs.forEach(([x, y, r]) => g.fillCircle(x, y, r));
    g.fillStyle(0x1a1a1a, 1);
    g.fillCircle(19, 26, 2.2);
    g.fillCircle(29, 26, 2.2);
    g.fillStyle(0xfda4af, 0.7);
    g.fillCircle(15, 31, 2.5);
    g.fillCircle(33, 31, 2.5);
    g.lineStyle(2, 0x1a1a1a, 0.85);
    g.beginPath();
    g.arc(24, 29, 3, 0.2, Math.PI - 0.2);
    g.strokePath();
    g.generateTexture('potassium_enemy_intern', 48, 46);
    g.destroy();
  }

  /** Mystery Leftovers: a wobbly glob of something in a cracked container. */
  private createScopeTexture(): void {
    const g = this.scene.make.graphics({ x: 0, y: 0 });
    const blobs: Array<[number, number, number]> = [
      [34, 30, 17], [20, 34, 11], [48, 33, 12], [27, 20, 9], [42, 19, 8]
    ];
    g.fillStyle(0x1a1a1a, 1);
    blobs.forEach(([x, y, r]) => g.fillCircle(x, y, r + 3));
    g.fillStyle(0xa3e635, 0.95);
    blobs.forEach(([x, y, r]) => g.fillCircle(x, y, r));
    g.fillStyle(0xd9f99d, 0.9);
    g.fillCircle(26, 26, 4);
    g.fillCircle(46, 28, 3);
    g.fillStyle(0xbfdbfe, 0.96);
    g.lineStyle(4, 0x1a1a1a, 1);
    g.fillRoundedRect(8, 38, 52, 20, 5);
    g.strokeRoundedRect(8, 38, 52, 20, 5);
    g.lineStyle(2, 0x1a1a1a, 0.6);
    g.beginPath();
    g.moveTo(44, 39);
    g.lineTo(40, 47);
    g.lineTo(45, 52);
    g.strokePath();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(33, 25, 8);
    g.lineStyle(2, 0x1a1a1a, 1);
    g.strokeCircle(33, 25, 8);
    g.fillStyle(0x1a1a1a, 1);
    g.fillCircle(35, 27, 3.2);
    g.lineStyle(2, 0x1a1a1a, 0.5);
    g.beginPath();
    g.moveTo(14, 12);
    g.lineTo(11, 6);
    g.moveTo(56, 12);
    g.lineTo(59, 5);
    g.strokePath();
    g.generateTexture('potassium_enemy_scope', 68, 64);
    g.destroy();
  }

  /** Roly-Poly: curled into a ball and rolling down fast. */
  private createDeadlineTexture(): void {
    const g = this.scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x94a3b8, 1);
    g.lineStyle(4, 0x1a1a1a, 1);
    g.fillCircle(28, 31, 22);
    g.strokeCircle(28, 31, 22);
    g.lineStyle(2.5, 0x1a1a1a, 0.7);
    for (let i = -1; i <= 1; i += 1) {
      g.beginPath();
      g.moveTo(10 + Math.abs(i) * 3, 31 + i * 11);
      g.lineTo(46 - Math.abs(i) * 3, 31 + i * 11);
      g.strokePath();
    }
    g.fillStyle(0xcbd5e1, 0.9);
    g.fillEllipse(19, 18, 10, 5);
    g.fillStyle(0xfbfbf9, 1);
    g.lineStyle(3, 0x1a1a1a, 1);
    g.fillEllipse(28, 31, 20, 14);
    g.strokeEllipse(28, 31, 20, 14);
    g.fillStyle(0x1a1a1a, 1);
    g.fillCircle(24, 30, 2);
    g.fillCircle(32, 30, 2);
    g.lineStyle(2, 0x1a1a1a, 0.9);
    g.beginPath();
    g.moveTo(24, 6);
    g.lineTo(20, 1);
    g.moveTo(32, 6);
    g.lineTo(36, 1);
    g.strokePath();
    g.generateTexture('potassium_enemy_deadline', 56, 62);
    g.destroy();
  }

  /** Pizza Box: breakable cardboard; damage reads as grease and torn corners. */
  private createWallTexture(): void {
    const g = this.scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xd6a76a, 0.98);
    g.lineStyle(5, 0x1a1a1a, 1);
    g.fillRoundedRect(5, 7, 70, 48, 4);
    g.strokeRoundedRect(5, 7, 70, 48, 4);
    g.lineStyle(3, 0x1a1a1a, 0.6);
    g.beginPath();
    g.moveTo(9, 44);
    g.lineTo(71, 44);
    g.strokePath();
    g.fillStyle(0xb45309, 0.28);
    g.fillEllipse(58, 20, 16, 9);
    g.fillEllipse(17, 36, 11, 7);
    g.fillStyle(0xfacc15, 1);
    g.lineStyle(3, 0x1a1a1a, 1);
    g.fillTriangle(30, 15, 50, 15, 40, 38);
    g.strokeTriangle(30, 15, 50, 15, 40, 38);
    g.fillStyle(0xd97706, 1);
    g.fillRect(31, 15, 18, 3);
    g.fillStyle(0xdc2626, 1);
    g.fillCircle(36, 22, 2.5);
    g.fillCircle(44, 23, 2.5);
    g.fillCircle(40, 30, 2.2);
    g.generateTexture('potassium_enemy_wall', 80, 62);
    g.destroy();
  }

  /** Cinder Block: unbreakable junk the banana has to bounce around. */
  private createHardWallTexture(): void {
    const g = this.scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x1a1a1a, 0.1);
    g.fillRoundedRect(8, 9, 70, 48, 3);
    g.fillStyle(0xa8a29e, 1);
    g.lineStyle(5, 0x1a1a1a, 1);
    g.fillRoundedRect(5, 7, 70, 48, 3);
    g.strokeRoundedRect(5, 7, 70, 48, 3);
    g.fillStyle(0x44403c, 1);
    g.lineStyle(3, 0x1a1a1a, 1);
    g.fillRoundedRect(13, 16, 22, 30, 2);
    g.strokeRoundedRect(13, 16, 22, 30, 2);
    g.fillRoundedRect(45, 16, 22, 30, 2);
    g.strokeRoundedRect(45, 16, 22, 30, 2);
    g.fillStyle(0x1a1a1a, 0.35);
    const speckles: Array<[number, number]> = [[10, 12], [40, 12], [70, 50], [40, 50], [10, 50], [70, 12]];
    speckles.forEach(([x, y]) => g.fillCircle(x, y, 1.4));
    g.generateTexture('potassium_enemy_hard_wall', 80, 62);
    g.destroy();
  }

  /** Tied Trash Bag: bursts into two dust bunnies (one is already peeking out). */
  private createSplitterTexture(): void {
    const g = this.scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x1a1a1a, 1);
    g.fillEllipse(63, 34, 118, 44);
    g.fillTriangle(53, 12, 73, 12, 63, 24);
    g.fillStyle(0x57534e, 1);
    g.fillEllipse(63, 34, 110, 36);
    g.fillTriangle(57, 15, 69, 15, 63, 22);
    g.lineStyle(4, 0x1a1a1a, 1);
    g.beginPath();
    g.moveTo(63, 14);
    g.lineTo(52, 4);
    g.moveTo(63, 14);
    g.lineTo(74, 4);
    g.strokePath();
    g.lineStyle(2, 0x1a1a1a, 0.55);
    g.beginPath();
    g.moveTo(34, 24);
    g.lineTo(42, 34);
    g.moveTo(84, 22);
    g.lineTo(92, 30);
    g.moveTo(56, 42);
    g.lineTo(70, 46);
    g.strokePath();
    g.fillStyle(0xa8a29e, 0.55);
    g.fillEllipse(38, 23, 18, 5);
    g.fillStyle(0x1a1a1a, 1);
    g.fillCircle(100, 37, 8);
    g.fillStyle(0xe7e5e4, 1);
    g.fillCircle(100, 37, 6);
    g.fillStyle(0x1a1a1a, 1);
    g.fillCircle(98, 36, 1.4);
    g.fillCircle(102, 36, 1.4);
    g.generateTexture('potassium_enemy_splitter', 126, 58);
    g.destroy();
  }

  /** Lid Pigeon: the trash-can lid is drawn by the shield plate attachment. */
  private createShieldTexture(): void {
    const g = this.scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xa5b4c8, 1);
    g.lineStyle(4, 0x1a1a1a, 1);
    g.fillEllipse(34, 40, 42, 32);
    g.strokeEllipse(34, 40, 42, 32);
    g.fillStyle(0x8193ad, 1);
    g.fillEllipse(40, 42, 22, 16);
    g.fillStyle(0xa5b4c8, 1);
    g.fillCircle(34, 18, 12);
    g.strokeCircle(34, 18, 12);
    g.fillStyle(0x5eead4, 0.8);
    g.fillEllipse(34, 29, 18, 6);
    g.fillStyle(0xf97316, 1);
    g.lineStyle(2, 0x1a1a1a, 1);
    g.fillTriangle(30, 21, 38, 21, 34, 28);
    g.strokeTriangle(30, 21, 38, 21, 34, 28);
    g.fillStyle(0xfdba74, 1);
    g.fillCircle(29, 15, 4);
    g.fillCircle(39, 15, 4);
    g.fillStyle(0x1a1a1a, 1);
    g.fillCircle(29, 15, 1.8);
    g.fillCircle(39, 15, 1.8);
    g.lineStyle(3, 0xf97316, 1);
    g.beginPath();
    g.moveTo(28, 55);
    g.lineTo(26, 62);
    g.moveTo(40, 55);
    g.lineTo(42, 62);
    g.strokePath();
    g.generateTexture('potassium_enemy_shield', 68, 66);
    g.destroy();
  }

  /** Sir Rummage: the raccoon in a cardboard crown, Circuit clutched in one paw. */
  private createBossTexture(): void {
    const g = this.scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x9ca3af, 1);
    g.lineStyle(5, 0x1a1a1a, 1);
    g.fillTriangle(22, 34, 30, 8, 46, 26);
    g.strokeTriangle(22, 34, 30, 8, 46, 26);
    g.fillTriangle(102, 34, 94, 8, 78, 26);
    g.strokeTriangle(102, 34, 94, 8, 78, 26);
    g.fillEllipse(62, 50, 92, 62);
    g.strokeEllipse(62, 50, 92, 62);
    g.fillStyle(0x3f3f46, 1);
    g.fillEllipse(44, 46, 34, 20);
    g.fillEllipse(80, 46, 34, 20);
    g.fillRect(44, 41, 36, 9);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(44, 46, 7);
    g.fillCircle(80, 46, 7);
    g.fillStyle(0x1a1a1a, 1);
    g.fillCircle(46, 47, 3.4);
    g.fillCircle(78, 47, 3.4);
    g.fillStyle(0xf5f5f4, 1);
    g.lineStyle(3, 0x1a1a1a, 1);
    g.fillEllipse(62, 66, 34, 22);
    g.strokeEllipse(62, 66, 34, 22);
    g.fillStyle(0x1a1a1a, 1);
    g.fillEllipse(62, 60, 10, 7);
    g.lineStyle(2.5, 0x1a1a1a, 1);
    g.beginPath();
    g.moveTo(54, 67);
    g.lineTo(58, 71);
    g.lineTo(62, 68);
    g.lineTo(66, 71);
    g.lineTo(70, 67);
    g.strokePath();
    g.fillStyle(0xd6a76a, 1);
    g.lineStyle(3, 0x1a1a1a, 1);
    g.beginPath();
    g.moveTo(46, 24);
    g.lineTo(46, 8);
    g.lineTo(54, 16);
    g.lineTo(62, 4);
    g.lineTo(70, 16);
    g.lineTo(78, 8);
    g.lineTo(78, 24);
    g.closePath();
    g.fillPath();
    g.strokePath();
    g.fillStyle(0x22c55e, 1);
    g.lineStyle(3, 0x1a1a1a, 1);
    g.fillRect(96, 62, 22, 16);
    g.strokeRect(96, 62, 22, 16);
    g.lineStyle(2, 0xfacc15, 1);
    g.beginPath();
    g.moveTo(100, 66);
    g.lineTo(110, 66);
    g.lineTo(110, 74);
    g.moveTo(104, 74);
    g.lineTo(114, 70);
    g.strokePath();
    g.fillStyle(0x9ca3af, 1);
    g.lineStyle(3, 0x1a1a1a, 1);
    g.fillCircle(97, 76, 7);
    g.strokeCircle(97, 76, 7);
    g.generateTexture('potassium_enemy_boss', 124, 90);
    g.destroy();
  }

  /** Soda can from Sir Rummage's hoard: his orbiting phase-2 blockers. */
  private createBossCanTexture(): void {
    const g = this.scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xef4444, 1);
    g.lineStyle(5, 0x1a1a1a, 1);
    g.fillRoundedRect(12, 12, 56, 38, 6);
    g.strokeRoundedRect(12, 12, 56, 38, 6);
    g.fillStyle(0xd4d4d8, 1);
    g.lineStyle(3, 0x1a1a1a, 1);
    g.fillEllipse(12, 31, 12, 38);
    g.strokeEllipse(12, 31, 12, 38);
    g.lineStyle(4, 0xfbfbf9, 0.95);
    g.beginPath();
    g.moveTo(22, 34);
    g.lineTo(32, 26);
    g.lineTo(44, 36);
    g.lineTo(56, 26);
    g.strokePath();
    g.lineStyle(2, 0x1a1a1a, 0.5);
    g.beginPath();
    g.moveTo(40, 13);
    g.lineTo(44, 22);
    g.lineTo(40, 30);
    g.strokePath();
    g.generateTexture('potassium_boss_can', 80, 62);
    g.destroy();
  }

  private createDamageOverlayTextures(): void {
    const cracked = this.scene.make.graphics({ x: 0, y: 0 });
    cracked.lineStyle(4, 0x1a1a1a, 0.9);
    cracked.beginPath();
    cracked.moveTo(22, 10);
    cracked.lineTo(32, 22);
    cracked.lineTo(27, 34);
    cracked.moveTo(50, 18);
    cracked.lineTo(42, 30);
    cracked.lineTo(50, 42);
    cracked.strokePath();
    cracked.fillStyle(0xfbfbf9, 0.74);
    cracked.fillRoundedRect(13, 43, 24, 8, 3);
    cracked.lineStyle(2, 0x1a1a1a, 0.7);
    cracked.strokeRoundedRect(13, 43, 24, 8, 3);
    cracked.generateTexture('potassium_damage_cracked', 76, 62);
    cracked.destroy();

    const critical = this.scene.make.graphics({ x: 0, y: 0 });
    critical.lineStyle(4, 0x1a1a1a, 0.95);
    critical.beginPath();
    critical.moveTo(18, 8);
    critical.lineTo(30, 20);
    critical.lineTo(22, 34);
    critical.lineTo(36, 48);
    critical.moveTo(56, 12);
    critical.lineTo(44, 24);
    critical.lineTo(56, 38);
    critical.moveTo(42, 8);
    critical.lineTo(38, 18);
    critical.lineTo(46, 27);
    critical.strokePath();
    critical.fillStyle(0xfbfbf9, 0.82);
    critical.fillRoundedRect(10, 40, 28, 9, 3);
    critical.fillRoundedRect(41, 31, 23, 9, 3);
    critical.lineStyle(2, 0x1a1a1a, 0.75);
    critical.strokeRoundedRect(10, 40, 28, 9, 3);
    critical.strokeRoundedRect(41, 31, 23, 9, 3);
    critical.generateTexture('potassium_damage_critical', 76, 62);
    critical.destroy();
  }

  private createWallDamageOverlayTextures(): void {
    const cracked = this.scene.make.graphics({ x: 0, y: 0 });
    cracked.lineStyle(4, 0x1a1a1a, 0.9);
    cracked.beginPath();
    cracked.moveTo(18, 11);
    cracked.lineTo(29, 23);
    cracked.lineTo(21, 34);
    cracked.moveTo(55, 15);
    cracked.lineTo(45, 27);
    cracked.lineTo(57, 39);
    cracked.strokePath();
    cracked.lineStyle(3, 0xfbfbf9, 0.48);
    cracked.beginPath();
    cracked.moveTo(13, 47);
    cracked.lineTo(28, 39);
    cracked.moveTo(49, 48);
    cracked.lineTo(68, 42);
    cracked.strokePath();
    cracked.generateTexture('potassium_wall_damage_cracked', 80, 62);
    cracked.destroy();

    const critical = this.scene.make.graphics({ x: 0, y: 0 });
    critical.lineStyle(4, 0x1a1a1a, 0.96);
    critical.beginPath();
    critical.moveTo(14, 8);
    critical.lineTo(29, 21);
    critical.lineTo(19, 32);
    critical.lineTo(34, 47);
    critical.moveTo(62, 8);
    critical.lineTo(48, 22);
    critical.lineTo(62, 37);
    critical.moveTo(42, 12);
    critical.lineTo(38, 27);
    critical.lineTo(48, 43);
    critical.strokePath();
    critical.lineStyle(3, 0xfbfbf9, 0.55);
    critical.beginPath();
    critical.moveTo(9, 50);
    critical.lineTo(25, 40);
    critical.moveTo(29, 13);
    critical.lineTo(42, 7);
    critical.moveTo(51, 52);
    critical.lineTo(73, 43);
    critical.strokePath();
    critical.generateTexture('potassium_wall_damage_critical', 80, 62);
    critical.destroy();
  }

  private createFireTexture(): void {
    const g = this.scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xf97316, 0.34);
    g.lineStyle(3, 0x1a1a1a, 0.42);
    g.fillEllipse(30, 18, 56, 24);
    g.strokeEllipse(30, 18, 56, 24);
    g.fillStyle(0xfacc15, 0.38);
    g.fillEllipse(30, 16, 34, 14);
    g.generateTexture('potassium_fire', 60, 36);
    g.destroy();
  }
}

function getSkillRank(skillRanks: PotassiumSkillRanks, upgrade: PotassiumUpgradeKind): PotassiumSkillRank {
  return skillRanks[upgrade] ?? 0;
}
