# **Audio Architecture and Technical Specifications for "The Ridge": An Elite Research Report and Reference Library**

> Status: historical/background only. The active Sketchbook Ridge audio spec is
> `docs/game-design/sketchbook-ridge-m3-audio-pack.md`; runtime hard rules live
> in `.agents/rules/40-audio-runtime.md`. Use this report as provenance, not as
> current implementation direction.

## **Tactile Foley and "Handmade" UI Audio Language**

The acoustic identity of a hand-drawn, sketchbook-native interactive portfolio relies on replacing synthetic, clean user interface (UI) signals with warm, physical, and domestic Foley sounds. Standard digital beeps and synthesized transient sweeps break immersion within a sketchbook visual aesthetic. To prevent this artistic dissonance, the soundscape must use lo-fi, organic Foley materials sourced from physical desk environments—such as paper rustling, pencil scratching, and fabric friction.

### **Case Studies in Minimalist, Cozy Audio Design**

Several prominent indie titles offer valuable precedents for managing quiet, organic audio environments:

* **Mini Metro and Mini Motorways:** These titles demonstrate a philosophy of data-driven minimalism. In *Mini Metro*, musicality is directly linked to the transit grid's physical growth, turning gameplay actions into musical notes. *Mini Motorways* shifts this focus by establishing that success in the game loop is represented by acoustic silence or a gentle, receded wash of white noise, while failures and congestion are highlighted by discordant, out-of-tune audio events. The UI elements blend into the background by aligning their pitch and timing with the global tempo of the generative soundtrack.  
* **Botanicula:** This point-and-click adventure avoids digital effects entirely, embracing the organic qualities of acoustic instruments and human vocalizations. Waving a cursor over background botanical items triggers subtle paper-like rustling, establishing a physical connection between user touch and environmental reaction.  
* **Untitled Goose Game:** This title achieves dynamic reactivity by adapting pre-existing public domain classical music—specifically, Claude Debussy’s *Préludes* for solo piano, such as "Minstrels: Modéré" from Book I. The game engine segments pre-recorded piano performances and schedules playback dynamically to mimic the pacing of silent-film slapstick comedy. The slapstick comedy formula is synthesized from Charlie Chaplin's *Modern Times*, relying on (a) surprise, (b) easily understood scenarios with instant audience response, (c) a build-up of tension, and (d) a climactic payoff. The physical presence of the animal protagonist is grounded by combining species-specific vocalities (a dedicated honk button) with tactile environmental reactions.

### **Microscopic Recording and Analog Processing Chains**

Capturing soft, domestic textures without introducing high-frequency harshness or excessive background noise requires highly specific recording techniques and processing paths. Paper tearing, graphite sketching, and clothing friction contain high-frequency transients that can sound brittle or metallic when captured too close to a microphone.

#### **1\. Transducer Selection and Spatial Placement**

While sensitive condenser microphones are standard for studio environments, recording highly transient, abrasive sounds like paper tears or whiteboard writes is often more effective with high-quality dynamic microphones or hypercardioid small-diaphragm condensers. Dynamic microphones naturally smooth out harsh high frequencies.  
To simulate natural human hearing, materials must be recorded from a distance of at least 50 centimeters to 1 meter. Close-miking (at 10 to 20 centimeters) exaggerates the proximity effect and captures unnatural, harsh physical details that do not align with a cozy, lived-in perspective. Furthermore, positioning the microphone 45 degrees off-axis relative to the friction surface naturally attenuates directional high-frequency build-ups, yielding a warmer, rounder transient profile.  
For extremely quiet textures—such as finger-pad skin touching paper or soft fur rustles—a specialized low-self-noise microphone is required. Condensers like the Lewitt LCT 540S (boasting an ultra-low self-noise floor) prevent the build-up of background hiss during subsequent compression stages. The recording environment must be highly treated with DIY rigid fiberglass acoustic panels to eliminate boxy room reflections, preventing dry Foley from sounding like it was recorded in a domestic bathroom.

