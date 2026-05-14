# **The Architecture of Exploration: Principles of Two-Dimensional Map Design and Cognitive Topology in the Metroidvania Genre**

The design of a two-dimensional game map represents a complex intersection of spatial geometry, psychological wayfinding, and narrative delivery. Unlike three-dimensional environments where players navigate with multiple degrees of freedom, the 2D plane demands a more rigorous adherence to visual composition and topological connectivity to ensure that the player remains engaged rather than frustrated.1 Within the contemporary landscape of game development, the "Metroidvania" subgenre—characterized by large, interconnected maps and ability-gated progression—stands as the definitive test of this architectural discipline.3 This analysis explores the foundational principles of 2D map design, centered on the landmark implementation in Team Cherry’s *Hollow Knight*, while examining the technical, psychological, and narrative mechanisms that differentiate world-class level design from mere spatial arrangement.

## **Foundations of 2D Spatial Geometry and Level Flow**

The core of effective 2D map design lies in the designer's ability to plan the layout, encounters, and overall flow of the experience.1 As a container for gameplay, the level must account for the specific mechanics of the avatar, translating the character’s movement speed and abilities into a physical space that feels neither cramped nor desolate.5 This begins with "Spatial Design," which involves the meticulous arrangement of platforms, obstacles, and pathways to create a coherent environment.1

### **The Role of Pacing and Movement Aids**

Designers must consider the speed of the character as the primary metric for level scale.5 If a character moves quickly, they cover more ground, necessitating larger areas or more frequent obstacles to maintain engagement.5 In the case of *Hollow Knight*, the Knight’s relatively measured pace is balanced by the dense distribution of environmental hazards and enemies, which prevents the world of Hallownest from feeling "empty" despite its vast size.3 To counteract potential tedium in backtracking, "Movement Aids"—such as springs, trampolines, or ropes—are strategically placed to facilitate faster traversal once the player has mastered a region’s basic layout.7

### **Structural Hierarchy and Topology**

A sophisticated 2D map is structured into "chunks" or areas of challenge rather than a simple string of rooms.7 These chunks are categorized by their purpose: platforms for traversal, obstacles for challenge, and triggers for world-state changes.7 The transition from "topographic space" (the literal physical arrangement of rocks and walls) to "topologic space" (the representation of time gain and shortcuts) is a hallmark of the genre.9 For instance, a rock that was once an obstacle (topography) may later be transformed into a source of currency or a shortcut after the acquisition of a new ability (topology), changing the player's relationship with the map.9

| Level Component Category | Functional Purpose | Design Goal |
| :---- | :---- | :---- |
| Platforms | Basic traversal and movement | Establishing the rhythmic flow of the level.7 |
| Obstacles/Hazards | Damage and death triggers | Providing challenge and defining path boundaries.7 |
| Movement Aids | Traversal enhancement | Reducing backtracking friction in explored areas.7 |
| Triggers/Switches | State changes and gating | Facilitating non-linear progression and shortcuts.7 |

## **Visual Composition and the Psychology of the Player Frame**

The visual organization of a 2D level, termed "shot composition," dictates how the environment appears within the player's camera frame.12 However, professional level design often favors "spatial composition"—the big-picture arrangement of core masses—over static screenshots, as players navigate based on pattern recognition and mental models rather than a single viewing angle.12

### **Gestalt Principles and Figure-Ground Relationships**

Designers utilize Gestalt psychology—the theory that humans organize visual elements into unified wholes—to create intuitive paths.2 By manipulating "positive space" (the area the subject occupies) and "negative space" (the space around or between objects), designers can guide the player's eye toward critical goals.2 Positive space is often welcoming and inviting, frequently employing the "cathedral effect"—using high ceilings and grand architecture to inspire awe—whereas negative space can be used to induce feelings of vulnerability or claustrophobia.14

### **Compositional Layering and Depth**

The technical execution of depth in a 2D plane relies on a multi-layered approach to composition. This layering ensures that the playable area remains distinct from the decorative atmosphere.16

* **Foreground Layers:** These are the closest to the observer and act as a frame for the central action. While often overlooked, darkening foreground objects can enhance the sense of space and focus the player's attention on the "Center of Interest".16  
* **Main Playable Layer:** This contains all interactive elements—the character, platforms, enemies, and walls. In *Hollow Knight*, this layer often features solid black outlines to clearly demarcate the boundaries of movement against softer backgrounds.16  
* **Close Background:** Non-interactive environmental details that add atmosphere, such as brick walls or vegetation, often using more saturated colors but lacking the sharp outlines of the main layer.16  
* **Multiple Backgrounds (Parallax):** These layers move slower than the foreground to create the "2.5D" illusion of depth.18

### **Visual Movement and "Flow"**

