import { describe, expect, it } from 'vitest';
import type * as Phaser from 'phaser';
import {
  applyTypewriterClip,
  startTypewriterEffect,
  visibleGlyphCount
} from './typewriterEffect';

describe('visibleGlyphCount', () => {
  it('skips line breaks that the typewriter steps through but Phaser does not draw', () => {
    expect(visibleGlyphCount('hello\nworld', 6)).toBe(5);
    expect(visibleGlyphCount('hello\nworld', 7)).toBe(6);
    expect(visibleGlyphCount('a\r\nb', 2)).toBe(1);
    expect(visibleGlyphCount('a\r\nb', 4)).toBe(2);
  });
});

describe('applyTypewriterClip', () => {
  it('draws each wrapped line in its final place and stops at the glyph limit', () => {
    const painted: string[] = [];
    const painter = {
      fillText(content: string) {
        painted.push(`f:${content}`);
      },
      strokeText(content: string) {
        painted.push(`s:${content}`);
      }
    } as unknown as CanvasRenderingContext2D;

    applyTypewriterClip(painter, visibleGlyphCount('hello world', 7), () => {
      painter.strokeText('hello ', 0, 0);
      painter.fillText('hello ', 0, 0);
      painter.strokeText('world', 0, 12);
      painter.fillText('world', 0, 12);
    });

    expect(painted).toEqual(['s:hello ', 'f:hello ', 's:w', 'f:w']);

    painter.fillText('kept', 1, 2);
    expect(painted.at(-1)).toBe('f:kept');
  });
});

describe('startTypewriterEffect', () => {
  it('keeps the full string laid out while revealing characters in place', () => {
    const paints: string[] = [];
    let onTick: (() => void) | undefined;
    const text = {
      text: '',
      context: {
        fillText(content: string) {
          paints.push(content);
        },
        strokeText() {}
      },
      setVisible() {},
      setText(value: string) {
        if (value !== this.text) {
          this.text = value;
          this.updateText();
        }
        return this;
      },
      updateText() {
        const fill = this.context.fillText as (content: string, x: number, y: number) => void;
        for (const line of this.text.split(/\r\n|\r|\n/)) {
          fill(line, 0, 0);
        }
      }
    };

    startTypewriterEffect(
      {
        time: {
          addEvent(config: { callback: () => void }) {
            onTick = config.callback;
            return { destroy() {} };
          }
        }
      } as unknown as Phaser.Scene,
      text as unknown as Phaser.GameObjects.Text,
      'hello\nworld',
      { charDelayMs: 20 }
    );

    expect(text.text).toBe('hello\nworld');
    expect(paints).toEqual(['h']);

    onTick?.();
    expect(text.text).toBe('hello\nworld');
    expect(paints.at(-1)).toBe('he');

    for (let step = 0; step < 9; step += 1) onTick?.();
    expect(paints.at(-2)).toBe('hello');
    expect(paints.at(-1)).toBe('world');
    expect(text.text).toBe('hello\nworld');
  });
});
