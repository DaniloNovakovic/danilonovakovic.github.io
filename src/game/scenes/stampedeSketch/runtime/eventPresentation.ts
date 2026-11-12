import * as Phaser from 'phaser';
import { createUiText } from '@/game/sharedSceneRuntime/text/createUiText';
import { STAMPEDE_MIRROR_RADIUS, type StampedeMirror } from './mapEvents';

export type StampedeBeaconKind = 'mirror' | 'gift' | 'heart' | 'bartender' | 'ex' | 'boyfriend';

export interface StampedeEventBeacon {
  x: number;
  y: number;
  kind: StampedeBeaconKind;
}

export interface StampedeEventLook {
  showBanner(title: string, subtitle?: string): void;
  syncMirror(mirror: StampedeMirror | null, nowMs: number, charging: boolean): void;
  syncBeacons(beacons: readonly StampedeEventBeacon[], view: Phaser.Geom.Rectangle): void;
  reset(): void;
}

const INK = 0x1a1a1a;
const PAPER = 0xfbfbf9;
/** The notebook frame crops the canvas edge, so arrows sit inside this inset. */
const EDGE_INSET = 44;

const BEACON_COLORS: Record<StampedeBeaconKind, number> = {
  mirror: 0x9fd3e6,
  gift: 0xf3c1d0,
  heart: 0xc0263b,
  bartender: 0xf0a202,
  ex: 0x6e3a62,
  boyfriend: 0xd13b3b
};

export function createStampedeEventLook(scene: Phaser.Scene): StampedeEventLook {
  return new PhaserStampedeEventLook(scene);
}

