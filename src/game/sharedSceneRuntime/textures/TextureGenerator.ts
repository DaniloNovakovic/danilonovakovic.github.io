import * as Phaser from 'phaser';
import type { HobbiesOverlayId } from '@/game/overlays/overlayIds';
import { drawOverworldBuildingArt, drawPixelOverworldBuildingArt } from './buildingTextures';

export class TextureGenerator {
  /**
   * Generates `player_idle` / `player_glasses` textures.
   *
   * `scaleFactor` rasterizes the same drawing larger so scenes that present
   * the player bigger (e.g. the Bridge Walk Rail) can stay crisp; pass a
   * matching `keySuffix` (e.g. `'_2x'`) so the default textures stay untouched.
   */
  static generatePlayer(scene: Phaser.Scene, scaleFactor = 1, keySuffix = '') {
    const k = scaleFactor;
    const pg = scene.make.graphics({ x: 0, y: 0 });
    const pFill = 0xfbfbf9;
    const pLine = 0x1a1a1a;

    // Shadow
    pg.fillStyle(0x000000, 0.1);
    pg.fillEllipse(24 * k, 60 * k, 20 * k, 6 * k);

    pg.fillStyle(pFill, 1);
    pg.lineStyle(3 * k, pLine, 1);

    // Legs
    pg.beginPath();
    pg.moveTo(18 * k, 45 * k);
    pg.lineTo(18 * k, 60 * k);
    pg.moveTo(30 * k, 45 * k);
    pg.lineTo(30 * k, 60 * k);
    pg.strokePath();

    // Backpack
    pg.fillRect(8 * k, 28 * k, 8 * k, 16 * k);
    pg.strokeRect(8 * k, 28 * k, 8 * k, 16 * k);

    // Body (Hoodie)
    pg.fillRect(14 * k, 24 * k, 20 * k, 22 * k);
    pg.strokeRect(14 * k, 24 * k, 20 * k, 22 * k);

    // Head
    pg.fillCircle(24 * k, 16 * k, 12 * k);
    pg.strokeCircle(24 * k, 16 * k, 12 * k);

    // Eyes (facing right)
    pg.fillStyle(pLine, 1);
    pg.fillCircle(26 * k, 14 * k, 2 * k);
    pg.fillCircle(32 * k, 14 * k, 2 * k);

    pg.generateTexture(`player_idle${keySuffix}`, 48 * k, 65 * k);

    // Glasses variant
    pg.lineStyle(2 * k, pLine, 1);
    pg.strokeCircle(26 * k, 14 * k, 4 * k);
    pg.strokeCircle(32 * k, 14 * k, 4 * k);
    pg.beginPath();
    pg.moveTo(29 * k, 14 * k);
    pg.lineTo(29 * k, 14 * k);
    pg.strokePath();
    pg.beginPath();
    pg.moveTo(22 * k, 13 * k);
    pg.lineTo(18 * k, 12 * k);
    pg.strokePath();
    pg.generateTexture(`player_glasses${keySuffix}`, 48 * k, 65 * k);
    pg.destroy();
  }

  static generateBuilding(scene: Phaser.Scene, id: string) {
    const bg = scene.make.graphics({ x: 0, y: 0 });
    const key = `building_${id}`;
    const bLine = 0x1a1a1a;

    drawOverworldBuildingArt(bg, id);

    // Sketchy Cross-hatching shading on the right side
    bg.lineStyle(2, bLine, 0.3);
    for (let i = 0; i < 150; i += 12) {
      bg.beginPath();
      bg.moveTo(180, 120 + i);
      bg.lineTo(210, 140 + i);
      bg.strokePath();
    }

    bg.generateTexture(key, 250, 310);
    bg.destroy();

    const pixel = scene.make.graphics({ x: 0, y: 0 });
    drawPixelOverworldBuildingArt(pixel, id);
    pixel.generateTexture(`${key}_pixel`, 250, 310);
    pixel.destroy();
  }

