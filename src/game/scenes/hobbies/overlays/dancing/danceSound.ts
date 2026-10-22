import { playNoise, playTone } from '../shared/audioVoices';
import { BEAT_SECONDS, COUNT_IN_BEATS, demoLengthBeats, type DanceMove } from './danceRound';

/** C-major pentatonic woodblock pitch per move, so sequences are also memorable by ear. */
const MOVE_PITCH: Record<DanceMove, number> = {
  up: 784,
  right: 659.25,
  left: 587.33,
  down: 523.25
};

function playMetronomeClick(context: AudioContext, at: number, accent: boolean): void {
  playNoise(context, { filter: 'highpass', filterFrequency: 2600, gain: accent ? 0.22 : 0.13, duration: 0.03, at });
  playTone(context, { frequency: accent ? 1760 : 1320, gain: accent ? 0.09 : 0.05, duration: 0.04, at });
}

export function playMoveStep(context: AudioContext, move: DanceMove, at = context.currentTime): void {
  const pitch = MOVE_PITCH[move];
  playTone(context, { frequency: pitch, endFrequency: pitch * 0.92, type: 'triangle', gain: 0.22, duration: 0.14, at });
  playNoise(context, { filter: 'bandpass', filterFrequency: pitch * 2, q: 4, gain: 0.12, duration: 0.04, at });
}

export function playMissStep(context: AudioContext): void {
  playTone(context, { frequency: 233, endFrequency: 110, type: 'triangle', gain: 0.2, duration: 0.45 });
}

export function playRoundCleared(context: AudioContext): void {
  const at = context.currentTime + 0.05;
  playTone(context, { frequency: 659.25, type: 'triangle', gain: 0.16, duration: 0.14, at });
  playTone(context, { frequency: 987.77, type: 'triangle', gain: 0.16, duration: 0.3, at: at + 0.12 });
}

/** Schedules the count-in and every demonstrated move on the audio clock from `start`. */
export function scheduleDemoAudio(context: AudioContext, sequence: readonly DanceMove[], start: number): void {
  const beats = demoLengthBeats(sequence.length);
  for (let beat = 0; beat < beats; beat++) {
    const at = start + beat * BEAT_SECONDS;
    playMetronomeClick(context, at, beat === 0);
    const move = sequence[beat - COUNT_IN_BEATS];
    if (move) playMoveStep(context, move, at);
  }
}
