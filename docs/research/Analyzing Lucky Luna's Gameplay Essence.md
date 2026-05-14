# **Structural Mechanics and Aesthetic Philosophy in Lucky Luna: A Deep Analysis of Vertical Platforming**

The evolution of the platforming genre has traditionally been defined by the mechanics of the jump, an upward propulsion that allows players to overcome gravity and navigate complex spatial environments. However, the release of Lucky Luna in September 2022 by developer Snowman and publisher Netflix Games represents a radical departure from this archetype.1 By fundamentally removing the ability to jump, Lucky Luna transforms the platforming experience into a deliberate, high-stakes navigation of vertical descents, where gravity serves as the primary engine of movement and the swipe gesture replaces the tactile button press.3 This analysis explores the architectural underpinnings of the game's level design, the intricate layering of its gameplay loop, and the psychological "essence of fun" derived from its minimalist control scheme and its roots in Japanese folklore.1

## **Developmental Genesis and Creative Philosophy**

The trajectory of Lucky Luna’s development is a testament to the meticulous refinement of a singular mechanical concept. Originally conceived by independent developer Nachobeard in 2014 under the title Cerulean Moon, the project spent nearly a decade in various stages of iteration.2 The developer’s initial intention was to release the game in 2016, but the pursuit of a frictionless, intuitive control scheme led to a collaboration with Snowman in 2020\.2 This partnership was pivotal, as Snowman brought the aesthetic sensibilities and production expertise honed during the development of Alto's Adventure and Alto's Odyssey.3

The core philosophy guiding this development was the creation of a game that could explain its own systems through action rather than explicit instruction.1 This "invisible tutorial" approach required a fundamental rethinking of mobile input. The developers explicitly rejected virtual joysticks, noting their lack of tactile feedback and reliability on a touchscreen.5 Instead, they opted for a system where the player moves the world around the character, Luna, who remains centered on the screen.1 This choice emphasizes the player's direct interaction with the environment, creating a sense of "sliding" through subterranean ruins that feels native to the mobile platform.5

| Development Phase | Key Stakeholders | Milestone | Strategic Outcome |
| :---- | :---- | :---- | :---- |
| Prototype (2014-2020) | Nachobeard | Cerulean Moon | Core "no-jump" mechanical proof of concept.2 |
| Collaboration (2020-2022) | Snowman, Nachobeard | Art & Level Refinement | Modern pixel art style and vertical level optimization.2 |
| Publication (2022) | Netflix Games | Official Launch | Subscription-based model without ads or IAP.3 |
| Post-Launch (2022-2025) | Netflix, Snowman | Updates & Porting | Sustained 4.6+ user rating and performance optimization.3 |

The visual identity of the game, led by artist Anaïs Maamar, was designed to be evocative of ancient civilizations and Japanese folklore.1 Drawing inspiration from *The Tale of the Bamboo Cutter*, the game features a protagonist in a fox mask exploring ruins to uncover her past.1 This narrative context provides the justification for the game's verticality, as Luna descends from the surface beach into the depths of a hidden temple.1

## **The Physics of Jumplessness: Mechanical Architecture**

The absence of a jump button necessitates a reconfiguration of the player's relationship with the environment. In traditional platformers, verticality is a hurdle to be overcome; in Lucky Luna, verticality is the medium of travel.1 The player controls Luna by swiping left or right, with the intensity of the swipe determining the character's horizontal velocity.3

### **Horizontal Displacement and Friction**

The game's horizontal movement operates on a physics model that balances precision and momentum. A gentle drag across the screen allows for slow, high-precision movement, which is critical for navigating narrow ledges or avoiding "skewers" and spikes.2 A fast swipe, conversely, initiates a dash that carries Luna across larger gaps. The satisfaction of the movement comes from mastering the inertia of these slides. The horizontal position ![][image1] of the character can be modeled by a force-driven motion with a high coefficient of friction ![][image2] to ensure responsiveness:

![][image3]  
This friction ensures that Luna does not "ice skate" uncontrollably, allowing the level designers to place traps with millimeter precision.11 Critics have noted that this movement feels "loose" yet "surprisingly precise," a contradiction that defines the learning curve of the game.3

### **Gravity and Vertical Navigation**

Since Luna cannot move upward through her own volition, the game utilizes environmental features to provide vertical lift. This shifts the burden of verticality from the character's kit to the level design itself.5

| Lifting Mechanism | Level Introduction | Functionality | Risk Factor |
| :---- | :---- | :---- | :---- |
| Water Fountains | The Spring | Launches Luna into the air | Requires timing to avoid toxic liquid.2 |
| Dragonflies | The Hive | Carries Luna to higher platforms | Most other insects in this level are lethal.2 |
| Moving Platforms | The Furnace | Cyclic horizontal/vertical travel | Risks crushing Luna against static geometry.2 |
| Falling Gaps | General | Primary mode of progression | Uncontrolled falls can lead to spike traps.1 |

Verticality is further emphasized by the game's portrait orientation.5 This aspect ratio reveals a greater portion of the environment below Luna, allowing the player to plan their descent. The vertical velocity ![][image4] is constant under gravity ![][image5], and since Luna is immune to fall damage, the "fun" is found in the management of horizontal alignment during freefall.2

## **The Triple Loop: Gameplay Progression and Feedback**

Lucky Luna employs a sophisticated "three-loop" structure that governs player engagement, ranging from the immediate tactile response to long-term narrative and completionist goals.1

### **The Micro-Loop: Tactile Resilience**

The immediate gameplay loop consists of the "swipe, fall, survive" cycle. This loop is characterized by high lethality—a single hit from a hazard like lava, spikes, or boiling water results in death—but is offset by infinite respawns and frequent checkpoints.1 This encourages a trial-and-error approach that allows players to experiment with momentum without the frustration of losing significant progress. The "flow state" is achieved when a player strings together multiple dashes and falls in a single, continuous movement, navigating a "gauntlet" of hazards with rhythmic precision.11

### **The Meso-Loop: Grading and Mastery**

The meso-loop centers on the completion of handmade levels, which typically take 5 to 10 minutes to finish.3 Upon reaching the end-of-level portal, players are graded on three specific metrics 2:

1. **Pearl Count:** Total value of collected treasures.  
2. **Time:** Speed of level completion.  
3. **Death Count:** The number of respawns utilized.

This grading system (Bronze, Silver, and Gold medals) introduces a high degree of replayability.2 A "safe" run aimed at zero deaths requires a different mechanical approach than a "speed" run aimed at a Gold medal in time, forcing players to develop an intimate knowledge of level layouts and shortcut opportunities.2

### **The Macro-Loop: Completion and Narrative**

The long-term loop involves the collection of "Shrine Slates" and the pursuit of the game's true ending.1 Each level contains hidden areas—often behind secret passageways—that house between one and four slates.1 When assembled, these slates form stone tablets that reveal Luna's background story through environmental storytelling.1

| Completionist Element | Total Count | Reward/Impact |
| :---- | :---- | :---- |
| Story Mode Levels | 6 | Progression to the Temple.1 |
| Shrine Slates | 1-4 per level | Unlocks the seventh portal/alternate ending.1 |
| Achievements | 100 | Trophies for the treasure room.13 |
| Endless Mode Levels | 5 | Infinite replayability and global leaderboards.2 |

The ultimate goal of the macro-loop is reaching the seventh portal, which leads to a final cutscene on the Moon.1 This provides a definitive conclusion to the narrative, though an alternate ending exists for those who complete both Story and Endless mode slates, where Luna places her mask on an altar and the temple collapses.1

## **Architectural Deep Dive: Level-by-Level Analysis**

