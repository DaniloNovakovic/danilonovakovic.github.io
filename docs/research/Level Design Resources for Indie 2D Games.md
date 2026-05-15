# **Technical Standards and Spatial Narratives: A Comprehensive Framework for 2D Level Design**

The discipline of level design within the contemporary interactive landscape resides at the critical intersection of spatial architecture, cognitive psychology, and systemic engineering. For the professional designer, particularly those operating within the indie development sphere and focused on 2D environments, the task is not merely the construction of digital geography but the curation of a guided player experience that harmonizes mechanics with narrative intent.1 This report serves as an exhaustive technical compendium and theoretical framework, intended for reference by specialized design agents and developers. It synthesizes decades of industry wisdom, from the foundational rules of early pioneers to the sophisticated pedagogical techniques of modern masterpieces like *Celeste* and *Hollow Knight*.1

## **The Ontology of the Level Designer**

In the formal industrial context, a clear distinction must be maintained between the roles of the level designer and the environment artist. While the latter focuses on the aesthetic fidelity, lighting, and set dressing of a space, the level designer is primarily concerned with shaping player behavior.2 This involves the drafting of layouts, the creation of functional blockouts, and the balancing of mechanical encounters to ensure a coherent flow.2 The level designer operates as an architect of movement, utilizing geometry as a tool to elicit specific psychological responses and to guide the player through the game's systemic "verbs".6

### **The Vocabulary of Interaction**

The conceptual foundation of level design is rooted in a fundamental language of verbs and objects. As established by theorists such as Anna Anthropy and Naomi Clark, verbs represent the primary actions available to the player character—running, jumping, shooting, or dashing—while objects are the environmental elements that interact with or resist those actions.6 The successful level designer does not merely place these elements in a vacuum but organizes them into "scenes" or "beats" that collectively form the narrative arc of the gameplay.7  
This vocabulary extends to the concept of "context," where the visual and auditory aesthetics of a level provide the necessary framework for interpreting the mechanics.7 Without context, a jump is merely a displacement in coordinate space; with context, it becomes a desperate leap across a volcanic chasm, imbuing the mechanical act with emotional weight.8 Professional design requires a disciplined understanding of how these relationships are established and maintained throughout a project’s lifecycle.6

### **Room Design versus World Design**

The scale of design dictates the methodology employed. In directed or scripted experiences, such as linear platformers, the designer may spend weeks perfecting a single room or screen to ensure that every jump and encounter is precisely tuned to the player’s moveset.2 This is analogous to the work of an architect focusing on the ergonomics of a single building. Conversely, in open-world or massive multiplayer environments, the designer adopts the role of an urban planner, focusing on biomes, neighborhoods, and "wayfinding" systems that allow for systemic, player-driven emergence.2  
In 2D indie development, this distinction is often blurred as designers navigate the complexities of interconnected maps, such as those found in the Metroidvania subgenre.9 Here, the design must function at both the granular level of individual challenges and the macro level of world progression, ensuring that the acquisition of new mechanics re-contextualizes previously explored spaces.9

| Design Scale | Primary Focus | Analogy | Key Output |
| :---- | :---- | :---- | :---- |
| Room/Screen Design | Precision mechanics, scripted events, micro-pacing. | Architect | Perfected "beats".2 |
| Area/Zone Design | Thematic consistency, enemy variety, sub-goals. | Interior Designer | Narrative vignettes.11 |
| World/Level Design | Interconnectedness, gating, macro-flow, wayfinding. | Urban Planner | Critical path mapping.2 |

## **Navigational Guidance and Spatial Communication**

One of the most profound challenges in 2D level design is guiding the player through an environment without relying on intrusive UI elements. Professional designers utilize "spatial communication," a set of techniques designed to intuitively nudge the player toward objectives while maintaining the illusion of agency.5

### **Sightlines and Clear Objectives**

The commencement of any design process should involve the placement of a clear, distant objective—a technique often used to combat "blank canvas syndrome".5 By establishing a visual goal, such as a lighthouse or a distant mountain peak, the designer provides the player with a constant sense of direction.5 Even in a 2D side-scroller, the use of "parallaxing"—layering geometry at different depths—helps the player perceive distance and orient themselves within the world.5  
Effective navigation also relies on the manipulation of sightlines. Blocking a player's view with foreground geometry can motivate movement, as the player is naturally driven to uncover hidden information and "mentally map" the space.5 Once a player reaches a vantage point, they are granted a "privileged perspective," allowing them to survey upcoming challenges from a position of safety before committing to action.5

### **The Use of Contrast and Affordances**

