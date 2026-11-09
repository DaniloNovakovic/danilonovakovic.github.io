import type * as Phaser from 'phaser';
import type { StampedeFlockKind } from './flock';

/**
 * Bird drawings for Chick Magnet. Every bird faces right with its body circle
 * centered on (0, 0) at exactly `radius`, which is also its hitbox. Heads, tails,
 * and props hang off that circle but never count for contact.
 */

type Graphics = Phaser.GameObjects.Graphics;

export type StampedeBirdMood = 'chase' | 'smitten' | 'gag';

export interface StampedeBirdPose {
  kind: StampedeFlockKind;
  radius: number;
  mood: StampedeBirdMood;
  flapStep: 0 | 1 | 2;
  hp: number;
  maxHp: number;
  poisoned: boolean;
  poisonFlash: boolean;
  dazed: boolean;
  flash: boolean;
  windup: boolean;
}

const INK = 0x1a1a1a;
const PAPER = 0xfbfbf9;
const LEG = 0xe0892a;
const BEAK = 0xef8b2c;
const COMB = 0xd13b3b;
const BLUSH = 0xf3a0b4;
const POISON = 0x7d9a3a;

export function stampedeBirdPoseKey(pose: StampedeBirdPose): string {
  return [
    pose.kind,
    pose.mood,
    pose.flapStep,
    pose.hp,
    pose.maxHp,
    pose.poisoned ? (pose.poisonFlash ? 2 : 1) : 0,
    pose.dazed ? 1 : 0,
    pose.flash ? 1 : 0,
    pose.windup ? 1 : 0
  ].join('|');
}

export function drawStampedeBird(g: Graphics, pose: StampedeBirdPose): void {
  g.clear();
  switch (pose.kind) {
    case 'hen':
      drawHen(g, pose);
      break;
    case 'rooster':
      drawRooster(g, pose);
      break;
    case 'nerd':
      drawNerd(g, pose);
      break;
    case 'perfume':
      drawPerfume(g, pose);
      break;
    case 'fixer':
      drawFixer(g, pose);
      break;
    case 'situationship':
      drawSituationship(g, pose);
      break;
    case 'bartender':
      drawBartender(g, pose);
      break;
    case 'ex':
      drawEx(g, pose);
      break;
    case 'chick':
    default:
      drawChick(g, pose);
      break;
  }
  drawStatus(g, pose);
}

function drawChick(g: Graphics, pose: StampedeBirdPose): void {
  const r = pose.radius;
  drawLegs(g, r, 1.6);
  body(g, r, 0xffd84d);
  g.lineStyle(1.6, INK, 1);
  g.beginPath();
  g.moveTo(-1, -r + 1);
  g.lineTo(-3, -r - 4);
  g.moveTo(1, -r + 1);
  g.lineTo(2, -r - 5);
  g.moveTo(3, -r + 2);
  g.lineTo(6, -r - 2);
  g.strokePath();
  wing(g, r, 0xf2b726, pose.flapStep);
  eye(g, r * 0.38, -r * 0.22, 1.9, pose.mood);
  beak(g, r * 0.86, r * 0.02, 4.5, pose.mood);
  blush(g, r * 0.2, r * 0.22, pose.mood);
}

function drawHen(g: Graphics, pose: StampedeBirdPose): void {
  const r = pose.radius;
  const tail = 0xb07a45;
  [-0.55, -0.15, 0.25].forEach((tilt) => {
    const x = -r * 0.95 + Math.sin(tilt) * 2;
    const y = -r * 0.35 + tilt * 6;
    g.fillStyle(tail, 1);
    g.lineStyle(2, INK, 1);
    g.fillEllipse(x, y, 9, 15);
    g.strokeEllipse(x, y, 9, 15);
  });
  drawLegs(g, r, 2);
  body(g, r, 0xf7efdc);
  wing(g, r, 0xc79a63, pose.flapStep);
  hatch(g, -r * 0.55, r * 0.05, r * 0.7, 3);
  const head = head_(g, r, 0.62, -0.82, 0.48, 0xf7efdc);
  comb(g, head.x, head.y - head.r, 1);
  wattle(g, head.x + head.r * 0.6, head.y + head.r * 0.55);
  eye(g, head.x + head.r * 0.25, head.y - head.r * 0.1, 1.8, pose.mood);
  beak(g, head.x + head.r * 0.95, head.y + head.r * 0.1, 5, pose.mood);
}