#### **2\. Signal Processing Chain (EQ, Compression, and Saturation)**

Raw home-recorded Foley requires careful spectral sculpting to sit comfortably in a mobile web mix. The processing chain must target and tame harsh resonant frequencies while introducing warm harmonic saturation:
`[Input Foley]`   
     `│`  
     `▼`  
`[High-Pass Filter] (100 Hz - 150 Hz)`  
     `│`  
     `▼`  
`[Notch / Parametric EQ] (Taming 4 kHz & 8 kHz harshness)`  
     `│`  
     `▼`  
`[Dynamic Compression] (Controlling dynamic peaks)`
     `│`  
     `▼`  
`[Tape Saturation] (Introducing warm odd/even harmonics)`
     `│`  
     `▼`  
`[Short Early Reflections] (Small space blend, <5% wet mix)`

To prevent low-end rumble from overloading mobile speaker transducers, a steep high-pass filter is applied between 100\\text{ Hz} and 150\\text{ Hz}. A parametric equalizer must target the 4\\text{ kHz} and 8\\text{ kHz} spectral bands. These ranges contain the harshest scratching frequencies of pencils and paper edges.  
Dynamic compression, utilizing a multiband compressor or de-esser, is configured to compress these target bands only when they exceed a specific threshold, preserving the natural performance dynamics. Tape saturation is introduced next, adding subtle, warm harmonic overtones that round out sharp transient spikes.  
Finally, a short, highly diffused early-reflections reverb (with a decay time under 0.3\\text{ seconds}) is mixed in at less than 5\\% wetness. This recreates a natural domestic tabletop space, smoothing out any remaining dry close-mic characteristics. Another advanced technique involves running a dynamic resonance suppressor (such as Soothe2) in delta mode. This extracts only the essential resonance character of wooden clicks or metal slides, which can then be blended back with the original dry signal to create a soft, satisfying UI click.

| Prop Material | Primary Interaction | Ideal Recording Distance | Microphones & Accessories | EQ & Spectral Targets |
| :---- | :---- | :---- | :---- | :---- |
| **Cotton / Linen** | Soft swish, fabric friction | 15–20 cm (focused close-mic) | Ultra-low self-noise condenser (e.g., Lewitt LCT 540S) | High-pass filter at 150 Hz; mild boost around 2–3 kHz |
| **Thick Sketchbook Paper** | Screen transitions, page flips | 50+ cm, 45-degree off-axis | Hypercardioid / Dynamic microphone | De-ess 4 kHz and 8 kHz peaks ; shelf boost at 250 Hz |
| **Graphite Pencil** | Menu hover, pencil sketches | 40 cm, 45-degree off-axis | Small diaphragm hypercardioid with pop shield | Notch cut at 6 kHz; subtle early reflections reverb |
| **Domestic Glass/Wood** | Tabletop button press clicks | 30 cm, dry space | Small diaphragm condenser | Dynamic compression; spectral delta taming |

### Key Takeaways for AI Training (Pillar 1)

* **Rule 1 (Acoustic Dominance):** Prohibit pure synthetic waveforms (sine, square, triangle oscillators) for UI actions. Every UI event must map to a physical domestic Foley asset.  
* **Rule 2 (Anti-Harshness):** Restrict close-mic raw assets unless pre-processed with steep notch filters at 4\\text{ kHz} and 8\\text{ kHz} and high-passed at 120\\text{ Hz}.  
* **Rule 3 (Environmental Cohesion):** Mix dry Foley with localized early reflection space models to avoid a sterile "isolation booth" signature.

## **Organic Creature Sound Design (The "Cicka" Language)**

