/**
 * HobbiesRoom — draws the hobby studio: stations, string lights, posters and
 * the little prize tags that fill in as mini-game parts are won.
 * Positions come from src/game/scenes/hobbies/roomLayout.ts.
 */
import * as Phaser from 'phaser';
import { HOBBIES_OVERLAY_IDS, type HobbiesOverlayId } from '@/game/overlays/overlayIds';
import { HOBBIES_EXIT_X, HOBBY_STATION_LAYOUT } from '../roomLayout';
import { getMessages } from '@/shared/i18n';
import { TextureGenerator } from '@/game/sharedSceneRuntime/textures/TextureGenerator';
import {
  HOBBIES_FLOOR_Y,
  HOBBIES_ROOM_HEIGHT,
  HOBBIES_ROOM_WIDTH
} from '@/game/sharedSceneRuntime/config';
import { createUiText } from '@/game/sharedSceneRuntime/text/createUiText';

const INK = 0x1a1a1a;
const PAPER = 0xfbfbf9;
const WALL_LEFT = 50;
const WALL_RIGHT = 950;
const CEILING_Y = 50;
const BULB_COUNT = 14;

export interface HobbiesRoomState {
  /** Station ids whose prize (part or pinned doodle) is already claimed. */
  claimed: ReadonlySet<HobbiesOverlayId>;
  focusId: HobbiesOverlayId | null;
}

interface StationView {
  id: HobbiesOverlayId;
  sprite: Phaser.GameObjects.Sprite;
  label: Phaser.GameObjects.Text;
  tag: Phaser.GameObjects.Graphics;
  tagX: number;
  claimed: boolean | null;
}

