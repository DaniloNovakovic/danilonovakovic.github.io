import type Phaser from 'phaser';
import type { MiniGameId } from '../../config/featureIds';

type Graphics = Phaser.GameObjects.Graphics;

function drawProfileHouse(bg: Graphics) {
  const bFill = 0xfbfbf9;
  const bLine = 0x1a1a1a;
  bg.fillStyle(bFill, 1);
  bg.lineStyle(5, bLine, 1);
  bg.beginPath();
  bg.moveTo(20, 150);
  bg.lineTo(125, 50);
  bg.lineTo(230, 150);
  bg.closePath();
  bg.fillPath();
  bg.strokePath();
  bg.fillRect(40, 150, 170, 150);
  bg.strokeRect(40, 150, 170, 150);
  bg.strokeRect(100, 220, 50, 80);
  bg.strokeRect(60, 180, 30, 30);
  bg.strokeRect(160, 180, 30, 30);
}

function drawExperiencesOffice(bg: Graphics) {
  const bFill = 0xfbfbf9;
  const bLine = 0x1a1a1a;
  bg.fillStyle(bFill, 1);
  bg.lineStyle(5, bLine, 1);
  bg.fillRect(50, 20, 150, 280);
  bg.strokeRect(50, 20, 150, 280);
  for (let y = 40; y < 250; y += 40) {
    bg.strokeRect(70, y, 30, 20);
    bg.strokeRect(110, y, 30, 20);
    bg.strokeRect(150, y, 30, 20);
  }
  bg.strokeRect(100, 260, 50, 40);
}

function drawProjectsLab(bg: Graphics) {
  const bFill = 0xfbfbf9;
  const bLine = 0x1a1a1a;
  bg.fillStyle(bFill, 1);
  bg.lineStyle(5, bLine, 1);
  bg.fillRect(30, 100, 190, 200);
  bg.strokeRect(30, 100, 190, 200);
  bg.beginPath();
  bg.moveTo(30, 100);
  bg.lineTo(60, 50);
  bg.lineTo(190, 50);
  bg.lineTo(220, 100);
  bg.strokePath();
  bg.strokeCircle(125, 150, 30);
  bg.strokeRect(100, 220, 50, 80);
  bg.lineStyle(2, bLine, 0.5);
  bg.beginPath();
  bg.moveTo(40, 120);
  bg.lineTo(80, 120);
  bg.moveTo(40, 130);
  bg.lineTo(70, 130);
  bg.strokePath();
}

function drawAbilitiesDojo(bg: Graphics) {
  const bFill = 0xfbfbf9;
  const bLine = 0x1a1a1a;
  bg.fillStyle(bFill, 1);
  bg.lineStyle(5, bLine, 1);
  bg.fillRect(40, 120, 170, 180);
  bg.strokeRect(40, 120, 170, 180);
  bg.beginPath();
  bg.moveTo(20, 120);
  bg.lineTo(125, 70);
  bg.lineTo(230, 120);
  bg.strokePath();
  bg.beginPath();
  bg.moveTo(40, 90);
  bg.lineTo(125, 40);
  bg.lineTo(210, 90);
  bg.strokePath();
  bg.strokeRect(100, 220, 50, 80);
}

function drawHobbiesPark(bg: Graphics) {
  const bFill = 0xfbfbf9;
  const bLine = 0x1a1a1a;
  bg.fillStyle(bFill, 1);
  bg.lineStyle(5, bLine, 1);
  bg.fillRect(40, 200, 170, 100);
  bg.lineStyle(4, bLine, 1);
  bg.strokeRect(40, 200, 170, 100);
  bg.beginPath();
  bg.moveTo(60, 200);
  bg.lineTo(60, 100);
  bg.lineTo(190, 150);
  bg.lineTo(190, 250);
  bg.closePath();
  bg.fillPath();
  bg.strokePath();
  bg.fillCircle(125, 120, 25);
  bg.strokeCircle(125, 120, 25);
  bg.beginPath();
  bg.moveTo(125, 145);
  bg.lineTo(125, 200);
  bg.strokePath();
  bg.strokeRect(100, 240, 50, 60);
}