Implementing animal sound design for a resident companion—such as the cat, Cicka—requires avoiding the repetitive "meow" samples found in cartoon-style libraries. Public reception of animal-focused games highlights a strong preference for realistic, non-human animal vocalizations, whereas unnatural, humanized, or repetitive meows are perceived as irritating and immersion-breaking. The character must sound like a real, living animal through a design that prioritizes physical presence over cartoonish vocal cues.

### **Physical Presence and Non-Vocal Textures**

To establish Cicka's presence, the sound design must prioritize physical, non-vocal audio textures. These subtle sounds occur during natural feline behaviors, such as sleeping, shifts in body weight, kneading (making biscuits), and breathing.

* **Skeletal and Weight Shifts:** A cat moving across wood or paper surfaces generates soft claw clicks and skin-friction sounds. These are recorded by dusting surfaces with micro-textures (like fine sand) and capturing the step transients using highly sensitive shotgun microphones positioned close to the floor.  
* **Kneading and Biscuit Making:** The gentle, rhythmic squeezing of soft fabric is designed using close-miked cotton or fleece rustling, layered with extremely brief, high-pass-filtered moisture squishes to simulate natural claw retraction.  
* **Breathing and Sighs:** Soft feline exhalations are designed using close-up recordings of gentle human breathing, pitched up by 4 to 6 semitones, high-pass filtered to remove chest bass, and smoothed with low-pass filters to emulate a small nasal cavity.  
* **Feline Purring:** Rather than a simple loop, purring must feel warm and organic. Real feline purring is generated during both inhalation and exhalation, creating a dual-phase rhythmic wave. This is designed by layering a continuous low-frequency hum (80\\text{ Hz} to 120\\text{ Hz}) with subtle odd-harmonic tape saturation. The volume and frequency are mapped to a slow, low-frequency oscillator (LFO) to simulate natural breathing cycles.

### **Micro-Trigger Matrix to Mitigate Audio Fatigue**

To prevent player audio fatigue, the animal's interactive cues must be throttled and randomized using a micro-trigger matrix. The system prevents repetition by continuously varying the pitch, playback rate, and selection pool based on player proximity and touch duration.

| Interaction State | Game Event Trigger | Primary Foley Layer | Vocal Layer | Playback Throttling | Audio Variation Parameters |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **Proximity Entry** | Player enters a 30px boundary | Soft carpet ruffle, light claw scratch | None (Silent physical cue) | Once per 15 seconds | Playback rate randomized by \\pm 10\\% |
| **Proximity Static** | Player idles near cat | Rhythmic breathing (nasal air swish) | Low-frequency purr (90\\text{ Hz}) | Continuous, low-volume loop | Purr intensity scales down with distance |
| **Direct Touch (Petting)** | Tap or click on cat collision box | Warm fabric compression | Gentle nasal trill (Chirp) | Once per touch gesture; max 1 repeat per 3 seconds | Pitch shifted randomly by \\pm 1.5 semitones |
| **Kneading Biscuit Loop** | Cat enters happy/kneading state | Rhythmic fleece squeeze | Soft rhythmic purr | Loop during active state; auto-fades after 8 seconds | LFO amplitude modulation at 1.2\\text{ Hz} (breathing rate) |
| **Vocal Query** | Cat seeks attention (rare) | Paw step on desk surface | Breath-led, short nasal chirp | Minimum 45-second cooldown | Selects from 5 distinct low-intensity chirps |

### **Key Takeaways for AI Training (Pillar 2\)**

* **Rule 1 (Vocal Restraint):** Ban repetitive meow vocalizations. The cat must express presence primarily through physical movement, breathing, and purring.  
* **Rule 2 (Natural Vocalizations):** Any vocalizations must be quiet, breathy, and short (under 0.8\\text{ seconds}). These sounds should use nasal, closed-mouth chirps or trills instead of open-mouthed, cartoonish meows.  
* **Rule 3 (Interactive Variety):** Apply a random pitch variation of \\pm 10\\% and a playback rate variance of \\pm 8\\% to every triggered sound effect to ensure no two interactions sound identical.

