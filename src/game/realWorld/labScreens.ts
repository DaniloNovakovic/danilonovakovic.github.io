import { CanvasTexture, SRGBColorSpace } from 'three';

/** A monitor picture that can redraw itself; `tick` is called every frame. */
export interface LabScreen {
  texture: CanvasTexture;
  tick(seconds: number): void;
}

const W = 320;
const H = 200;
/** Screens redraw at a jittery, old-CRT pace, not every frame. */
const FRAME_SECONDS = 1 / 10;
const INK = '#1a1a1a';

function canvas2d(width = W, height = H) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return { canvas, g: canvas.getContext('2d') };
}

function stroke(g: CanvasRenderingContext2D, points: Array<[number, number]>) {
  g.beginPath();
  points.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.stroke();
}

/** The drawn street of the portfolio, as the aliens saw it: paper, ink, cracks, then the black. */
function drawOldWorld(g: CanvasRenderingContext2D) {
  g.fillStyle = '#f4f1ea';
  g.fillRect(0, 0, W, H);
  g.strokeStyle = INK;
  g.lineWidth = 3;
  g.lineJoin = 'round';
  stroke(g, [
    [0, 150],
    [W, 150]
  ]);
  // Houses, a START sign and a little stick figure: the street, roughly.
  for (const [x, w, h] of [
    [30, 50, 60],
    [100, 40, 80],
    [210, 60, 55]
  ] as const) {
    g.strokeRect(x, 150 - h, w, h);
    stroke(g, [
      [x - 6, 150 - h],
      [x + w / 2, 150 - h - 26],
      [x + w + 6, 150 - h]
    ]);
    g.strokeRect(x + w / 2 - 7, 130, 14, 20);
  }
  g.strokeRect(160, 112, 34, 14);
  stroke(g, [
    [177, 126],
    [177, 150]
  ]);
  g.beginPath();
  g.arc(290, 112, 7, 0, Math.PI * 2);
  g.stroke();
  stroke(g, [
    [290, 119],
    [290, 136],
    [282, 150]
  ]);
  stroke(g, [
    [290, 136],
    [298, 150]
  ]);
  stroke(g, [
    [280, 126],
    [302, 122]
  ]);
  // The screen destroyer's cracks, and the black eating the picture.
  g.lineWidth = 2;
  for (let i = 0; i < 9; i++) {
    const angle = (i / 9) * Math.PI * 2 + 0.3;
    stroke(g, [
      [150, 90],
      [150 + Math.cos(angle) * 60, 90 + Math.sin(angle) * 40],
      [150 + Math.cos(angle + 0.2) * 130, 90 + Math.sin(angle + 0.2) * 90]
    ]);
  }
  g.fillStyle = '#050505';
  g.beginPath();
  for (let i = 0; i < 14; i++) {
    const angle = (i / 14) * Math.PI * 2;
    const r = 38 + ((i * 37) % 11) * 2;
    g.lineTo(150 + Math.cos(angle) * r * 1.3, 90 + Math.sin(angle) * r);
  }
  g.fill();
}

/** Static, scanlines and the occasional torn band. */
function addSignalNoise(g: CanvasRenderingContext2D, source: HTMLCanvasElement, frame: number, reducedMotion: boolean) {
  g.drawImage(source, 0, 0);
  if (!reducedMotion && frame % 7 < 2) {
    const y = (frame * 53) % (H - 24);
    g.drawImage(source, 0, y, W, 18, ((frame % 3) - 1) * 14, y, W, 18);
  }
  g.fillStyle = 'rgba(11,14,28,0.28)';
  for (let y = 0; y < H; y += 4) g.fillRect(0, y, W, 2);
  g.fillStyle = 'rgba(127,224,200,0.12)';
  g.fillRect(0, 0, W, H);
}

function screen(draw: (g: CanvasRenderingContext2D, frame: number) => void, reducedMotion: boolean): LabScreen {
  let frame = 0;
  let next = 0;
  const { canvas, g } = canvas2d();
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  if (g) draw(g, 0);
  return {
    texture,
    tick(seconds) {
      if (!g || reducedMotion || seconds < next) return;
      next = seconds + FRAME_SECONDS;
      frame += 1;
      draw(g, frame);
      texture.needsUpdate = true;
    }
  };
}

/** The portfolio's street on an alien monitor: the simulation Danilo just broke out of. */
export function oldWorldScreen(reducedMotion: boolean): LabScreen {
  const source = canvas2d();
  if (source.g) drawOldWorld(source.g);
  return screen((g, frame) => addSignalNoise(g, source.canvas, frame, reducedMotion), reducedMotion);
}

function drawBrainScan(g: CanvasRenderingContext2D, frame: number) {
  g.fillStyle = '#0b0e1c';
  g.fillRect(0, 0, W, H);
  g.strokeStyle = '#ff9fbf';
  g.lineWidth = 3;
  for (const side of [-1, 1]) {
    g.beginPath();
    g.ellipse(160 + side * 34, 80, 36, 52, 0, 0, Math.PI * 2);
    g.stroke();
    for (let i = 0; i < 4; i++) {
      stroke(g, [
        [160 + side * 14, 46 + i * 20],
        [160 + side * 34, 52 + i * 20],
        [160 + side * 52, 44 + i * 20]
      ]);
    }
  }
  const t = frame * 0.35;
  g.fillStyle = 'rgba(255,211,110,0.85)';
  g.beginPath();
  g.arc(160 + Math.sin(t) * 46, 80 + Math.cos(t * 1.3) * 34, 9, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#7fe0c8';
  g.lineWidth = 2;
  g.beginPath();
  for (let x = 0; x <= W; x += 4) {
    const y = 170 + Math.sin(x * 0.09 + t * 2) * 10 + Math.sin(x * 0.31 + t * 5) * 5;
    if (x) g.lineTo(x, y);
    else g.moveTo(x, y);
  }
  g.stroke();
  // Alien readouts: marks we can't read.
  g.fillStyle = '#7fe0c8';
  for (let i = 0; i < 6; i++) g.fillRect(14, 16 + i * 14, 8 + ((i * 7 + frame) % 5) * 6, 6);
}

/** A sleeping mind being read: a pink brain outline, one lit spot wandering, a brainwave. */
export function brainScanScreen(reducedMotion: boolean): LabScreen {
  return screen(drawBrainScan, reducedMotion);
}