Lighting and sound are primary tools for attracting player attention. High-contrast areas, localized sound sources, or moving objects (such as spinning fans) act as beacons that draw the player toward intended routes.4 This is reinforced by "affordances"—visual shapes that communicate their function.1 For example, an archway intuitively suggests passage, while a series of stepped platforms suggests vertical ascent.5 Professional design requires that these affordances remain consistent; if a red door is interactive in the first level, every red door in the game must share that property unless a clear narrative reason is provided for the change.11

### **Pinch Points and One-Way Valves**

To maintain control over the experience without taking control away from the player, designers utilize "pinch points." These are narrow passages that force the player into a specific position, allowing the designer to frame a "hero shot" or introduce a critical narrative element.5 Complementary to this are "one-way valves"—drops or barriers that prevent the player from backtracking.5 These valves serve several purposes: they prevent the player from getting lost in complex areas, they nudge the player toward the next objective, and in technical terms, they can facilitate the unloading of previous map sections to optimize performance.5

## **Technical Metrics and Physics in 2D Environments**

The "feel" of a 2D game is determined by the precise calibration of its physics and the metrics of its environment. A level designed for a character with a high-speed dash will be fundamentally different from one designed for a slow, momentum-based character.15

### **Movement Models: Snappy versus Weighted**

The industry generally categorizes 2D character movement into "snappy" and "weighted" models. Snappy controls, utilized in titles like *Super Meat Boy* or *Hollow Knight*, feature near-instant acceleration and deceleration, allowing for extreme precision and rapid reaction times.15 Weighted controls, such as those in the *Super Mario* series, rely on momentum and acceleration curves, requiring the player to account for inertia when jumping or stopping.15  
Designing for these models requires strict adherence to environmental metrics. Designers must establish a "Bible of Obstacles" that defines the exact height and length of a character’s jump.15 For instance, if a character’s maximum jump height is 5 units, a platform placed at 5.5 units becomes an insurmountable barrier.16

| Metric Category | Variable | Technical Impact |
| :---- | :---- | :---- |
| Vertical Traversal | Max Jump Height (![][image1]) | Determines platform verticality.16 |
| Horizontal Traversal | Max Jump Length (![][image2]) | Determines pit width.16 |
| Acceleration | ![][image3] | Influences "snappiness" of movement.15 |
| Gravity | ![][image4] | Dictates the "weight" of falling and jumping.1 |
| Dash Distance | ![][image5] | Defines the spacing of mid-air recharge points.1 |

The physics of a jump can be modeled using standard kinematic equations. The peak height of a jump is calculated as ![][image6], where ![][image7] is the initial vertical velocity and ![][image4] is the gravity constant. Professional 2D design often incorporates "variable jump input," where the height of the jump is determined by the duration of the button press; releasing the button essentially applies a vertical "brake" to the character's velocity.15

### **Checkpoints and Difficulty Scaling**

The placement of checkpoints is a critical metric for managing player frustration and maintaining "flow".15 In high-difficulty titles like *Super Meat Boy*, frequent checkpoints (often one per screen) allow for a high failure rate without significant time loss, keeping the player in a state of constant engagement.15 In contrast, games with more exploration, such as *Hollow Knight* or *Silksong*, utilize more distant checkpoints to increase the tension of exploration and require a higher level of mastery over the character's moveset.15

## **Pedagogical Design: The Invisible Tutorial**

One of the hallmarks of expert level design is the ability to teach the player new mechanics without the use of explicit text or intrusive tutorials.1 This pedagogical approach relies on the player's natural curiosity and the structured sequencing of challenges.

### **The Four-Step Introduction Pattern**

Modern 2D masterpieces often follow a four-step pattern when introducing a new mechanic or hazard 1:

1. **Safety:** The mechanic is introduced in an area where failure has no consequence (e.g., no pits or enemies).1  
2. **Combination:** The player must combine the new mechanic with a previously learned skill (e.g., jumping while dashing).1  
3. **Risk:** The mechanic must be used to overcome a genuine hazard, establishing the stakes of the new skill.1  
4. **Mastery:** The player is required to use the mechanic in a complex, timed sequence to proceed, confirming their proficiency.16

*Celeste* provides a definitive example of this pattern through its use of "green diamonds" (dash crystals).1 The player first encounters a crystal in a safe area, where they intuitively dash into it and realize it recharges their ability.1 The game then places crystals over spikes, forcing the player to plan a route that involves mid-air recharges to reach safety.1 This "self-teaching" method fosters a sense of accomplishment and respects the player's intelligence.1

### **Problem-Solution Ordering**

A fundamental psychological rule in level design is that the player should encounter a problem before finding the solution.5 If a player finds a "red key" before they have ever seen a "red door," the key feels like a meaningless collectible.5 However, if they struggle to open a red door first, the subsequent discovery of the red key provides a satisfying "Aha\!" moment and a clear sense of progress.5 This ordering ensures that every item and ability has immediate utility and narrative value.