  static generateHobbyItem(scene: Phaser.Scene, id: HobbiesOverlayId) {
    const bg = scene.make.graphics({ x: 0, y: 0 });
    const key = `hobby_${id}`;
    const hLine = 0x1a1a1a;
    const hFill = 0xfbfbf9;

    bg.fillStyle(hFill, 1);
    bg.lineStyle(4, hLine, 1);

    if (id === 'art') {
      bg.beginPath();
      bg.moveTo(60, 10);
      bg.lineTo(20, 110);
      bg.strokePath();
      bg.beginPath();
      bg.moveTo(60, 10);
      bg.lineTo(100, 110);
      bg.strokePath();
      bg.beginPath();
      bg.moveTo(60, 10);
      bg.lineTo(60, 110);
      bg.strokePath();
      bg.fillRect(25, 30, 70, 50);
      bg.strokeRect(25, 30, 70, 50);
      bg.lineStyle(2, hLine, 0.6);
      bg.beginPath();
      bg.moveTo(35, 70);
      bg.lineTo(50, 50);
      bg.lineTo(60, 60);
      bg.lineTo(80, 40);
      bg.strokePath();
    } else if (id === 'music') {
      bg.beginPath();
      bg.arc(60, 80, 25, 0, Math.PI * 2);
      bg.fillPath();
      bg.strokePath();
      bg.beginPath();
      bg.arc(60, 55, 18, 0, Math.PI * 2);
      bg.fillPath();
      bg.strokePath();
      bg.fillStyle(hLine, 1);
      bg.fillCircle(60, 65, 6);
      bg.fillStyle(hFill, 1);
      bg.fillRect(55, 15, 10, 35);
      bg.strokeRect(55, 15, 10, 35);
      bg.fillRect(52, 5, 16, 10);
      bg.strokeRect(52, 5, 16, 10);
      bg.lineStyle(1, hLine, 0.5);
      bg.beginPath();
      bg.moveTo(57, 15);
      bg.lineTo(57, 85);
      bg.strokePath();
      bg.beginPath();
      bg.moveTo(60, 15);
      bg.lineTo(60, 85);
      bg.strokePath();
      bg.beginPath();
      bg.moveTo(63, 15);
      bg.lineTo(63, 85);
      bg.strokePath();
    } else if (id === 'fitness') {
      bg.fillRect(35, 20, 50, 80);
      bg.strokeRect(35, 20, 50, 80);
      bg.beginPath();
      bg.moveTo(45, 20);
      bg.lineTo(60, 0);
      bg.strokePath();
      bg.beginPath();
      bg.moveTo(75, 20);
      bg.lineTo(60, 0);
      bg.strokePath();
      bg.lineStyle(2, hLine, 0.5);
      bg.beginPath();
      bg.moveTo(35, 40);
      bg.lineTo(85, 40);
      bg.strokePath();
      bg.beginPath();
      bg.moveTo(35, 65);
      bg.lineTo(85, 65);
      bg.strokePath();
    } else if (id === 'dancing') {
      // Simple dancing figure (arms up, motion lines)
      bg.lineStyle(4, hLine, 1);
      bg.strokeCircle(60, 55, 14);
      bg.beginPath();
      bg.moveTo(60, 69);
      bg.lineTo(60, 100);
      bg.strokePath();
      bg.beginPath();
      bg.moveTo(60, 78);
      bg.lineTo(35, 48);
      bg.strokePath();
      bg.beginPath();
      bg.moveTo(60, 78);
      bg.lineTo(85, 48);
      bg.strokePath();
      bg.beginPath();
      bg.moveTo(60, 100);
      bg.lineTo(45, 115);
      bg.strokePath();
      bg.beginPath();
      bg.moveTo(60, 100);
      bg.lineTo(75, 115);
      bg.strokePath();
      bg.lineStyle(2, hLine, 0.35);
      bg.beginPath();
      bg.moveTo(95, 35);
      bg.lineTo(105, 25);
      bg.strokePath();
      bg.beginPath();
      bg.moveTo(98, 50);
      bg.lineTo(112, 45);
      bg.strokePath();
    }

    bg.generateTexture(key, 120, 120);
    bg.destroy();
  }