function drawRooster(g: Graphics, pose: StampedeBirdPose): void {
  const r = pose.radius;
  const tail = 0x24433a;
  g.lineStyle(5, INK, 1);
  sickles(g, r);
  g.lineStyle(3, tail, 1);
  sickles(g, r);
  drawLegs(g, r, 2.2);
  g.lineStyle(2, INK, 1);
  g.lineBetween(-r * 0.2, r * 1.0, -r * 0.45, r * 0.95);
  body(g, r, pose.windup ? 0xd9462b : 0xe0662b);
  wing(g, r, 0x8f3a1c, pose.flapStep);
  const head = head_(g, r, 0.62, -0.86, 0.5, 0xf08a3c);
  comb(g, head.x, head.y - head.r, 1.6);
  wattle(g, head.x + head.r * 0.6, head.y + head.r * 0.6);
  eye(g, head.x + head.r * 0.25, head.y - head.r * 0.12, 2, pose.mood);
  g.lineStyle(2.4, INK, 1);
  g.lineBetween(head.x - head.r * 0.2, head.y - head.r * 0.6, head.x + head.r * 0.55, head.y - head.r * 0.3);
  beak(g, head.x + head.r * 0.95, head.y + head.r * 0.1, 6, pose.mood);
  if (pose.windup) steam(g, head.x - head.r * 1.2, head.y - head.r * 0.6);
}

function drawNerd(g: Graphics, pose: StampedeBirdPose): void {
  const r = pose.radius;
  drawLegs(g, r, 1.8);
  body(g, r, 0xb9c9e2);
  g.fillStyle(0x8b4c39, 1);
  g.lineStyle(2, INK, 1);
  g.fillRect(-r * 0.15, -r * 0.05, r * 0.75, r * 0.6);
  g.strokeRect(-r * 0.15, -r * 0.05, r * 0.75, r * 0.6);
  g.lineStyle(1.2, PAPER, 1);
  g.lineBetween(-r * 0.05, r * 0.12, r * 0.5, r * 0.12);
  wing(g, r, 0x8ea4c6, pose.flapStep);
  const head = head_(g, r, 0.55, -0.78, 0.52, 0xb9c9e2);
  g.lineStyle(1.8, INK, 1);
  g.beginPath();
  g.moveTo(head.x - 2, head.y - head.r + 1);
  g.lineTo(head.x - 5, head.y - head.r - 5);
  g.lineTo(head.x - 1, head.y - head.r - 3);
  g.strokePath();
  beak(g, head.x + head.r * 1.05, head.y + head.r * 0.2, 4.5, pose.mood);
  const lens = Math.max(3.2, head.r * 0.42);
  g.fillStyle(PAPER, 1);
  g.lineStyle(2.4, INK, 1);
  [head.x + head.r * 0.05, head.x + head.r * 0.85].forEach((x) => {
    g.fillCircle(x, head.y - head.r * 0.05, lens);
    g.strokeCircle(x, head.y - head.r * 0.05, lens);
  });
  g.lineBetween(head.x + head.r * 0.05 + lens, head.y - head.r * 0.05, head.x + head.r * 0.85 - lens, head.y - head.r * 0.05);
  if (pose.mood === 'gag') {
    xEye(g, head.x + head.r * 0.05, head.y - head.r * 0.05, 1.8);
    xEye(g, head.x + head.r * 0.85, head.y - head.r * 0.05, 1.8);
  } else {
    g.fillStyle(INK, 1);
    g.fillCircle(head.x + head.r * 0.15, head.y - head.r * 0.05, 1.3);
    g.fillCircle(head.x + head.r * 0.95, head.y - head.r * 0.05, 1.3);
  }
}