function drawContactTower(bg: Graphics) {
  const bFill = 0xfbfbf9;
  const bLine = 0x1a1a1a;
  bg.fillStyle(bFill, 1);
  bg.lineStyle(5, bLine, 1);
  bg.fillRect(60, 150, 130, 150);
  bg.strokeRect(60, 150, 130, 150);
  bg.beginPath();
  bg.moveTo(125, 150);
  bg.lineTo(125, 20);
  bg.strokePath();
  bg.strokeCircle(125, 40, 15);
  bg.strokeCircle(125, 40, 25);
  bg.strokeRect(100, 240, 50, 60);
}

function drawGenericBuilding(bg: Graphics) {
  const bFill = 0xfbfbf9;
  const bLine = 0x1a1a1a;
  bg.fillStyle(bFill, 1);
  bg.lineStyle(5, bLine, 1);
  bg.fillRect(30, 100, 190, 200);
  bg.strokeRect(30, 100, 190, 200);
  bg.strokeRect(100, 200, 50, 100);
}

const OVERWORLD_BUILDING_ART: Partial<Record<MiniGameId, (g: Graphics) => void>> = {
  profile: drawProfileHouse,
  experiences: drawExperiencesOffice,
  projects: drawProjectsLab,
  abilities: drawAbilitiesDojo,
  hobbies: drawHobbiesPark,
  contact: drawContactTower
};

const PIXEL_BUILDING_PALETTES: Partial<Record<MiniGameId, { base: number; accent: number }>> = {
  profile: { base: 0x89c2ff, accent: 0xffd166 },
  experiences: { base: 0x9bf6ff, accent: 0x5f6caf },
  projects: { base: 0xcaffbf, accent: 0xffadad },
  abilities: { base: 0xfdffb6, accent: 0x8ecae6 },
  hobbies: { base: 0xffc6ff, accent: 0xbde0fe },
  contact: { base: 0xd0f4de, accent: 0xffafcc }
};

/**
 * Draws the footprint art for an overworld building texture (`building_${id}`).
 * Unknown ids (e.g. hobby-only overlays) fall back to a generic block.
 */
export function drawOverworldBuildingArt(bg: Graphics, id: MiniGameId): void {
  const draw = OVERWORLD_BUILDING_ART[id];
  if (draw) {
    draw(bg);
  } else {
    drawGenericBuilding(bg);
  }
}

/**
 * Draws an intentionally chunky temporary polished layer. Final assets can replace
 * this texture key without changing the Lens/state wiring.
 */
export function drawPixelOverworldBuildingArt(bg: Graphics, id: MiniGameId): void {
  const palette = PIXEL_BUILDING_PALETTES[id] ?? { base: 0xbde0fe, accent: 0xffd166 };
  const line = 0x1a1a1a;

  bg.fillStyle(palette.base, 1);
  bg.lineStyle(4, line, 1);
  bg.fillRect(30, 80, 190, 220);
  bg.strokeRect(30, 80, 190, 220);

  bg.fillStyle(palette.accent, 1);
  bg.fillRect(50, 105, 40, 40);
  bg.fillRect(110, 105, 40, 40);
  bg.fillRect(170, 105, 30, 40);
  bg.fillRect(60, 170, 45, 45);
  bg.fillRect(145, 170, 45, 45);
  bg.strokeRect(50, 105, 40, 40);
  bg.strokeRect(110, 105, 40, 40);
  bg.strokeRect(170, 105, 30, 40);
  bg.strokeRect(60, 170, 45, 45);
  bg.strokeRect(145, 170, 45, 45);

  bg.fillStyle(0xfbfbf9, 1);
  bg.fillRect(100, 235, 50, 65);
  bg.strokeRect(100, 235, 50, 65);

  bg.lineStyle(3, 0xffffff, 0.45);
  for (let y = 95; y < 285; y += 24) {
    bg.beginPath();
    bg.moveTo(40, y);
    bg.lineTo(210, y);
    bg.strokePath();
  }
}
