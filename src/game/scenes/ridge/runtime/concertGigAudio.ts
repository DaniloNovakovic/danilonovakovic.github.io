// Band voices and the backing chart are a small synth palette; branching is voicing data.
// fallow-ignore-file complexity
import type { GigChord, GigLane, GigSong } from '@/game/core/ridge';
import { renderPluckedString } from '@/shared/audio/karplusStrong';
import { buildBandEvents, laneHz, type BandEvent, type BandOptions } from './bandScore';

/**
 * Sound and song clock for the Concert Crossing gig.
 *
 * The audio clock is the source of truth: backing-band hits are scheduled on
 * `AudioContext` time a short lookahead ahead of the playhead, and the
 * playhead itself is read back from the clock so the notes on screen sit on
 * what you hear. Without a running context (locked, or no Web Audio) the gig
 * runs silent on the scene's frame clock instead. Every cue has a visual twin
 * in the highway and panel, so muted play loses nothing that matters.
 *
 * Synth voices are deliberate here: this is an explicit music toy, voiced as
 * a small street band (plucked lead, bass, kit, a humming crowd), or at
 * Last-Stop Plaza as a bachata trio (güira, bongó, bass, requinto). What the
 * band plays lives in bandScore; this file is only how it sounds.
 */

const LOOKAHEAD_MS = 140;
/** Silence before song time 0, so the camera can settle on the stage. */
const PRE_ROLL_MS = 600;
const SAMPLE_RATE = 22050;
const PLUCK_BASE_HZ = 220;
const MASTER_LEVEL = 0.62;
/** Crowd cheers never stack closer than this. */
const CHEER_GAP_MS = 1800;

export interface GigAudioOutput {
  context: AudioContext;
  destination: AudioNode;
}

type WindowWithWebKitAudio = Window & { webkitAudioContext?: typeof AudioContext };

export class ConcertGigAudio {
  private readonly ctx: AudioContext | null;
  private readonly bus: GainNode | null = null;
  private readonly noise: AudioBuffer | null = null;
  private readonly pluck: { buffer: AudioBuffer; baseHz: number } | null = null;
  private readonly events: BandEvent[];
  private eventCursor = 0;
  /** Context time (s) at song time 0. */
  private startAt = 0;
  /** Silent fallback clock, in song ms. */
  private frameClockMs = -PRE_ROLL_MS;
  private readonly audioClock: boolean;
  private pausedSongMs: number | null = null;
  private lastCheerAt = Number.NEGATIVE_INFINITY;
  private destroyed = false;

  constructor(output: GigAudioOutput | null, song: GigSong, options: BandOptions = {}) {
    this.events = buildBandEvents(song, options);
    const context = output?.context ?? null;
    this.ctx = context;
    this.audioClock = context?.state === 'running';
    if (!output || !context || !this.audioClock) return;

    const compressor = context.createDynamicsCompressor();
    compressor.connect(output.destination);
    this.bus = context.createGain();
    this.bus.gain.value = MASTER_LEVEL;
    this.bus.connect(compressor);
    this.noise = makeNoise(context);
    const rendered = renderPluckedString(PLUCK_BASE_HZ, {
      sampleRate: SAMPLE_RATE,
      durationSeconds: 1.4,
      decay: 0.9962,
      brightness: 0.62
    });
    const buffer = context.createBuffer(1, rendered.samples.length, SAMPLE_RATE);
    buffer.getChannelData(0).set(rendered.samples);
    this.pluck = { buffer, baseHz: rendered.renderedFrequency };
    this.startAt = this.contextNow() + PRE_ROLL_MS / 1000;
  }

  /**
   * Phaser's own context and master input, when the game runs on Web Audio.
   * Reusing them keeps Phaser's unlock, mute, and volume in charge.
   */
  static outputFrom(sound: unknown): GigAudioOutput | null {
    const manager = sound as { context?: unknown; destination?: unknown } | null;
    const AudioCtor =
      typeof window === 'undefined'
        ? undefined
        : (window.AudioContext ?? (window as WindowWithWebKitAudio).webkitAudioContext);
    if (!AudioCtor || !(manager?.context instanceof AudioCtor)) return null;
    const destination = manager.destination instanceof AudioNode ? manager.destination : manager.context.destination;
    return { context: manager.context, destination };
  }

  /** Song time right now, in ms. */
  nowMs(): number {
    if (this.pausedSongMs !== null) return this.pausedSongMs;
    if (!this.audioClock) return this.frameClockMs;
    return (this.contextNow() - this.startAt) * 1000;
  }

  /** Song time at a DOM event timestamp (performance clock), for input. */
  msAtEventTime(eventTimeStamp: number): number {
    const now = this.nowMs();
    const age = performance.now() - eventTimeStamp;
    // Stale or future stamps (some browsers lie) fall back to "now".
    return age > 0 && age < 250 ? now - age : now;
  }