## **Dual-Cue Timing and Accessibility (Telegraph Terrace Research)**

In rhythm-focused or timing-based mini-games, players process sensory feedback through both visual and auditory pathways. However, web-first mobile platforms (PixiJS and Phaser) introduce unique latency and rendering challenges that can quickly desynchronize these cues. Designing these mini-games requires a deep understanding of human sensory processing, high-precision timing architecture, and visual fallbacks for silent play.

### **Psychology of Auditory and Visual Processing**

In human sensory psychology, auditory stimuli are processed faster than visual stimuli. Auditory signals reach the brain's processing centers in approximately 140 milliseconds, whereas visual stimuli require around 180 milliseconds. This discrepancy means that if an audio cue and a visual cue occur at the exact same physical instant, the player perceives the audio first. To create a satisfying, responsive experience, the visual transient (the peak of a button animation) should precede the audio transient (the peak of the sound effect) by a tiny fraction of a second, matching human sensory alignment.

### **Synchronization of Web Audio and Sprite Rendering**

Executing frame-perfect timing in a mobile web browser is difficult because the JavaScript main thread handles multiple tasks, including layout calculations, rendering, garbage collection, and physics. Standard browser timers, such as setInterval or setTimeout, are notoriously unreliable because they are deferred to the next event loop cycle. This delay can easily cause audio and video cues to drift out of sync.  
To solve this, the application must use a synchronized tri-clock architecture that coordinates the browser's hardware-timed audio thread, background timers, and the display repaint loop.  
`┌────────────────────────────────────────────────────────┐`  
`│             WebAudio API (Hardware Thread)             │`  
`│            Master Clock: audioContext.currentTime      │`  
`└──────────────────────────┬─────────────────────────────┘`  
                           `│ Schedules precise audio playback`  
                           `▼`  
`┌────────────────────────────────────────────────────────┐`  
`│             Web Worker (Dedicated Thread)              │`  
`│            Background Timer: High-frequency tick       │`  
`└──────────────────────────┬─────────────────────────────┘`  
                           `│ Queues scheduled events to Main Thread`  
                           `▼`  
`┌────────────────────────────────────────────────────────┐`  
`│            Main JavaScript Thread (PixiJS/Phaser)     │`  
`│            requestAnimationFrame() Render Loop        │`  
`└────────────────────────────────────────────────────────┘`

1. **The Web Audio API Clock (audioContext.currentTime):** This serves as the master reference clock. Run directly by the device's audio hardware thread, it is highly accurate and completely unaffected by main-thread JavaScript slowdowns or garbage collection.  
2. **A Dedicated Web Worker:** Operating on a background thread, the Web Worker uses a highly accurate interval timer to continuously monitor the master clock and queue up upcoming audio events. By running outside the main thread, the worker's timing ticks remain precise even during heavy rendering tasks.  
3. **The requestAnimationFrame Loop:** This loop handles visual updates by timing them directly to the screen's refresh rate. When a frame is ready to render, the loop queries the Web Audio master clock (audioContext.currentTime) and calculates the exact visual frame that matches the current audio playback position.

By calculating this ratio before every repaint, the game engine can smoothly sync visual sprite animations with audio playback, completely bypassing main-thread timing drift.

### **Designing for Silent Play (Muted Accessibility)**

Because many mobile web users play with their devices muted, the game must remain fully playable without audio. Audio cues should reinforce visual actions, but they must never be the only way to play. The game's timing-critical loops must be entirely playable using clear visual indicators:

* **Visual Wave Pulses:** To mimic the crescendo of an audio track, UI borders should pulse inward, with their scale contracting to match the target frame.  
* **Frame-Perfect Scale Distortion:** When a perfect hit occurs, the target sprite should squash and stretch along its vertical axis, giving the player instant physical feedback.  
* **Transient Screen Shake:** Strong beats or successful timing actions should trigger subtle screen shakes of 1 to 2 pixels, providing a visual sense of impact that mirrors the missing audio transient.