  static generatePotassiumAssets(scene: Phaser.Scene) {
    if (scene.textures.exists('banana_peel_yellow')) return;

    const PEEL_SVG = (colorMain: string, colorLight: string) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <path d="M 32 36 C 26 50, 22 62, 32 62 C 42 62, 38 50, 32 36 Z" fill="${colorMain}" stroke="#1a1a1a" stroke-width="3" stroke-linejoin="round"/>
  <path d="M 28 30 C 10 24, 4 40, 8 48 C 15 52, 22 40, 28 30 Z" fill="${colorMain}" stroke="#1a1a1a" stroke-width="3" stroke-linejoin="round"/>
  <path d="M 36 30 C 54 24, 60 40, 56 48 C 49 52, 42 40, 36 30 Z" fill="${colorMain}" stroke="#1a1a1a" stroke-width="3" stroke-linejoin="round"/>
  <path d="M 32 26 C 24 8, 40 8, 32 26 Z" fill="${colorLight}" stroke="#1a1a1a" stroke-width="3" stroke-linejoin="round"/>
  <circle cx="32" cy="32" r="5" fill="#4a3b32" stroke="#1a1a1a" stroke-width="3"/>
  <circle cx="32" cy="32" r="2" fill="#2d1c15"/>
  <path d="M 32 44 L 32 54 M 22 36 L 14 42 M 42 36 L 50 42" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round" opacity="0.4"/>
</svg>`;

    const DEADLINE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect x="12" y="16" width="40" height="38" rx="4" fill="#ef4444" stroke="#1a1a1a" stroke-width="3"/>
  <rect x="12" y="16" width="40" height="12" rx="4" fill="#dc2626" stroke="#1a1a1a" stroke-width="3"/>
  <rect x="20" y="8" width="4" height="12" rx="2" fill="#e5e5e5" stroke="#1a1a1a" stroke-width="3"/>
  <rect x="40" y="8" width="4" height="12" rx="2" fill="#e5e5e5" stroke="#1a1a1a" stroke-width="3"/>
  <path d="M 20 34 L 28 38 L 24 42 Z" fill="#1a1a1a"/>
  <path d="M 44 34 L 36 38 L 40 42 Z" fill="#1a1a1a"/>
  <path d="M 28 46 Q 32 42 36 46" fill="none" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/>
</svg>`;

    const CREEPER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80">
  <path d="M 40 20 C 60 10, 75 30, 70 50 C 65 70, 50 75, 40 72 C 30 75, 15 70, 10 50 C 5 30, 20 10, 40 20 Z" fill="#8b5cf6" stroke="#1a1a1a" stroke-width="3"/>
  <path d="M 30 15 C 40 5, 55 15, 50 25 C 45 35, 25 35, 30 15 Z" fill="#a78bfa" stroke="#1a1a1a" stroke-width="3"/>
  <path d="M 15 50 Q 5 60 10 70" fill="none" stroke="#8b5cf6" stroke-width="5" stroke-linecap="round"/>
  <path d="M 65 50 Q 75 60 70 70" fill="none" stroke="#8b5cf6" stroke-width="5" stroke-linecap="round"/>
  <path d="M 25 65 Q 25 80 35 75" fill="none" stroke="#8b5cf6" stroke-width="5" stroke-linecap="round"/>
  <path d="M 55 65 Q 55 80 45 75" fill="none" stroke="#8b5cf6" stroke-width="5" stroke-linecap="round"/>
  <circle cx="35" cy="40" r="8" fill="#fff" stroke="#1a1a1a" stroke-width="3"/>
  <circle cx="35" cy="40" r="3" fill="#1a1a1a"/>
  <circle cx="55" cy="35" r="6" fill="#fff" stroke="#1a1a1a" stroke-width="3"/>
  <circle cx="55" cy="35" r="2" fill="#1a1a1a"/>
  <circle cx="20" cy="30" r="5" fill="#fff" stroke="#1a1a1a" stroke-width="3"/>
  <circle cx="20" cy="30" r="2" fill="#1a1a1a"/>
</svg>`;

    const BUG_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <path d="M 24 30 L 12 24 L 10 34" fill="none" stroke="#1a1a1a" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
  <path d="M 40 30 L 52 24 L 54 34" fill="none" stroke="#1a1a1a" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
  <path d="M 24 40 L 10 42 L 14 52" fill="none" stroke="#1a1a1a" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
  <path d="M 40 40 L 54 42 L 50 52" fill="none" stroke="#1a1a1a" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
  <ellipse cx="32" cy="44" rx="14" ry="12" fill="#22c55e" stroke="#1a1a1a" stroke-width="3"/>
  <ellipse cx="32" cy="28" rx="12" ry="10" fill="#4ade80" stroke="#1a1a1a" stroke-width="3"/>
  <circle cx="32" cy="18" r="8" fill="#22c55e" stroke="#1a1a1a" stroke-width="3"/>
  <path d="M 28 12 Q 24 4 16 8" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/>
  <path d="M 36 12 Q 40 4 48 8" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/>
  <circle cx="28" cy="16" r="2" fill="#1a1a1a"/>
  <circle cx="36" cy="16" r="2" fill="#1a1a1a"/>
</svg>`;

    const toBase64 = (svg: string) => {
      return 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svg)));
    };

    scene.load.svg('banana_peel_yellow', toBase64(PEEL_SVG('#F3DE72', '#FCEE98')));
    scene.load.svg('banana_peel_green', toBase64(PEEL_SVG('#A4D44D', '#D4F090')));
    scene.load.svg('banana_peel_brown', toBase64(PEEL_SVG('#8B5A2B', '#A06D3D')));
    scene.load.svg('enemy_deadline', toBase64(DEADLINE_SVG));
    scene.load.svg('enemy_scope_creeper', toBase64(CREEPER_SVG));
    scene.load.svg('enemy_bug', toBase64(BUG_SVG));
  }
}