function drawPerfume(g: Graphics, pose: StampedeBirdPose): void {
  const r = pose.radius;
  g.lineStyle(1.6, 0xe0457b, 0.55);
  dashedCircle(g, 0, 0, r + 6, 12);
  drawLegs(g, r, 1.8);
  body(g, r, 0xf7b8d2);
  wing(g, r, 0xef8db5, pose.flapStep);
  const head = head_(g, r, 0.55, -0.8, 0.5, 0xf7b8d2);
  g.fillStyle(0xe0457b, 1);
  g.lineStyle(1.6, INK, 1);
  const bx = head.x - head.r * 0.2;
  const by = head.y - head.r * 0.95;
  g.fillTriangle(bx, by, bx - 6, by - 5, bx - 6, by + 4);
  g.strokeTriangle(bx, by, bx - 6, by - 5, bx - 6, by + 4);
  g.fillTriangle(bx, by, bx + 6, by - 5, bx + 6, by + 4);
  g.strokeTriangle(bx, by, bx + 6, by - 5, bx + 6, by + 4);
  g.fillCircle(bx, by, 1.8);
  eye(g, head.x + head.r * 0.3, head.y - head.r * 0.05, 1.8, pose.mood);
  if (pose.mood !== 'gag') {
    g.lineStyle(1.2, INK, 1);
    const ex = head.x + head.r * 0.3;
    const ey = head.y - head.r * 0.05;
    g.lineBetween(ex - 1, ey - 2.2, ex - 2.5, ey - 4.5);
    g.lineBetween(ex + 0.5, ey - 2.4, ex + 0.5, ey - 5);
    g.lineBetween(ex + 2, ey - 2.2, ex + 3.5, ey - 4.5);
  }
  beak(g, head.x + head.r * 1.0, head.y + head.r * 0.15, 4.5, pose.mood);
  blush(g, head.x + head.r * 0.1, head.y + head.r * 0.45, 'smitten');
  sparkle(g, r * 1.05, -r * 1.3, 3.2);
  sparkle(g, -r * 0.9, -r * 0.9, 2.4);
}

function drawFixer(g: Graphics, pose: StampedeBirdPose): void {
  const r = pose.radius;
  drawLegs(g, r, 1.8);
  body(g, r, 0xf6caa6);
  g.lineStyle(2.4, 0x6b7280, 1);
  g.lineBetween(-r * 0.6, r * 0.45, r * 0.1, -r * 0.1);
  g.lineStyle(1.8, INK, 1);
  g.strokeCircle(r * 0.15, -r * 0.15, 2.6);
  wing(g, r, 0xe8a27c, pose.flapStep);
  const head = head_(g, r, 0.55, -0.8, 0.5, 0xf6caa6);
  g.fillStyle(PAPER, 1);
  g.lineStyle(1.8, INK, 1);
  g.fillRoundedRect(head.x - head.r * 0.9, head.y - head.r * 1.45, head.r * 1.6, head.r * 0.75, 2);
  g.strokeRoundedRect(head.x - head.r * 0.9, head.y - head.r * 1.45, head.r * 1.6, head.r * 0.75, 2);
  g.lineStyle(1.8, COMB, 1);
  const cx = head.x - head.r * 0.1;
  const cy = head.y - head.r * 1.08;
  g.lineBetween(cx - 2.2, cy, cx + 2.2, cy);
  g.lineBetween(cx, cy - 2.2, cx, cy + 2.2);
  eye(g, head.x + head.r * 0.3, head.y - head.r * 0.05, 1.8, pose.mood);
  beak(g, head.x + head.r * 1.0, head.y + head.r * 0.15, 4.5, pose.mood);
}

function drawSituationship(g: Graphics, pose: StampedeBirdPose): void {
  const r = pose.radius;
  drawLegs(g, r, 1.6);
  g.fillStyle(0xd8c8f2, 0.85);
  g.fillCircle(0, 0, r);
  hatch(g, -r * 0.5, 0, r * 0.8, 4);
  g.lineStyle(2.6, INK, 1);
  dashedCircle(g, 0, 0, r, 10);
  wing(g, r, 0xb7a2de, pose.flapStep);
  const cx = r * 0.55;
  const cy = -r * 0.8;
  const hr = r * 0.5;
  g.fillStyle(0xd8c8f2, 0.9);
  g.fillCircle(cx, cy, hr);
  g.lineStyle(2.2, INK, 1);
  dashedCircle(g, cx, cy, hr, 7);
  eye(g, cx + hr * 0.3, cy - hr * 0.05, 1.8, pose.mood);
  beak(g, cx + hr * 1.0, cy + hr * 0.15, 4.5, pose.mood);
  g.fillStyle(INK, 1);
  [-5, 0, 5].forEach((dx) => g.fillCircle(cx + dx, cy - hr - 7, 1.5));
}

