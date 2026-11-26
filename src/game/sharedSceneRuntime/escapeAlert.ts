import type * as Phaser from 'phaser';

/**
 * Alert red: the one colour the Digital Sketchbook allows, and only once the
 * simulation is broken (Out of Bounds escape). See the Color Palette exception
 * in docs/design/style-guide.md.
 *
 * Rules: danger only (the OUT_OF_BOUNDS stamp and barrier, alarm marks,
 * scrawled warnings, damage). Never meaning on its own: always paired with
 * ink hatching or text, so a scene reads the same in greyscale. Never flashes.
 * Contrast is about 3.9:1 on the cream paper and 4.2:1 on the dark Basement,
 * so red text is large: at least ALERT_TEXT_MIN_PX, bold.
 */
export const ALERT_RED = 0xe5322d;
export const ALERT_RED_CSS = '#e5322d';
/** WCAG "large text" (14pt bold), where 3:1 contrast is enough. */
export const ALERT_TEXT_MIN_PX = 19;

/** Draws an escape scribble: ink strokes with every third one heavy and alert red. */
export function strokeAlertScribble(
  g: Phaser.GameObjects.Graphics,
  strokes: readonly Phaser.Math.Vector2[][],
  ink: { color: number; alpha: number }
): void {
  strokes.forEach((points, i) => {
    const heavy = i % 3 === 0;
    g.lineStyle(heavy ? 3 : 2, heavy ? ALERT_RED : ink.color, heavy ? 0.9 : ink.alpha);
    g.strokePoints(points);
  });
}