The level design of Lucky Luna follows a progression of thematic "biomes," each introducing a new mechanical vocabulary.2 The vertical orientation allows these levels to be "maze-like," with branching paths that lead either to safety, shortcuts, or hidden secrets.11

### **The Gateway: The Silent Tutorial**

The Gateway is a short, obstacle-free introduction designed to familiarize the player with the swipe-to-move-world mechanic.2 It lacks an endless mode and death medals, serving purely as a conceptual bridge from the beach to the temple.1

### **The Garden: Precision and Hazards**

The Garden introduces the first lethal obstacles: spikes and skewers.2 Here, the "no-jump" constraint is first felt as a tangible pressure. Players must learn to "thread the needle" between spike-lined corridors using the slow-drag movement for maximum control.2 The level design utilizes narrow shafts that require rhythmic horizontal shifting to avoid static traps.

### **The Spring: Liquid Dynamics**

The Spring introduces water-based hazards and movement. Liquid poison serves as a floor hazard, while water fountains provide the game's primary vertical displacement.2 The "fun" in this level derives from the timing of these fountains. The player must calculate the apex of their launch to reach horizontal platforms that are otherwise inaccessible.1

### **The Hive: Biological Synergies**

The Hive represents one of the most innovative uses of the environment. While most insects are hostile, the dragonfly serves as a vehicle, allowing Luna to fly upward.2 This introduces a "soft" version of flight that contrasts with the earlier falling-heavy levels. Branching paths in The Hive often hide Shrine Slates behind dangerous clusters of hostile bugs, forcing a risk-versus-reward decision.1

### **The Furnace: Industrial Timing**

The Furnace shifts the focus to mechanical traps: fire-breathing statues and moving platforms.2 This level demands a mastery of the fast-swipe dash. The statues operate on cycles, requiring the player to wait for a visual cue before dashing through a zone. Moving platforms introduce the risk of being "squashed" against walls, a hazard that requires the player to account for the relative motion of the platform versus Luna's horizontal slide.2

### **The Sky Terrace: The Mechanical Synthesis**

The final handmade level, the Sky Terrace, combines hazards from all previous areas: spikes, water, insects, and fire.2 It serves as a comprehensive test of the player's mechanical dexterity. The level design here is more open, with larger voids that require precise freefall alignment and the strategic use of updrafts and fountains to reach the exit portal.1

## **The Endless Dungeon: Procedural Complexity**

Upon collecting a sufficient amount of pearls in Story Mode, players unlock the Endless Mode for the corresponding level.2 This mode represents the ultimate challenge of the game's systems, as it removes the safety net of checkpoints.1

Endless Mode utilizes procedurally generated "numbered segments," rearranging rooms to ensure that no two runs are identical.2 Performance is tracked by "floors"—the distance or number of rooms passed.2 Every few floors, the player is forced into a "challenge room" with random aspects 2:

* **Jester Challenges:** Players must either collect or avoid jesters while navigating standard hazards.2  
* **Time Limits:** Pressure is applied to move through segments faster than the story mode pace.  
* **Environmental Bubbles:** Extra obstacles like bubbles or spikes are added to existing layouts to increase cognitive load.2

| Endless Mode Metric | Purpose | Completion Reward |
| :---- | :---- | :---- |
| Floors Cleared | Measures total distance/stamina. | Global Leaderboard ranking.2 |
| Challenge Success | Awards Shrine Slates. | Progression toward the alternate ending.1 |
| Pearl/Gem Accumulation | Fills the Treasure Room. | Aesthetic progression and achievements.2 |

## **The Essence of Fun: Psychological and Aesthetic Synergy**

The "essence of fun" in Lucky Luna is a multi-layered phenomenon that combines mechanical mastery, atmospheric immersion, and the subversion of genre expectations.

### **The Joy of Falling: Zen and Momentum**