## **Structural Theory in Metroidvanias and Megadungeons**

The Metroidvania subgenre represents one of the most complex challenges in level design, requiring a delicate balance between non-linear exploration and controlled progression.10 The core of this design is the relationship between "locks" and "keys," where the keys are often mechanical upgrades rather than literal items.10

### **Subtractive Design and Gating Logic**

The development of a Metroidvania often follows a "subtractive design" philosophy.16 The designer first defines the character's ultimate moveset—everything they will be able to do by the end of the game.16 The world is then constructed with barriers that can only be bypassed by specific abilities.10 Progression is managed by stripping the player of these abilities at the start of the game and then scattering them throughout the world.10

| Gate Type | Mechanical Requirement | Function |
| :---- | :---- | :---- |
| Spatial Gate | Double Jump / Wall Jump | Re-contextualizes vertical space.19 |
| Physical Gate | Bomb / Heavy Strike | Destroys barriers, opening shortcuts.16 |
| Environmental Gate | Heat Shield / Gas Mask | Allows passage through hazardous biomes.16 |
| Combat Gate | Specific Weapon Element | Requires mastery of a new combat style.14 |

### **The Foreshadowing Loop and Spiral Map Design**

To keep the player motivated during long periods of exploration, designers utilize "Foreshadowing Loops".19 This involves showing the player a path or a reward they cannot yet reach, creating a "mental bookmark".19 When the player later acquires the necessary upgrade, they are encouraged to backtrack to the foreshadowed area, reinforcing their mastery over the world.9  
Spiral map design is a technique where the world is arranged in an almost counter-clockwise pattern around a central hub.9 This prevents the world from feeling like a linear corridor and ensures that the player is frequently circling back to known areas, which are then re-evaluated in the context of their new abilities.4

## **Environmental Storytelling and Narrative Traces**

Level design is a powerful narrative tool that allows for the embedding of story directly into the physical space.11 This "indexical storytelling" engages the player as an active participant in uncovering the game's history.13

### **The Theme Park Influence: Don Carson’s Secrets**

Much of modern environmental storytelling in games draws from the theme park industry, specifically the work of Disney "Imagineers" like Don Carson.11 The environment must answer the player's first question—"Where am I?"—within the first 15 seconds.11 This is achieved through "cause-and-effect vignettes"—staged scenes that suggest a previous event.11 A dining table with chairs overturned and a half-eaten meal suggests a sudden, violent interruption, telling a story without a single line of dialogue.11  
Professional designers also utilize "the familiar" to anchor players in alien environments.11 If the goal is to design a surreal, intestine-like level, periodically placing recognizable objects (like a discarded human shoe or a mechanical lamp) provides the player with a sense of scale and a point of comparison, making the alien elements more impactful.11

### **The Door Problem and Spatial Agency**

Narrative can also be used to lead gameplay through the "Door Problem of Combat Design".22 This involves using environmental cues to draw a player into a room or toward an encounter.23 A partially open door or a flickering light at the end of a corridor piques the player's curiosity, driving them forward.5 This technique ensures that the player is always an "active participant" in the narrative rather than a passive observer.13

## **The id Software Legacy: John Romero’s Rules for Layout**

The foundational principles of 3D level design, as established by John Romero during the development of *Doom* and *Quake*, remain remarkably relevant to 2D environments, particularly regarding layout clarity and technical rigor.4

### **Romero’s Eight Rules of Level Construction**

Romero’s rules focus on maintaining a high level of quality and readability through texture work and spatial contrast.4 For the 2D designer, these can be translated as follows:

1. **Texture and Height Alignment:** Always change the floor height (or ledge position) when changing floor textures.4 This helps the player distinguish between different surfaces and elevations, which is crucial for readability in tile-based 2D games.4  
2. **Border Textures:** Use border or "support" textures between different wall segments and doorways to create a clean transition.4  
3. **Strict Alignment:** Be obsessive about texture alignment with the grid.4 In 2D games, misaligned tiles are often the mark of amateur design and can lead to visual noise that distracts from the gameplay.25  
4. **Contrast:** Use contrast in every element: light and dark areas, cramped and open areas, and high-intensity vs. quiet areas.4 This maintains a "roller-coaster" pace that prevents the player from becoming bored.18  
5. **Landmarks:** Create easily recognizable landmarks to assist with navigation and prevent the player from getting turned around.4  
6. **Secret Density:** Include at least four secrets per level to reward thorough exploration.18  
7. **The Horseshoe Layout:** Design paths that are non-linear, forcing the player to look at every wall of a room, which increases the likelihood of them noticing secrets or environmental story cues.4  
8. **The Loop:** Ensure that levels flow so that the player revisits areas multiple times, reinforcing their understanding of the spatial layout.4