function drawBartender(g: Graphics, pose: StampedeBirdPose): void {
  const r = pose.radius;
  drawLegs(g, r, 2);
  body(g, r, 0xf4f1ea);
  g.fillStyle(0x3a3a3a, 1);
  g.slice(0, 0, r - 1.2, Math.PI * 0.08, Math.PI * 0.92, false);
  g.fillPath();
  g.lineStyle(1.2, PAPER, 0.8);
  g.lineBetween(-r * 0.15, r * 0.35, -r * 0.15, r * 0.85);
  g.lineStyle(2.6, INK, 1);
  g.strokeCircle(0, 0, r);
  const head = head_(g, r, 0.55, -0.85, 0.48, 0xf6d36b);
  g.fillStyle(0xb91c1c, 1);
  g.lineStyle(1.4, INK, 1);
  const tx = head.x - head.r * 0.2;
  const ty = head.y + head.r * 1.05;
  g.fillTriangle(tx, ty, tx - 5, ty - 3.5, tx - 5, ty + 3.5);
  g.strokeTriangle(tx, ty, tx - 5, ty - 3.5, tx - 5, ty + 3.5);
  g.fillTriangle(tx, ty, tx + 5, ty - 3.5, tx + 5, ty + 3.5);
  g.strokeTriangle(tx, ty, tx + 5, ty - 3.5, tx + 5, ty + 3.5);
  comb(g, head.x, head.y - head.r, 0.9);
  eye(g, head.x + head.r * 0.3, head.y - head.r * 0.15, 1.8, pose.mood);
  beak(g, head.x + head.r * 1.0, head.y + head.r * 0.1, 5, pose.mood);
  g.lineStyle(2, INK, 1);
  g.beginPath();
  g.arc(head.x + head.r * 0.65, head.y + head.r * 0.45, 3, Math.PI * 0.1, Math.PI * 0.9, false);
  g.strokePath();
  if (pose.windup) {
    mug(g, r * 0.1, -r * 2.2, 1.25);
    exclaim(g, -r * 0.9, -r * 2.2);
  } else {
    mug(g, -r * 0.55, r * 0.15, 1);
  }
}

function drawEx(g: Graphics, pose: StampedeBirdPose): void {
  const r = pose.radius;
  g.lineStyle(6, INK, 1);
  sickles(g, r);
  g.lineStyle(3.5, 0x2a1d30, 1);
  sickles(g, r);
  drawLegs(g, r, 2.6);
  body(g, r, pose.windup ? 0x6e3a62 : 0x4a3550);
  g.lineStyle(1.4, PAPER, 0.25);
  for (let i = -2; i <= 2; i += 1) {
    g.lineBetween(-r * 0.7 + i * 5, r * 0.65, -r * 0.3 + i * 5, r * 0.05);
  }
  g.fillStyle(0xc0263b, 1);
  g.lineStyle(2.2, INK, 1);
  g.fillEllipse(r * 0.38, -r * 0.42, r * 0.95, r * 0.32);
  g.strokeEllipse(r * 0.38, -r * 0.42, r * 0.95, r * 0.32);
  wing(g, r, 0x33233a, pose.flapStep);
  const head = head_(g, r, 0.58, -0.82, 0.46, 0x5e4466);
  g.fillStyle(INK, 1);
  g.fillRoundedRect(head.x - head.r * 0.15, head.y - head.r * 0.4, head.r * 1.3, head.r * 0.5, 2);
  g.fillStyle(0xd6336c, 1);
  g.lineStyle(2, INK, 1);
  const bx = head.x + head.r * 0.95;
  const by = head.y + head.r * 0.2;
  g.fillTriangle(bx, by - 4, bx + 9, by, bx, by + 4);
  g.strokeTriangle(bx, by - 4, bx + 9, by, bx, by + 4);
  brokenHeart(g, head.x - head.r * 0.2, head.y - head.r - 12);
  if (pose.windup) steam(g, head.x - head.r * 1.4, head.y - head.r * 0.5);
}