| Timing State | Auditory Feedback | Visual Redundancy Indicator | Sprite Frame Sync Target | Target Sync Tolerance |
| :---- | :---- | :---- | :---- | :---- |
| **Perfect Alignment** | Warm, damp wooden tap | High-contrast frame-scale squash; screen flash | Frame 8 (Full contact frame) | \\pm 16.6\\text{ ms} (1 frame at 60Hz) |
| **Early Hit** | Dull, thin paper click | Horizontal drift displacement | Frame 6 (Anticipation frame) | \-50\\text{ ms} to \-17\\text{ ms} |
| **Late Hit** | Low-pitch sliding whoosh | Vertical drift desaturation | Frame 10 (Release frame) | \+17\\text{ ms} to \+50\\text{ ms} |
| **Complete Miss** | Flat, hollow cardboard flop | Outward chromatic aberration blink | Frame 12 (Failure recovery frame) | \> \\pm 60\\text{ ms} |

### **Key Takeaways for AI Training (Pillar 3\)**

* **Rule 1 (The Master Clock):** Never use standard JavaScript timers (setTimeout) to schedule audio events. All audio must be scheduled using the Web Audio API's master clock (audioContext.currentTime).  
* **Rule 2 (Dual-Cue Parallelism):** Every timing-based audio event must map to a corresponding visual animation frame, ensuring the visual transient occurs 30 milliseconds before the audio peak.  
* **Rule 3 (Silent Playability):** Ensure the entire timing mini-game can be completed with the audio muted. Use screen shakes, sprite scale distortions, and pulsing UI borders to visually represent the rhythm.

## **Lightweight Web Audio Implementation Patterns**

Mobile web browsers—especially Safari on iOS and Chrome on Android—enforce strict memory limitations, interaction locks, and audio-thread behaviors. Building a lightweight, robust sound engine for these environments requires optimizing asset sizes, preventing memory leaks, and managing browser-enforced interaction states.

### **Understanding the Decoded Memory (LPCM) Footprint**

The most common cause of browser crashes in mobile web games is running out of memory due to uncompressed audio. While highly compressed audio formats like MP3 or AAC require very little space on disk, the Web Audio API must decode these files into 32-bit Linear Pulse Code Modulation (LPCM) in system RAM before they can be played back. This uncompressed format requires a massive memory footprint of approximately 10\\text{ MB} of system RAM per minute for a single channel (mono) of audio.  
Under this formula, a standard 4-minute stereo track decoded at 44.1\\text{ kHz} balloons to nearly 85\\text{ MB} of native system RAM, even if the compressed MP3 file on disk was only 600\\text{ KB}. On mobile devices, loading just a few of these uncompressed tracks will cause the browser to crash due to out-of-memory errors.  
To prevent these crashes, the sound designer must downsample all game assets in two ways:

* **Downmix to Mono:** Because mobile phones have closely spaced speakers, true stereo imaging is rarely noticeable. Downmixing all ambient sounds and Foley effects to mono instantly cuts their decoded memory footprint in half.  
* **Reduce Sample Rates to 22.05 kHz:** Halving the sample rate from 44.1\\text{ kHz} to 22.05\\text{ kHz} reduces the decoded memory footprint by another 50\\%. This reduction is perfect for cozy, lo-fi games, as the slight loss of high frequencies actually enhances the warm, acoustic sketchbook aesthetic.

### **The iOS Safari Memory Leak and the Scratch Buffer Fix**

On iOS Safari, simply disconnecting an audio node or removing its JavaScript references is not enough to free its memory. Safari’s internal decoding thread often retains active references to the decoded audio buffer, causing memory to leak with every state change or scene reload. To fix this leak, the game engine must manually overwrite the massive audio buffer with a tiny, 1-sample "scratch buffer" before discarding the audio node. Because browsers like Chrome and Firefox will throw errors if an active buffer is reassigned during playback, this reassign script must be wrapped in a try-catch block to ensure cross-browser compatibility:

```js
// Initialize a global, 1-sample scratch buffer to overwrite leaking memory.
const scratchBuffer = audioContext.createBuffer(1, 1, 22050);

function safeDisposeSourceNode(sourceNode) {
    if (!sourceNode) return;

    // 1. Prevent further callbacks by clearing event handlers.
    sourceNode.onended = null;

    // 2. Stop playback and disconnect from the audio graph.
    try {
        sourceNode.disconnect(0);
    } catch (e) {
        // Handle cases where the node was already disconnected.
    }

    // 3. Overwrite the massive decoded buffer with our 1-sample dummy buffer.
    try {
        sourceNode.buffer = scratchBuffer;
    } catch (e) {
        // Catches and bypasses browser-specific reassignment errors.
    }

    // 4. Dereference the node to let the garbage collector reclaim memory.
    sourceNode = null;
}
```

### **Addressing Latency Discrepancies on Chrome Android and iOS Safari**

Mobile Safari and Chrome Android exhibit highly divergent latency behaviors that directly impact real-time gameplay. Under native execution, Android devices often report total round-trip audio latencies under 50 milliseconds. However, when running Web Audio inside Chrome on Android, total latency can balloon to 300 milliseconds. This is caused by Chrome bypassing the low-latency audio path of the hardware when a device reports that it does not support Android's strict low-latency parameters. In such cases, Chrome defaults to a large, safe buffer size (often 3,000 frames) instead of a performance-optimized size (256 or 512 frames).  
By contrast, Web Audio latency inside iOS Safari is generally tighter, measuring around 130 milliseconds. To minimize the 300-millisecond latency on Android and keep latency consistent across both platforms, developers must apply several constructor-level parameters when instantiating the AudioContext:

* **The latencyHint Option:** Constructing the context with latencyHint: 0.003 (or 'interactive') forces Chrome to request the smallest possible buffer size from the audio driver. While this can occasionally cause minor audio glitches on older devices, it is essential for reducing input lag in timing-critical games.  
* **Bypassing Resampling:** If the sample rate of loaded audio files does not match the native sample rate of the device's hardware (which is typically 48 kHz on modern Android phones), the browser must resample the audio in real-time. This resampling step introduces significant latency overhead. Constructing the AudioContext with a specified sampleRate option that matches the device's hardware sample rate eliminates this overhead completely.

### **Managing Browser Interaction Locks and State Transitions**

Mobile browsers start the Web Audio API in a suspended state to prevent unwanted ads or autoplay audio from playing without the user's consent. No audio can play until the player performs an explicit interaction, such as a screen tap.

#### **Unlocking the Audio Context**

To handle these browser security locks cleanly, the Phaser or PixiJS game engine must listen for the UNLOCKED event before attempting to play any audio. This avoids flooding the browser console with autoplay warnings and ensures that assets load and play only after user consent has been granted:

```js
// Listen for Phaser's sound manager to unlock before starting background music.
this.sound.once(Phaser.Sound.Events.UNLOCKED, () => {
    this.backgroundMusic.play({ loop: true, volume: 0.3 });
});
```

#### **State Transitions and Focus Changes**

When transitioning between different game states—such as moving from the quiet Overworld to a timing mini-game—the audio engine must gracefully fade active tracks out and clean-load new assets, rather than running a complex, resource-heavy dynamic audio mixer. Using Phaser's built-in WebAudioSoundManager and addAudioSprite allows developers to package all UI and gameplay Foley sounds into a single compressed audio file, which reduces network requests and memory overhead.  
To handle visibility changes cleanly (such as when a player switches tabs or receives a phone call), the game must listen to the browser's visibilitychange event. Rather than relying on Phaser's automatic focus handling, which can fail on certain iOS devices, the sound manager should set pauseOnBlur to false and handle pause and resume states manually:

```js
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Manually suspend the audio context and pause game loops when focus is lost.
        audioContext.suspend();
    } else {
        // Manually resume the audio context on focus return.
        audioContext.resume();
    }
});
```

| Audio Codec | Mobile Safari Support | Chrome Android Support | Decoded Memory (LPCM) Size | Gapless Looping Support | Latency Under Web Audio | Recommended Deployment Use Case |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **MP3** | Universal | Universal | High (\~10MB/min/ch) | No (decoder padding gaps) | Moderate (\~130ms on iOS) | Legacy UI sprites and non-looping ambient events |
| **AAC** | Universal | Universal | High (\~10MB/min/ch) | No (standard container gaps) | Moderate | Short, one-shot Foley sequences with high transient profiles |
| **Ogg Vorbis** | No | Universal | Moderate | Yes | Low | Long ambient background soundscapes specifically for Android devices |
| **Ogg Opus** | No | Universal | Low (optimized decoding) | Yes | Ultra-low | High-efficiency loops and background music layers on Android |

### **Key Takeaways for AI Training (Pillar 4\)**

* **Rule 1 (Strict Downsampling):** Force all game assets to mono, and restrict their sample rates to 22.05\\text{ kHz} to instantly reduce uncompressed memory usage by 75\\%.  
* **Rule 2 (Safari Leak Prevention):** Every disposed source node must be disconnected, have its event handlers cleared, and have its buffer reference overwritten with a 1-sample scratch buffer before deletion.  
* **Rule 3 (Manual Focus Control):** Disable automatic browser focus handling. Manually trigger audioContext.suspend() and audioContext.resume() using the browser's visibilitychange event to prevent audio freezes on mobile devices.  
* **Rule 4 (Hardware Alignment):** Eliminate resampling overhead on Android by setting the context sampleRate constructor option to match the native hardware output, paired with a latencyHint set to 0.003.

#### **Works cited**