### **Managing Flow and Revisitability**

The "Loop" is a particularly powerful pattern in 2D design. By guiding the player back to a previously explored area, the designer provides an "illusion of non-linearity" while maintaining a strictly controlled progression path.4 This reinforcement of space allows the player to feel like they are developing a deep understanding of the world, fostering a sense of immersion and expertise.4

## **Professional Workflow: From Blockout to Final Polish**

The production of a level is a highly iterative process that prioritizes gameplay functionality over visual fidelity in its early stages.2

### **The Blockout Phase: Agility and Flexibility**

A "blockout" (or "greybox") is a version of a level built with simple, placeholder geometry.5 The goal is to achieve "maximum information for minimum effort".5 Professional designers use blockouts to quickly test gameplay ideas, pacing, and difficulty before the environment is "handed off" to artists for final set dressing.2  
During the blockout phase, designers should focus on "temp furniture"—placeholders that help judge the true scale of a space.5 An empty room always feels larger than it will once it is fully decorated with furniture, crates, and debris.5 Placing these items early prevents the need for costly layout changes later in production.5

### **Iteration and "Go Map" Philosophy**

The only way to master the craft is through the constant production and testing of levels.2 This is referred to in the community as the "Go Map" philosophy—an encouragement to stop over-analyzing and start building.2 Professional design involves observing playtests and being willing to "tear down walls" if they don't serve the gameplay.5 A level is never truly finished; it is refined through a continuous cycle of testing and iteration until the intended player experience is achieved.23

| Phase | Goal | Key Tools |
| :---- | :---- | :---- |
| Pre-Production | Defining pillars, metrics, and "verbs." | GDD, Prototypes.16 |
| Blockout/Greybox | Testing flow, pacing, and sightlines. | Simple primitives, grid editors.5 |
| Iteration/Testing | Observing players, adjusting difficulty. | Playtests, heatmaps.2 |
| Art Pass | Set dressing, lighting, environmental story. | Final assets, Substance Painter.2 |
| Final Polish | Bug fixing, performance optimization. | Profilers, automated testing.14 |

## **Documentation and Project Management for Level Design**

In a professional setting, the level designer is responsible for maintaining clear, up-to-date documentation that ensures the entire team is aligned with the project's vision.27

### **The Modern Game Design Document (GDD)**

The GDD serves as the single source of truth for the project.30 For level designers, a modern GDD should be "minimal" and "living"—updated constantly as the game evolves.27 Key sections include 27:

* **Design Pillars:** The 3-5 core principles that guide every design decision (e.g., "Exploration over Combat," "Precise Movement," "Atmospheric Horror").27  
* **The Core Loop:** A concise summary of the player's moment-to-moment experience (e.g., Explore → Fight → Loot → Upgrade → Repeat).27  
* **Technical Metrics:** A "Bible of Obstacles" specifying the exact jump heights, run speeds, and collision rules.15  
* **Level Maps and Flowcharts:** Visual representations of how the levels are interconnected and the order in which mechanics are introduced.16

### **Technical Design and Living Documents**

For complex projects, a Technical Design Document (TDD) may be necessary to explain implementation details, such as how the game handles dynamic map loading or AI pathfinding in 2D environments.14 Some teams utilize specialized tools like Codecks or wiki-style databases to integrate design documentation directly into their project management workflow, ensuring that task execution is always grounded in the design intent.31

## **Curated Resource Compendium for Professional Referencing**

To maintain a competitive edge, designers must engage with a wide range of academic and professional resources. The following collection represents the highest quality sources available for 2D level design.12

### **Essential Literature**

* **"An Architectural Approach to Level Design" by Christopher W. Totten:** Provides a comprehensive breakdown of architectural techniques and spatial design principles applicable to both 2D and 3D environments.35  
* **"A Game Design Vocabulary" by Anna Anthropy and Naomi Clark:** Establishes the fundamental language of verbs, objects, and scenes.6  
* **"Level Up\! The Guide to Great Video Game Design" by Scott Rogers:** A practical, visually-driven guide to designing mechanics and levels from a veteran of titles like *Pac-Man World*.34  
* **"The Art of Game Design: A Book of Lenses" by Jesse Schell:** A "bible" of the industry that provides 100+ mental frameworks for evaluating player experience.34  
* **"Level Design: Concept, Theory, and Practice" by Rudolf Kremers:** A comprehensive textbook focusing on the theoretical reasons behind design choices, including pacing and immersion.8

### **Digital Databases and Educational Communities**