  /** Per frame: tick the silent clock and keep the band booked ahead. */
  update(deltaMs: number): void {
    if (this.destroyed || this.pausedSongMs !== null) return;
    if (!this.audioClock) {
      this.frameClockMs += Math.min(deltaMs, 100);
      return;
    }
    const horizon = this.nowMs() + LOOKAHEAD_MS;
    while (this.eventCursor < this.events.length && this.events[this.eventCursor]!.timeMs <= horizon) {
      this.play(this.events[this.eventCursor]!);
      this.eventCursor += 1;
    }
  }

  pause(): void {
    if (this.pausedSongMs !== null) return;
    this.pausedSongMs = this.nowMs();
    this.bus?.gain.setTargetAtTime(0, this.ctx!.currentTime, 0.02);
  }

  resume(): void {
    if (this.pausedSongMs === null) return;
    const songMs = this.pausedSongMs;
    this.pausedSongMs = null;
    if (!this.ctx || !this.audioClock) return;
    this.startAt = this.contextNow() - songMs / 1000;
    this.bus?.gain.setTargetAtTime(MASTER_LEVEL, this.ctx.currentTime, 0.05);
  }

  /** The lead guitar: a pluck on the chord tone for this lane. */
  strum(chord: GigChord, lane: GigLane, perfect: boolean): void {
    const ctx = this.ctx;
    if (!ctx || !this.bus || !this.pluck || this.destroyed) return;
    const at = ctx.currentTime;
    const source = ctx.createBufferSource();
    source.buffer = this.pluck.buffer;
    source.playbackRate.value = (laneHz(chord, lane) / this.pluck.baseHz) * (1 + (Math.random() - 0.5) * 0.004);
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = perfect ? 4200 : 2600;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5 + Math.random() * 0.06, at);
    gain.gain.setTargetAtTime(0, at + 0.9, 0.25);
    this.oneShot(source, [tone, gain], at, at + 1.4);
  }

  /**
   * A danced step: the feet scuff the boards, and the hip tap on four is
   * answered by a bongó slap. Perfect steps land crisper.
   */
  step(lane: GigLane, perfect: boolean): void {
    const ctx = this.ctx;
    if (!ctx || !this.bus || !this.noise || this.destroyed) return;
    const at = ctx.currentTime;
    if (lane === 1) {
      this.bongo(at, perfect ? 470 : 430, perfect ? 1.3 : 1);
      this.noiseHit(at, 'highpass', 5200, 0.12, 0.07, 0.9);
      return;
    }
    this.noiseHit(at, 'bandpass', 700 + Math.random() * 160, perfect ? 0.2 : 0.15, 0.06, 1.1);
  }

  /** A step with nothing under it: a soft stumble on the boards. */
  scuff(): void {
    const ctx = this.ctx;
    if (!ctx || !this.bus || !this.noise || this.destroyed) return;
    this.noiseHit(ctx.currentTime, 'lowpass', 420, 0.18, 0.09, 0.8);
  }

  /** A strum with nothing under it: a dead-string chuck. */
  chuck(): void {
    const ctx = this.ctx;
    if (!ctx || !this.bus || !this.noise || this.destroyed) return;
    const at = ctx.currentTime;
    this.noiseHit(at, 'bandpass', 380 + Math.random() * 80, 0.22, 0.05, 1.2);
  }

  /** The crowd roars, scaled by how warm they are. Throttled. */
  cheer(level: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.bus || !this.noise || this.destroyed) return;
    const now = performance.now();
    if (now - this.lastCheerAt < CHEER_GAP_MS) return;
    this.lastCheerAt = now;
    const at = ctx.currentTime;
    const source = ctx.createBufferSource();
    source.buffer = this.noise;
    source.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 900 + Math.random() * 300;
    band.Q.value = 0.5;
    const gain = ctx.createGain();
    const peak = 0.05 + 0.2 * Math.min(1, Math.max(0, level));
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(peak, at + 0.25);
    gain.gain.setTargetAtTime(0.0001, at + 0.7, 0.45);
    this.oneShot(source, [band, gain], at, at + 2.6);
  }

  /** Stop booking the band and let what is ringing fade out. Call destroy() later. */
  release(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    if (this.ctx && this.bus) this.bus.gain.setTargetAtTime(0, this.ctx.currentTime + 1.2, 0.4);
  }

  destroy(): void {
    this.destroyed = true;
    this.bus?.disconnect();
  }

  private contextNow(): number {
    const ctx = this.ctx!;
    const stamp = typeof ctx.getOutputTimestamp === 'function' ? ctx.getOutputTimestamp() : null;
    if (stamp?.contextTime && stamp.performanceTime) {
      // What is leaving the speakers now, interpolated between audio callbacks.
      const since = (performance.now() - stamp.performanceTime) / 1000;
      return stamp.contextTime + Math.min(Math.max(since, 0), 0.1);
    }
    return ctx.currentTime - Math.min(0.3, ctx.outputLatency || ctx.baseLatency || 0);
  }

  private play(event: BandEvent): void {
    const ctx = this.ctx!;
    const at = this.startAt + event.timeMs / 1000;
    if (at < ctx.currentTime - 0.02) return;
    const when = Math.max(at, ctx.currentTime);
    switch (event.hit) {
      case 'kick':
        return this.kick(when, event.level);
      case 'snare':
        this.noiseHit(when, 'bandpass', 1800, event.level * 0.5, 0.14, 0.8);
        return this.tone(when, 'triangle', 190, event.level * 0.25, 0.08);
      case 'hat':
        return this.noiseHit(when, 'highpass', 7000, event.level * 0.18, 0.04, 0.7);
      case 'click':
        return this.tone(when, 'square', 1500, event.level * 0.12, 0.03);
      case 'crash':
        return this.noiseHit(when, 'highpass', 4200, event.level * 0.22, 1.1, 0.5);
      case 'clap':
        this.noiseHit(when, 'bandpass', 1200, event.level * 0.35, 0.09, 1.4);
        return this.noiseHit(when + 0.012, 'bandpass', 1100, event.level * 0.25, 0.08, 1.4);
      case 'bass':
        return this.bass(when, event.hz ?? 110, event.level);
      case 'hum':
        return this.hum(when, event.hz ?? 220, event.level);
      case 'guira':
        // hz 1 marks a long downbeat scrape, 0 a quick offbeat flick.
        return this.noiseHit(when, 'highpass', 5200, event.level * 0.16, event.hz ? 0.1 : 0.035, 0.9);
      case 'bongoHigh':
        return this.bongo(when, 440, event.level);
      case 'bongoLow':
        return this.bongo(when, 300, event.level);
      case 'requinto':
        return this.pluckAt(when, event.hz ?? 440, event.level, 3600);
    }
  }

  /** A hand drum: a quick pitch drop on a sine, with a little skin noise on top. */
  private bongo(at: number, hz: number, level: number): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(hz * 1.25, at);
    osc.frequency.exponentialRampToValueAtTime(hz, at + 0.03);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(level * 0.32, at);
    gain.gain.exponentialRampToValueAtTime(0.001, at + 0.16);
    this.oneShot(osc, [gain], at, at + 0.18);
    this.noiseHit(at, 'bandpass', hz * 4, level * 0.06, 0.03, 1.5);
  }

  /** A short requinto pluck on the band's own beat (the lead strum is the player's). */
  private pluckAt(at: number, hz: number, level: number, brightness: number): void {
    const ctx = this.ctx!;
    if (!this.pluck) return;
    const source = ctx.createBufferSource();
    source.buffer = this.pluck.buffer;
    source.playbackRate.value = hz / this.pluck.baseHz;
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = brightness;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(level * 0.5, at);
    gain.gain.setTargetAtTime(0, at + 0.32, 0.12);
    this.oneShot(source, [tone, gain], at, at + 0.9);
  }

  private kick(at: number, level: number): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(140, at);
    osc.frequency.exponentialRampToValueAtTime(48, at + 0.16);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(level * 0.7, at);
    gain.gain.exponentialRampToValueAtTime(0.001, at + 0.28);
    this.oneShot(osc, [gain], at, at + 0.3);
  }

  private bass(at: number, hz: number, level: number): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = hz;
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 520;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(level * 0.32, at + 0.012);
    gain.gain.setTargetAtTime(0.0001, at + 0.16, 0.06);
    this.oneShot(osc, [tone, gain], at, at + 0.5);
  }

  /** The crowd humming the tune in the breakdown: a soft, slow swell. */
  private hum(at: number, hz: number, level: number): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = hz;
    osc.detune.value = (Math.random() - 0.5) * 18;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(level * 0.12, at + 0.4);
    gain.gain.setTargetAtTime(0.0001, at + 1.5, 0.3);
    this.oneShot(osc, [gain], at, at + 2.6);
  }

  private tone(at: number, type: OscillatorType, hz: number, level: number, length: number): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = hz;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(level, at);
    gain.gain.exponentialRampToValueAtTime(0.001, at + length);
    this.oneShot(osc, [gain], at, at + length + 0.02);
  }

  private noiseHit(at: number, type: BiquadFilterType, hz: number, level: number, length: number, q: number): void {
    const ctx = this.ctx!;
    const source = ctx.createBufferSource();
    source.buffer = this.noise;
    // Start somewhere new in the buffer so repeats never sound identical.
    const offset = Math.random() * 0.5;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = hz;
    filter.Q.value = q;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(level, at);
    gain.gain.exponentialRampToValueAtTime(0.001, at + length);
    this.oneShot(source, [filter, gain], at, at + length + 0.02, offset);
  }

  /** Wire source → chain → bus, play once, and disconnect everything after. */
  private oneShot(
    source: AudioScheduledSourceNode,
    chain: readonly AudioNode[],
    at: number,
    stopAt: number,
    offset = 0
  ): void {
    let node: AudioNode = source;
    for (const next of chain) node = node.connect(next);
    node.connect(this.bus!);
    source.onended = () => {
      source.onended = null;
      source.disconnect();
      for (const next of chain) next.disconnect();
    };
    if (source instanceof AudioBufferSourceNode) source.start(at, offset);
    else source.start(at);
    source.stop(stopAt);
  }
}

function makeNoise(ctx: AudioContext): AudioBuffer {
  const buffer = ctx.createBuffer(1, SAMPLE_RATE, SAMPLE_RATE);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  return buffer;
}
