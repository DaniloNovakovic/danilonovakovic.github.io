import { playNoise, playTone } from '../shared/audioVoices';
import type { StrikeGrade } from './strikeCombo';

function jitter(value: number, amount = 0.06): number {
  return value * (1 + (Math.random() - 0.5) * amount);
}

const GRADE_SOUNDS: Record<StrikeGrade, (context: AudioContext) => void> = {
  perfect: (context) => {
    playNoise(context, { filter: 'lowpass', filterFrequency: jitter(1500), gain: 0.85, duration: 0.24 });
    playNoise(context, { filter: 'highpass', filterFrequency: 3200, gain: 0.22, duration: 0.05 });
    playTone(context, { frequency: jitter(125), endFrequency: 38, gain: 0.9, duration: 0.38 });
  },
  clean: (context) => {
    playNoise(context, { filter: 'lowpass', filterFrequency: jitter(950), gain: 0.55, duration: 0.16 });
    playTone(context, { frequency: jitter(95), endFrequency: 48, gain: 0.55, duration: 0.22 });
  },
  miss: (context) => {
    playNoise(context, { filter: 'bandpass', filterFrequency: jitter(700, 0.2), q: 0.6, gain: 0.12, duration: 0.2 });
  }
};

/** Bag thud (noise burst + low sine), heavier for a dead-center hit; a soft whoosh on a miss. */
export function playStrikeSound(context: AudioContext, grade: StrikeGrade): void {
  GRADE_SOUNDS[grade](context);
}

/** Two-tone ring bell for a finished combo. */
export function playRoundBell(context: AudioContext): void {
  const at = context.currentTime + 0.12;
  playTone(context, { frequency: 880, type: 'triangle', gain: 0.18, duration: 1.4, at });
  playTone(context, { frequency: 1318.5, type: 'sine', gain: 0.08, duration: 1.1, at });
  playTone(context, { frequency: 880, type: 'triangle', gain: 0.14, duration: 1.2, at: at + 0.32 });
}