Visual movement, or "flow" in graphic design, uses lines, shapes, and color to guide the viewer from one point to the next.13 Designers have experimented with applying classical composition rules, such as the "rule of thirds" or the "golden spiral," to 2D paper maps to see if visual flow translates to player movement flow.13 While "leading lines" (implied paths created by environment art) are a common tool, modern critiques suggest that they may be less effective than "sightlines"—open trajectories of space that offer a potential view of a distant landmark.12

## **Cognitive Mapping and Wayfinding Mechanics**

Wayfinding is the active process by which players orient themselves within the game environment.14 In complex, non-linear maps like those of Hallownest, designers must provide a variety of navigational aids, ranging from explicit tools to implicit environmental cues.20

### **Landmarks and Weenies**

"Landmarks" are distinctive features that help players understand their location.14 "Weenies" are specific objects placed to draw attention and guide the player toward a location, such as a brightly colored monument or a prominent tower.14 *Hollow Knight*’s design incorporates these through structures like the Temple of the Black Egg, which players stumble across early on, creating long-term curiosity about its significance.3 Similarly, the planned "Citadel" in the upcoming *Silksong* towers over the world of Pharloom, providing a constant orienting point for the player.22

### **Lighting and Color as Directional Cues**

Lighting and color serve as implicit visual cues that guide movement without explicit signage.20 In *Assassins Creed* or *The Last of Us*, specific colors (like yellow tape or white ledges) indicate climbable paths.24 In *Hollow Knight*, orange gooey blobs signify the presence of infection, while a shift from the somber blue of the Forgotten Crossroads to the dark green of Greenpath indicates a transition into a new biome.25 Lighting is also used diegetically; in dark areas, light might represent a window or an exit, guiding the player toward safety.14

### **The Diegetic Mapping System of Hollow Knight**

A significant innovation in *Hollow Knight* is its diegetic mapping system, which turns cartography into an active gameplay loop rather than a background utility.25

* **The Cornifer Loop:** Upon entering a new area, the player has no map. They must follow a trail of paper and the sound of humming to find Cornifer the mapmaker.27  
* **The Incomplete Map:** The map purchased from Cornifer is a crude, incomplete drawing. It is up to the player to fill in the rest by exploring and then resting at a bench, which triggers the Knight to update the map.27  
* **Earned Navigational Support:** Unlike games that provide an automatic "fog-of-war" minimap, *Hollow Knight* forces players to buy markers and even the ability to see their own position on the map (the Wayward Compass).6

This system encourages players to form internal "mental models" of the space.27 By making navigational aids items that require currency (Geo) and equipment slots (Notches), the game forces players to choose their level of support, essentially opting into their own navigational difficulty.27

| Navigational Mechanic | Implementation in Hollow Knight | Psychological Effect |
| :---- | :---- | :---- |
| Mental Modeling | No map upon area entry | Encourages observation of landmarks.27 |
| Diegetic UI | Physical map item; real-time viewing | Increases immersion and tension; no pause safety.27 |
| Progress Retention | Map updates kept upon death | Offsets frustration of losing currency (Geo).27 |
| Selective Guidance | Wayward Compass as an equipable charm | Rewards map memorization with more combat power.6 |

## **Connectivity, Topology, and the "World-First" Philosophy**

Team Cherry’s approach to map design for *Hollow Knight* was famously "intuition-based" rather than mathematical.30 They focused on building a "space" or a "world" rather than a series of platforms.22 This "world-first" philosophy suggests that if a designer conceives of a space as a "cavern with a lake" or a "ruined tower," the placement of platforms and enemies becomes a natural consequence of that space's logic.22

### **Hub and Spoke Architecture: The Forgotten Crossroads**

The Forgotten Crossroads serves as the central "crossroads" of Hallownest, connecting the fungus area, the desert, and the City of Tears.4 This central node architecture is crucial for Metroidvanias, providing a familiar anchor point for the player to return to after branching out into more difficult regions.4 The strength of Hallownest lies in its high degree of interconnectivity; Team Cherry was keen on creating as many connections between areas as possible to facilitate a sense of a "living" world.4

### **Logical Transitions and Environmental Shifts**

Transitions between areas in *Hollow Knight* are designed to be logical and narrative-rich.26 Entering Deepnest through the Mantis Village requires defeating the Mantis Lords, and the presence of bug corpses and Mantis-style spears establishes the tone and lore of the defensive Mantis tribe without dialogue.26 Furthermore, the map is not static; the "Infected Crossroads" shift halfway through the game represents a radical environmental change that shocks the player and demands a re-evaluation of a previously "safe" area.26

### **Deepnest: A Case Study in Psychological Disorientation**

Deepnest is arguably the most distinct area in Hallownest, defined by its intentional use of disorientation and spatial pressure.29

* **Atmosphere of Absence:** Deepnest is defined by what it lacks—light, clear pathways, and silence. The droning soundtrack and claustrophobic corridors create a sense of panic.31  
* **Mechanical Tension:** The presence of enemies like "Stalking Devouts" and "Corpse Creepers" reinforces the feeling of being hunted in a labyrinth.31  
* **The Fear of the Dark:** Without the Lumafly Lantern, navigation is near-impossible, using a mechanical gate to enforce a psychological state of vulnerability.29