function drawStatus(g: Graphics, pose: StampedeBirdPose): void {
  const r = pose.radius;
  if (pose.poisoned) {
    g.fillStyle(POISON, pose.poisonFlash ? 0.55 : 0.28);
    g.fillCircle(0, 0, r);
    g.lineStyle(1.6, POISON, 0.9);
    [-5, 1, 7].forEach((dx) => wavy(g, dx, -r - 6, 9));
  }
  if (pose.flash) {
    g.fillStyle(PAPER, 0.8);
    g.fillCircle(0, 0, r);
  }
  if (pose.dazed) {
    [-r * 0.6, 0, r * 0.6].forEach((dx, index) => sparkle(g, dx, -r * 1.85 - (index % 2) * 3, 2.6));
  }
  drawHpPips(g, pose);
}

function drawHpPips(g: Graphics, pose: StampedeBirdPose): void {
  if (pose.maxHp <= 1) return;
  const r = pose.radius;
  const y = r * 1.55;
  if (pose.maxHp > 4) {
    const width = r * 1.8;
    g.fillStyle(PAPER, 1);
    g.lineStyle(2, INK, 1);
    g.fillRect(-width / 2, y + 4, width, 6);
    g.fillStyle(0xc0263b, 1);
    g.fillRect(-width / 2, y + 4, width * Math.max(0, pose.hp / pose.maxHp), 6);
    g.strokeRect(-width / 2, y + 4, width, 6);
    return;
  }
  const gap = 7;
  const start = -((pose.maxHp - 1) * gap) / 2;
  for (let index = 0; index < pose.maxHp; index += 1) {
    g.fillStyle(index < pose.hp ? 0xc0263b : PAPER, 1);
    g.lineStyle(1.4, INK, 1);
    g.fillCircle(start + index * gap, y + 6, 2.6);
    g.strokeCircle(start + index * gap, y + 6, 2.6);
  }
}

function body(g: Graphics, r: number, fill: number): void {
  g.fillStyle(fill, 1);
  g.fillCircle(0, 0, r);
  g.lineStyle(2.6, INK, 1);
  g.strokeCircle(0, 0, r);
}

function head_(
  g: Graphics,
  r: number,
  fx: number,
  fy: number,
  fr: number,
  fill: number
): { x: number; y: number; r: number } {
  const x = r * fx;
  const y = r * fy;
  const hr = r * fr;
  g.fillStyle(fill, 1);
  g.fillCircle(x, y, hr);
  g.lineStyle(2.4, INK, 1);
  g.strokeCircle(x, y, hr);
  return { x, y, r: hr };
}

function drawLegs(g: Graphics, r: number, width: number): void {
  g.lineStyle(width, LEG, 1);
  [-r * 0.3, r * 0.25].forEach((x) => {
    g.lineBetween(x, r * 0.7, x - 1, r * 1.22);
    g.lineBetween(x - 1, r * 1.22, x - 4, r * 1.3);
    g.lineBetween(x - 1, r * 1.22, x + 3, r * 1.3);
  });
}

function wing(g: Graphics, r: number, fill: number, flapStep: 0 | 1 | 2): void {
  const lift = flapStep * r * 0.28;
  const w = r * 0.95;
  const h = r * (0.55 + flapStep * 0.18);
  g.fillStyle(fill, 1);
  g.lineStyle(2, INK, 1);
  g.fillEllipse(-r * 0.2, r * 0.12 - lift, w, h);
  g.strokeEllipse(-r * 0.2, r * 0.12 - lift, w, h);
}

function eye(g: Graphics, x: number, y: number, size: number, mood: StampedeBirdMood): void {
  if (mood === 'gag') {
    xEye(g, x, y, size);
    return;
  }
  if (mood === 'smitten') {
    g.lineStyle(1.6, INK, 1);
    g.beginPath();
    g.arc(x, y + 0.6, size, Math.PI * 1.1, Math.PI * 1.9, false);
    g.strokePath();
    return;
  }
  g.fillStyle(INK, 1);
  g.fillCircle(x, y, size);
  g.fillStyle(PAPER, 1);
  g.fillCircle(x + size * 0.35, y - size * 0.35, size * 0.38);
}

function xEye(g: Graphics, x: number, y: number, size: number): void {
  g.lineStyle(1.6, INK, 1);
  g.lineBetween(x - size, y - size, x + size, y + size);
  g.lineBetween(x - size, y + size, x + size, y - size);
}