Contrary to the "gravity is an enemy" trope in platformers, Lucky Luna encourages a Zen-like acceptance of descent. The lack of a jump button simplifies the decision-making process, allowing the player to focus entirely on horizontal precision.8 This creates a "soothing" experience where the player can slip into a flow state, prioritized by the relaxing pixel art and soundtrack.3 The satisfaction of navigating a long, complex vertical shaft perfectly is described by critics as more fulfilling than traditional jumping mechanics.8

### **Visual and Auditory Atmosphere**

The art style, influenced by Studio Ghibli and classic titles like *ICO* and *Shadow of the Colossus*, contributes to the sense of a "space lost in time".5 The color harmonies and "flat surfaces" prevent visual fatigue, allowing the player to remain engaged during difficult challenge gauntlets.5 The sound effects—the chime of collected pearls and the rush of wind during a dash—provide the tactile feedback that the touchscreen lacks, grounding the player in the digital ruins.3

### **The Replayability of Mastery**

The fun is also derived from the game's transparency. The three-medal system and online leaderboards provide immediate, quantifiable goals.3 Because the game is subscription-based via Netflix, there are no "pay-to-win" mechanics, ensuring that every Gold medal and every high score is a result of pure player skill.9 This integrity fosters a dedicated community of players who exchange tips on tackling "frustrating" challenge rooms and finding hidden slates.1

## **Comparative Context: Subverting the Mobile Market**

Lucky Luna occupies a unique niche in the mobile gaming landscape. Its refusal to include virtual joysticks or jumping mechanics places it in opposition to "hardcore" ports like *Blasphemous*, while its focus on precision descent distinguishes it from "one-button" runners like *Super Mario Run*.3

| Feature | Lucky Luna | Traditional Mobile Platformer |
| :---- | :---- | :---- |
| **Input Method** | Swipe/Slide (No Buttons) | Virtual Joysticks/Buttons.3 |
| **Verticality** | Primary (Downward) | Secondary (Upward/Horizontal).1 |
| **Monetization** | Netflix Subscription (Premium) | F2P (Ads/Microtransactions).3 |
| **Failure State** | Instant Death/Respawn | Health Bar/Limited Lives.1 |
| **Orientation** | Portrait | Landscape.5 |

The game's success (scoring consistently between 4.6 and 4.8 out of 5\) suggests that there is a significant appetite for high-polish, minimalist experiences that prioritize "meaningful moments" over infinite retention.3

## **Strategic Insights and Conclusion**

Lucky Luna represents a successful experiment in mechanical reductionism. By identifying the "jump" as a potential barrier to mobile precision, Snowman and Nachobeard crafted an experience that is both accessible and deeply challenging.1

The gameplay loop—centered on the assembly of Shrine Slates and the mastery of the Endless Dungeon—provides a compelling reason for players to return to its underground world.1 The level design, which utilizes environmental features to replace character abilities, ensures that each biome feels distinct and strategically fresh.2 Ultimately, the essence of fun in Lucky Luna is found in the "Zen of the swipe"—the ability to find control and grace in the inevitable process of falling.

For the professional game designer, Lucky Luna serves as a case study in how "limiting a range of movement" can actually push creativity, resulting in a world that is "immediate and understandable" yet "challenging and exciting" for all skill levels.5 Its placement within the Netflix Games ecosystem further underscores a shift toward premium-quality mobile titles that value artistic integrity as much as mechanical innovation.9

#### **Works cited**