## **Ability Gating and the Verbs of Progression**

The defining characteristic of a Metroidvania is ability-based progression, where the acquisition of a new "verb" (double jump, dash, etc.) acts as a "key" to a previously "locked" part of the world.3

### **The Lock and Key Formula**

Designers typically map out abilities and their effects on the world before building the rooms.8 A common workflow involves creating "Progression Testing Rooms" that force the player to use a newly acquired ability to exit, ensuring they understand the mechanic before returning to the main world.34 These gates tease the player, showing them a tantalizing path that is just out of reach.3

* **Verticality Gates:** Walls or ledges that require the Mantis Claw (wall jump) or Monarch Wings (double jump).35  
* **Distance Gates:** Large gaps requiring the Mothwing Cloak (dash) or the infinite-length Crystal Heart.32  
* **Hazard/State Gates:** Barriers like acid or shadow walls that require Isma’s Tear or the Shade Cloak to pass.3

### **Sequence Breaking and Player Agency**

Sequence breaking—acquiring items or entering areas earlier than intended—is a hallmark of high-level Metroidvania design.36 *Hollow Knight* facilitates this through mechanics like the "pogo jump" (downward striking an enemy or spikes to gain height).3 While some games strictly railroad the player, *Hollow Knight* eventually transitions into a highly open structure where players can choose their own path, leading to unique experiences for every player and multiple possible endings.3

| Ability/Verb | Map Gating Mechanism | Potential for Sequence Breaking |
| :---- | :---- | :---- |
| Mantis Claw (Wall Jump) | Vertical walls and high ledges | Extensive; often used to skip intended paths.35 |
| Monarch Wings (Double Jump) | Gaps and heights unreachable with single jump | Medium; can often be bypassed with pogo jumps.6 |
| Shade Cloak (Shadow Dash) | Shadow-gate barriers.3 | Low; typically a hard narrative gate. |
| Crystal Heart (Super Dash) | Long horizontal pits.32 | Low; requires specific vertical alignment. |

## **Technical Implementation and Optimization of 2D Worlds**

The performance and "feel" of a 2D map depend on robust technical foundations, particularly in games requiring high precision.37

### **Tiling and Endless Scrolling**

To efficiently render large worlds, developers use "tiling." Instead of loading a massive single map, the environment is broken into "pages" or tiles that are loaded and recycled dynamically.39 This allows for a seamless, "endless" scrolling experience without performance penalties or memory leaks.39 A native 2D framework may provide only 16 milliseconds to prepare a page to maintain 60 FPS, necessitating optimized "Set" methods for recycling visible nodes.39

### **Parallax Math and Perspective**

Parallax scrolling simulates depth by moving background layers at different ratios of the camera’s speed.19 In Unity, for example, using multiple cameras—one orthographic for the playable area and one perspective for the background—can provide "free" parallax, though many developers prefer code-based control for better precision.37

The basic formula for vertical or horizontal parallax movement is often tied to the division of the player's position:

![][image1]  
where ![][image2] is a constant that increases as the layer recedes into the distance.19 Foreground layers use a similar logic but may move faster than the focal point to simulate objects passing very close to the lens.19

### **Optimization Pitfalls**

A common pitfall in 2D platformer design is "precision-over-tuning," where the difficulty of a jump is not matched by the responsiveness of the controls.10 Playtesting is essential to identify "difficulty spikes"—sudden and extreme increases in challenge that frustrate players rather than engaging them.10 For example, early playtests of *Ori and the Will of the Wisps* led to the removal of the "Gorlek Mines" area because it was not fun and caused players to get lost in an unengaging way.41

## **Narrative Architecture and Environmental Storytelling**

In professional level design, the environment is the primary narrative medium.42 Environmental storytelling is the "art of arranging a careful selection of objects" to suggest a story to the discoverer.44

### **Indexical and Symbolic Storytelling**

* **Indexical Storytelling:** Remnants of past events, such as broken weapons, skeletons posed in vignettes, or graffiti.15 Finding a "broken picture frame" in a deserted house might allude to loss, while "untouched meals on a table" suggests a catastrophe happened suddenly.42  
* **Symbolic Storytelling:** Using the architecture itself to convey themes. In *Dishonored 2*, the verticality of the Dust District shows the working class living beneath those in power.15 In *Hollow Knight*, the "surrealist" descent into the subterranean subconscious is reinforced by motifs of doubling and dreams, such as the "Broken Vessel" being a distorted twin of the Knight.45

### **The Player as Archivist**

This design transforms the player into an "archivist" or "investigator," making them active participants in the storytelling.15 The lack of explicit dialogue in *Hollow Knight* or *Dark Souls* encourages players to piece together the world's history through item descriptions and background details.3 A single "Blue Lake" area in Hallownest exists purely for narrative reasons, providing a moment of calm and beauty that serves the story rather than a mechanical goal.4

