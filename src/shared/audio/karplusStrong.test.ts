import { describe, expect, it } from 'vitest';
import { renderPluckedString } from './karplusStrong';

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function rms(samples: Float32Array, from: number, to: number): number {
  let sum = 0;
  for (let i = from; i < to; i++) sum += samples[i]! ** 2;
  return Math.sqrt(sum / (to - from));
}

describe('renderPluckedString', () => {
  const sampleRate = 22050;

  it('renders the requested duration, normalized and fading to silence', () => {
    const { samples } = renderPluckedString(110, { sampleRate, durationSeconds: 1, random: seededRandom(1) });
    expect(samples.length).toBe(sampleRate);
    const peak = samples.reduce((max, value) => Math.max(max, Math.abs(value)), 0);
    expect(peak).toBeLessThanOrEqual(0.9001);
    expect(peak).toBeGreaterThan(0.5);
    expect(Math.abs(samples[samples.length - 1]!)).toBe(0);
  });

  it('decays over time like a plucked string', () => {
    const { samples } = renderPluckedString(196, { sampleRate, durationSeconds: 1.5, random: seededRandom(2) });
    const early = rms(samples, 0, 2000);
    const late = rms(samples, 28000, 30000);
    expect(late).toBeLessThan(early * 0.5);
  });

  it('reports a rendered pitch within a semitone of the target for playbackRate correction', () => {
    for (const frequency of [82.41, 110, 146.83, 196, 246.94, 329.63]) {
      const { renderedFrequency } = renderPluckedString(frequency, { sampleRate, durationSeconds: 0.1, random: seededRandom(3) });
      const cents = Math.abs(1200 * Math.log2(renderedFrequency / frequency));
      expect(cents).toBeLessThan(100);
    }
  });

  it('is deterministic for a given random source', () => {
    const a = renderPluckedString(220, { sampleRate, durationSeconds: 0.05, random: seededRandom(9) });
    const b = renderPluckedString(220, { sampleRate, durationSeconds: 0.05, random: seededRandom(9) });
    expect(Array.from(a.samples)).toEqual(Array.from(b.samples));
  });
});
