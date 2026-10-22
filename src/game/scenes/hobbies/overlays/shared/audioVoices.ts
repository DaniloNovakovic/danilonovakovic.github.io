/**
 * Tiny Web Audio one-shot voices shared by the hobby mini-games.
 * Every voice is scheduled on the audio clock and disconnects its nodes when
 * the source ends.
 */

const NOISE_SAMPLE_RATE = 22050;
const NOISE_SECONDS = 0.5;
const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>();

function getNoiseBuffer(context: BaseAudioContext): AudioBuffer {
  const cached = noiseBuffers.get(context);
  if (cached) return cached;
  const buffer = context.createBuffer(1, NOISE_SAMPLE_RATE * NOISE_SECONDS, NOISE_SAMPLE_RATE);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  noiseBuffers.set(context, buffer);
  return buffer;
}

function disconnectOnEnded(source: AudioScheduledSourceNode, nodes: readonly AudioNode[]): void {
  source.onended = () => {
    source.onended = null;
    source.disconnect();
    for (const node of nodes) node.disconnect();
  };
}

function envelope(gain: GainNode, start: number, peak: number, duration: number): void {
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
}

export interface ToneVoice {
  frequency: number;
  /** Optional pitch glide target reached at the end of the voice. */
  endFrequency?: number;
  type?: OscillatorType;
  gain: number;
  duration: number;
  /** Absolute audio-clock start time; defaults to now. */
  at?: number;
}

export function playTone(context: AudioContext, voice: ToneVoice): void {
  const start = voice.at ?? context.currentTime;
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = voice.type ?? 'sine';
  osc.frequency.setValueAtTime(voice.frequency, start);
  if (voice.endFrequency) {
    osc.frequency.exponentialRampToValueAtTime(voice.endFrequency, start + voice.duration);
  }
  envelope(gain, start, voice.gain, voice.duration);
  osc.connect(gain).connect(context.destination);
  disconnectOnEnded(osc, [gain]);
  osc.start(start);
  osc.stop(start + voice.duration + 0.02);
}

export interface NoiseVoice {
  filter: BiquadFilterType;
  filterFrequency: number;
  q?: number;
  gain: number;
  duration: number;
  at?: number;
}

export function playNoise(context: AudioContext, voice: NoiseVoice): void {
  const start = voice.at ?? context.currentTime;
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  source.buffer = getNoiseBuffer(context);
  source.playbackRate.value = 0.9 + Math.random() * 0.2;
  filter.type = voice.filter;
  filter.frequency.setValueAtTime(voice.filterFrequency, start);
  filter.Q.value = voice.q ?? 0.8;
  envelope(gain, start, voice.gain, voice.duration);
  source.connect(filter).connect(gain).connect(context.destination);
  disconnectOnEnded(source, [filter, gain]);
  source.start(start, Math.random() * 0.2);
  source.stop(start + voice.duration + 0.02);
}