function beak(g: Graphics, x: number, y: number, size: number, mood: StampedeBirdMood): void {
  g.fillStyle(BEAK, 1);
  g.lineStyle(1.6, INK, 1);
  if (mood === 'gag') {
    g.fillTriangle(x - 1, y - size * 0.5, x + size, y - size * 0.75, x + size * 0.3, y);
    g.strokeTriangle(x - 1, y - size * 0.5, x + size, y - size * 0.75, x + size * 0.3, y);
    g.fillTriangle(x - 1, y + size * 0.1, x + size * 0.3, y + 0.5, x + size * 0.9, y + size * 0.65);
    g.strokeTriangle(x - 1, y + size * 0.1, x + size * 0.3, y + 0.5, x + size * 0.9, y + size * 0.65);
    return;
  }
  g.fillTriangle(x - 1, y - size * 0.5, x + size, y, x - 1, y + size * 0.5);
  g.strokeTriangle(x - 1, y - size * 0.5, x + size, y, x - 1, y + size * 0.5);
}

function blush(g: Graphics, x: number, y: number, mood: StampedeBirdMood): void {
  if (mood !== 'smitten') return;
  g.fillStyle(BLUSH, 0.9);
  g.fillEllipse(x, y, 5, 3);
}

function comb(g: Graphics, x: number, y: number, scale: number): void {
  g.fillStyle(COMB, 1);
  g.lineStyle(1.6, INK, 1);
  [-3.2, 0, 3.2].forEach((dx, index) => {
    const size = (index === 1 ? 3.2 : 2.6) * scale;
    g.fillCircle(x + dx * scale, y - size * 0.6, size);
    g.strokeCircle(x + dx * scale, y - size * 0.6, size);
  });
}

function wattle(g: Graphics, x: number, y: number): void {
  g.fillStyle(COMB, 1);
  g.lineStyle(1.4, INK, 1);
  g.fillEllipse(x, y + 2, 3.6, 5.5);
  g.strokeEllipse(x, y + 2, 3.6, 5.5);
}

function sickles(g: Graphics, r: number): void {
  [0, 1, 2].forEach((index) => {
    g.beginPath();
    g.arc(-r * 0.75, -r * 0.1, r * (0.65 + index * 0.18), Math.PI * (0.9 + index * 0.07), Math.PI * 1.55, false);
    g.strokePath();
  });
}

function hatch(g: Graphics, x: number, y: number, size: number, step: number): void {
  g.lineStyle(1, INK, 0.35);
  for (let offset = -size / 2; offset <= size / 2; offset += step) {
    g.lineBetween(x + offset - 3, y + size * 0.3, x + offset + 3, y - size * 0.3);
  }
}

function dashedCircle(g: Graphics, x: number, y: number, r: number, segments: number): void {
  const span = (Math.PI * 2) / segments;
  for (let index = 0; index < segments; index += 1) {
    g.beginPath();
    g.arc(x, y, r, index * span, index * span + span * 0.62, false);
    g.strokePath();
  }
}

function sparkle(g: Graphics, x: number, y: number, size: number): void {
  g.fillStyle(0xf6c445, 1);
  g.lineStyle(1.2, INK, 1);
  const points = [
    { x, y: y - size * 1.6 },
    { x: x + size * 0.45, y: y - size * 0.45 },
    { x: x + size * 1.6, y },
    { x: x + size * 0.45, y: y + size * 0.45 },
    { x, y: y + size * 1.6 },
    { x: x - size * 0.45, y: y + size * 0.45 },
    { x: x - size * 1.6, y },
    { x: x - size * 0.45, y: y - size * 0.45 }
  ];
  polygon(g, points);
}

function polygon(g: Graphics, points: readonly { x: number; y: number }[]): void {
  g.beginPath();
  points.forEach((point, index) => {
    if (index === 0) g.moveTo(point.x, point.y);
    else g.lineTo(point.x, point.y);
  });
  g.closePath();
  g.fillPath();
  g.strokePath();
}

function steam(g: Graphics, x: number, y: number): void {
  g.fillStyle(PAPER, 1);
  g.lineStyle(1.6, INK, 1);
  [[0, 0, 3.5], [-5, -4, 2.6], [-9, -9, 1.8]].forEach(([dx, dy, size]) => {
    g.fillCircle(x + dx!, y + dy!, size!);
    g.strokeCircle(x + dx!, y + dy!, size!);
  });
}

