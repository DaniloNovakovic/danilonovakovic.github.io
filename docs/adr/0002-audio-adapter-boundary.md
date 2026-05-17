# Keep Audio Behind Scene-Owned Or Shared Adapter Boundaries

Status: accepted for M3 audio planning.

Sketchbook Ridge audio should enter runtime code through explicit Phaser scene
ownership first, and through a shared audio adapter only after at least two
scenes need the same lifecycle, scheduling, cleanup, or mute policy. The audio
direction pack defines what cues should feel like; `.agents/rules/40-audio-runtime.md`
defines hard runtime constraints.

The adapter boundary should expose named cue intent rather than raw Web Audio
graphs. Scenes may request loop, one-shot, ducking, cooldown, and cleanup
behavior by cue id, but they should not coordinate audio through React overlay
globals, ad hoc `window` state, or per-feature AudioContext ownership. React
overlays may own self-contained confirmation sounds, but they must not import
Phaser scene internals to trigger game audio.

Timing-sensitive cues must remain visual-first. Audio may reinforce a contact
frame, rhythm, or reward, but muted play must still show the timing or state
change through animation, shape, shake, pulse, text, or other visual feedback.

The first implementation slice should stay deliberately small: scene-owned
short one-shots and loops with explicit disposal, browser gesture unlock
tolerance, conservative decoded-memory use, and repeated-cue instance limits.
Do not introduce a full dynamic score engine or generalized audio framework
until a second scene proves the shared lifecycle need.