1. Lucky Luna \- Wikipedia, accessed May 14, 2026, [https://en.wikipedia.org/wiki/Lucky\_Luna](https://en.wikipedia.org/wiki/Lucky_Luna)  
2. Lucky Luna \- Snowman Games Wiki \- Miraheze, accessed May 14, 2026, [https://snowman.miraheze.org/wiki/Lucky\_Luna](https://snowman.miraheze.org/wiki/Lucky_Luna)  
3. Lucky Luna Review & User Ratings \- MiniReview, accessed May 14, 2026, [https://minireview.io/platform/lucky-luna](https://minireview.io/platform/lucky-luna)  
4. Presskit \- Lucky Luna, accessed May 14, 2026, [https://luckylunagame.com/press/](https://luckylunagame.com/press/)  
5. Lucky Luna is Now Available on Netflix | by Snowman | Medium, accessed May 14, 2026, [https://builtbysnowman.medium.com/lucky-luna-is-now-available-on-netflix-29a73d97f723](https://builtbysnowman.medium.com/lucky-luna-is-now-available-on-netflix-29a73d97f723)  
6. 露娜小福星- 維基百科，自由的百科全書, accessed May 14, 2026, [https://zh.wikipedia.org/zh-tw/%E5%B9%B8%E8%BF%90%E7%9A%84%E9%9C%B2%E5%A8%9C](https://zh.wikipedia.org/zh-tw/%E5%B9%B8%E8%BF%90%E7%9A%84%E9%9C%B2%E5%A8%9C)  
7. About \- Snowman, accessed May 14, 2026, [https://www.builtbysnowman.com/about.html](https://www.builtbysnowman.com/about.html)  
8. Celebrating 1 Year of Lucky Luna \- Snowman \- Medium, accessed May 14, 2026, [https://builtbysnowman.medium.com/celebrating-1-year-of-lucky-luna-42ba7ac06c1b](https://builtbysnowman.medium.com/celebrating-1-year-of-lucky-luna-42ba7ac06c1b)  
9. Laya's Horizon \- Wikipedia, accessed May 14, 2026, [https://en.wikipedia.org/wiki/Laya%27s\_Horizon](https://en.wikipedia.org/wiki/Laya%27s_Horizon)  
10. Lucky Luna \- App Store, accessed May 14, 2026, [https://apps.apple.com/ca/app/lucky-luna/id1609150630](https://apps.apple.com/ca/app/lucky-luna/id1609150630)  
11. Lucky Luna review \- "A surprisingly precise swiping platformer ..., accessed May 14, 2026, [https://www.pocketgamer.com/lucky-luna/review/](https://www.pocketgamer.com/lucky-luna/review/)  
12. Super Cozy Cooking Games: My Top App Store Picks You'll Love\! \- Lemon8, accessed May 14, 2026, [https://www.lemon8-app.com/maddy10203/7377373220658217477?region=us](https://www.lemon8-app.com/maddy10203/7377373220658217477?region=us)  
13. Lucky Luna \- App Store, accessed May 14, 2026, [https://apps.apple.com/es/app/lucky-luna/id1609150630?l=en-GB](https://apps.apple.com/es/app/lucky-luna/id1609150630?l=en-GB)  
14. Lucky Luna \- App Store \- Apple, accessed May 14, 2026, [https://apps.apple.com/us/app/lucky-luna/id1609150630](https://apps.apple.com/us/app/lucky-luna/id1609150630)  
15. Lucky Luna for Android \- Download the APK from Uptodown, accessed May 14, 2026, [https://lucky-luna.en.uptodown.com/android](https://lucky-luna.en.uptodown.com/android)  
16. Lucky Luna \- App Store, accessed May 14, 2026, [https://apps.apple.com/tr/app/lucky-luna/id1609150630](https://apps.apple.com/tr/app/lucky-luna/id1609150630)  
17. November | 2016 | RVGFanatic | Page 2, accessed May 14, 2026, [http://rvgfanatic.com/wordpress/index.php/2016/11/page/2/](http://rvgfanatic.com/wordpress/index.php/2016/11/page/2/)  
18. Relive the Fun: Maggie Market Games Are Back on Flashmuseum.org\! \- Lemon8, accessed May 14, 2026, [https://www.lemon8-app.com/@kimotherapyy/7501600502526886420?region=sg](https://www.lemon8-app.com/@kimotherapyy/7501600502526886420?region=sg)  
19. All the New Mobile Games Coming to Netflix in September, accessed May 14, 2026, [https://about.netflix.com/news/all-the-new-mobile-games-coming-to-netflix-in-september](https://about.netflix.com/news/all-the-new-mobile-games-coming-to-netflix-in-september)

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACEAAAAYCAYAAAB0kZQKAAABq0lEQVR4Xu2VzysGURSGj6IIZSdZyQbl90bYsrBQsvEHUBQbSpKUsrCQsrSSLLBQFrJQVn5tkJStf8BGykbEOd0zzZl37u37mm+W31Nvnfuce+9MM7cZojL5MYkiQBuKvDjiDKMM8MDpRFkqY5xLlAX449SiLAXZMMQL5xclM8r5QpmVVc4zSoPc4BlKRXrNKLMgGw2gVCrI9XuwocjZuEFp2eXMmPEWZ82MI3yvop3cOdkh1x/XMTJF/vXUSO49Cgucb4onPnK2tRZkY98mc5wlzg+5/qLGh299QtbpuJvcI5da7j5iQ10I6Z2iBLzr+0y9TMlJ1aYWDiiwCcXnoQsbgMzBfRN8Uvgiwj6F+/MU7llkTj1Ki0w4RGlYofCF3incs6TmNKhspfg8dJj+q6mFCfJsoog/N+MPU1tS6/dU1nCetG7RnhzOY60tqU0U8dNav5H/vcsPL7U+OkySEXJPJBqvm3kW6fWjpPgbIGmCXsQd5x5lFi44tyiLRG6wCmVWUo+0CIbIfQhzY5NzgrIA8metRFkq11T4wxRxxelFmRezKAIMoiiD/ANqHWAsPY0ZCwAAAABJRU5ErkJggg==>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAXCAYAAAA/ZK6/AAAAnElEQVR4XmNgGAWDEdQDsRiaGCcUYwX/gdgdi9haNDEw8GaASKIDkJgxuiAInGPA1BCGRQwOQBK9WMR+oImBgTADRFIKTRwk1g5lT0eWmMQAkVRBEiuBivEDsQ4QhyLJMfyDSt6DKpgNxH1QMR8g/oVQCgEgiR4g1gXiaCBmRJILRGKDAcz9AugSuADMaqLBHwYcQYcLMKMLDCwAALFXIR+o4jgvAAAAAElFTkSuQmCC>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAmwAAAAzCAYAAAAq0lQuAAAEvklEQVR4Xu3dW6hnUxwH8GXcRRii3FKUXB9EhigPSrk8SN5chngYRYjkHlLCi/ImueTWNB48COVhjBJFxuRWclcoNIz7ff1mr91Z/z3/48yc8z/n/P+zP5/6ttdae8/p/1/7YX7t/95rpwQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEDP7JTzb85d3R0AAIyHKNbC0zl71TsAAFg8G1JTqF1TjT2XFGwL7dvUnIf13R0AAKG9stZa2+mzML7JWdYdBAAIdcH2edVmYXULZwCg507OuSNnZc7NZeypnOU5K3KWlLHWk1U7jmM0ds95KOeItGnB1s75SWnqHAEAPVEXBt0ioWv7nD1KO45dlZr7reoCjtmJq5lLSzvmtj0X3TmvtwBAD9yZ81XVn6kQuLZqz3Qsmy8e6ugWzreV9rA5jyVXAICeiALgsE5/c5yQ80V3kFn7KQ3+tDzsPJhzAOipujB4PDX3sT1RjXW9m3NIzu+puc+K0ajPw6Gpmd9wcRo+5zEGAPTEBTlX59yfc0NqfoZ7bOCIQe0VuXNSs6DuQTkvDxzBbMTDButyLs05L+fL1BTPoTvnV+bsWPYBAIyFG9PUTfjDAgDAGLguDS/Oho0BALAIojC7u+rvWbZrqjEAgIlwX9nul/NINX57zuVVf9JEwbZb1Y97vcL+1dg4+77Td2UQAHrq69Tc7/VXNRaFwT2lHe+m3Lfat1A+zPlkhswkvscLOa+W9qSpP/O5nT4A0BPH5GyXmkJgl2q8LgyivU3Vb8dGmfkQ64/Vf7t7tWpLrO8ObKHj/ie7Vsd11Z8/2j9X/XZsNgEAJlD9n/glOaur/qT+Bx+Lyr5Z9dufQydFLMexturHeTit6gMAPVMXZdFuX2F0YM6vpV0XP5Mgvkd9/1rXbzk/lvZ7OY+W9r1l287JW6m5Chlezzk7NT/XHlnGbs15ODVroo3SP6lZlDjsnaY+j8VvAaCHzsp5qerXxduy1Dx4EC9qH4VYeX++HZvzTmq+x/s5zw/u3iieFr0p58xq7MWybb//3zmnp+YtAVHAxgLBD5Z9IY67JWdJzgFp8CflUYi//0vZRuHZtgEAZi2uUEVBMV1RETfNh9h/dL1jEURxdXya+qwXlm0Ur2+X9lVlW3+fth1vDYgidrrvOgpz+dtRbM7l3wMAW7EVqXkqs1UXDa+UbbzbcrFfS7WqbOOqWYjibWlqHkz4I+eUMh7iKdlnS7v9Ph+U7UWpufp2VM4+ZWwU4srfa93BLTSs0AQA2FgY7NDpdw0bmxRndAfG1MrU/OTbmuQ5BwBGINY4i5yfpgqD2NZpxZObkyruIYufGsdVLH78Rhqc8+nOAwDQI1EEtE+Uriv9el+9ftuGnOWpuf+rvvrD3H2cc1nVr8/DMzlXVH0AoGe6BVq7BEjbr9VXehb7oYOtzbC5rtvdhY8BgJ64Pm1aGJza6TP/YlmReq7jStvqqu88AECPPZCG39j+aWqemvyhM878iEV1/6z6Md87l23bD2vKFgDomSgGTkzNU4nRbhfGjSdFP0qDV3qYPzH3Ubh9l/NZzsE5h1f74m0M25Y+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4+8/16Ala+yOzMwAAAAASUVORK5CYII=>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAAZCAYAAADXPsWXAAAA6UlEQVR4XmNgGAWjgM5gDhAfA+L/QMwIFROD8h1hivABHSDOg7JBmhKgbBEofzaUjxf8gNJmDBBNLEhyx4E4GImPE9RC6QkMEEOQwXQglkYTwwtABjxDE3uJxicIQIb4o4ldQOPjBXIMmF4BBbYUEv8JEH9F4m8EYiYkPhiADNGHsjmB+A6S3BYojWwRuqVg4M0AkQDhHWhyIOAExI+gbDYGHIYQAg+B2BnKrgPilUhyRAOQzaxQ9jcg1kSSIxrIAPFPIL7MQKZXQFlgCZQdAMTnkeSIBq1AnALE8kD8BU2OJKDCgAgT6gMAAWsrxno6PIAAAAAASUVORK5CYII=>

[image5]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAYCAYAAADDLGwtAAAAmElEQVR4XmNgGAW0AuZAvByI7dElkMFHIJ4MZc8B4r9A/B8hDQE/gPgpmhhI0RJkgTyooAiSGDNUTAtJDCyAbkUpFjGwwDc0sc9QcRQAEtiPRWwNmhhDM1QCBv5B+dpIYnBQDMTvgbidAYf7sIEvDFgUgtz2E00MpKgATQwseAHK5oXyjyGkEYAbiKcB8S4gbgViNlTpAQcA85on0bDMg3IAAAAASUVORK5CYII=>