function exclaim(g: Graphics, x: number, y: number): void {
  g.fillStyle(0xc0263b, 1);
  g.lineStyle(1.6, INK, 1);
  g.fillRect(x - 2, y - 9, 4, 9);
  g.strokeRect(x - 2, y - 9, 4, 9);
  g.fillCircle(x, y + 4, 2.2);
  g.strokeCircle(x, y + 4, 2.2);
}

function wavy(g: Graphics, x: number, y: number, height: number): void {
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x + 2, y - height * 0.33);
  g.lineTo(x - 1, y - height * 0.66);
  g.lineTo(x + 1.5, y - height);
  g.strokePath();
}

function brokenHeart(g: Graphics, x: number, y: number): void {
  heartShape(g, x, y, 1.1, 0xc0263b);
  g.lineStyle(1.6, PAPER, 1);
  g.beginPath();
  g.moveTo(x, y - 3);
  g.lineTo(x - 1.5, y);
  g.lineTo(x + 1.5, y + 2);
  g.lineTo(x, y + 5);
  g.strokePath();
}

function mug(g: Graphics, x: number, y: number, scale: number): void {
  const w = 9 * scale;
  const h = 11 * scale;
  g.fillStyle(0xf0a202, 1);
  g.lineStyle(1.8, INK, 1);
  g.fillRect(x - w / 2, y - h / 2, w, h);
  g.strokeRect(x - w / 2, y - h / 2, w, h);
  g.strokeCircle(x + w / 2 + 2, y, 2.6 * scale);
  g.fillStyle(PAPER, 1);
  g.fillEllipse(x, y - h / 2, w + 3, 4.5 * scale);
  g.strokeEllipse(x, y - h / 2, w + 3, 4.5 * scale);
}

function heartShape(g: Graphics, x: number, y: number, scale: number, color: number): void {
  g.fillStyle(color, 1);
  g.lineStyle(1.8, INK, 1);
  g.fillCircle(x - 3.4 * scale, y - 1.4 * scale, 3.6 * scale);
  g.fillCircle(x + 3.4 * scale, y - 1.4 * scale, 3.6 * scale);
  g.fillTriangle(x - 6.8 * scale, y, x + 6.8 * scale, y, x, y + 7.5 * scale);
  g.beginPath();
  g.arc(x - 3.4 * scale, y - 1.4 * scale, 3.6 * scale, Math.PI * 0.8, Math.PI * 1.95, false);
  g.strokePath();
  g.beginPath();
  g.arc(x + 3.4 * scale, y - 1.4 * scale, 3.6 * scale, Math.PI * 1.05, Math.PI * 0.2, false);
  g.strokePath();
  g.lineBetween(x - 6.8 * scale, y + 0.4 * scale, x, y + 7.5 * scale);
  g.lineBetween(x + 6.8 * scale, y + 0.4 * scale, x, y + 7.5 * scale);
}

export function drawBeerMug(g: Graphics): void {
  g.clear();
  mug(g, 0, 0, 1.3);
}

export function drawResistMark(g: Graphics): void {
  g.clear();
  g.lineStyle(2.6, INK, 1);
  g.lineBetween(-5, -5, 5, 5);
  g.lineBetween(-5, 5, 5, -5);
}

export function drawFeather(g: Graphics, color: number): void {
  g.clear();
  g.fillStyle(color, 1);
  g.lineStyle(1.5, INK, 0.85);
  g.fillEllipse(0, 0, 7, 13);
  g.strokeEllipse(0, 0, 7, 13);
  g.lineBetween(0, -5, 0, 5);
}

export function drawInkHeart(g: Graphics): void {
  g.clear();
  heartShape(g, 0, 0, 0.9, 0xc0263b);
}

export function stampedeFeatherColor(kind: StampedeFlockKind): number {
  switch (kind) {
    case 'hen':
      return 0xf7efdc;
    case 'rooster':
      return 0xe0662b;
    case 'nerd':
      return 0xb9c9e2;
    case 'perfume':
      return 0xf7b8d2;
    case 'fixer':
      return 0xf6caa6;
    case 'situationship':
      return 0xd8c8f2;
    case 'bartender':
      return 0x3a3a3a;
    case 'ex':
      return 0x4a3550;
    case 'chick':
    default:
      return 0xffd84d;
  }
}
