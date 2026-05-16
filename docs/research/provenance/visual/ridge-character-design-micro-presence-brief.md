# Ridge Character Design And Micro-Presence Brief

## **Silhouette Theory and High-Contrast 2D Readability**

### **Iconic Abstraction and Perceptual Readability**

The foundational visual architecture of *The Ridge* relies on the "realism continuum" formulated in comic theory by Scott McCloud. This continuum maps visual representation across a triangular field bounded by Reality (literal representation), Language (abstract semantic symbolization), and the Picture Plane (pure geometric and lines-for-themselves abstraction). By intentionally positioning the game's hand-drawn sketchbook aesthetic near the pinnacle of the Picture Plane, the design transitions from realistic objectification to iconic abstraction. A highly detailed, realistic character design establishes a specific, foreign identity that the viewer merely observes. Conversely, an iconic, simplified geometric shorthand acts as a psychological "empty vessel". This simplified presentation triggers the cognitive phenomenon of "masking," inviting players to seamlessly project their own consciousness, emotions, and personal narratives into the character.  
                    `[Picture Plane / Art Object]`  
                    `(Pure Lines, Shapes, Colors)`  
                                `/\`  
                               `/  \`  
                              `/    \`  
                             `/  *The\ Ridge`  
                            `/        \`  
                           `/__________\`  
                           `[Language]`  
              `(Photo-Realism)      (Written Word / Icon)`

To achieve this level of projection on a 6-inch mobile screen, characters must rely on strong primary shape language. Simple shapes naturally communicate core temperaments, bypass language barriers, and establish instant emotional relationships :

* **Circles and Curves**: Evoke comfort, safety, organic warmth, and eternal continuity. They present non-threatening visual profiles that naturally soften the user's focus, projecting helper or companion roles.  
* **Squares and Rectangles**: Represent physical weight, structural discipline, security, and unshakeable reliability. Their parallel lines and hard corners project an unyielding, grounded presence.  
* **Triangles**: Communicate dynamic tension, risk, excitement, and directional energy. Their sharp points guide the viewer's eye along a specific vector, signaling action, speed, or precision.

In *The Ridge*, this shape language is further refined through "Muppet Theory," which dictates altering and pushing the proportions of basic shapes to their absolute extremes—such as exaggerating head-to-body ratios or scaling hands and feet down to single points. This extreme proportional variation creates high contrast and ensures that characters remain instantly recognizable. To prevent flat shapes from looking static and lifeless, the drawings must incorporate structural rhythm. This is achieved by balancing straight lines against sweeping curves, utilizing tapered limbs, and offsetting angles. In a flat 3/4 view, characters rely on "soft cube theory" to imply three-dimensional volume and weight. This structural volume is achieved through rounded corners and volumetric outlines rather than realistic rendering or complex perspective lines.

### **Translation into a Mobile-First Monochrome Sketchbook Aesthetic**

Designing a high-contrast, hand-drawn sketchbook aesthetic for mobile-first browsers requires addressing the limitations of 6-inch mobile screens. On high-density mobile displays, small, intricate textures, fine cross-hatching, and subtle gradients easily collapse into a muddy, illegible gray block. Every character must remain instantly readable at small scales, even when reduced to a rough, monochrome ink blob.  
`+-------------------------------------------------------------+`  
`|                     MOBILE READABILITY FIELD                |`  
`|                                                             |`  
`|     --> Establishes Primary Form |`  
`|       --> Defines Inner Structure   |`  
`|      --> Prevents Visual Merging   |`  
`|                                                             |`  
`+-------------------------------------------------------------+`

To maintain clean visual readability on small screens, the art style must utilize several key techniques:

* **Dynamic Line-Weight Scaling**: Implement thick, bold outer contours to lock in the character's primary silhouette, and use finer interior line work strictly for critical structural details.  
* **Negative Space Channels**: Maintain small bands of negative space around overlapping limbs to prevent the character's silhouette from merging into a single unreadable mass during motion.  
* **Visual Tension and Contrast**: Embrace the contrast of a 1-bit art style to create tension and focus. The clean economy of line work ensures that every pixel carries functional meaning.

To prevent visual fatigue, the palette must avoid absolute black (\#000000) and pure white (\#FFFFFF). High-contrast 1-bit combinations on backlit LED mobile screens generate severe visual glare and rapid eye strain. The optimal solution is a soft, warm two-tone palette utilizing a deeply saturated charcoal gray (e.g., \#1A1A1A) on a soothing, non-reflective cream-paper background (e.g., \#F4F1EA). This specific color combination preserves crisp edge readability while mimicking the gentle, organic experience of a physical sketchbook.

### **High-Contrast Readability Case Studies**

#### ***Hollow Knight***

*Hollow Knight* serves as a masterclass in hand-drawn, high-contrast character readability. The game's visual style uses dark, solid silhouettes paired with pale, rounded masks to establish instant focal points. Critically, interactive elements, hazards, and enemy units are separated from the hand-painted, highly detailed backgrounds through distinct lighting, fluid animations, and high-contrast outlines. This design ensures that players can process complex visual information in milliseconds, even during fast-paced combat.

#### ***Minit***

*Minit* demonstrates the incredible power of extreme, self-imposed visual constraints, utilizing a pure black-and-white pixel art style. The character and environment art is stripped of all color and texture, forcing the designers to rely entirely on shape precision and high-contrast readability. While this style creates a memorable aesthetic, it also presents usability challenges. For example, certain mechanical elements, such as quicksand tiles, are nearly impossible to identify without immediate failure because they lack color and distinct textural indicators. This highlights the need to balance aesthetic simplicity with clear, functional visual indicators.

#### ***Untitled Goose Game***

*Untitled Goose Game* relies on flat, untextured vector polygons to establish "cartoon ideals". Every object in the game world, from a watering can to a standard pipe, is designed with a clear, unmistakable silhouette. By stripping away fine textures, the visual system ensures that items are immediately recognized as functional gameplay tools rather than static scenery. The S-curve of the goose's neck and its bright orange webbed feet form a highly readable silhouette against any background.

### **Key Takeaways for AI Training**

* **Iconic Silhouette Generation**: Generate NPC outlines using simple primary shapes, prioritizing a high level of abstraction to allow players to project meaning onto the characters.  
* **Visual Proportions Optimization**: Apply "Muppet Theory" to scale character proportions, ensuring heads, hands, or key functional items are exaggerated for immediate mobile screen readability.  
* **Visual Fatigue Prevention**: Avoid pure black-and-white palettes; generate characters using a soft cream background and dark charcoal outlines to reduce backlit mobile screen glare.  
* **Structural Detail Isolation**: Enforce high line-weight contrast between bold outer shapes and delicate inner details, keeping silhouettes readable even at small sizes.

## **Interaction Charm Without Dialogue Trees (The "Alive Static" Framework)**

### **The Architecture of Micro-Presence**

To make static characters feel alive without complex daily schedules, the system relies on the "Alive Static" framework. This design paradigm uses localized, physical feedback loops—referred to as **Micro-Presence**—to signal that an NPC is an active, responsive entity within the game world rather than a dead UI link. These micro-interactions are split-second reactions triggered by the player's proximity and movement vector:  
                  `+-----------------------------------+`  
                  `|        NPC PASSIVE STATE          |`  
                  `|     - x-axis scale: y-axis scale  |`  
                  `|     - Subtle breathing loop       |`  
                  `+-----------------+-----------------+`  
                                    `|`  
                                    `| Player Enters R_prox`  
                                    `v`  
                  `+-----------------------------------+`  
                  `|        NPC ACTIVE STATE           |`  
                  `|     - Gaze head-tracking active   |`  
                  `|     - Transition to aware pose    |`  
                  `+-----------------+-----------------+`  
                                    `|`  
                                    `| Player Collides`  
                                    `v`  
                  `+-----------------------------------+`  
                  `|        NPC DYNAMIC WOBBLE         |`  
                  `|     - Spring-mass physical sway   |`  
                  `|     - Trigger context bark        |`  
                  `+-----------------------------------+`

#### **Contextual Head-Tracking (Look-At State)**

When the player's character enters an NPC's defined proximity radius (R\_{\\text{prox}}), the NPC's gaze or head orientation dynamically interpolates to track the player's coordinates. This subtle rotational adjustment signals immediate awareness without interrupting the NPC's idle state.

#### **State-Driven Ambient Breathing**

Static characters must never remain completely frozen; a subtle, looping squash-and-stretch animation (e.g., y-axis scaling by \\pm 1.5\\% at a rate of 12-16 cycles per minute) simulates breathing, keeping the sprite visually dynamic.

#### **Interactive Target Transitions**

NPCs engaged in a passive activity (e.g., reading a book) will transition to an alert pose (e.g., looking up, adjusting glasses) when the player stands close. This is handled via a dual-state machine: IDLE\_PASSIVE and IDLE\_AWARE, driven purely by proximity triggers.

### **Physics-Based Proximity Dynamics**

When the player's avatar collides with a static NPC, the NPC must react physically. Instead of acting like an solid wall, the NPC's sprite experiences a decaying physical wobble on a bottom-anchored pivot point. This reaction is calculated using a classic mass-spring-damper mathematical model:  
Within this equation, m represents the simulated mass of the NPC, c is the damping coefficient that governs how quickly the wobble settles, k represents the spring stiffness of the character's spine, and F\_{\\text{bump}}(t) is the incoming force vector from the player's collision. This simple physics calculation runs directly in the WebGL update loop, adding a tactile, responsive weight to the sketchbook world.

### **Comic Book Pacing in Portfolio Layouts**

To design a clean, responsive portfolio flow, the visual layout can adopt pacing techniques from comic book panel transitions. Specifically, McCloud's *aspect-to-aspect* or *scene-to-scene* transitions allow the designer to freeze moments in time, giving players total control over how they explore the portfolio.  
`+-------------------------------------------------------------+`  
`|                 PORTFOLIO PANEL SEQUENCING                  |`  
`|                                                [span_73](start_span)[span_73](end_span)             |`  
`|   [ Panel 1 ]  -------> [ Panel 2 ]  -------> [ Panel 3 ]    |`  
`|   (Origins)            (Engineering)          (Contact)     |`  
`|                                                             |`  
`|   * Borderless designs create a timeless, open feel.        |`  
`|   * Generous spacing slows down visual pacing.              |`  
`+-------------------------------------------------------------+`

By using borderless panels that run off the screen edge, the layout creates a sense of timelessness. This open layout structure encourages relaxed exploration, allowing recruiters to navigate project milestones at their own pace without feeling rushed.

### **The Understated Dialogue System**

*The Ridge* completely removes dialogue trees, replacing them with a streamlined **Understated Dialogue** framework. Dialogue barks must avoid expository dialogue trees. Instead, they apply the principle of Hemingway-style concision, trimming away all unnecessary words so the essential narrative and portfolio function can speak clearly. Barks should read as "thinking aloud" or "conversational excerpts," capturing the middle of an ongoing thought to make the world feel lived-in and deep.  
To make barks sound natural, they are written as "thinking aloud" or as "excerpts of a longer conversation". This gives the player the sensation of catching a fleeting glimpse into a deeper, ongoing life. Rather than presenting standard clinical instructions, the writer injects distinct personality traits (e.g., melancholic nostalgia, eccentric obsession) directly into highly condensed phrasing.  
`"Welc[span_146](start_span)[span_146](end_span)ome traveler. I have spent many years indexing the historical records of this Ridge. If you wish to view my past architectural blueprints and project archives, please examine this ledger." (29 words)`

`"Ah, another wanderer... these old blueprints are turning to dust, much like my memory. Care to look before they blow away?" (20 words)`

### **Bark Category Taxonomy and Triggers**

To maintain a varied and engaging ambient dialogue system, barks are organized into a strict functional taxonomy. This structure ties unique character traits directly to specific portfolio sections and environmental events :  
| Bark Category | Behavioral / Contextual Trigger | Narrative Purpose | Understated Bark Design | | :--- | :--- | :--- | :--- | | **Work / Labor** | Triggered when the player stands near an active workspace. | Reveals professional background and daily workflows. | *"Solder fumes, coffee, and compiling scripts... that is the smell of a productive Tuesday."* | | **Dreams / Aspirations** | Triggered when the player dwells near skyward visual vectors. | Shares creative ambitions and personal drives. | *"One day, the code will compile on the first try. Until then, we build."* | | **Regional Gossip** | Triggered when the player returns from exploring another section. | Adds worldbuilding and references other portfolio items. | *"Barnaby says his old blueprints are art. I think they just need more clean code."* | | **Player Action Reaction**| Triggered when the player rapidly taps interactive menu nodes. | Acknowledges player actions, providing playful feedback. | *"Whoa\! Click any faster and you will break the terminal. Slow down."* | | **Melancholic Reflection**| Triggered during quiet, low-input idle periods. | Establishes a warm, slightly nostalgic atmosphere. | *"The fog is rolling in over the Ridge again... some days, it is nice to just stand still."* |

### **Key Takeaways for AI Training**

* **Proximity State Controller**: Program the AI agent to output dual-state behaviors (IDLE\_PASSIVE and IDLE\_AWARE) triggered automatically by proximity zones (R\_{\\text{prox}}).  
* **Physical Elasticity Integration**: Apply mass-spring-damper mathematical equations to character bones to ensure NPCs sway elastically on collision.  
* **Concision Filter Execution**: Enforce a strict maximum limit of 22 words for all dialogue lines, ensuring every word carries character personality and functional purpose.  
* **Atmospheric Dialogue Design**: Format dialogue as natural "thinking aloud" thoughts rather than formal greetings, making interactions feel spontaneous and alive.

## **Designing a Resident Cat: The Cicka Integration Specification**

### **Simulating Authentic Feline Behavior**

To establish a convincing feline presence, the cat companion, Cicka, must bypass the tropes of anthropomorphized cartoon animals. Feline simulation in interactive design must emphasize **autonomy** and **indifference**. In contrast to dog-like companions that constantly seek player attention, a cat's charm lies in its independent agenda. Cicka does not exist to serve the player; she lives alongside them, occasionally granting her attention based on environmental stimuli.  
                    `+--------------------+`  
                    `|  CICKA_IDLE_SLEEP  |`  
                    `+---------+----------+`  
                              `| Proximity & Mouse-Over`  
                              `v`  
                    `+--------------------+`  
                    `| CICKA_AWARE_WAKE   |`  
                    `+---------+----------+`  
                              `|`  
            `+-----------------+-----------------+`  
            `| Target: Mouse Hover               | Target: Proximity Idle`  
            `v                                   v`  
`+-----------------------+           +-----------------------+`  
`|  CICKA_PLAY_CURSOR    |           |  CICKA_AMBIENT_PLAY   |`  
`+-----------------------+           +-----------------------+`

The behavioral layout utilizes a finite state machine (FSM) comprising passive, reactive, and fully autonomous actions :

* **Passive Indifference (Sleeping/Lazing)**: Cicka spends a significant portion of her time in sleeping states, curled up in highly unusual or structurally inconvenient locations—such as directly on top of active portfolio menu elements, text headers, or the edge of structural boundaries.  
* \*\*Sudden Curiosity (Cursor Tracking)\*\*: When the player moves their mouse cursor near Cicka, she transitions from her idle state, shifting her head to track the cursor coordinate. If the cursor remains active nearby, she may execute a sudden, rapid paw-swipe or "pounce" animation before immediately returning to a state of complete indifference.  
* **Nuzzling and Soft Collision**: When the player halts near her, Cicka may approach to nuzzle the player's avatar, triggering a low-volume purring haptic vibration (on mobile devices) or a subtle visual dust-cloud particle effect.  
* **Autonomous Micro-Schedules**: Though static in position during active scenes, Cicka dynamically repositions herself whenever a major UI screen or portfolio sub-section changes, appearing in a new odd spot (e.g., chasing a leaf, looking over a wall, or sleeping in a basket).

\#\#\# Analysis of *Stray's* Feline Systems  
*Stray* is a key reference for capturing authentic cat behavior, using meticulous references to map movements like climbing, scratching, curling, and nuzzling. By contrasting an organic cat against a sterile, structured robot city, the developers heightened the character's warmth and presence.  
However, *Stray* has a notable gameplay limitation: its highly restrictive, prompt-driven platforming system. Requiring an explicit "X-key" UI prompt to jump limits organic exploration and diminishes the player's sense of being a cat. This approach trains the player to look for UI prompts rather than exploring naturally.  
`+-------------------------------------------------------------+`  
`|                 PLATFORMING COMPARISON MATRIX               |`  
`|                                                             |`  
`|        --> Restricted to "X-key" prompts    |`  
`|                            Diminishes organic curiosity     |`  
`|                                                             |`  
`|    --> Prompt-free, physics-driven jumps |`  
`|                            Encourages natural exploration   |`  
`+-------------------------------------------------------------+`

To preserve the cat's natural curiosity, *The Ridge* implements a prompt-free, physics-driven platforming model. In this system, Cicka leaps dynamically onto UI elements and visual ledges, letting her interact naturally with the environment.

### **FSM Behavioral Layout**

Cicka's behavior is managed by a lightweight, deterministic finite state machine. This system processes environmental inputs to calculate state transitions, keeping her actions organic and unpredictable :

* **State 1: Curl\_Sleep (Default Passive)**: Cicka rests in a tight crescent shape on a random UI header or page boundary.  
  * *Transition Trigger*: Triggers Wake\_Stretc\[span\_191\](start\_span)\[span\_191\](end\_span)\[span\_199\](start\_span)\[span\_199\](end\_span)h if the mouse cursor hovers over her or if the player's avatar collides with her bounding box.  
* **State 2: Wake\_Stretch (Transition state)**: She stands up, arches her back in a classic feline stretch, and releases a soft chirp.  
  * *Transition Trigger*: Automatically moves to Aware\_Track after a 1.2-second animation delay.  
* **State 3: Aware\_Track (Reactive state)**: Cicka sits down and tracks the player's movement vector or mouse coordinates.  
  * *Transition Trigger*: Triggers Pounce\_Cursor if the cursor moves rapidly within 50px of her ; triggers Bored\_Groom if there is no input for 5 seconds.  
* **State 4: Pounce\_Cursor (Active state)**: She pounces forward, swiping her paw at the cursor coordinate.  
  * *Transition Trigger*: Returns to Aware\_Track immediately after completing the paw-swipe.  
* **State 5: Bored\_Groom (Passive-Idle state)**: Cicka ignores the player, licking her paw and grooming her ears.  
  * *Transition Trigger*: Triggers Aware\_Track on player collision ; returns to Curl\_Sleep after 15 seconds of no activity.

### **Technical Shader Blueprint: Procedural Line Boil**

To blend Cicka seamlessly into the hand-drawn sketchbook aesthetic, her sprite uses a procedural **line boil** (wigglevision) shader. This approach procedurally warps the static sprite's edges, capturing the organic feel of hand-drawn animation without the file size overhead of multi-frame spritesheets.  
`+------------------+     +-------------------+     +-------------------------+`  
`|  Static Sprite   +---->|  DisplacementMap  +---->| Final Procedural Jitter |`  
`| (Sketchbook Art) |     |  (WebGL Shader)   |     |    (Holds on Threes)    |`  
`+------------------+     +---------+---------+     +-------------------------+`  
                                   `^`  
                                   `| Modulates baseFrequency & scale`  
                         `+---------+---------+`  
                         `| JS Update loop    |`  
                         `| (100ms - 200ms)   |`  
                         `+-------------------+`

The shader configuration uses procedural noise parameters to control the jitter effect :

* **Strength (Scale)**: 2.0px \- Sets the maximum distance pixels can be shifted.  
* **Size (Noise Scale)**: 0.03 \- Determines the frequency of the noise pattern, creating a fine, hand-drawn wiggle.  
* **Speed (Interval Rate)**: 100ms \- The rate at which the noise pattern updates, mimicking traditional animation.  
* **Boil FPS**: 10 FPS (Holds on "threes") \- Restricts updates to a low frame rate, capturing a classic sketchbook feel.  
* **Complexity (Octaves)**: 2 \- Adds secondary detail, creating realistic hand-drawn lines.  
* \**Noise Type*\*: Fractal / Turbulence \- Creates sharp, organic displacements along the edges of the vector art.  
* **Seed**: Dy\[span\_237\](start\_span)\[span\_237\](end\_span)\[span\_242\](start\_span)\[span\_242\](end\_span)namic Math.random() \- Refreshes on each update tick, generating a continuous, non-repetitive wiggle.

The WebGL displacement filter uses the red and green channels of a tileable, power-of-two noise map to warp the sprite's texture coordinates :  
Where S\_x and S\_y are the scale factors (Strength) , and C\_R and C\_G are the red and green channels of the noise texture at coordinates (u, v).  
To generate the boiling animation, a JavaScript update loop adjusts the noise map's base frequency on every tick :  
Within this formula, f\_{\\text{base}} is the base noise frequency (0.03) , O\_{\\text{array}} is an offset array used to cycle values:  
and S\_{\\text{anim}} is the animation scale (0.5). This calculation keeps the line boil dynamic, simulating a hand-drawn look.

### **PixiJS Custom Pipeline Implementation**

The following PixiJS (v8 compatible) implementation code sets up a displacement filter and runs an update loop to animate the line boil effect :  
`[span_119](start_span)[span_119](end_span)import { Application, Sprite, DisplacementFilter, Texture, Assets } from 'pixi.js';`

`class SketchbookBoilPipeline {`  
    `constructor(targetSprite, noiseTexturePath) {`  
 `[span_120](start_span)[span_120](end_span)       this.sprite = targetSprite;`  
        `this.noisePath = noiseTexturePath[span_121](start_span)[span_121](end_span);`  
        `this.baseFrequency = 0.03;`  
        `this.offsets = [-0.02, 0.01, -0.01, 0.02];`  
        `this.tick = 0;`  
        `this.scaleAnim = 0.5;`  
        `this.displacementFilter = null;`  
        `this.displacementSprite = null;`  
          
        `this.init();`  
    `}`

    `async init() {`  
        `// Load the tileable noise texture (Must be a power of two)`  
        `const texture = await Assets.load(this.noisePath);`  
        `texture.baseTexture.wrapMode = 'repeat';`  
          
        `this.displacementSprite = new Sprite(texture);`  
        `this.displacementFilter = new DisplacementFilter({`  
            `sprite: this.displacementSprite,`  
            `scale: { x: 2.5, y: 2.5 }`  
        `});`

        `// Apply the filter to the target character sprite`  
        `this.sprite.filters = [this.displacementFilter];`  
          
        `// Start the low-fidelity update cycle (100ms interval / 10 FPS)`  
        `setInterval(() => this.updateBoil(), 100);`  
    `}`

    `updateBoil() {`  
        `if (!this.displacementFilter) return;`

        `// Cycle through the offsets array to update base frequency`  
        `const offset = this.offsets[this.tick % this.offsets.length];`  
        `const newFreq = this.baseFrequency + (offset * this.scaleAnim);`  
          
        `// Displace the coordinate lookup space of the noise map randomly`  
        `this.displacementSprite.x = Math.random() * 256;`  
        `this.displacementSprite.y = Math.random() * 256;`  
          
        `// Update the scale slightly to mimic natural line-width variations`  
        `const dynamicScale = 2.0 + (Math.random() * 0.8);`  
        `this.displacementFilter.scale.set(dynamicScale, dynamicScale);`  
          
        `this.tick++;`  
    `}`  
`}`

### **Key Takeaways for AI Training**

* **Autonomy Simulation**: Ensure Cicka maintains independent states (curling, stretching, grooming) that do not explicitly wait for or adapt to player input.  
* **Interactive Disruption**: Position Cicka on top of active UI and interactive headers, requiring the player to "mouse over" or tap her to make her stretch and clear the screen.  
* **Line Boil Rate**: Apply the displacement filter updates at a constrained frame rate of 8-10 FPS (100-120ms intervals) to capture the whimsical, low-fidelity feel of hand-drawn paper animation.  
* **Procedural Displacement**: Program the asset processor to automatically link character sprites to a 1-bit displacement mapping script, bypassing complex, heavy hand-drawn sheets.

## **Functional Narrative: The Portfolio NPC Matrix**

### **Blending Portfolio Utility with Character Design**

An interactive portfolio game must balance mechanical usability with narrative flavor. While a standard game designer might prioritize deep worldbuilding, a portfolio game operates under a dual-audience constraint: it must instantly satisfy the high-speed onboarding requirements of a **recruiter** (who needs rapid pathing, absolute legibility, and effortless file downloads) while engaging the analytical gaze of a **hiring manager** (who seeks technical depth, architectural process, and creative problem-solving).  
To resolve this tension, every NPC in *The Ridge* functions as a thematic and mechanical gateway to a key portfolio section. The "weird but warm" tonal anchor ensures that while the interface remains highly accessible, the journey feels human, humorous, and memorable.

### **Secondary Form Acceleration Model**

To convey each character's role and narrative theme instantly, their silhouettes use prominent **secondary forms**. In character design, secondary forms—such as wings, tails, oversized books, or mechanical accessories—act as immediate visual cues that reveal the character's purpose before any text is read :  
`+-------------------------------------------------------------+`  
`|                 SECONDARY FORM ACCELERATION                 |`  
`|                                                             |`  
`|   +          |`  
`|   (e.g., Rounded Owl)   (e.g., Stack of Books on Head)      |`  
`|           [span_132](start_span)[span_132](end_span)                                                  |`  
`|   --> Instantly signals "Archivist / Past Projects"         |`  
`|   --> Bypasses the need for text labels or tutorials        |`  
`+-----------[span_133](start_span)[span_133](end_span)--------------------------------------------------+`

By emphasizing these key features, the design guides the player's eyes straight to the character's interactive role, reducing the need for text labels or tutorials.

### **Interactive Portfolio Resident Matrix**

| NPC Name | Shape Language | Secondary Forms | Portfolio Role | Recruiter Utility (Fast Path) | Hiring Manager Utility (Deep Dive) |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **Barnaby** | Soft, drooping oval form. | Oversized round glasses; a tall stack of books on head. | Past Projects & Commercial Case Studies. | High-speed, horizontal slider displaying projects. | Links to comprehensive design process documents. |
| **Corvus** | Sharp, angular triangles. | Spiky, mechanical crow wings; large copper gear. | Technical Skills & Code Stack. | Clear list of core development languages. | Direct links to active GitHub repositories. |
| **Pip** | Small, perfect circle. | Oversized dynamic post cap; large letter pouch. | Contact Info & PDF Resume. | Large, one-click PDF resume download button. | Dynamic email forms and links to professional sites. |
| **Beatrice** | Solid, heavy square blocks. | Sculptor's apron; large charcoal pencil. | Design Philosophy & Level Studies. | High-level summary of the designer's profile. | Walk-through diagrams of 2D level blockouts. |
| **Cicka** | Fluid, morphing S-curves. | Flicking tail; curled sleeping paws. | Mascot & Interactive Play. | Tap-to-clear interaction for UI headers. | Demonstration of procedural WebGL line boil. |

## **Tiny Cast Resident Profiles**

### **1\. Barnaby the Archivist**

      `,---.`  
     `( @ @ )   <-- Exaggerated glasses`  
    `/   Y   \`  
   `/  - " -  \`  
  ``(  `-----'  )  <-- Soft, drooping oval shape``  
  ``[span_26](start_span)[span_26](end_span)[span_42](start_span)[span_42](end_span)`----------'``

\* **Visual Silhouette**: A soft, drooping oval shape resembling a sleepy owl. He features exaggerated round glasses and a stack of books piled directly on his head.

* **Portfolio Role**: Manages "Past Projects & Case Studies".  
* **Recruiter Action Vector (Fast)**: Clicking Barnaby opens a horizontal, visual slider displaying his book collection, with each cover representing a past project.  
* **Hiring Manager Action Vector (Deep)**: Inside each book, managers find links to project case studies detailing design decisions, timeline stages, and outcomes.  
* **Proximity State Behavior**:  
  * *Idle*: Drops his head and snoozes, with "Zzz" text particles appearing at a slow, rhythmic interval.  
  * *Aware*: Adjusts his glasses and looks up toward the player, with his book stack swaying slightly.  
* **Concision Barks**:  
  * *"These blueprints are turning to dust, much like my memory. Care to look before they blow away?"*  
  * *"A long road behind, and only fog ahead. Still, the milestones are worth remembering, aren't they?"*

### **2\. Corvus the Tech-Hoarder**

      `/\`  
     `/  \      <-- Sharp triangular peak`  
    `/____\`  
   `/|    |\ [span_275](start_span)[span_275](end_span)   <-- Spiky wing plates`  
  `/ | <> | \   <-- Piercing diamond eyes`  
 `*  |____|  *`  
    `/    \`

* **Visual Silhouette**: A spiky, angular triangle resembling a metal crow. His silhouette is defined by sharp wing plates and a large, jagged copper gear held under his arm.  
* **Portfolio Role**: Manages "Technical Skills & Engineering Stack".  
* **Recruiter Action Vector (Fast)**: Shows a clean list of core coding languages, letting recruiters quickly scan his technical stack.  
* **Hiring Manager Action Vector (Deep)**: Opens a folder of terminal scripts and technical docs, with links to clean code on GitHub.  
* **Proximity State Behavior**:  
  * *Idle*: Hugs his copper gear, polishing it with his wing in a fast, rhythmic animation loop.  
  * *Aware*: Turns his head sharply toward the player, with his feathers bristling into a spikier triangle shape.  
* **Concision Barks**:  
  * *"Keep back\! These scripts are perfectly optimized\! Hands off the source code... unless you have a job offer?"*  
  * *"Compiled it myself. Yes, every single line. Do not touch the red button. It is not ready."*

\---

### **3\. Pip the Postal Carrier**

     `__..__`  
  `.'      '.  <-- Oversized dynam[span_54](start_span)[span_54](end_span)ic post cap`  
  `/   o   o  \ <-- Small circular body`  
 `|     _      |`  
  `'._______.'`

* **Visual Silhouette**: A small, perfect circle topped with an oversized, floppy postal cap that slides over his eyes. He stands next to a tall, hand-drawn mailbox, creating a strong vertical profile.  
* **Portfolio Role**: Manages "Contact Info & PDF Resume Download".  
* **Recruiter Action Vector (Fast)**: Presents a large, clear PDF resume download button, allowing recruiters to save the file instantly.  
* **Hiring Manager Action Vector (Deep)**: Reveals direct email options, professional social networks, and links to external design profiles.  
* **Proximity State Behavior**:  
  * *Idle*: Leans against the mailbox, swinging his letter bag back and forth like a slow pendulum.  
  * *Aware*: Perks up, pushes his floppy cap back, and stands at attention with a prompt-free, responsive salute.  
* **Concision Barks**:  
  * *"A letter\! For me? Oh, you want the creator. I have the delivery coordinates right here\!"*  
  * *"Direct line to headquarters, ready\! Just stamp this document to download the complete resume."*

### **4\. Madame Beatrice the Sculptor**

  `+---------+`  
  `|  _[span_31](start_span)[span_31](end_span)[span_47](start_span)[span_47](end_span)   _  |  <-- Rigid square head`  
  `| [o][[span_298](start_span)[span_298](end_span)o] |`  
  `|    ~    |`  
  `|  =[span_55](start_span)[span_55](end_span)====  |  <-- Blocky badger muzzle`  
  `+---------+`

* **Visual Silhouette**: A solid, heavy square representing a blocky badger wrapped in a thick, clay-splattered apron. She carries a massive charcoal pencil over her shoulder like a club.  
* **Portfolio Role**: Manages "Design Philosophy, Level Studies, & About Me".  
* **Recruiter Action Vector (Fast)**: Displays a clean, high-level summary of the designer's background, values, and location.  
* **Hiring Manager Action Vector (Deep)**: Displays wireframes, 2D level blockouts, and pre-production documents demonstrating her design process.  
* **Proximity State Behavior**:  
  * *Idle*: Carves a large stone block, sending paper shavings and dust particles flying at regular intervals.  
  * *Aware*: Stops carving and turns her blocky head to frown at the player, crossing her arms defensively.  
* **Concision Barks**:  
  * *"Art is just work you haven't given up on yet. Want to see how the sausage gets made? Look in here."*  
  * *"A clean blockout is worth a thousand pretty pictures. Keep your lines straight and your mechanics tight."*

### **Key Takeaways for AI Training**

* **Portfolio Role Integration**: Program the AI agent to map each portfolio section directly to a themed character, blending storytelling with utility.  
* **Visual Anchor Enforcement**: Require characters to use clear secondary forms, making their interactive roles obvious without text labels.  
* **Fast-Path Priority**: Ensure every character menu has a prominent, single-tap option for recruiters, keeping interactions fast and efficient.  
* **Deep-Dive Layering**: Organize deep portfolio content in nested menus, allowing hiring managers to explore case studies without cluttering the screen.

## **Conclusion and Implementation Roadmap**

To build *The Ridge* as a high-performance, mobile-first browser experience, development should follow a three-phased technical roadmap:  
`+-------------------------------[span_268](start_span)[span_268](end_span)[span_272](start_span)[span_272](end_span)------------------------------+`  
`|                 TECHNICAL IMPLEMENTATION PATH               |`  
`|                                                             |`  
`|     --> Palette & Silhouette     |`  
`|             [span_135](start_span)[span_135](end_span)                        Dynamic line-scaling     |`  
`|                                                              |`  
`|    --> WebGL displacement       |`  
`|                                     Line boil loop (10 FPS)  |`  
`|                                                              |`  
`|    --> Proximity triggers (FSM) |`  
`|                                     Understated barks        |`  
`+-------------------------------------------------------------+`

### **Phase 1: Core Rendering Setup**

* **Palette Configuration**: Set the WebGL background to a warm, non-reflective cream-paper tone (\#F4F1EA) and use deeply saturated charcoal outlines (\#1A1A1A) to prevent mobile eye strain.  
* **Silhouette Tuning**: Draw character sprites with thick outer outlines for strong silhouettes, using thin interior lines strictly for key details.

### **Phase 2: Shader Pipeline Integration**

* **Line Boil Shader**: Apply a custom PixiJS DisplacementFilter to all character layers, using a tileable, power-of-two noise texture.  
* **Low-Fidelity Loop**: Configure a JavaScript interval running at 100ms (10 FPS) to shift the noise coordinates, creating an organic, hand-drawn wigglevision effect.

### **Phase 3: Interaction and Systems Binding**

* **Proximity State Controller**: Map simple proximity zones (R\_{\\text{prox}}) to static NPCs, triggering look-at transitions and alert poses when the player steps inside.  
* **Dialogue and Physics Hooks**: Wire physical collision reactions to apply a spring-based wobble, and trigger concise barks that deliver personality without cluttering the screen.

#### **Works cited**

1\. (PDF) Discerning Pictures: How We Look at and Understand Images in Comics \- ResearchGate, https://www.researchgate.net/publication/215742076\_Discerning\_Pictures\_How\_We\_Look\_at\_and\_Understand\_Images\_in\_Comics 2\. Abstract vs. Realistic \- Understanding Comics \- WordPress.com, https://understandingcomics177.wordpress.com/about/1-2/2-2/3-2/ 3\. 'Understanding Comics: The Invisible Art' by Scott McCloud \- Member Tools, https://members.cruzio.com/\~zdino/bookReviews/McCloud.understandingComics.htm 4\. Applying Scott McCloud's Understanding Comics to Video Games \- PopMatters, https://www.popmatters.com/110740-applying-understanding-comics-to-video-games-2496078642.html 5\. Compelling Storyboards: Learning from Comics \- Atomic Spin, https://spin.atomicobject.com/compelling-storyboards-comics/ 6\. Character Design: Simple Rules For Any Style \- Part 1 – Start Learning Today \- The Art Club, https://www.the-art-club.com/character-design-simple-rules-for-any-style-part-1 7\. Character Creation/Design \- Brave Zebra, https://www.bravezebra.com/game-art/character-design/ 8\. Shape Language in Video Games: Character Design in 2025 \- Ejaw.net, https://ejaw.net/shape-language-in-character-design/ 9\. Shaping Perception: How Visual Forms Influence UX Design \- Tubik Blog, https://blog.tubikstudio.com/psychology-of-shapes/ 10\. PixiJS Development Services for High-Performance 2D Web Experiences \- CodeRower, https://coderower.com/technologies/pixijs-development-services/ 11\. Different Video Game Art Styles: How to Pick the Perfect Visuals \- VSQUAD Studio, https://vsquad.art/blog/different-video-game-art-styles-how-to-pick-the-perfect-visuals 12\. How Minit's team found creativity through limitations | GamesIndustry.biz, https://www.gamesindustry.biz/theres-always-tomorrow-in-a-world-of-time-limits 13\. A mini-story about the Minit mosquito \- CONTROL500, https://ctrl500.com/art/a-mini-story-about-the-minit-mosquito/ 14\. Minit is a Zelda-style adventure where you die every minute | PC Gamer, https://www.pcgamer.com/minit-is-a-zelda-style-adventure-where-you-die-every-minute/ 15\. Looking at a switch from a minimal color palette to black and white, is it a good move?, https://www.reddit.com/r/gamemaker/comments/f6gn0f/looking\_at\_a\_switch\_from\_a\_minimal\_color\_palette/ 16\. Silksong's art direction is limited by Team Cherry's art style \- Reddit, https://www.reddit.com/r/Silksong/comments/1pot83q/silksongs\_art\_direction\_is\_limited\_by\_team/ 17\. What's Your Game Art Style? Aesthetics Every Artist Should Know \- Champlain College, https://www.champlain.edu/blog/stories/common-game-art-styles/ 18\. 5 Side-Scrollers Reviewed \- KCimgd Ryan Nothard, https://kcimgdryannothard.wordpress.com/2017/12/05/5-side-scrollers-reviewed/ 19\. Realistic vs Stylized Art in Video Game Development, https://gamestudio.n-ix.com/realistic-vs-stylized-art-in-video-game-development/ 20\. Minit Review: Done in 60 Seconds \- Champion's Choice, https://championschoiceblog.wordpress.com/2024/04/02/minit-review-done-in-60-seconds/ 21\. How Untitled Goose Game made a game out of everyday items, https://www.rockpapershotgun.com/how-untitled-goose-game-made-a-game-out-of-everyday-items 22\. Videogame instructions in the gallery: Prototyping and testing for Honk\! Untitled Goose Exhibition \[Part 2\] | by Tim Woodward | ACMI LABS, https://labs.acmi.net.au/videogame-instructions-in-the-gallery-prototyping-and-testing-for-honk-b5929fb51bdc 23\. FiveM Resources That Enhance Realism and Immersion \- London Studios, https://londonstudios.net/fivem-resources-that-enhance-realism-and-immersion/ 24\. Why Realistic, Adaptive NPCs with AI are Key to Game Development?, https://www.xbytesolutions.com/why-realistic-ai-npcs-matter-in-game-development/ 25\. UI/UX for Game Design: Key Elements of Gamified Interfaces \- Trinergy Digital, https://www.trinergydigital.com/news/ui-ux-for-game-design-key-elements-for-gamified-interfaces 26\. AI challenges in Entertainment and Player Expression PowerPoint Presentation \- SlideServe, https://www.slideserve.com/issac/ai-challenges-in-entertainment-and-player-expression 27\. Simulating Hand-Drawn Motion with SVG Filters \- Camillo Visini, https://camillovisini.com/coding/simulating-hand-drawn-motion-with-svg-filters 28\. Animating Non-Human Characters: Challenges and Techniques \- RMCAD, https://www.rmcad.edu/blog/animating-non-human-characters-challenges-and-techniques/ 29\. How to Make a Level Design Portfolio That Will Get You Hired \- Game Design Skills, https://gamedesignskills.com/game-design/level-design-portfolio/ 30\. Game Narrative Designer \- Find Skill.ai, https://findskill.ai/skills/gaming-entertainment/game-narrative-designer/ 31\. \[FOR HIRE\] Narrative Systems / Dialogue Design (Reactive Dialogue, Barks, VO Structure) | Now Taking Pilot Projects : r/gameDevClassifieds \- Reddit, https://www.reddit.com/r/gameDevClassifieds/comments/1sl25qf/for\_hire\_narrative\_systems\_dialogue\_design/ 32\. 8 Key Principles of Writing Effective Game Dialogue \- Game Developer, https://www.gamedeveloper.com/game-platforms/8-key-principles-of-writing-effective-game-dialogue 33\. Adding Life To Worlds With Dialogue Barks \- Game Developer, https://www.gamedeveloper.com/design/adding-life-to-worlds-with-dialogue-barks 34\. Svetlina's Quest: A Gamified Portfolio \- DEV Community, https://dev.to/svet\_62385e9/svetlinas-quest-a-gamified-portfolio-14bh 35\. How to create a resume and portfolio and get a job as a game designer \- Medium, https://medium.com/my-games-company/how-to-create-a-resume-and-portfolio-and-get-a-job-as-a-game-designer-bc3094ce7565 36\. state driven agent design 1 \- AI Junkie, http://www.ai-junkie.com/architecture/state\_driven/tut\_state1.html 37\. Stray (video game) \- Wikipedia, https://en.wikipedia.org/wiki/Stray\_(video\_game) 38\. Neko Atsume 2 \- App Store \- Apple, https://apps.apple.com/de/app/neko-atsume-2/id6499131935?l=en-GB 39\. Stray: What could have been : r/patientgamers \- Reddit, https://www.reddit.com/r/patientgamers/comments/1ps5nb3/stray\_what\_could\_have\_been/ 40\. Finite Automata Simulation for Leveraging AI-Assisted Systems \- Medium, https://medium.com/data-science/finite-automata-simulation-for-leveraging-ai-assisted-systems-9d50b36bcbd3 41\. Quick start guide to Wise Feline Utility AI \- NoOpArmy Games, https://www.nooparmygames.com/WF-UtilityAI-Unreal/articles/quickstart.html 42\. What is the proper way to make squiggly lineart as seen here? When I try the character looks like it's having a seizure :( : r/animation \- Reddit, https://www.reddit.com/r/animation/comments/1dlfbm6/what\_is\_the\_proper\_way\_to\_make\_squiggly\_lineart/ 43\. line boil / hand-drawn jitter FREE plugin for Resolve : r/davinciresolve \- Reddit, https://www.reddit.com/r/davinciresolve/comments/1r9cque/line\_boil\_handdrawn\_jitter\_free\_plugin\_for\_resolve/ 44\. DisplacementFilter | pixi.js, https://pixijs.download/dev/docs/filters.DisplacementFilter.html 45\. How To Do A Line Boil \- YouTube, https://www.youtube.com/watch?v=9XDD6YKIy2k 46\. PIXI.filters.DisplacementFilter, https://api.pixijs.io/@pixi/filter-displacement/PIXI/filters/DisplacementFilter.html 47\. Filters / Blend Modes \- PixiJS, https://pixijs.com/8.x/guides/components/filters 48\. GitHub \- ABCoder1/ABCoder1.github.io: A pacman themed portfolio site made with Phaser.js to reimagine my professional journey., https://github.com/ABCoder1/ABCoder1.github.io 49\. 10 Game Design Resume Examples for 2026, https://resumeworded.com/game-design-resume-examples
