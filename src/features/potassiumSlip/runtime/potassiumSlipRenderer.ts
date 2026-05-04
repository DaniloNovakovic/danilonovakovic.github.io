import * as Phaser from 'phaser';
import { GAME_DESIGN_WIDTH } from '@game/runtime/config';
import { POTASSIUM_PROJECTILE_CONTROL_DEFAULTS } from './potassiumSlipProjectileControl';
import { createUiText, snapUiTextCoordinate } from '@game/runtime/text/createUiText';
import type {
  PotassiumDraftOption,
  PotassiumEnemyHealthState,
  PotassiumEnemyKind,
  PotassiumShieldSide,
  PotassiumSkillRanks,
  PotassiumSkillRank,
  PotassiumUpgradeKind
} from './potassiumSlipWaves';
import {
  getPotassiumData,
  getPotassiumEnemyHp,
  getPotassiumEnemyKind,
  getPotassiumEnemyMaxHp,
  getPotassiumShieldSide,
  isPotassiumEnemyDying,
  POTASSIUM_DATA_KEYS,
  setPotassiumData
} from './potassiumSlipPhaserData';

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
    this.hudText?.setText(input.waveLabel);
    this.scoreText?.setText(`Score ${input.score}`);
    this.livesText?.setText(`Lives ${input.lives}`);
  }

  createStartOverlay(): void {
    const { arena } = this.layout;
    this.overlayText = createUiText(this.scene, GAME_DESIGN_WIDTH / 2, 245, 'POTASSIUM SLIP', {
      fontSize: '32px',
      color: '#1a1a1a',
      fontStyle: 'bold',
      wordWrap: { width: arena.width - 64, useAdvancedWrap: true }
    }).setOrigin(0.5).setDepth(1010);

    this.subOverlayText = createUiText(
      this.scene,
      GAME_DESIGN_WIDTH / 2,
      320,
      'DRAG TOWARD A TARGET. RELEASE BANANA.\nHOLD ANYWHERE TO YO-YO IT HOME.\nCLEAR WAVES. STEAL THE CIRCUIT.',
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
    this.overlayText?.setFontSize(input.titleFontSize).setText(input.title).setPosition(GAME_DESIGN_WIDTH / 2, 255).setVisible(true);
    this.subOverlayText?.setFontSize(15).setText(`Final Score: ${input.score}`).setPosition(GAME_DESIGN_WIDTH / 2, 308).setVisible(true);
  }

  showUpgradeChoices(choices: PotassiumUpgradeChoiceView[]): void {
    const { arena } = this.layout;
    this.clearUpgradeChoices();
    this.upgradeChoiceBackdrop = this.scene.add.rectangle(GAME_DESIGN_WIDTH / 2, 305, arena.width - 76, 176, 0xfbfbf9, 0.96)
      .setStrokeStyle(5, 0x1a1a1a, 0.9)
      .setDepth(1200);
    this.upgradeChoiceTitle = createUiText(this.scene, GAME_DESIGN_WIDTH / 2, 238, 'CHOOSE BANANA NONSENSE', {
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
    this.clearTerminal();
    const buttons: Array<{ action: PotassiumTerminalAction; label: string }> = outcome === 'won'
      ? [
        { action: 'endless', label: 'ENDLESS MODE' },
        { action: 'return', label: 'RETURN TO CITY' }
      ]
      : [
        { action: 'retry', label: 'RETRY' },
        { action: 'return', label: 'RETURN TO CITY' }
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
      const hp = Math.ceil(getPotassiumEnemyHp(enemy));
      const maxHp = getPotassiumEnemyMaxHp(enemy);
      label.setText(`${hp}/${maxHp}`);
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
    projectile.setTexture(getSkillRank(skillRanks, 'poison') > 0 ? 'banana_peel_green' : 'banana_peel_yellow');
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
    const label = createUiText(this.scene, enemy.x, enemy.y - 34, `${labelText} ${hp}/${hp}`, {
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
    const plate = this.scene.add.rectangle(enemy.x, enemy.y, 12, 12, 0x38bdf8, 0.4)
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

  private createInternTexture(): void {
    const g = this.scene.make.graphics({ x: 0, y: 0 });
    g.lineStyle(3, 0x1a1a1a, 1);
    g.fillStyle(0xfacc15, 0.95);
    g.fillEllipse(24, 24, 30, 24);
    g.strokeEllipse(24, 24, 30, 24);
    g.fillStyle(0x1a1a1a, 1);
    g.fillCircle(18, 20, 2);
    g.fillCircle(30, 20, 2);
    for (let i = 0; i < 3; i += 1) {
      g.beginPath();
      g.moveTo(13 + i * 9, 32);
      g.lineTo(8 + i * 9, 40);
      g.moveTo(18 + i * 9, 32);
      g.lineTo(22 + i * 9, 40);
      g.strokePath();
    }
    g.generateTexture('potassium_enemy_intern', 48, 46);
    g.destroy();
  }

  private createScopeTexture(): void {
    const g = this.scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xa855f7, 0.85);
    g.lineStyle(4, 0x1a1a1a, 1);
    g.beginPath();
    g.moveTo(34, 8);
    g.lineTo(54, 14);
    g.lineTo(61, 34);
    g.lineTo(50, 56);
    g.lineTo(28, 58);
    g.lineTo(8, 46);
    g.lineTo(10, 24);
    g.lineTo(22, 10);
    g.closePath();
    g.fillPath();
    g.strokePath();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(28, 30, 8);
    g.fillStyle(0x1a1a1a, 1);
    g.fillCircle(30, 30, 3);
    g.generateTexture('potassium_enemy_scope', 68, 64);
    g.destroy();
  }

  private createDeadlineTexture(): void {
    const g = this.scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xf97316, 0.9);
    g.lineStyle(4, 0x1a1a1a, 1);
    g.beginPath();
    g.moveTo(28, 4);
    g.lineTo(54, 46);
    g.lineTo(28, 34);
    g.lineTo(2, 46);
    g.closePath();
    g.fillPath();
    g.strokePath();
    g.lineStyle(3, 0x1a1a1a, 0.8);
    g.beginPath();
    g.moveTo(28, 34);
    g.lineTo(28, 58);
    g.strokePath();
    g.generateTexture('potassium_enemy_deadline', 56, 62);
    g.destroy();
  }

  private createWallTexture(): void {
    const g = this.scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x8b5a2b, 0.96);
    g.lineStyle(5, 0x1a1a1a, 1);
    g.fillRoundedRect(5, 7, 70, 48, 4);
    g.strokeRoundedRect(5, 7, 70, 48, 4);
    g.fillStyle(0xb7793b, 0.96);
    g.fillRect(10, 12, 60, 10);
    g.fillRect(10, 26, 60, 10);
    g.fillRect(10, 40, 60, 10);
    g.lineStyle(2, 0x1a1a1a, 0.48);
    g.beginPath();
    g.moveTo(18, 13);
    g.lineTo(12, 21);
    g.moveTo(48, 26);
    g.lineTo(60, 35);
    g.moveTo(26, 42);
    g.lineTo(18, 50);
    g.strokePath();
    g.fillStyle(0xfbfbf9, 0.5);
    g.fillRect(14, 16, 18, 3);
    g.fillRect(42, 44, 16, 3);
    g.lineStyle(3, 0x1a1a1a, 0.75);
    g.beginPath();
    g.moveTo(12, 31);
    g.lineTo(68, 31);
    g.strokePath();
    g.generateTexture('potassium_enemy_wall', 80, 62);
    g.destroy();
  }

  private createHardWallTexture(): void {
    const g = this.scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x1a1a1a, 0.08);
    g.fillRoundedRect(7, 5, 66, 52, 5);
    g.fillStyle(0xfbfbf9, 1);
    g.lineStyle(5, 0x1a1a1a, 1);
    g.fillRoundedRect(5, 7, 70, 48, 5);
    g.strokeRoundedRect(5, 7, 70, 48, 5);
    g.fillStyle(0x1a1a1a, 0.12);
    g.fillRoundedRect(11, 13, 58, 36, 4);
    g.lineStyle(6, 0x1a1a1a, 0.92);
    g.beginPath();
    g.moveTo(18, 17);
    g.lineTo(62, 45);
    g.moveTo(62, 17);
    g.lineTo(18, 45);
    g.strokePath();
    g.generateTexture('potassium_enemy_hard_wall', 80, 62);
    g.destroy();
  }

  private createSplitterTexture(): void {
    const g = this.scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xfde68a, 0.96);
    g.lineStyle(4, 0x1a1a1a, 1);
    g.fillRoundedRect(7, 8, 112, 42, 6);
    g.strokeRoundedRect(7, 8, 112, 42, 6);
    g.fillStyle(0xfacc15, 0.82);
    g.fillRoundedRect(12, 13, 48, 32, 4);
    g.fillRoundedRect(66, 13, 48, 32, 4);
    g.lineStyle(3, 0x1a1a1a, 0.85);
    g.beginPath();
    g.moveTo(63, 10);
    g.lineTo(63, 50);
    g.moveTo(24, 24);
    g.lineTo(50, 24);
    g.moveTo(76, 34);
    g.lineTo(104, 34);
    g.strokePath();
    g.fillStyle(0x1a1a1a, 1);
    g.fillCircle(29, 31, 3);
    g.fillCircle(93, 27, 3);
    g.generateTexture('potassium_enemy_splitter', 126, 58);
    g.destroy();
  }

  private createShieldTexture(): void {
    const g = this.scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xdbeafe, 0.96);
    g.lineStyle(4, 0x1a1a1a, 1);
    g.beginPath();
    g.moveTo(34, 5);
    g.lineTo(58, 18);
    g.lineTo(52, 50);
    g.lineTo(34, 60);
    g.lineTo(16, 50);
    g.lineTo(10, 18);
    g.closePath();
    g.fillPath();
    g.strokePath();
    g.fillStyle(0x38bdf8, 0.45);
    g.fillRoundedRect(18, 38, 32, 10, 4);
    g.lineStyle(2, 0x1a1a1a, 0.75);
    g.strokeRoundedRect(18, 38, 32, 10, 4);
    g.generateTexture('potassium_enemy_shield', 68, 66);
    g.destroy();
  }

  private createBossTexture(): void {
    const g = this.scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xffffff, 1);
    g.lineStyle(6, 0x1a1a1a, 1);
    g.fillRoundedRect(4, 10, 116, 70, 10);
    g.strokeRoundedRect(4, 10, 116, 70, 10);
    g.lineStyle(3, 0x1a1a1a, 0.55);
    g.strokeCircle(34, 44, 14);
    g.strokeCircle(88, 44, 14);
    g.beginPath();
    g.moveTo(45, 62);
    g.lineTo(80, 62);
    g.strokePath();
    g.fillStyle(0xfacc15, 0.5);
    g.fillRect(12, 16, 100, 12);
    g.generateTexture('potassium_enemy_boss', 124, 90);
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
