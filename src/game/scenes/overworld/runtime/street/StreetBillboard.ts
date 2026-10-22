/**
 * StreetBillboard — a roadside board that shows the doodle signed at the
 * Hobbies easel. Empty boards just say the space is for rent.
 */
import * as Phaser from 'phaser';
import { getMessages } from '@/shared/i18n';
import { createUiText } from '@/game/sharedSceneRuntime/text/createUiText';

const INK = 0x1a1a1a;
const PAPER = 0xfbfbf9;
const GROUND_Y = 550;
const BOARD_W = 170;
const BOARD_H = 112;
const BOARD_TOP = 330;
const TEXTURE_PREFIX = 'street-doodle-';

let textureSerial = 0;
let loadedDoodle: { dataUrl: string; key: string } | null = null;

export class StreetBillboard {
  private readonly scene: Phaser.Scene;
  private readonly x: number;
  private readonly emptyText: Phaser.GameObjects.Text;
  private image?: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, x: number, doodleDataUrl: string | null) {
    this.scene = scene;
    this.x = x;
    this.drawFrame();
    this.emptyText = createUiText(scene, x, BOARD_TOP + BOARD_H / 2, getMessages().scenes.overworld.billboardEmpty, {
      fontSize: '13px',
      color: '#1a1a1a',
      align: 'center',
      wordWrap: { width: BOARD_W - 24 }
    })
      .setOrigin(0.5)
      .setAlpha(0.45)
      .setRotation(-0.04)
      .setDepth(9);
    if (doodleDataUrl) this.showDoodle(doodleDataUrl);
  }

  private showDoodle(dataUrl: string): void {
    this.emptyText.setVisible(false);
    if (loadedDoodle?.dataUrl === dataUrl && this.scene.textures.exists(loadedDoodle.key)) {
      this.placeImage(loadedDoodle.key);
      return;
    }
    if (loadedDoodle && this.scene.textures.exists(loadedDoodle.key)) {
      this.scene.textures.remove(loadedDoodle.key);
    }
    textureSerial += 1;
    const key = `${TEXTURE_PREFIX}${textureSerial}`;
    loadedDoodle = { dataUrl, key };
    this.scene.textures.once(`addtexture-${key}`, () => {
      if (this.scene.sys.isActive()) this.placeImage(key);
    });
    this.scene.textures.addBase64(key, dataUrl);
  }

  private placeImage(key: string): void {
    this.image?.destroy();
    const image = this.scene.add.image(this.x, BOARD_TOP + BOARD_H / 2, key).setDepth(9);
    const scale = Math.min((BOARD_W - 16) / image.width, (BOARD_H - 16) / image.height);
    image.setScale(scale);
    this.image = image;
  }

  private drawFrame(): void {
    const g = this.scene.add.graphics().setDepth(8);
    const left = this.x - BOARD_W / 2;
    g.lineStyle(5, INK, 1);
    g.lineBetween(left + 30, BOARD_TOP + BOARD_H, left + 30, GROUND_Y);
    g.lineBetween(left + BOARD_W - 30, BOARD_TOP + BOARD_H, left + BOARD_W - 30, GROUND_Y);
    g.lineStyle(2, INK, 0.7);
    g.lineBetween(left + 30, BOARD_TOP + BOARD_H + 20, left + BOARD_W - 30, GROUND_Y - 6);
    g.fillStyle(INK, 1);
    g.fillRect(left + 6, BOARD_TOP + 6, BOARD_W, BOARD_H);
    g.fillStyle(PAPER, 1);
    g.fillRect(left, BOARD_TOP, BOARD_W, BOARD_H);
    g.lineStyle(4, INK, 1);
    g.strokeRect(left, BOARD_TOP, BOARD_W, BOARD_H);
    // Tape corners.
    g.fillStyle(INK, 0.25);
    g.fillRect(left - 6, BOARD_TOP - 4, 22, 9);
    g.fillRect(left + BOARD_W - 16, BOARD_TOP - 4, 22, 9);
  }
}