1\. Handcrafted Paper UI Sound Pack by sound shmyak \- Itch.io, https://soundshmyak.itch.io/handcrafted-paper-ui-sound-pack 2\. Foley Beginner Equipment Advice (for recording simple desktop sounds) : r/GameAudio, https://www.reddit.com/r/GameAudio/comments/3evpb0/foley\_beginner\_equipment\_advice\_for\_recording/ 3\. \#sound+design.Mini+Motorways \- Disasterpeace, https://disasterpeace.com/blog/tag.sound+design.Mini+Motorways 4\. The Organic Feel of 'Botanicula' \- PopMatters, https://www.popmatters.com/159779-botanicula-2495841864.html 5\. Finding Untitled Goose Game's Dynamic Music in the World of Silent Cinema \- UC Press Journals, https://online.ucpress.edu/jsmg/article/2/1/1/115922/Finding-Untitled-Goose-Game-s-Dynamic-Music-in-the 6\. Designing for Slapstick Comedy in Untitled Goose Game \- Diva-Portal.org, https://www.diva-portal.org/smash/get/diva2:1579793/FULLTEXT01.pdf 7\. Finding Untitled Goose Game's Dynamic Music in the World of Silent Cinema, https://www.semanticscholar.org/paper/Finding-Untitled-Goose-Game%E2%80%99s-Dynamic-Music-in-the-Golding/ba71529ea747a99a76444ff1e3554bdbb1e90ffb 8\. Caturday felids: Review of new cat video game “Stray”; pet cat on the loose in Boston airport for three weeks; cat demands to be spooned \- Why Evolution Is True, https://whyevolutionistrue.com/2022/07/30/caturday-felids-review-of-new-cat-video-game-stray-pet-cat-on-the-loose-in-boston-airport-for-three-weeks-cat-demands-to-be-spooned/ 9\. What are some tips and techniques on recording paper, pencil, chalkboard and other often harsh sounding foley?, https://sound.stackexchange.com/questions/27958/what-are-some-tips-and-techniques-on-recording-paper-pencil-chalkboard-and-oth 10\. 8 things I learned that greatly improved my foley recordings, https://foleytales.com/2023/12/03/8-things-i-learned-that-greatly-improved-my-foley-recordings/ 11\. I Recorded Clothing Foley...and made a sound library with it \- David Dumais Audio, https://www.daviddumaisaudio.com/i-recorded-clothing-foley-and-made-a-sound-library-with-it/ 12\. What's your secret sauce for making satisfying UI sound effects? : r/GameAudio \- Reddit, https://www.reddit.com/r/GameAudio/comments/1hnyzmr/whats\_your\_secret\_sauce\_for\_making\_satisfying\_ui/ 13\. Sound Design for Video Games: A Primer \- Mega Cat Studios, https://megacatstudios.com/blogs/game-development/sound-design-for-video-games-a-primer 14\. Free cat meowing sound effects generator \- Adobe Firefly, https://www.adobe.com/products/firefly/features/sound-effect-generator/animal/cat-meow.html 15\. Anyone else put off by the deep, unnatural meows? : r/mewgenics \- Reddit, https://www.reddit.com/r/mewgenics/comments/1opkyr7/anyone\_else\_put\_off\_by\_the\_deep\_unnatural\_meows/ 16\. Stray: What could have been : r/patientgamers \- Reddit, https://www.reddit.com/r/patientgamers/comments/1ps5nb3/stray\_what\_could\_have\_been/ 17\. Developing game audio with the Web Audio API | Articles \- web.dev, https://web.dev/articles/webaudio-games 18\. Near-Realtime Animations with Synchronized Audio in JavaScript ..., https://medium.com/fender-engineering/near-realtime-animations-with-synchronized-audio-in-javascript-6d845afcf1c5 19\. Web Audio API latency on Android \- Stack Overflow, https://stackoverflow.com/questions/35701015/web-audio-api-latency-on-android 20\. Synchronize Animation To An Audio File With Web Audio \- Hans Garon, https://hansgaron.com/articles/web\_audio/animation\_sync\_with\_audio/part\_one/ 21\. Render Loop \- PixiJS, https://pixijs.com/8.x/guides/concepts/render-loop 22\. I've spent quite a lot of time working with the Web Audio API, and I strongly ag... | Hacker News, https://news.ycombinator.com/item?id=15242429 23\. Phaser 3 API Documentation \- Class: WebAudioSoundManager \- GitHub Pages, https://photonstorm.github.io/phaser3-docs/Phaser.Sound.WebAudioSoundManager.html 24\. Web Audio Best Practices for Games in Phaser 3 \- Ourcade Blog, https://blog.ourcade.co/posts/2020/phaser-3-web-audio-best-practices-games/ 25\. Web Audio API Memory Leaks on Mobile Platforms \- Stack Overflow, https://stackoverflow.com/questions/24119684/web-audio-api-memory-leaks-on-mobile-platforms 26\. How I optimized my Phaser 3 action game — in 2025 | by François \- Medium, https://franzeus.medium.com/how-i-optimized-my-phaser-3-action-game-in-2025-5a648753f62b 27\. WebAudio high latency on Android \[40103372\] \- Chromium Issue, https://issues.chromium.org/40103372 28\. Web Audio API \- MDN Web Docs \- Mozilla, https://developer.mozilla.org/en-US/docs/Web/API/Web\_Audio\_API 29\. (FREE) Cozy Game Sound Pack 1 \- GameDev Market, https://www.gamedevmarket.net/asset/free-cozy-game-sound-pack-1 30\. Help\! Mobile Safari Web Speech API silent failure \- Works on Desktop/iPad, but silent on iPhone (No console errors) : r/learnjavascript \- Reddit, https://www.reddit.com/r/learnjavascript/comments/1smimrx/help\_mobile\_safari\_web\_speech\_api\_silent\_failure/