class PhaserStampedeEventLook implements StampedeEventLook {
  private readonly scene: Phaser.Scene;
  private readonly mirrorGround: Phaser.GameObjects.Graphics;
  private readonly mirrorStand: Phaser.GameObjects.Graphics;
  private readonly mirrorLabel: Phaser.GameObjects.Text;
  private readonly arrows: Phaser.GameObjects.Graphics;
  private readonly bannerTitle: Phaser.GameObjects.Text;
  private readonly bannerSubtitle: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.mirrorGround = scene.add.graphics().setDepth(14).setVisible(false);
    this.mirrorStand = scene.add.graphics().setDepth(19).setVisible(false);
    this.mirrorLabel = createUiText(scene, 0, 0, 'pep talk', {
      fontSize: '13px',
      color: '#1a1a1a',
      fontStyle: 'bold',
      backgroundColor: '#fbfbf9',
      padding: { x: 4, y: 1 }
    }).setOrigin(0.5, 1).setDepth(33).setVisible(false);
    this.arrows = scene.add.graphics().setScrollFactor(0).setDepth(80);
    this.bannerTitle = createUiText(scene, 500, 74, '', {
      fontSize: '30px',
      color: '#1a1a1a',
      fontStyle: 'bold',
      backgroundColor: '#fbfbf9',
      padding: { x: 12, y: 4 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(85).setVisible(false);
    this.bannerSubtitle = createUiText(scene, 500, 108, '', {
      fontSize: '15px',
      color: '#4b4337',
      fontStyle: 'bold',
      backgroundColor: '#fbfbf9',
      padding: { x: 8, y: 2 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(85).setVisible(false);
  }

  showBanner(title: string, subtitle = ''): void {
    const targets = [this.bannerTitle, this.bannerSubtitle];
    targets.forEach((text) => this.scene.tweens.killTweensOf(text));
    this.bannerTitle.setText(title).setVisible(true).setAlpha(1).setScale(0.6).setAngle(-3);
    this.bannerSubtitle.setText(subtitle).setVisible(subtitle.length > 0).setAlpha(1).setScale(1);
    this.scene.tweens.add({
      targets: this.bannerTitle,
      scale: 1,
      angle: -1.5,
      duration: 260,
      ease: 'Back.easeOut'
    });
    this.scene.tweens.add({
      targets,
      alpha: 0,
      delay: 2_100,
      duration: 420,
      onComplete: () => targets.forEach((text) => text.setVisible(false))
    });
  }

  syncMirror(mirror: StampedeMirror | null, nowMs: number, charging: boolean): void {
    this.mirrorGround.clear();
    this.mirrorStand.clear();
    if (!mirror) {
      this.mirrorGround.setVisible(false);
      this.mirrorStand.setVisible(false);
      this.mirrorLabel.setVisible(false);
      return;
    }
    const { x, y } = mirror;
    const pulse = 1 + Math.sin(nowMs / 220) * 0.04;
    const ground = this.mirrorGround.setVisible(true);
    ground.fillStyle(0x9fd3e6, charging ? 0.28 : 0.14);
    ground.fillCircle(x, y, STAMPEDE_MIRROR_RADIUS * pulse);
    ground.lineStyle(2.5, INK, 0.75);
    const segments = 16;
    const turn = nowMs / 2_000;
    for (let index = 0; index < segments; index += 1) {
      const start = turn + (index / segments) * Math.PI * 2;
      ground.beginPath();
      ground.arc(x, y, STAMPEDE_MIRROR_RADIUS * pulse, start, start + (Math.PI / segments) * 1.1, false);
      ground.strokePath();
    }
    if (mirror.charge > 0) {
      ground.lineStyle(6, 0x2f8fb5, 0.9);
      ground.beginPath();
      ground.arc(x, y, STAMPEDE_MIRROR_RADIUS - 6, -Math.PI / 2, -Math.PI / 2 + mirror.charge * Math.PI * 2, false);
      ground.strokePath();
    }

    const stand = this.mirrorStand.setVisible(true);
    stand.lineStyle(3, INK, 1);
    stand.lineBetween(x - 10, y - 4, x - 16, y + 12);
    stand.lineBetween(x + 10, y - 4, x + 16, y + 12);
    stand.fillStyle(0xc89b5d, 1);
    stand.fillEllipse(x, y - 30, 34, 48);
    stand.strokeEllipse(x, y - 30, 34, 48);
    stand.fillStyle(0xdff1f8, 1);
    stand.fillEllipse(x, y - 30, 24, 38);
    stand.lineStyle(2, INK, 1);
    stand.strokeEllipse(x, y - 30, 24, 38);
    stand.lineStyle(2.4, PAPER, 1);
    stand.lineBetween(x - 6, y - 40, x + 2, y - 46);
    stand.lineBetween(x - 6, y - 32, x + 5, y - 42);
    this.mirrorLabel
      .setText(charging ? 'looking good...' : 'pep talk')
      .setPosition(x, y - 58)
      .setVisible(true);
  }

  syncBeacons(beacons: readonly StampedeEventBeacon[], view: Phaser.Geom.Rectangle): void {
    this.arrows.clear();
    const cx = view.width / 2;
    const cy = view.height / 2;
    const halfW = cx - EDGE_INSET;
    const halfH = cy - EDGE_INSET;
    beacons.forEach((beacon) => {
      const sx = beacon.x - view.x;
      const sy = beacon.y - view.y;
      const inside = sx > EDGE_INSET - 16 && sx < view.width - EDGE_INSET + 16
        && sy > EDGE_INSET - 16 && sy < view.height - EDGE_INSET + 16;
      if (inside) return;
      const dx = sx - cx;
      const dy = sy - cy;
      const scale = Math.min(halfW / Math.max(0.001, Math.abs(dx)), halfH / Math.max(0.001, Math.abs(dy)));
      const ax = cx + dx * scale;
      const ay = cy + dy * scale;
      const angle = Math.atan2(dy, dx);
      this.drawArrow(ax, ay, angle, BEACON_COLORS[beacon.kind]);
    });
  }

  reset(): void {
    [this.bannerTitle, this.bannerSubtitle].forEach((text) => {
      this.scene.tweens.killTweensOf(text);
      text.setVisible(false);
    });
    this.arrows.clear();
    this.syncMirror(null, 0, false);
  }

  private drawArrow(x: number, y: number, angle: number, color: number): void {
    const g = this.arrows;
    const pulse = 1 + Math.sin(this.scene.time.now / 160) * 0.12;
    const tipReach = 26 * pulse;
    const tip = { x: x + Math.cos(angle) * tipReach, y: y + Math.sin(angle) * tipReach };
    const left = { x: x + Math.cos(angle + 2.2) * 14, y: y + Math.sin(angle + 2.2) * 14 };
    const right = { x: x + Math.cos(angle - 2.2) * 14, y: y + Math.sin(angle - 2.2) * 14 };
    g.fillStyle(INK, 1);
    g.fillTriangle(tip.x, tip.y, left.x, left.y, right.x, right.y);
    g.fillStyle(PAPER, 1);
    g.fillCircle(x, y, 15);
    g.fillStyle(color, 1);
    g.lineStyle(3, INK, 1);
    g.fillCircle(x, y, 12);
    g.strokeCircle(x, y, 12);
  }
}