## **Accessibility vs. Artistic Difficulty**

The modern discourse surrounding *Hollow Knight* and its sequel *Silksong* has highlighted the tension between "hardcore" design and accessibility.47

### **Challenge and Punishment**

Difficulty can be modeled as the sum of "challenge" (execution requirements) and "punishment" (the penalty for failure).49 *Hollow Knight* features high punishment; dying means losing Geo and having to trek back to a "shade" to retrieve it, while benches (save points) are often far apart.27 Some critics argue this is "unnecessarily obtuse" and acts as a barrier to disabled players or those with limited time.40

### **Inclusive Design Compromises**

While Team Cherry has stuck to their vision of an "intuitive, spatial understanding" of the map, other games in the genre have innovated with accessibility.48 *Prince of Persia: The Lost Crown* allows for "Memory Shards," which let players take screenshots and pin them to the map.51 *Silksong* appears to offer slight compromises, such as the "Fractured Mask" tool that prevents a fatal blow from killing the player, offering a "second chance" at life before returning to a rest bench—a feature particularly helpful for physically disabled players struggling with precision.51

### **Literacy and Automated Performance**

A "literacy gap" exists between experienced and new gamers. Experienced players have "automated" many of the basic movement and combat patterns, making them more resilient to the game’s punishments.49 For less experienced players, the high level of punishment in a game like *Silksong* creates a "double penalty," as they make more mistakes and have less effective health to survive those mistakes compared to the first game.49

## **Comparative Metroidvania Analysis: Metroid, Ori, and Hollow Knight**

While all three series share the Metroidvania label, their map design philosophies differ significantly.35

* **Metroid (Samus Returns/Dread):** Focuses on "organic rock formations" and tight, dense power-up distribution.35 Progression is often more linear, with Samus becoming vastly more powerful (up to 1000% more health) by the end of the game.35  
* **Ori (Blind Forest/Will of the Wisps):** Emphasizes "flow" and "momentum".38 The movement is "parkour-esque," and the map is designed for high-speed traversal.35 The first *Ori* focused more on "chase sequences" and platforming than combat, whereas the second game integrated more *Hollow Knight*\-style combat and a "charms" system.52  
* **Hollow Knight:** A more "generous" game that offers entire optional areas, bosses, and music tracks that most players will not find on a first run.35 It maintains a tighter balance; the character’s health only increases by less than 100%, ensuring that even late-game enemies remain a threat.35

| Feature | Super Metroid/Dread | Ori Franchise | Hollow Knight |
| :---- | :---- | :---- | :---- |
| Map Structure | Tight, dense, organic 35 | Fluid, platforming-focused 38 | Spacious, free-form, interconnected 35 |
| Progression Curve | Massive power spike 35 | Movement-based evolution 35 | Balanced, consistent threat 35 |
| Navigation Support | Automatic fog-of-war 28 | Clear, colorful, highlighted | Manual, diegetic, earned 27 |
| Combat Focus | Ranged, tactical | Evasive, momentum-based 35 | Melee-heavy, timing-focused 6 |

## **Synthesis and Conclusion**

Successful 2D map design is not merely a matter of arranging tiles but of creating a "spatial narrative" that respects the player’s intelligence and agency.10 The shift from linear "stages" to the interconnected "playable worlds" of Hallownest or Nibel reflects a deeper understanding of the relationship between body and space in digital environments.9 By employing diegetic UI, landmarks, and "world-first" architectural logic, designers can create environments that are both challenging and unforgettable.22

The future of 2D map design lies in the tension between the "uncompromising vision" of difficulty—where the world is a dangerous, indifferent entity—and the push for "assist modes" and inclusive design that allow for a wider range of player literacy and ability.48 As technical tools like dynamic tiling and perspective-based parallax continue to evolve, the ability to weave complex stories through the very ground the player walks upon remains the ultimate hallmark of a good 2D map.39 The design of Hallownest serves as a permanent case study in this craft, proving that even a world of bugs can achieve the grandeur of a cathedral and the intimacy of a personal tragedy through the power of its geography.14

#### **Works cited**

