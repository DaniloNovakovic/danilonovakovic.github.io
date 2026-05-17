# Audio Runtime Rules

Applies to Web Audio, Phaser sound usage, audio assets, timing cues, music/SFX
playback, and audio-related browser lifecycle code.

## Hard Rules

1. **Audio is never the only critical cue.** Any timing, progression, danger,
   success, failure, or navigation cue must have a readable visual equivalent
   that works while muted.
2. **Respect browser audio unlock.** Audio playback must tolerate a suspended or
   unavailable `AudioContext` and begin only after a user gesture or Phaser
   sound-manager unlock path.
3. **Use the audio clock for timing-critical playback.** Schedule timing audio
   with `AudioContext.currentTime`, Phaser sound scheduling, or a dedicated
   audio adapter. Do not use `setTimeout` or `setInterval` as the source of
   truth for rhythm or hit-window audio.
4. **Phaser still owns visual frames.** Align visuals through scene `update`,
   tweens, or scene-owned UI state. Do not add custom `requestAnimationFrame`
   loops for audio synchronization; if a worker scheduler becomes necessary,
   isolate it behind an adapter and get an Architect review first.
5. **Budget decoded memory on mobile.** Default short Foley, ambience, and UI
   one-shots to mono and lower sample rates such as 22.05 kHz when the material
   tolerates it. Document exceptions for music, voice, or assets where stereo
   imaging is the point.
6. **Avoid long predecoded buffers.** Long ambience or music should not be
   casually preloaded as decoded Web Audio buffers on mobile. Prefer scoped
   loading, audio sprites for small one-shots, or streaming/browser-native
   playback when that better fits the use case.
7. **Clean up low-level nodes deliberately.** Stop and disconnect source nodes,
   clear event handlers, and release buffer references. If repeated low-level
   source-node disposal appears, centralize it in a helper and account for iOS
   Safari buffer-retention behavior.
8. **Keep repeated sounds varied and throttled.** Gameplay and Cicka one-shots
   need cooldowns, instance limits, and small pitch/playback-rate variation
   before they ship.
9. **Prefer physical Ridge Foley for shipped feedback.** Paper, graphite,
   fabric, wood, room air, and soft domestic objects fit the Digital Sketchbook
   identity. Pure synth tones are fine for prototypes or explicit music toys,
   but should not quietly become final Ridge UI/world SFX.
10. **Keep audio side effects in the right layer.** Scene audio belongs in the
    owning scene or a focused shared scene runtime/adaptor when reuse is real.
    React overlays may use Web Audio for self-contained overlay experiences,
    but must not import Phaser or create global `window` audio backdoors.
11. **Treat real audio input as permissioned data.** Microphone capture, file
    analysis, voice processing, cloud transcription, stem separation, and
    external publishing all require explicit user approval and a local-first or
    non-executing fallback when possible.

## When In Doubt

Start with the smallest audible layer: one tactile Foley family, one trigger
matrix, one visual fallback, and one mobile memory budget. Promote shared audio
runtime only after a second scene needs the same lifecycle, scheduling, or
cleanup policy.