* **Level-Design.org:** A massive knowledge database and reference collection for level designers, including thousands of tagged screenshots for analysis.12  
* **GDC Vault:** The primary archive for industry talks, featuring masterclasses on environmental storytelling, pacing, and 2D platformer design.20  
* **Level Design Lobby (Podcast/Blog):** Hosted by Max Pears, this resource provides interviews with industry professionals and deep dives into specific LD concepts.12  
* **Steve Lee’s YouTube Channel:** A lead level designer (formerly of Arkane) who provides walkthroughs of professional level design processes, blockout tips, and portfolio advice.12  
* **Game Maker's Toolkit (GMTK):** Mark Brown’s channel provides exceptional case studies on level design, such as "Why Nathan Drake Doesn't Need a Compass" and "The Best 2D Platformer?".12

## **Synthesis: Actionable Patterns for Design Agents**

The integration of these principles into a cohesive design workflow requires the adoption of specific, actionable patterns. For a design agent operating in the 2D indie space, the following strategic takeaways should be considered mandatory:

1. **Prioritize Movement Fidelity:** Before any levels are built, the character's movement must be "perfect." This involves refining the "buffer windows" (allowing for inputs to be registered slightly before they can be executed) and "coyote time" (allowing a player to jump for a few frames after leaving a platform) to ensure the game feel is forgiving and responsive.1  
2. **Standardize Environmental Feedback:** Use consistent visual languages for interactables. For example, all destructible walls should share a specific texture or "crumbly" appearance.1 This reduces cognitive load on the player and allows them to focus on the mechanical challenge.1  
3. **Implement One-Way Valves Strategicially:** Use valves not just for navigation but for technical optimization and to ensure that the player is always moving toward a goal.5  
4. **Adopt a "Problem-First" Philosophy:** Always present the lock before the key. This ensures that the acquisition of new abilities is meaningful and rewarding.5  
5. **Focus on "Action Blocks" in Pre-Production:** Develop small, self-contained mechanical challenges (action blocks) and test them in isolation before attempting to string them together into a full level.16  
6. **Utilize Safety Nets to Maintain Flow:** Avoid instant-death traps unless the game is explicitly a "masocore" title. Instead, use lower platforms or water pits that require the player to backtrack a short distance rather than restarting the entire screen.5  
7. **Maintain Living Documentation:** Ensure that the GDD is a functional tool that is updated as playtest data reveals flaws in the original design.27

The convergence of these techniques—from Romero’s grid-based rigor to modern pedagogical scaffolding—provides a robust framework for creating engaging, professional-grade 2D levels.1 As the indie development scene continues to push the boundaries of the medium, the successful level designer will be the one who best balances technical excellence with a deep, intuitive understanding of the player's psychological journey through the digital space.1

#### **Works cited**