1. The Art of Level Design in Video Games \- SAE United Kingdom, accessed May 14, 2026, [https://www.sae.edu/gbr/insights/the-art-of-level-design-in-video-games/](https://www.sae.edu/gbr/insights/the-art-of-level-design-in-video-games/)  
2. 2D Design Basics \- AIGA, accessed May 14, 2026, [https://www.aiga.org/sites/default/files/2021-03/2A\_2D\_Design\_Introduction.pdf](https://www.aiga.org/sites/default/files/2021-03/2A_2D_Design_Introduction.pdf)  
3. Game Design Analysis: Hollow Knight | Game Analytics with Lenses ..., accessed May 14, 2026, [https://www.anuflora.com/game/?p=4501](https://www.anuflora.com/game/?p=4501)  
4. How to design a great Metroidvania map | PC Gamer, accessed May 14, 2026, [https://www.pcgamer.com/how-to-design-a-great-metroidvania-map/](https://www.pcgamer.com/how-to-design-a-great-metroidvania-map/)  
5. The Art of Platformer Level Design: Crafting Engaging, Fun Gameplay \- iD Tech, accessed May 14, 2026, [https://www.idtech.com/blog/platformer-level-design-made-simple](https://www.idtech.com/blog/platformer-level-design-made-simple)  
6. Game Analysis – Hollow Knight \- Bryson's Game Design, accessed May 14, 2026, [https://brysonsgamedesignblog.wordpress.com/2022/10/13/game-analysis-hollow-knight/](https://brysonsgamedesignblog.wordpress.com/2022/10/13/game-analysis-hollow-knight/)  
7. A Framework for Analysis of 2D Platformer Levels \- UC Santa Cruz, accessed May 14, 2026, [https://eis.ucsc.edu/papers/smith-sandbox-08.pdf](https://eis.ucsc.edu/papers/smith-sandbox-08.pdf)  
8. How to Metroidvania maps? : r/gamedesign \- Reddit, accessed May 14, 2026, [https://www.reddit.com/r/gamedesign/comments/1np6934/how\_to\_metroidvania\_maps/](https://www.reddit.com/r/gamedesign/comments/1np6934/how_to_metroidvania_maps/)  
9. (PDF) Game analysis "Hollow Knight" \- Phenomenological approach and spatial paradigm, accessed May 14, 2026, [https://www.researchgate.net/publication/335925312\_Game\_analysis\_Hollow\_Knight\_-\_Phenomenological\_approach\_and\_spatial\_paradigm](https://www.researchgate.net/publication/335925312_Game_analysis_Hollow_Knight_-_Phenomenological_approach_and_spatial_paradigm)  
10. Platformer Level Design Tips You Didn't Know About \- RetroStyle Games, accessed May 14, 2026, [https://retrostylegames.com/blog/platformer-level-design-tips/](https://retrostylegames.com/blog/platformer-level-design-tips/)  
11. How can level design be THIS bad? :: Hollow Knight: Silksong General Discussions \- Steam Community, accessed May 14, 2026, [https://steamcommunity.com/app/1030300/discussions/0/595159519774015680/](https://steamcommunity.com/app/1030300/discussions/0/595159519774015680/)  
12. Composition | The Level Design Book, accessed May 14, 2026, [https://book.leveldesignbook.com/process/blockout/massing/composition](https://book.leveldesignbook.com/process/blockout/massing/composition)  
13. Visual Movement & Level Flow \- Game Developer, accessed May 14, 2026, [https://www.gamedeveloper.com/design/visual-movement-level-flow](https://www.gamedeveloper.com/design/visual-movement-level-flow)  
14. Mapping & Wayfinding. World Maps | by Myk Eff | Understanding Games | Medium, accessed May 14, 2026, [https://medium.com/understanding-games/mapping-wayfinding-5fc21d054898](https://medium.com/understanding-games/mapping-wayfinding-5fc21d054898)  
15. Game Design: Environmental Storytelling | by John Mulholland \- Medium, accessed May 14, 2026, [https://medium.com/@johnmulholland/game-design-environmental-storytelling-3574aff0ff2b](https://medium.com/@johnmulholland/game-design-environmental-storytelling-3574aff0ff2b)  
16. Pixel art Platformer level design \- Full Guide | Sandro Maglione, accessed May 14, 2026, [https://www.sandromaglione.com/articles/pixel-art-platformer-level-design-full-guide](https://www.sandromaglione.com/articles/pixel-art-platformer-level-design-full-guide)  
17. Composition in Level Design, accessed May 14, 2026, [http://level-design.org/?page\_id=2274](http://level-design.org/?page_id=2274)  
18. 2D Platform Games Part 3: Scrolling and Parallax Backgrounds \- Katy's Code, accessed May 14, 2026, [https://katyscode.wordpress.com/2013/01/21/2d-platform-games-part-3-scrolling-and-parallax-backgrounds/](https://katyscode.wordpress.com/2013/01/21/2d-platform-games-part-3-scrolling-and-parallax-backgrounds/)  
19. Parallax Scrolling: A Simple, Effective Way to Add Depth to a 2D Game \- Code, accessed May 14, 2026, [https://code.tutsplus.com/parallax-scrolling-a-simple-effective-way-to-add-depth-to-a-2d-game--cms-21510t](https://code.tutsplus.com/parallax-scrolling-a-simple-effective-way-to-add-depth-to-a-2d-game--cms-21510t)  
20. A Study of Navigation Aids in Video Games \- SCSS \- School of Computer Science and Statistics, accessed May 14, 2026, [https://www.scss.tcd.ie/publications/theses/diss/2020/TCD-SCSS-DISSERTATION-2020-021.pdf](https://www.scss.tcd.ie/publications/theses/diss/2020/TCD-SCSS-DISSERTATION-2020-021.pdf)  
21. How do you feel about manual mapping vs automap? : r/DRPG \- Reddit, accessed May 14, 2026, [https://www.reddit.com/r/DRPG/comments/1rulogy/how\_do\_you\_feel\_about\_manual\_mapping\_vs\_automap/](https://www.reddit.com/r/DRPG/comments/1rulogy/how_do_you_feel_about_manual_mapping_vs_automap/)  
22. Interview with Team Cherry for Hollow Knight Silkson | ACMI, accessed May 14, 2026, [https://www.acmi.net.au/stories-and-ideas/from-ludum-dare-to-pharloom/](https://www.acmi.net.au/stories-and-ideas/from-ludum-dare-to-pharloom/)  
23. Team Cherry interview on the creation of Pharloom \- “If you think about it more as a world and a space, it's actually much easier to come up with stuff to put in it” : r/metroidvania \- Reddit, accessed May 14, 2026, [https://www.reddit.com/r/metroidvania/comments/1p4m84v/team\_cherry\_interview\_on\_the\_creation\_of\_pharloom/](https://www.reddit.com/r/metroidvania/comments/1p4m84v/team_cherry_interview_on_the_creation_of_pharloom/)  
24. Using colours to indicate direction : r/gamedev \- Reddit, accessed May 14, 2026, [https://www.reddit.com/r/gamedev/comments/2cl6hm/using\_colours\_to\_indicate\_direction/](https://www.reddit.com/r/gamedev/comments/2cl6hm/using_colours_to_indicate_direction/)  
25. Hollow Knight: A lesson in Game Design | by Dimas T. de Lorena Filho | Medium, accessed May 14, 2026, [https://dimasgibi.medium.com/hollow-knight-a-lesson-in-game-design-8cc4ff8aa1cd](https://dimasgibi.medium.com/hollow-knight-a-lesson-in-game-design-8cc4ff8aa1cd)  
26. Hollow Knight: How to Design an Immersive World \- Hookshot, Charge Beam, Revive, accessed May 14, 2026, [https://hookshotchargebeamrevive.wordpress.com/2018/10/29/hollow-knight-how-to-design-an-immersive-world/](https://hookshotchargebeamrevive.wordpress.com/2018/10/29/hollow-knight-how-to-design-an-immersive-world/)  
27. Getting Lost (by Design) in Hollow Knight \- superjump, accessed May 14, 2026, [https://www.superjumpmagazine.com/getting-lost-by-design-in-hollow-knight/](https://www.superjumpmagazine.com/getting-lost-by-design-in-hollow-knight/)  
28. To those who like the map system \- Hollow Knight \- GameFAQs, accessed May 14, 2026, [https://gamefaqs.gamespot.com/boards/204582-hollow-knight/77931074](https://gamefaqs.gamespot.com/boards/204582-hollow-knight/77931074)  
29. Hollow Knight: A Failure In Metroidvanias \- Reddit, accessed May 14, 2026, [https://www.reddit.com/r/metroidvania/comments/149ojvh/hollow\_knight\_a\_failure\_in\_metroidvanias/](https://www.reddit.com/r/metroidvania/comments/149ojvh/hollow_knight_a_failure_in_metroidvanias/)  
30. How the Hollow Knight devs mapped out their 'Metroidvania' \- Game Developer, accessed May 14, 2026, [https://www.gamedeveloper.com/design/how-the-i-hollow-knight-i-devs-mapped-out-their-metroidvania-](https://www.gamedeveloper.com/design/how-the-i-hollow-knight-i-devs-mapped-out-their-metroidvania-)  
31. Maturity is the realization that Deepnest is one of the best areas in the whole game : r/HollowKnight \- Reddit, accessed May 14, 2026, [https://www.reddit.com/r/HollowKnight/comments/1bki5ku/maturity\_is\_the\_realization\_that\_deepnest\_is\_one/](https://www.reddit.com/r/HollowKnight/comments/1bki5ku/maturity_is_the_realization_that_deepnest_is_one/)  
32. The Sliding Scale of Ability Gating Utility : r/metroidvania \- Reddit, accessed May 14, 2026, [https://www.reddit.com/r/metroidvania/comments/1omxc3m/the\_sliding\_scale\_of\_ability\_gating\_utility/](https://www.reddit.com/r/metroidvania/comments/1omxc3m/the_sliding_scale_of_ability_gating_utility/)  
33. Game Design Principles for a Metroidvania \- YouTube, accessed May 14, 2026, [https://www.youtube.com/watch?v=GWioZ8ahge0](https://www.youtube.com/watch?v=GWioZ8ahge0)  
34. Guide to Making Metroidvania Style Games: Part 1 \- Subtractive Design, accessed May 14, 2026, [http://subtractivedesign.blogspot.com/2013/01/guide-to-making-metroidvania-style.html](http://subtractivedesign.blogspot.com/2013/01/guide-to-making-metroidvania-style.html)  
35. What Can Hollow Knight and Metroid Learn From Each Other? | by ..., accessed May 14, 2026, [https://thomaswell.medium.com/what-can-hollow-knight-and-metroid-learn-from-each-other-5550601d1c12](https://thomaswell.medium.com/what-can-hollow-knight-and-metroid-learn-from-each-other-5550601d1c12)  
36. How important (to you) is the ability to sequence break in a Metroidvania? \- Reddit, accessed May 14, 2026, [https://www.reddit.com/r/metroidvania/comments/lja7e4/how\_important\_to\_you\_is\_the\_ability\_to\_sequence/](https://www.reddit.com/r/metroidvania/comments/lja7e4/how_important_to_you_is_the_ability_to_sequence/)  
37. Parallax in 2D \- different approaches pros and cons? : r/Unity2D \- Reddit, accessed May 14, 2026, [https://www.reddit.com/r/Unity2D/comments/5axj8n/parallax\_in\_2d\_different\_approaches\_pros\_and\_cons/](https://www.reddit.com/r/Unity2D/comments/5axj8n/parallax_in_2d_different_approaches_pros_and_cons/)  
38. Q\&A with Thomas Mahler Celebrating 8 Years of Ori The Game, accessed May 14, 2026, [https://www.orithegame.com/qa-with-thomas-mahler-celebrating-8-years-of-ori-the-game/](https://www.orithegame.com/qa-with-thomas-mahler-celebrating-8-years-of-ori-the-game/)  
39. Anatomy of a Scroller. How 2D platform games achieve infinite… | by Ahmed Farghaly, accessed May 14, 2026, [https://medium.com/@AhmedFarghaly/anatomy-of-a-scroller-6f811543e49d](https://medium.com/@AhmedFarghaly/anatomy-of-a-scroller-6f811543e49d)  
40. Finding the maps is not good game design at all :: Hollow Knight General Discussions, accessed May 14, 2026, [https://steamcommunity.com/app/367520/discussions/0/682991471067001204/?ctp=2](https://steamcommunity.com/app/367520/discussions/0/682991471067001204/?ctp=2)  
41. We are Moon Studios, creators of the Ori franchise. Ask us anything\! : r/pcgaming \- Reddit, accessed May 14, 2026, [https://www.reddit.com/r/pcgaming/comments/hfpsj8/we\_are\_moon\_studios\_creators\_of\_the\_ori\_franchise/](https://www.reddit.com/r/pcgaming/comments/hfpsj8/we_are_moon_studios_creators_of_the_ori_franchise/)  
42. Environmental Storytelling in Video Games, accessed May 14, 2026, [https://gamedesignskills.com/game-design/environmental-storytelling/](https://gamedesignskills.com/game-design/environmental-storytelling/)  
43. Understanding Environmental Storytelling in Video Games \- Dana Oberson, accessed May 14, 2026, [https://www.danaoberson.com/environmental-storytelling-in-games-3/](https://www.danaoberson.com/environmental-storytelling-in-games-3/)  
44. Environmental Storytelling in Video Games: Crafting Narratives beyond Words \- IntechOpen, accessed May 14, 2026, [https://www.intechopen.com/chapters/1225186](https://www.intechopen.com/chapters/1225186)  
45. The Surreal Philosophy of Hollow Knight \- Game Developer, accessed May 14, 2026, [https://www.gamedeveloper.com/design/the-surreal-philosophy-of-hollow-knight](https://www.gamedeveloper.com/design/the-surreal-philosophy-of-hollow-knight)  
46. What you Give is What you Get: Environmental Storytelling in Games \- RemptonGames.com, accessed May 14, 2026, [https://remptongames.com/2018/11/24/what-you-give-is-what-you-get-environmental-storytelling-in-games/](https://remptongames.com/2018/11/24/what-you-give-is-what-you-get-environmental-storytelling-in-games/)  
47. The Debate Over Silksong Points To A Growing Divide In The World Of Gaming \- Kotaku, accessed May 14, 2026, [https://kotaku.com/game-difficulty-hollow-knight-easy-mode-2000624441](https://kotaku.com/game-difficulty-hollow-knight-easy-mode-2000624441)  
48. Hollow Knight: Silksong Reinforces the Metroidvania Genre's Accessibility Barriers : r/Games \- Reddit, accessed May 14, 2026, [https://www.reddit.com/r/Games/comments/1npmzq7/hollow\_knight\_silksong\_reinforces\_the/](https://www.reddit.com/r/Games/comments/1npmzq7/hollow_knight_silksong_reinforces_the/)  
49. (Semi-academic) Analysis of the differing opinions about difficulty in Silksong from a teacher's perspective \[LONG READ\!\] \- Reddit, accessed May 14, 2026, [https://www.reddit.com/r/HollowKnight/comments/1ngqd17/semiacademic\_analysis\_of\_the\_differing\_opinions/](https://www.reddit.com/r/HollowKnight/comments/1ngqd17/semiacademic_analysis_of_the_differing_opinions/)  
50. Is HollowKnight on the same tier as Super Metroid in terms of all time great "Metroidvania" experiences? : r/nintendo \- Reddit, accessed May 14, 2026, [https://www.reddit.com/r/nintendo/comments/b4yzz8/is\_hollowknight\_on\_the\_same\_tier\_as\_super\_metroid/](https://www.reddit.com/r/nintendo/comments/b4yzz8/is_hollowknight_on_the_same_tier_as_super_metroid/)  
51. Hollow Knight: Silksong Reinforces the Metroidvania Genre's Accessibility Barriers \- IGN, accessed May 14, 2026, [https://www.ign.com/articles/hollow-knight-silksong-reinforces-the-metroidvania-genres-accessibility-barriers](https://www.ign.com/articles/hollow-knight-silksong-reinforces-the-metroidvania-genres-accessibility-barriers)  
52. Made a comparison of two of the most loved modern metroidvanias, Ori 2 and Hollow Knight. Whats your take on them? \- Reddit, accessed May 14, 2026, [https://www.reddit.com/r/metroidvania/comments/vv1yvp/made\_a\_comparison\_of\_two\_of\_the\_most\_loved\_modern/](https://www.reddit.com/r/metroidvania/comments/vv1yvp/made_a_comparison_of_two_of_the_most_loved_modern/)

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAmwAAAAyCAYAAADhjoeLAAADP0lEQVR4Xu3dS8huUxgH8OUuuacolAEDyQSlJBNFMjA45ZaYkNvUzMBASYakMDguAzFW5FImTqSMkHKJUso9lOOSy/O0n3XedXYf3ynn+773ff1+9W/t/ayvTu8ZPa2991qtAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwEr7OvJXZW/Vfhxq31cNAIAddGKbmrPR/B4AgB2WDdotdf3OOAEAwHLY3aam7Yf5BAAAy8NjUACAJfZnmxq2L+YT/+CPyA3zIgAAW+ObGo9vB77KdqB/BwDAf/Tm7D4bsV2z2ruR8yNPRc6r2if7Zlu7J/J85IW6/ypya13/VuOFkZcjd0aOi/weeTHyQc0DADCzpy32WuvuG2rZpI0erDHnjo2cUffnVNLPNaZ7a3y2TQ3azZGjI3dEXmmLf/eCGgEADppv26Kp+bhq/f2vdX1MOL6rlo9Px1W58TdfWuPTNV5WY66kza3r/xUAsCQeaPs3HPmYcJ1fwP+wxitqzN9+eV2/WuNjNaa+OvdWjbf3ifBRjS8NNQCALZFNyyGRIyI3zebWTf7W/gh0I5fUeOZQu6jt39SeOlwDAGyLfAz6S+SZ+cSaycbr83lxE0+0acXt0PkEAMB2OrLt7HtYZ0c+3SQAAP9re9vUsN09nwgPRx6fFwEA2D59Ze3+4Xp01bwAAMD2ySOZRhs1bLkpbHd15Mk2rbql3HC2b3vRv7o8LfJ25Lm6/zLyaOS7ugcAYBNHtY33Wnt9qI17jfW/ya9Ib5vVUt8Ko9d2t+kF/WzY8jSAPCkgXVMjAAAH0ZVtsddYX1VLr9V4euTkus6GLU8AyJW2E6rW6wAAbJE8O/OsNu071o9nuj5yTOTwyCNVe6hN52+eGzmsanlkU/qpxmWWX6FmY5krjwAAK+fi4ToPPU/ZmHV5fua4ipZnbWYzt2rej1w7LwIArLo8h/OuyEnziRXk0S0AwBK7sS0atusie4Y5AACWQP86tm8QbLUNAGDJ9IatH/wOAMCS6Stquc/ce+MEAAA775S2aNjy69c8mQEAgCXyRmRXXedpDp9Fft03CwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/ub9TXmHKKMtI8AAAAAElFTkSuQmCC>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAAXCAYAAADduLXGAAAAoElEQVR4XmNgGJSAEYhV0QWxgadA/B+KiQJXGEhQDFJ4DV0QFwApjkAXxAaiGDCd0ATE/mhiYHCTAaGYC4jvAzEfEH+Dq0ACIIW3gVgQiDdCxX5CxTEASHAnEM9El0AHMxgQJsyGslUQ0qgAPTJA7INQdj6SOBiAJKeh8VuQ2HDACRUQRRL7CMQbgLgHiA2RxMHAE10ACDyAmANdcBTAAACQdCSKrBERiwAAAABJRU5ErkJggg==>