export class HobbiesRoom {
  private readonly scene: Phaser.Scene;
  private readonly stations: StationView[] = [];
  private readonly lights: Phaser.GameObjects.Graphics;
  private lastTick = -1;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    for (const hobbyId of HOBBIES_OVERLAY_IDS) {
      TextureGenerator.generateHobbyItem(scene, hobbyId);
    }
    this.drawShell();
    this.drawWindows();
    this.drawPosters();
    this.drawFloorProps();
    this.lights = scene.add.graphics().setDepth(2);
    this.createStations();
    this.drawExitDoor();
  }

  update(state: HobbiesRoomState, tick: number, motion: boolean): void {
    const wobble = motion && tick % 2 === 0 ? 0.04 : -0.04;
    for (const station of this.stations) {
      this.updateStation(station, state, motion ? wobble : 0);
    }
    if (tick === this.lastTick) return;
    this.lastTick = tick;
    this.drawLights(motion ? tick : 0);
  }

  private updateStation(station: StationView, state: HobbiesRoomState, wobble: number): void {
    const claimed = state.claimed.has(station.id);
    if (claimed !== station.claimed) {
      station.claimed = claimed;
      this.drawTag(station);
    }
    const focused = station.id === state.focusId;
    station.sprite.setRotation(focused ? wobble : 0).setScale(focused ? 1.06 : 1);
    station.label.setScale(focused ? 1.12 : 1);
  }

  private drawShell(): void {
    const { scene } = this;
    const floorY = HOBBIES_FLOOR_Y;
    scene.add.rectangle(HOBBIES_ROOM_WIDTH / 2, HOBBIES_ROOM_HEIGHT / 2, HOBBIES_ROOM_WIDTH, HOBBIES_ROOM_HEIGHT, 0xf4f1ea);
    const bg = scene.add.graphics();
    bg.fillStyle(PAPER, 1);
    bg.fillRect(WALL_LEFT, CEILING_Y, WALL_RIGHT - WALL_LEFT, 500);
    bg.lineStyle(6, INK, 1);
    bg.strokeRect(WALL_LEFT, CEILING_Y, WALL_RIGHT - WALL_LEFT, 500);

    // Floor boards.
    bg.lineStyle(2, INK, 0.2);
    for (let y = floorY + 15; y < 550; y += 15) bg.lineBetween(WALL_LEFT, y, WALL_RIGHT, y);
    for (let x = 90; x < WALL_RIGHT; x += 120) bg.lineBetween(x, floorY, x - 20, 550);
    bg.lineStyle(4, INK, 1);
    bg.lineBetween(WALL_LEFT, floorY, WALL_RIGHT, floorY);

    // Wainscoting.
    bg.lineStyle(2, INK, 0.3);
    bg.lineBetween(WALL_LEFT, 420, WALL_RIGHT, 420);
    for (let x = 80; x < WALL_RIGHT; x += 40) bg.lineBetween(x, 420, x, floorY);
  }

  private drawWindows(): void {
    const g = this.scene.add.graphics();
    for (const left of [150, 730]) {
      g.lineStyle(4, INK, 1);
      g.strokeRect(left, 150, 120, 120);
      g.lineStyle(2, INK, 0.5);
      g.lineBetween(left + 60, 150, left + 60, 270);
      g.lineBetween(left, 210, left + 120, 210);
      // Scribbled cloud outside.
      g.lineStyle(1.5, INK, 0.3);
      g.strokeEllipse(left + 38, 180, 34, 14);
      g.strokeEllipse(left + 52, 176, 26, 12);
      // Curtains, tied back.
      g.lineStyle(2, INK, 0.75);
      for (const side of [-1, 1]) {
        const edge = side < 0 ? left - 6 : left + 126;
        g.beginPath();
        g.moveTo(edge, 140);
        g.lineTo(edge + side * -22, 140);
        g.lineTo(edge + side * -6, 220);
        g.lineTo(edge + side * -16, 282);
        g.lineTo(edge, 282);
        g.closePath();
        g.strokePath();
        g.lineStyle(1, INK, 0.35);
        for (let y = 150; y < 280; y += 12) g.lineBetween(edge, y, edge + side * -10, y + 6);
        g.lineStyle(2, INK, 0.75);
      }
      g.lineStyle(3, INK, 0.9);
      g.lineBetween(left - 30, 140, left + 150, 140);
    }
  }

  private drawPosters(): void {
    const g = this.scene.add.graphics();
    this.drawEightLimbsPoster(g, 340, 132);
    this.drawChordPoster(g, 470, 150);
    this.drawFramedSketch(g, 590, 138);
  }

  private drawPosterPaper(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number): void {
    g.fillStyle(INK, 1);
    g.fillRect(x + 4, y + 4, w, h);
    g.fillStyle(PAPER, 1);
    g.fillRect(x, y, w, h);
    g.lineStyle(2, INK, 1);
    g.strokeRect(x, y, w, h);
    g.fillStyle(INK, 1);
    g.fillCircle(x + w / 2, y + 5, 2.5);
  }

  /** Muay Thai: the art of eight limbs — a stick figure mid-teep. */
  private drawEightLimbsPoster(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    this.drawPosterPaper(g, x - 6, y, 108, 128);
    const cx = x + 44;
    g.lineStyle(3, INK, 1);
    g.strokeCircle(cx, y + 30, 9);
    g.lineBetween(cx, y + 39, cx - 4, y + 74);
    g.lineBetween(cx - 4, y + 74, cx - 14, y + 108);
    g.lineBetween(cx - 4, y + 74, cx + 34, y + 62);
    g.lineBetween(cx - 2, y + 50, cx - 20, y + 40);
    g.lineBetween(cx - 2, y + 50, cx + 16, y + 42);
    g.lineStyle(1, INK, 0.4);
    for (let i = 0; i < 4; i += 1) g.lineBetween(cx + 38 + i * 2, y + 54 + i * 5, cx + 48 + i * 2, y + 50 + i * 5);
    createUiText(this.scene, x + 48, y + 116, getMessages().scenes.hobbies.posterLimbs, {
      fontSize: '11px',
      color: '#1a1a1a',
      fontStyle: 'bold'
    }).setOrigin(0.5);
  }

  /** Guitar: an E minor chord box, the first chord everyone learns. */
  private drawChordPoster(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    this.drawPosterPaper(g, x, y, 80, 100);
    const left = x + 16;
    const top = y + 26;
    g.lineStyle(1.5, INK, 0.9);
    for (let s = 0; s < 6; s += 1) g.lineBetween(left + s * 10, top, left + s * 10, top + 56);
    for (let f = 0; f <= 4; f += 1) g.lineBetween(left, top + f * 14, left + 50, top + f * 14);
    g.lineStyle(3, INK, 1);
    g.lineBetween(left, top, left + 50, top);
    g.fillStyle(INK, 1);
    g.fillCircle(left + 10, top + 21, 4);
    g.fillCircle(left + 20, top + 21, 4);
    createUiText(this.scene, x + 40, y + 14, 'Em', { fontSize: '13px', color: '#1a1a1a', fontStyle: 'bold' }).setOrigin(0.5);
  }

  /** A framed doodle of the street's first house — the sketchbook sketching itself. */
  private drawFramedSketch(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    g.lineStyle(5, INK, 1);
    g.strokeRect(x, y, 84, 70);
    g.lineStyle(1, INK, 0.5);
    g.strokeRect(x + 7, y + 7, 70, 56);
    g.lineStyle(2, INK, 0.9);
    g.strokeRect(x + 30, y + 34, 24, 22);
    g.lineBetween(x + 26, y + 36, x + 42, y + 20);
    g.lineBetween(x + 42, y + 20, x + 58, y + 36);
    g.lineStyle(1, INK, 0.6);
    g.lineBetween(x + 12, y + 56, x + 72, y + 56);
  }

  private drawFloorProps(): void {
    const g = this.scene.add.graphics();
    const stationX = new Map(HOBBY_STATION_LAYOUT.map((station) => [station.id, station.x]));
    this.drawDropCloth(g, stationX.get('art') ?? 280);
    this.drawAmp(g, stationX.get('music') ?? 440);
    this.drawMat(g, stationX.get('fitness') ?? 600);
    this.drawDanceCorner(g, stationX.get('dancing') ?? 760);
    this.drawPlant(g);
  }

  /** Paint-splattered drop cloth under the easel. */
  private drawDropCloth(g: Phaser.GameObjects.Graphics, artX: number): void {
    const floorY = HOBBIES_FLOOR_Y;
    g.lineStyle(2, INK, 0.6);
    g.strokeEllipse(artX, floorY + 14, 120, 16);
    g.fillStyle(INK, 0.5);
    for (let i = 0; i < 7; i += 1) g.fillCircle(artX - 44 + i * 14, floorY + 10 + (i % 3) * 4, 1.5 + (i % 2));
  }

  /** Practice amp next to the guitar. */
  private drawAmp(g: Phaser.GameObjects.Graphics, musicX: number): void {
    const floorY = HOBBIES_FLOOR_Y;
    g.fillStyle(PAPER, 1);
    g.fillRect(musicX + 34, floorY - 36, 40, 36);
    g.lineStyle(2, INK, 1);
    g.strokeRect(musicX + 34, floorY - 36, 40, 36);
    g.lineStyle(1, INK, 0.5);
    for (let y = floorY - 30; y < floorY - 4; y += 5) g.lineBetween(musicX + 38, y, musicX + 70, y);
    g.lineStyle(2, INK, 0.8);
    g.lineBetween(musicX + 34, floorY - 6, musicX + 14, floorY - 2);
  }

  /** Training mat under the bag. */
  private drawMat(g: Phaser.GameObjects.Graphics, fitX: number): void {
    const floorY = HOBBIES_FLOOR_Y;
    g.lineStyle(2, INK, 0.7);
    g.strokeRect(fitX - 56, floorY + 4, 112, 12);
    g.lineStyle(1, INK, 0.3);
    for (let x = fitX - 50; x < fitX + 56; x += 10) g.lineBetween(x, floorY + 4, x + 6, floorY + 16);
  }

  /** Checkered dance floor + a tall mirror. */
  private drawDanceCorner(g: Phaser.GameObjects.Graphics, danceX: number): void {
    const floorY = HOBBIES_FLOOR_Y;
    for (let i = 0; i < 6; i += 1) {
      g.fillStyle(INK, i % 2 === 0 ? 0.18 : 0.04);
      g.fillRect(danceX - 66 + i * 22, floorY + 2, 22, 14);
    }
    g.lineStyle(3, INK, 1);
    g.strokeRect(danceX + 96, 300, 44, floorY - 300);
    g.lineStyle(1.5, INK, 0.3);
    g.lineBetween(danceX + 104, 320, danceX + 120, 300);
    g.lineBetween(danceX + 104, 350, danceX + 132, 316);
  }

  /** A plant that has seen better days. */
  private drawPlant(g: Phaser.GameObjects.Graphics): void {
    const floorY = HOBBIES_FLOOR_Y;
    g.lineStyle(2, INK, 0.9);
    g.strokeRect(906, floorY - 30, 26, 30);
    g.lineBetween(919, floorY - 30, 912, floorY - 66);
    g.lineBetween(919, floorY - 30, 930, floorY - 60);
    g.strokeEllipse(908, floorY - 70, 14, 8);
    g.strokeEllipse(932, floorY - 64, 14, 8);
  }

  private createStations(): void {
    const messages = getMessages();
    const floorY = HOBBIES_FLOOR_Y;
    for (const station of HOBBY_STATION_LAYOUT) {
      const sprite = this.scene.add
        .sprite(station.x, floorY + station.yOffsetFromFloor, `hobby_${station.id}`)
        .setOrigin(0.5, station.spriteMode === 'floor' ? 1 : 0.5)
        .setDepth(3); // Player walks at depth 8, in front of the props.
      const label = createUiText(this.scene, station.x, floorY - 140, messages.scenes.hobbies.labels[station.id], {
        fontSize: '20px',
        color: '#1a1a1a',
        fontStyle: 'bold'
      })
        .setOrigin(0.5)
        .setDepth(9);
      const tagX = station.x + label.width / 2 + 18;
      const tag = this.scene.add.graphics({ x: tagX, y: floorY - 140 }).setDepth(9);
      this.stations.push({ id: station.id, sprite, label, tag, tagX, claimed: null });
    }
  }

  /** Paper prize tag: dashed outline of the prize until won, then solid with a tick. */
  private drawTag(station: StationView): void {
    const g = station.tag;
    const claimed = station.claimed ?? false;
    g.clear();
    g.fillStyle(PAPER, 1);
    g.fillRect(-11, -11, 22, 22);
    g.lineStyle(2, INK, claimed ? 1 : 0.45);
    g.strokeRect(-11, -11, 22, 22);
    g.lineStyle(2, INK, claimed ? 1 : 0.35);
    switch (station.id) {
      case 'music':
        g.lineBetween(-6, 6, 6, -6);
        g.strokeCircle(-6, 6, 2);
        break;
      case 'fitness':
        g.strokeRect(-3, -6, 6, 12);
        g.lineBetween(-1, -8, 1, -8);
        break;
      case 'dancing':
        g.strokeTriangle(0, -7, 5, 0, -5, 0);
        g.strokeTriangle(0, 7, 5, 0, -5, 0);
        break;
      default:
        g.strokeCircle(0, -3, 3);
        g.lineBetween(0, 0, 0, 7);
    }
    if (!claimed) return;
    g.lineStyle(3, INK, 1);
    g.lineBetween(5, 8, 9, 12);
    g.lineBetween(9, 12, 16, 2);
  }

  private drawLights(frame: number): void {
    const g = this.lights;
    g.clear();
    const span = WALL_RIGHT - WALL_LEFT - 40;
    g.lineStyle(1.5, INK, 0.7);
    g.beginPath();
    for (let i = 0; i <= BULB_COUNT; i += 1) {
      const x = WALL_LEFT + 20 + (span * i) / BULB_COUNT;
      const y = CEILING_Y + 22 + Math.sin((i / BULB_COUNT) * Math.PI * 3) * 10 + 10;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.strokePath();
    for (let i = 1; i < BULB_COUNT; i += 1) {
      const x = WALL_LEFT + 20 + (span * i) / BULB_COUNT;
      const y = CEILING_Y + 22 + Math.sin((i / BULB_COUNT) * Math.PI * 3) * 10 + 10;
      const on = (i + frame) % 3 !== 0;
      g.fillStyle(on ? PAPER : INK, on ? 1 : 0.15);
      g.fillCircle(x, y + 7, 4);
      g.lineStyle(1.5, INK, 0.9);
      g.strokeCircle(x, y + 7, 4);
      if (on) {
        g.lineStyle(1, INK, 0.35);
        g.lineBetween(x - 7, y + 12, x - 10, y + 15);
        g.lineBetween(x + 7, y + 12, x + 10, y + 15);
      }
    }
  }

  private drawExitDoor(): void {
    const floorY = HOBBIES_FLOOR_Y;
    const exitDoor = this.scene.add.graphics();
    exitDoor.lineStyle(4, INK, 1);
    exitDoor.fillStyle(PAPER, 1);
    exitDoor.fillRect(HOBBIES_EXIT_X - 30, floorY - 100, 60, 100);
    exitDoor.strokeRect(HOBBIES_EXIT_X - 30, floorY - 100, 60, 100);
    exitDoor.strokeCircle(HOBBIES_EXIT_X + 20, floorY - 50, 3);
    // Doormat.
    exitDoor.lineStyle(2, INK, 0.6);
    exitDoor.strokeRect(HOBBIES_EXIT_X - 34, floorY + 2, 68, 8);
    createUiText(this.scene, HOBBIES_EXIT_X, floorY - 120, getMessages().navigation.exit, {
      fontSize: '16px',
      color: '#1a1a1a'
    }).setOrigin(0.5);
  }
}