1. The Award-Winning Level Design in Celeste | by Joseph Diamond ..., accessed May 15, 2026, [https://medium.com/@josephdiamond115/the-award-winning-level-design-in-celeste-c2acb315bf79](https://medium.com/@josephdiamond115/the-award-winning-level-design-in-celeste-c2acb315bf79)  
2. What is level design | The Level Design Book, accessed May 15, 2026, [https://book.leveldesignbook.com/introduction](https://book.leveldesignbook.com/introduction)  
3. Can anyone give me an example of a 2D action platformer game with very solid level design ?, i need inspiration \- Reddit, accessed May 15, 2026, [https://www.reddit.com/r/gamedesign/comments/npv6pf/can\_anyone\_give\_me\_an\_example\_of\_a\_2d\_action/](https://www.reddit.com/r/gamedesign/comments/npv6pf/can_anyone_give_me_an_example_of_a_2d_action/)  
4. John Romero's Level Design Tips \- Helldorado Team, accessed May 15, 2026, [https://www.helldoradoteam.com/2018/12/19/john-romeros-level-design-tips/](https://www.helldoradoteam.com/2018/12/19/john-romeros-level-design-tips/)  
5. Spatial Communication in Level Design, accessed May 15, 2026, [https://www.youtube.com/watch?v=AKeUZVikPV8\&list=PL7drPFPQSY36C2L9N88cQ9VoEvxicnyI0](https://www.youtube.com/watch?v=AKeUZVikPV8&list=PL7drPFPQSY36C2L9N88cQ9VoEvxicnyI0)  
6. Game Design Vocabulary, A by Anna Anthropy & Naomi Clark on Apple Books, accessed May 15, 2026, [https://books.apple.com/us/book/game-design-vocabulary-a/id825597940](https://books.apple.com/us/book/game-design-vocabulary-a/id825597940)  
7. A Game Design Vocabulary \- Pearsoncmg.com, accessed May 15, 2026, [https://ptgmedia.pearsoncmg.com/images/9780321886927/samplepages/0321886925.pdf](https://ptgmedia.pearsoncmg.com/images/9780321886927/samplepages/0321886925.pdf)  
8. Level Design: Concept, Theory, and Practice \- 1st Edition \- Rudolf Kre \- Routledge, accessed May 15, 2026, [https://www.routledge.com/Level-Design-Concept-Theory-and-Practice/Kremers/p/book/9781568813387](https://www.routledge.com/Level-Design-Concept-Theory-and-Practice/Kremers/p/book/9781568813387)  
9. What are some tips on making Metroidvania Level Layouts and Gating Mechanism? : r/gamedesign \- Reddit, accessed May 15, 2026, [https://www.reddit.com/r/gamedesign/comments/fs9vbf/metroidvania\_what\_are\_some\_tips\_on\_making/](https://www.reddit.com/r/gamedesign/comments/fs9vbf/metroidvania_what_are_some_tips_on_making/)  
10. Making Sense of Metroidvania Game Design \- Game Developer, accessed May 15, 2026, [https://www.gamedeveloper.com/design/making-sense-of-metroidvania-game-design](https://www.gamedeveloper.com/design/making-sense-of-metroidvania-game-design)  
11. Environmental Storytelling: Creating Immersive 3D Worlds Using Lessons Learned from the Theme Park Industry \- Game Developer, accessed May 15, 2026, [https://www.gamedeveloper.com/design/environmental-storytelling-creating-immersive-3d-worlds-using-lessons-learned-from-the-theme-park-industry](https://www.gamedeveloper.com/design/environmental-storytelling-creating-immersive-3d-worlds-using-lessons-learned-from-the-theme-park-industry)  
12. bytecauldron/awesome-level-design: A curated list of ... \- GitHub, accessed May 15, 2026, [https://github.com/bytecauldron/awesome-level-design](https://github.com/bytecauldron/awesome-level-design)  
13. Intro to Environmental Storytelling | Video Game Design \- YouTube, accessed May 15, 2026, [https://www.youtube.com/watch?v=yrl1JD-LO78](https://www.youtube.com/watch?v=yrl1JD-LO78)  
14. (PDF) A Framework for Metroidvania Games \- ResearchGate, accessed May 15, 2026, [https://www.researchgate.net/publication/346540910\_A\_Framework\_for\_Metroidvania\_Games](https://www.researchgate.net/publication/346540910_A_Framework_for_Metroidvania_Games)  
15. Platformer Game Design (Definition, Fundamentals, Mechanics), accessed May 15, 2026, [https://gamedesignskills.com/game-design/platformer/](https://gamedesignskills.com/game-design/platformer/)  
16. Guide to Making Metroidvania Style Games: Part 1 \- Subtractive Design, accessed May 15, 2026, [http://subtractivedesign.blogspot.com/2013/01/guide-to-making-metroidvania-style.html](http://subtractivedesign.blogspot.com/2013/01/guide-to-making-metroidvania-style.html)  
17. Are there any good resources to learn about level design in depth? : r/gaming \- Reddit, accessed May 15, 2026, [https://www.reddit.com/r/gaming/comments/1ist144/are\_there\_any\_good\_resources\_to\_learn\_about\_level/](https://www.reddit.com/r/gaming/comments/1ist144/are_there_any_good_resources_to_learn_about_level/)  
18. LESSONS FROM HELL: John Romero's Level Design Rules for DOOM \- I Cast Light\!, accessed May 15, 2026, [https://icastlight.blogspot.com/2024/01/lessons-from-hell-john-romeros-level.html](https://icastlight.blogspot.com/2024/01/lessons-from-hell-john-romeros-level.html)  
19. Metroidvanias and Megadungeons \- Rise Up Comus, accessed May 15, 2026, [http://riseupcomus.blogspot.com/2024/01/metroidvanias-and-megadungeons.html](http://riseupcomus.blogspot.com/2024/01/metroidvanias-and-megadungeons.html)  
20. What Happened Here? Environmental Storytelling \- GDC Vault, accessed May 15, 2026, [https://www.gdcvault.com/play/1012647/what-happened-here-environmental](https://www.gdcvault.com/play/1012647/what-happened-here-environmental)  
21. Environmental Storytelling: Indices and the Art of Leaving Traces \- GDC Vault, accessed May 15, 2026, [https://gdcvault.com/play/1016566/Environmental-Storytelling-Indices-and-the](https://gdcvault.com/play/1016566/Environmental-Storytelling-Indices-and-the)  
22. Level Design Compendium: The Curated List (+40 links) : r/gamedev \- Reddit, accessed May 15, 2026, [https://www.reddit.com/r/gamedev/comments/fv2s65/level\_design\_compendium\_the\_curated\_list\_40\_links/](https://www.reddit.com/r/gamedev/comments/fv2s65/level_design_compendium_the_curated_list_40_links/)  
23. Good Resources for level design? : r/leveldesign \- Reddit, accessed May 15, 2026, [https://www.reddit.com/r/leveldesign/comments/19e77wy/good\_resources\_for\_level\_design/](https://www.reddit.com/r/leveldesign/comments/19e77wy/good_resources_for_level_design/)  
24. John Romero's 8 rules for making games\! so here's part 1\! \#doom \#games \#retro \#fun \#viral \#trending \- YouTube, accessed May 15, 2026, [https://www.youtube.com/shorts/LylUEGZ03aU](https://www.youtube.com/shorts/LylUEGZ03aU)  
25. Tips for creating good WADs \- The Doom Wiki at DoomWiki.org, accessed May 15, 2026, [https://doomwiki.org/wiki/Tips\_for\_creating\_good\_WADs](https://doomwiki.org/wiki/Tips_for_creating_good_WADs)  
26. Level Design in a Day: Best Practices from the Best in the Business \- GDC Vault, accessed May 15, 2026, [https://gdcvault.com/play/1016327/Level-Design-in-a-Day](https://gdcvault.com/play/1016327/Level-Design-in-a-Day)  
27. How to write a game design document — with examples and template \- GitBook, accessed May 15, 2026, [https://www.gitbook.com/blog/how-to-write-a-game-design-document](https://www.gitbook.com/blog/how-to-write-a-game-design-document)  
28. World of Level Design \- Tutorials for Becoming the Best Level Designer and Game Environment Artist, accessed May 15, 2026, [https://www.worldofleveldesign.com/](https://www.worldofleveldesign.com/)  
29. LEVEL-DESIGN.org – Level Art and Design news website, accessed May 15, 2026, [http://level-design.org/](http://level-design.org/)  
30. Master How to Make a Game Design Document: Your Essential Guide, accessed May 15, 2026, [https://kevurugames.com/blog/how-to-write-a-game-design-document-gdd/](https://kevurugames.com/blog/how-to-write-a-game-design-document-gdd/)  
31. Writing Modern Game Design Documents (+Examples) \- Codecks, accessed May 15, 2026, [https://www.codecks.io/blog/writing-modern-game-design-documents/](https://www.codecks.io/blog/writing-modern-game-design-documents/)  
32. Free Game Design Document (GDD) Template & How-To Guide, accessed May 15, 2026, [https://indiegameacademy.com/free-game-design-document-template-how-to-guide/](https://indiegameacademy.com/free-game-design-document-template-how-to-guide/)  
33. Finished Game Design Document Examples? : r/gamedesign \- Reddit, accessed May 15, 2026, [https://www.reddit.com/r/gamedesign/comments/7ze7xq/finished\_game\_design\_document\_examples/](https://www.reddit.com/r/gamedesign/comments/7ze7xq/finished_game_design_document_examples/)  
34. 20 Best Books for Game Designers \- Devtodev, accessed May 15, 2026, [https://www.devtodev.com/resources/articles/20-best-books-for-game-designers](https://www.devtodev.com/resources/articles/20-best-books-for-game-designers)  
35. Book recommendation for level design : r/gamedev \- Reddit, accessed May 15, 2026, [https://www.reddit.com/r/gamedev/comments/1sy2s89/book\_recommendation\_for\_level\_design/](https://www.reddit.com/r/gamedev/comments/1sy2s89/book_recommendation_for_level_design/)  
36. 10 Game Level Design Books to Learn From, accessed May 15, 2026, [https://gamedesignskills.com/game-design/level-design-books/](https://gamedesignskills.com/game-design/level-design-books/)

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAWCAYAAAAfD8YZAAAAz0lEQVR4Xu2SsQqBYRSG31IKKTfiBoxGi81NkEXZTHZGl6DsBpFQZLK7BolCMYj365wvv9P//TfAU89ynv+cvuEH/jToli7onC7pJtLXdEbHdBKZf/FS8zaQAaQ1bfC4+LRD5QbpsRQhsWeD4l8VywgSCzaQNKStbPAkXe5AWtkGj19OMoiLe9oytrUFl+uQWLFBce1hh54DwpdLkNa1wZP0rCmkZW1wpCBxZ4OSdBh9SKzZQDIILA/phZ7okZ7x+TVz9Koz19w3d1rV/nO8AdFuRm3+sGguAAAAAElFTkSuQmCC>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAUCAYAAAC58NwRAAAAhklEQVR4XmNgGH5gHhB/AuL/SPgjEPchK8IGYIqJAowMEMVn0SVwgWwGiAYvdAlc4CUDCc4BAZLcr8UAUdyJLoELrGGAaOBDl4ACDJvxOQdkCCieUABI8T90QSgARSgTsoA5A0TDRGRBKHjAgGRzOBCfggqA8G0g3gfER4H4BZJ4CUzDUAcAra4l9Jn0G0AAAAAASUVORK5CYII=>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAVCAYAAACUhcTwAAAAcklEQVR4XmNgGAXkAGYgrgTifHQJGGgH4l9QNjeU/R8hzcAQDRXgQBI7CxWDAxDnObIAVOwLjBMCFUiHS0MASAzkPjDYARVABnJQMVaYwBSoADJYgiS2FESAfIKsyA3Kh4nB5ZyRJLKhYv+gfCGYosEEAIOOHmYSXsA5AAAAAElFTkSuQmCC>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAYCAYAAADDLGwtAAAAmElEQVR4XmNgGAW0AuZAvByI7dElkMFHIJ4MZc8B4r9A/B8hDQE/gPgpmhhI0RJkgTyooAiSGDNUTAtJDCyAbkUpFjGwwDc0sc9QcRQAEtiPRWwNmhhDM1QCBv5B+dpIYnBQDMTvgbidAYf7sIEvDFgUgtz2E00MpKgATQwseAHK5oXyjyGkEYAbiKcB8S4gbgViNlTpAQcA85on0bDMg3IAAAAASUVORK5CYII=>

[image5]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAVCAYAAACUhcTwAAAAjUlEQVR4XmNgGHRAAl0AGSwE4v9QjBdoMhChaCUDEYpACr6iC4JADxA3QdkgRTVIcgyVQPwLylZlQDiaHaYgFSrAARMAgktQMTgAcZ4jC0DFvsM4HlCBdLg0BIDEGmCcZVABZKACFYNbPwUqgAyWIIktBRHcSAIgEAzlw8Tgcs5IEtlQsX9QvhBM0WACAHzwJ6iTQnBMAAAAAElFTkSuQmCC>

[image6]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAD4AAAAhCAYAAACBQRgKAAACRUlEQVR4XuWZO2gVQRSGj4jPiCYQMUU67exsBMUUksYoJlUEGx9opZWvVoxWIkoQrXwkppBgpY2gRQoLsYiNhSS2Wqj4NlFB0f/nnOHOPexu2ARy19kPPnZ2/puQc2dnZ3YjkianYAd8Ade7LGl+2HE5nImDunDErBXL4FXfWQeO23GiqTdxfsO/5hWXJcFr0SJJu2ihyTNsx7jYWhRO1klzsWEZS5678Fx0PhC1S3ELfpXGjYG+tWwJfOeyj7DP8lbwFPZYezQO5ksoLAsuD8zW+qAFrIR/4DTsdFlpOLIs7LkPjKIvpQqsEh2U/XZ+P8oKOSZa2F4fGMx++c4Kwf35ddEB3Am3Nsf5cE7njegO0WzIBxUj/P1PmnrnIFzK/XC36M1rl/nMMl5OVeas6I4tbwAz4Yen4EnnGcvK/LJ9cCzHO3AE3oY34Q1pbEoWAtf2E3ATHHRZLmF+5y1RVZ/fgWtws+8s4r3kj+g20ey8D1pEuPrKmklR+Fg0W+2DAnrhxRJe0B9bXJaKFva/rt/zJtwFs24IvIsnVzg3+t/gJ/gBfhbdBpI2+N36mPEzP0WXuipwQHQwZuFGlyULH066rb1C9Avge7bk4ZNkPPXYvhSd1wYWvic651XwRXQ1OgS3RFkyHBW9D8X4q2FNdJ4ELOiN63skug0OJLUaBeJ9B58nCAvtsvYGaaxSycA5fBAehqfhduvnEhwu7VfwsrWT4IE0NlV+c8WXEC/hPevnE1st4FuYQJLzO4tx+NDak5Lz39J/poKgsskC2d0AAAAASUVORK5CYII=>

[image7]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAAZCAYAAADXPsWXAAAA4ElEQVR4XmNgGAWjgM5gDhAfA+L/QMwIFROD8h1hivABHSDOg7JBmhKgbBEofzaUjxf8gNJmDBBNLEhyx4E4GImPE9RC6QkMEEOQwXQglkYTwwtABjxDE3uJxicIQIb4o4ldQOPjBXIMmF4BBbYUlA2KsbNAfAchzXAViQ0HIEP0oWxOBlQNN6A0skXoloKBNwNEAoR3oMmBQBMQL4GybYD4OZIc0QBkOMiFILAPiDOR5IgGBL1CDPAA4vdAfISBTEOMgLgQygYlyklIckSDo0BsAcT2DKixRjIwQBegKgAALGgr4BK6ma8AAAAASUVORK5CYII=>