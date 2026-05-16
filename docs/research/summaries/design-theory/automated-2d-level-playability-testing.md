# **Comprehensive Methodologies for Automated Playability and Reachability Validation in 2D Platformers and Metroidvanias**

## **Compile-Time Asset Validation and Input Regression Testing**

The automated quality assurance of modern two-dimensional (2D) games begins prior to the execution of physical simulations. Developers implement static validation tools that scan project directories, configurations, and scene graph metadata to detect logical inconsistencies.1 This pre-execution pipeline acts as an immediate filter, preventing non-functional builds from reaching more resource-intensive testing phases.1

Static validation frameworks perform strict data validation on pre-built entities, prefabs, and localization keys.1 For example, regression checkers verify that if a quest log references a specific item or key, that item is present in the active asset bundles.1 Similarly, components are evaluated to ensure that all non-optional object references are non-null across all scenes and prefab variants.1 By parsing localization files, the system confirms that every text tag mapped to a user interface element has a corresponding valid key within the localization databases, preventing missing text errors.1

Once static structural integrity is verified, developers turn to runtime input regression testing.3 The foundational approach to validating whether a modified level remains playable involves recording frame-precise player input streams and replaying them relative to the player character's initial spawn timestamp.3 In a perfectly deterministic environment, replaying these recorded inputs is highly effective for regression testing.3 However, this methodology is fragile.3 Minor modifications to level layouts, enemy patrol positions, or core character kinematics (such as jump acceleration or maximum velocity) quickly render recorded inputs obsolete, causing the simulated player to miss jumps or collide with hazards.3

To mitigate input desynchronization, developers employ structural workarounds 3:

* **Input Fudging and State Synchronization:** The testing harness monitors the actual position of the character against the historical recording. If the character's coordinates deviate past a specific threshold, the testing harness overrides the active physics solver, snapping the entity back to its recorded position. While this ensures the simulation completes, it introduces artificial states that do not occur during standard gameplay, reducing the overall validity of the test.3  
* **Headless and Closed-Loop Systems:** Rather than executing the full visual and audio pipeline, developers run automated test suites in a headless mode.5 This closed-loop infrastructure handles inputs, physics calculations, and collision events at thousands of frames per second, allowing developers to execute extensive regression tests within continuous integration (CI) environments.5  
* **Deterministic Physics Architecture:** To ensure input replay reliability, developers often bypass general-purpose physics engines (which introduce floating-point inaccuracies across different platforms) in favor of integer-based, axis-aligned bounding box (AABB) physics engines.3

| Component | Target Artifacts | Validation Mechanism | Output Metrics |
| :---- | :---- | :---- | :---- |
| **Static Data Validator** 1 | Prefabs, scene hierarchies, asset bundles, and localization tables. | Recursive metadata checking, reference tracking, and database key validation. | Reference integrity, null-pointer exceptions, and missing localization keys. |
| **Input Regression Replayer** 3 | Input state streams, player spawn matrices, and action timestamps. | Headless frame-by-frame replay of saved controller states. | Replay path accuracy, collision failures, and completion rates. |
| **State Sync Engine** 3 | Real-time coordinate states and historical player path recordings. | Coordinate threshold monitoring with forced coordinate snapping. | State deviation logs, correction frequencies, and execution success. |

## **Kinematic Trajectory Modeling and Parabolic Pathfinding Graphs**

Platforming gameplay revolves around precise spatial movement.8 To automate the verification of jump trajectories, developers must model the mathematics of movement and build pathfinding graphs directly from the level geometry.9 Movement constants—such as running speed, jump height, and gravity—must be finalized early in the design phase to avoid breaking existing level paths.3

Classic one-dimensional equations of motion govern jump trajectories under constant gravitational acceleration.8 A jump trajectory is calculated using the vertical position and velocity equations 8:

![][image1]  
![][image2]  
In these equations, ![][image3] represents the elapsed jump time, ![][image4] represents gravity (which acts in the negative ![][image5]\-direction), and ![][image6] represents the initial upward velocity.8 If a designer specifies a maximum jump height ![][image7] and a total jump duration ![][image8] (where ![][image9] represents the time to reach the apex of the jump), the required gravity and initial velocity are derived as follows 8:

![][image10]  
![][image11]  
Using these equations, developers build automated pathfinding graphs during the build phase to verify reachability.9

        
         
                \+--- Apex (v\_y \= 0\)  
               / \\  
              /   \\ \<--- Raycast checks along path  
             /     \\  
   Origin   /       \\   Landing Surface  
  \+--------+         \+-----------------+  
  |        |         |                 |  
  | Node A |         |     Node B      |  
  \+--------+         \+-----------------+

First, the system determines the boundaries of the playable space by querying all colliders in the active scene.10 Second, a coarse set of vertical raycasts is emitted across the environment.10 To ensure no walkable surface is missed, the spacing between these raycasts is configured to be narrower than the smallest walkable surface or the player's bounding box.10 Third, when a raycast hits an object with a walkable angle, a tangent-aligned flood-fill algorithm maps out the continuous walkable area using additional raycasts, simplifying complex 2D surfaces into 1D polylines.10

Once surfaces are mapped as hierarchical nodes, transition edges representing valid paths (such as jumps, drops, or dashes) must be verified.9 To validate jump connections, the system executes frame-by-frame coordinate calculations or runs raycasts along precalculated parabolic curves to check for intermediate obstacles.10 If the trajectory is unobstructed, a directed edge is created, storing key metadata: the start position, the end position, and the total airborne time.10 To keep the graph lightweight, redundant jump edges that start and end on the exact same surface are discarded.10

For complex platformers with dynamic hazards or tight level layouts, developers employ advanced waypoint routing frameworks like *Surfacer*.11 To minimize calculation times, the generator selects high-likelihood jump and land positions.11 These points include surface edges, closest interior points offset by the character's width, or positions located behind vertical barriers.11

              \+------------------+  
              |   Obstacle Wall  |  
              |                  |  
   Origin     |   \* Waypoint 1   |      Destination  
  \+--------+  |   (Calculated    |     \+-----------+  
  |        |  |    Deviation)    |     |           |  
  | Node A |  \+--------+---------+     |  Node B   |  
  \+---/----+           |               \+-----\\-----+  
     /                 v                      \\  
    /                  \+--- \* Waypoint 2       \\  
   \+--------------------------------------------+

Each waypoint stores its spatial coordinates, horizontal direction, and a calculated range of acceptable horizontal velocities (![][image12]\-velocities).11 Defining this velocity range ensures the character has sufficient speed to clear subsequent obstacles without overshooting the landing platform.11 Waypoints are calculated using a pre-order tree traversal, while individual movement steps are processed using an in-order tree traversal.11 If an intermediate waypoint is blocked, the engine backtracks, increases the overall jump height, and recalculates the trajectory.11 If a waypoint would force the character through geometry, it is flagged as "fake" and replaced with a valid waypoint positioned outside the adjacent corner.11

This structural validation contrasts with local heuristic solvers used by enemy AI units.12 Rather than evaluating paths globally, local AI units rely on real-time sensors: forward-facing raycasts detect wall heights to determine if a jump can clear them, while ceiling and floor sensors search for ledges to drop from or jump toward.12 While local sensors are useful for runtime AI navigation, global reachability validation is required during level design to ensure maps are structurally sound and free of dead-ends.9

| Optimization Technique | Implementation Mechanism | Impact on Validation | Performance Trade-offs |
| :---- | :---- | :---- | :---- |
| **Coarse Jump Validation** 10 | Reduces the frequency of trajectory collision checks during pre-processing (e.g., waiting several physics frames between raycasts). | Accelerates the overall generation time of the pathfinding navigation mesh. | Slightly increases the risk of missing small geometry overlaps. |
| **Asynchronous Raycasting** 10 | Grid-based cell approximations of world bounds utilizing marching squares to handle collision calculations on background threads. | Offloads raycast calculations from the main thread, keeping the editor responsive. | Demands complex data-syncing models to handle changes in scene geometry. |
| **Interior Point Culling** 11 | Prioritizes verifying interior paths over surface-edge nodes and stops processing a surface pair once a valid edge is found. | Minimizes the search space of potential jump trajectories. | May skip finding optimal paths or shortcuts in favor of the first valid option. |

## **Answer Set Programming and Topological Level Proofing**

While physical reachability is critical, Metroidvania games introduce progression gating.13 Progression in this genre is controlled by ability gates (e.g., unlocking a double jump or air dash to cross wide gaps) rather than simple physical keys.13 Consequently, a level might be physically open but topologically impassable if the player lacks the required ability to cross a gate.13 To prevent softlocks, where a player becomes trapped behind an ability gate without the means to progress or escape, developers analyze levels on both a topological and physical layer.13

Developers employ Answer Set Programming (ASP) and logic solvers like clingo to verify level layouts.17 In an ASP pipeline, the level is modeled as a set of logical constraints written in AnsProlog.17 This approach allows the solver to verify the map structure and geometry in a single pass, guaranteeing that all generated layouts satisfy the specified constraints.17

   
    
      \+------------+        Requires: Dash \[Locked\]  
      |  Biome A   \+----------------------------------+  
      |  (Start)   |                                  |  
      \+-----+------+                                  v  
            |                                   \+-----+------+  
            | Contains: Dash                    |  Biome B   |  
            v                                   | (Optional) |  
      \+-----+------+                            \+-----+------+  
      | Gate Room  |                                  |  
      |  (Puzzle)  | \<--------------------------------+  
      \+------------+         Backtrack Path (Unlocked)

To optimize calculation times, developers split the validation workload into individual rooms.17 High-level progression gating is analyzed across a global room connectivity graph first, and then individual room geometries are solved iteratively.17 Within each room, the solver identifies distinct "platforms" (walkable surfaces grouped by the player's base jump height) to determine directionality and reachability based on unlocked abilities.17

Using constraint-based reachability rules, the system identifies and prevents softlocks 20:

* **Forward Reachability Analysis:** The solver maps all coordinates that are reachable from the player's spawn point given their currently unlocked abilities.  
* **Backward Reachability Analysis:** The solver verifies that for every reachable coordinate, there exists a valid return path back to a safe progression hub or the start of the level.  
* **Sink Detection:** Any coordinate that is reachable going forward but unreachable going backward is flagged as a "sink" (a potential softlock).20 The solver then either flags this area for the designer or triggers an automated repair script to adjust the geometry.20

To bypass complex local installation requirements, developers can host logic solvers on external servers, allowing local engines to query the solver via APIs.22 This layout-focused proofing ensures that players are safely "locked in" key areas to force them to learn new mechanics before they can proceed.16 This design philosophy is mirrored in games like *Super Metroid*, where players are trapped in Brinstar until they master the mechanics required to escape.16

| Exploratory Gating Dimension | Design Principles | Gating Rules & Implementations | Pacing Impact |
| :---- | :---- | :---- | :---- |
| **World Exploration** 16 | Broadest level of progression. Divides the world into distinct thematic biomes. | Gated by major bosses, narrative flags, or mandatory ability acquisitions. | Guides the high-level flow of the game, preventing players from entering endgame zones early. |
| **Level Exploration** 16 | Granular progression within a single biome or world zone. | Controlled by level-specific mechanics, shortcuts, or locked doors. | Encourages exploration within a zone, leading players to critical upgrades. |
| **Room Exploration** 16 | Most granular level of progression. Localized puzzles within single screens. | Gated by hidden switches, simple platforming challenges, or destructible blocks. | Introduces short gameplay loops that reward player curiosity and observation. |

In addition to topological validation, automated systems can repair unstable layouts.21 For example, image-based segmentation pipelines using models like YOLOv8 can detect structural gaps or physics-based instabilities in simulated levels.21 Once instability is detected, the repair tool applies modifications directly to a 2D representation of the level, using a default material (such as wood, which balances weight and friction to prevent collapsed structures) to fill gaps before exporting the repaired map to XML format for final re-evaluation.21

## **Autonomous Playtesting via Deep Reinforcement Learning and Visual Models**

While static solvers and pathfinding graphs are useful for validating structural layouts, they cannot account for real-time physics, complex enemy behaviors, or player combat interactions.2 To validate levels under dynamic runtime conditions, developers employ automated gameplay agents.6

Using frameworks like Unity ML-Agents, developers train virtual players using reinforcement learning to play through levels at high speeds, running thousands of simulations concurrently.2 To ensure these agents explore levels thoroughly rather than simply rushing to the exit, developers implement specialized reward models 23:

* **Curiosity-Driven Rewards:** In early level development, standard goal rewards (such as reaching the exit) are too sparse to guide agent learning. Developers introduce curiosity-driven intrinsic rewards that incentivize agents to explore unvisited coordinates, helping uncover collision clipping issues, hidden hazards, and geometry errors.23  
* **Task-Based Reward Shaping:** In complex environments, developers shape rewards to guide agent behavior. For example, in collaborative physics tasks (such as pushing heavy blocks to clear paths), developers reward agents with small increments (+0.001) for moving blocks away from their spawn points, ensuring they learn the mechanics needed to complete the puzzle.24  
* **Input Regularization (SPAC and LZ-SAC):** To make automated agents behave more like human players, developers apply information-theoretic bottlenecks to the policy.26 Algorithms like SPAC penalize complex or erratic input combinations using predictive models, while LZ-SAC uses compression algorithms (like LZ4) to evaluate the complexity of action sequences, rewarding agents that find simple, human-like solutions.26

   
    
   Inputs:  Return-to-Go (R\_t) \---\>  
            State (s\_t)         \---\> \[  Modeling  \] \---\> Action (a\_t)  
            Action (a\_t-1)      \---\>

To improve training stability, developers can use Decision Transformers (DT) to train policies offline as a sequence modeling task.27 This approach bypasses standard Temporal Difference (TD) learning, which often suffers from unstable policy calculations because it relies on estimating future rewards during active training.27

For games with highly complex visual styles or those lacking robust API access, developers use visual object-centric reinforcement learning pipelines.28 Tools like *Lap* use LLMs (such as ChatGPT-O1-mini) to convert visual game frames into numeric matrices to suggest moves.29 For visually demanding action-platformers like *Hollow Knight*, developers deploy models like OC-STORM, which utilize visual tracking algorithms (like Cutie) to perceive the screen.28

By learning to track player masks, hazards, and enemy hitboxes directly from video frames, these visual agents can validate complex platforming challenges and boss fights without requiring direct access to internal game code.28 This visual validation ensures that levels are balanced and fair, matching the design standards of human-curated layouts.31

## **Synthesis of Automated Level Testing Methodologies**

Every automated testing framework has unique strengths, trade-offs, and hardware requirements. Selecting the optimal toolset depends on the game's complexity, engine architecture, and production phase.3

| Testing Methodology | Technical Mechanism | Target Genre / Use Case | Primary Strengths | Key Limitations |
| :---- | :---- | :---- | :---- | :---- |
| **Static Data & Prefab Validation** 1 | Asset database parsing and reference checks before runtime. | Large-scale projects with complex databases and bundles. | Detects logical errors, broken links, and missing assets instantly. | Cannot validate physics, movement, or path reachability. |
| **Kinematic Pathfinding Graphs** 9 | 1D polyline generation and parabolic jump trajectory verification. | High-precision platformers and exploration-focused layouts. | Fast calculation; maps out physical reachability across the entire map. | Hard to scale to dynamic objects or physics engines with high friction variability. |
| **Answer Set Programming (ASP)** 17 | Declarative constraint solving and platform-connectivity analysis. | Metroidvanias with progression locks and keys. | Guarantees complete progression path solvability; eliminates softlocks. | High computational complexity; requires simplifying maps into discrete rooms. |
| **Input Playback (TAS)** 3 | Frame-precise controller state replaying on deterministic engines. | Difficulty-focused platformers and specific challenge rooms. | Easy to configure; guarantees exact replication of developer playthroughs. | Highly fragile; minor edits to level design or physics constants break playback. |
| **Deep Reinforcement Learning** 2 | Curiosity-driven training and simulation playtests via ML-Agents. | Physics-heavy games, combat encounters, and balance testing. | Discovers unexpected edge cases, visual collision bugs, and sequence breaks. | Demands long training times; policies are sensitive to changes in movement values. |
| **Vision-Based Visual Solvers** 28 | Real-time object tracking and segmentation from visual frame inputs. | Games lacking robust API coordinates or complex action-adventure titles. | Operates directly on visual frames, requiring zero internal state access. | High GPU processing requirements; sensitive to changes in visual design and assets. |

## **Designing Levels for Automated Testing: Best Practices**

To maximize the value of automated testing, developers should design game systems with testability in mind from the start of production.3

First, developers should define and lock in core movement constants (such as jump heights, dashes, and running speeds) early in development.3 Attempting to adjust physics values late in production to fit specific level layouts will invalidate existing pathfinding graphs and break trained reinforcement learning models, requiring extensive re-engineering and retraining.3

Second, developers should design levels using a modular, segmented structure.3 Instead of forcing testing agents to play through entire levels to verify reachability, levels should be split into self-contained screens or challenge rooms.3 This modular design allows developers to write target unit tests for specific interactions—such as verifying that a player can cross a particular gap with a dash-jump combination—speeding up testing in continuous integration pipelines.1

Third, developers should implement a hybrid validation pipeline that combines static and dynamic testing.2 Static solvers and pathfinding graphs should be used during the initial layout phase to guarantee that the map topology is solvable and free of softlocks.17 Once the layout is confirmed, developers can deploy automated reinforcement learning agents and visual solvers to test combat difficulty, verify dynamic physical obstacles, and identify performance bottlenecks.2 This two-tiered validation process ensures that levels are structurally correct while maintaining polished, human-friendly gameplay.2

#### **Works cited**

1. Let's talk Unit testing. How practical is automated testing in games? \- Unity Discussions, accessed May 16, 2026, [https://discussions.unity.com/t/lets-talk-unit-testing-how-practical-is-automated-testing-in-games/757327](https://discussions.unity.com/t/lets-talk-unit-testing-how-practical-is-automated-testing-in-games/757327)  
2. Game Development with AI: ChatGPT Complete Guide (2025) \- Generalist Programmer, accessed May 16, 2026, [https://generalistprogrammer.com/tutorials/game-development-ai-chatgpt-complete-guide](https://generalistprogrammer.com/tutorials/game-development-ai-chatgpt-complete-guide)  
3. Automated playtesting in a 2D platformer \- Game Development Stack Exchange, accessed May 16, 2026, [https://gamedev.stackexchange.com/questions/210463/automated-playtesting-in-a-2d-platformer](https://gamedev.stackexchange.com/questions/210463/automated-playtesting-in-a-2d-platformer)  
4. How to automate playtesting? : r/gamedev \- Reddit, accessed May 16, 2026, [https://www.reddit.com/r/gamedev/comments/1czeb7m/how\_to\_automate\_playtesting/](https://www.reddit.com/r/gamedev/comments/1czeb7m/how_to_automate_playtesting/)  
5. Closed-Loop Development: How AI Agents Build Software While You Sleep \- Medium, accessed May 16, 2026, [https://medium.com/@alexzanfir/closed-loop-development-how-ai-agents-build-software-while-you-sleep-6df42cd05a85](https://medium.com/@alexzanfir/closed-loop-development-how-ai-agents-build-software-while-you-sleep-6df42cd05a85)  
6. Automate your playtesting: Create virtual players for game simulation \- Unity, accessed May 16, 2026, [https://unity.com/blog/games/automate-your-playtesting-create-virtual-players-for-game-simulation](https://unity.com/blog/games/automate-your-playtesting-create-virtual-players-for-game-simulation)  
7. Celeste and TowerFall Physics \- Maddy Thorson \- Medium, accessed May 16, 2026, [https://maddythorson.medium.com/celeste-and-towerfall-physics-d24bd2ae0fc5](https://maddythorson.medium.com/celeste-and-towerfall-physics-d24bd2ae0fc5)  
8. Physics for Game Dev — A Platformer Physics Cheatsheet | by Bruno Guedes | Medium, accessed May 16, 2026, [https://medium.com/@brazmogu/physics-for-game-dev-a-platformer-physics-cheatsheet-f34b09064558](https://medium.com/@brazmogu/physics-for-game-dev-a-platformer-physics-cheatsheet-f34b09064558)  
9. How to implement A\* pathfinding in a 2D platformer with gravity? : r/gamedev \- Reddit, accessed May 16, 2026, [https://www.reddit.com/r/gamedev/comments/1lac4b/how\_to\_implement\_a\_pathfinding\_in\_a\_2d\_platformer/](https://www.reddit.com/r/gamedev/comments/1lac4b/how_to_implement_a_pathfinding_in_a_2d_platformer/)  
10. Platformer analysis: Generating graphs for pathfinding – Robert ..., accessed May 16, 2026, [https://rmminusr.com/platformer-toolset-automatic-pathfinding/](https://rmminusr.com/platformer-toolset-automatic-pathfinding/)  
11. How to build a platformer AI \- Part 3: Calculating jump trajectories, accessed May 16, 2026, [https://devlog.levi.dev/2021/09/building-platformer-ai-part-3.html](https://devlog.levi.dev/2021/09/building-platformer-ai-part-3.html)  
12. DevLog \#11 \- Enemy AI and platformer pathfinding in Unity \- torch in sky, accessed May 16, 2026, [https://torchinsky.me/kwad-devlog-11/](https://torchinsky.me/kwad-devlog-11/)  
13. How to create your own Metroidvania \- Dreamnoid, accessed May 16, 2026, [https://dreamnoid.com/articles/how-to-create-your-own-metroidvania](https://dreamnoid.com/articles/how-to-create-your-own-metroidvania)  
14. Metroidvania Generation \- Aran P. Ink, accessed May 16, 2026, [https://aran.ink/metroidvania-generation](https://aran.ink/metroidvania-generation)  
15. Metroidvania Toolkit \- Dev diaries \- Defold game engine forum, accessed May 16, 2026, [https://forum.defold.com/t/metroidvania-toolkit/81541](https://forum.defold.com/t/metroidvania-toolkit/81541)  
16. The pacing of metroidvania games \- Ruben Bimmel \- Itch.io, accessed May 16, 2026, [https://rubenbimmel.itch.io/metroidvania-pacing-chart/devlog/87273/the-pacing-of-metroidvania-games](https://rubenbimmel.itch.io/metroidvania-pacing-chart/devlog/87273/the-pacing-of-metroidvania-games)  
17. Procedural Generation In 2d Metroidvania Game With Answer Set Programming \- Aircc Digital Library, accessed May 16, 2026, [https://aircconline.com/csit/papers/vol13/csit130511.pdf](https://aircconline.com/csit/papers/vol13/csit130511.pdf)  
18. Procedural Generation in 2D Metroidvania Game with Answer Set Programming, accessed May 16, 2026, [https://www.researchgate.net/publication/369612320\_Procedural\_Generation\_in\_2D\_Metroidvania\_Game\_with\_Answer\_Set\_Programming](https://www.researchgate.net/publication/369612320_Procedural_Generation_in_2D_Metroidvania_Game_with_Answer_Set_Programming)  
19. PROCEDURAL GENERATION IN 2D METROIDVANIA GAME WITH ANSWER SET PROGRAMMING AND PERLIN NOISE \- ResearchGate, accessed May 16, 2026, [https://www.researchgate.net/publication/371752050\_PROCEDURAL\_GENERATION\_IN\_2D\_METROIDVANIA\_GAME\_WITH\_ANSWER\_SET\_PROGRAMMING\_AND\_PERLIN\_NOISE](https://www.researchgate.net/publication/371752050_PROCEDURAL_GENERATION_IN_2D_METROIDVANIA_GAME_WITH_ANSWER_SET_PROGRAMMING_AND_PERLIN_NOISE)  
20. Paper Database \- PCG Workshop, accessed May 16, 2026, [https://www.pcgworkshop.com/database.php](https://www.pcgworkshop.com/database.php)  
21. From Unstable to Playable: Stabilizing Angry Birds Levels via Object Segmentation \- arXiv, accessed May 16, 2026, [https://arxiv.org/html/2509.23787v1](https://arxiv.org/html/2509.23787v1)  
22. PROCEDURAL GENERATION IN 2D METROIDVANIA GAME WITH ANSWER SET PROGRAMMING AND PERLIN NOISE \- Aircc Digital Library, accessed May 16, 2026, [https://aircconline.com/ijaia/V14N3/14323ijaia02.pdf](https://aircconline.com/ijaia/V14N3/14323ijaia02.pdf)  
23. Augmenting Automated Game Testing with Deep Reinforcement Learning \- IEEE Web Hosting, accessed May 16, 2026, [https://ieee-cog.org/2020/papers/paper\_215.pdf](https://ieee-cog.org/2020/papers/paper_215.pdf)  
24. Reinforcement Learning in game development and testing \- Ada Beat, accessed May 16, 2026, [https://adabeat.com/case-adventures/reinforcement-learning-in-game-development-and-testing/](https://adabeat.com/case-adventures/reinforcement-learning-in-game-development-and-testing/)  
25. Improving Playtesting Coverage via Curiosity Driven Reinforcement Learning Agents, accessed May 16, 2026, [https://www.researchgate.net/publication/356873952\_Improving\_Playtesting\_Coverage\_via\_Curiosity\_Driven\_Reinforcement\_Learning\_Agents](https://www.researchgate.net/publication/356873952_Improving_Playtesting_Coverage_via_Curiosity_Driven_Reinforcement_Learning_Agents)  
26. Reinforcement Learning with Simple Sequence Priors \- OpenReview, accessed May 16, 2026, [https://openreview.net/forum?id=qxF8Pge6vM](https://openreview.net/forum?id=qxF8Pge6vM)  
27. \[ICLR 2022\] Part 3: Reinforcement Learning as a sequence modeling problem \- LG AI Research BLOG, accessed May 16, 2026, [https://www.lgresearch.ai/blog/view/?seq=232](https://www.lgresearch.ai/blog/view/?seq=232)  
28. object-centric world models improve reinforcement learning in visually complex environments \- arXiv, accessed May 16, 2026, [https://arxiv.org/html/2501.16443v1](https://arxiv.org/html/2501.16443v1)  
29. \[2507.09490\] Towards LLM-Based Automatic Playtest \- arXiv, accessed May 16, 2026, [https://arxiv.org/abs/2507.09490](https://arxiv.org/abs/2507.09490)  
30. (Semi-academic) Analysis of the differing opinions about difficulty in Silksong from a teacher's perspective \[LONG READ\!\] \- Reddit, accessed May 16, 2026, [https://www.reddit.com/r/HollowKnight/comments/1ngqd17/semiacademic\_analysis\_of\_the\_differing\_opinions/](https://www.reddit.com/r/HollowKnight/comments/1ngqd17/semiacademic_analysis_of_the_differing_opinions/)  
31. A COMPARISON OF PROCEDURAL-GENERATED AND HUMAN-DESIGNED TWO-DIMENSIONAL PLATFORMER GAME LEVELS BALIM ALPAY \- GCRIS, accessed May 16, 2026, [https://gcris.ieu.edu.tr/bitstreams/386149ca-ecc1-453d-868d-1a5345142dcc/download](https://gcris.ieu.edu.tr/bitstreams/386149ca-ecc1-453d-868d-1a5345142dcc/download)  
32. Is it okay to make levels that you personally can't beat? : r/IndieDev \- Reddit, accessed May 16, 2026, [https://www.reddit.com/r/IndieDev/comments/1ldou1v/is\_it\_okay\_to\_make\_levels\_that\_you\_personally/](https://www.reddit.com/r/IndieDev/comments/1ldou1v/is_it_okay_to_make_levels_that_you_personally/)  
33. The Role of Playtesting in Game Development \[Part 1\] | by Cassia \- Medium, accessed May 16, 2026, [https://medium.com/@shiphrah\_/the-role-of-playtesting-in-game-development-part-1-5ff2399531d4](https://medium.com/@shiphrah_/the-role-of-playtesting-in-game-development-part-1-5ff2399531d4)  
34. This is what takes Celeste from an A+ game to a B/B- imo. I'm doing nothing differently, but getting different results each time. Every room is just a series of dice rolls. 10% chance of clearing obstacle A \* 20% chance of clearing obstacle B \* … String enough probabilities together, \- Reddit, accessed May 16, 2026, [https://www.reddit.com/r/celestegame/comments/10h6peo/this\_is\_what\_takes\_celeste\_from\_an\_a\_game\_to\_a\_bb/](https://www.reddit.com/r/celestegame/comments/10h6peo/this_is_what_takes_celeste_from_an_a_game_to_a_bb/)  
35. Celeste (video game) \- Wikipedia, accessed May 16, 2026, [https://en.wikipedia.org/wiki/Celeste\_(video\_game)](https://en.wikipedia.org/wiki/Celeste_\(video_game\))  
36. Automatic generation and evaluation of platform games \- Universidade de Lisboa, accessed May 16, 2026, [https://repositorio.ulisboa.pt/bitstream/10451/61522/1/TM\_Diogo\_Soares.pdf](https://repositorio.ulisboa.pt/bitstream/10451/61522/1/TM_Diogo_Soares.pdf)  
37. Graph-based generation of action-adventure dungeon levels using answer set programming | Request PDF \- ResearchGate, accessed May 16, 2026, [https://www.researchgate.net/publication/327635798\_Graph-based\_generation\_of\_action-adventure\_dungeon\_levels\_using\_answer\_set\_programming](https://www.researchgate.net/publication/327635798_Graph-based_generation_of_action-adventure_dungeon_levels_using_answer_set_programming)

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAmwAAAAuCAYAAACVmkVrAAAEvUlEQVR4Xu3d24tvYxgH8Hcj5JBTUnKYiNiU8ymHcENuyOmCaOdQjilJSW6IHFNCComSIhcoFFJESSRJys0ul/4I3m/vWvu3ZpmZvX+/GTPj5/Opp1nrXWvPrLXXzdPzvO9apQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwDLuqfFQjb3GBwAA2Fh71niuxj7d/h81LpwcXldJFp8qk2sBAKC0hO3pGgd0+z/UuGlyeF0t1Pi6xn6jcQCATeGuGn/V+LKs3JY8sMYrNU6vcUiNS2s8vuiM2eXvvlw2LmG6v8a340EAgM0gFa0zBvu/dmNLSZL2SWnJXeK6snKCt5TDa3xRWvLXu6TGw4P9XbF3jUfHg6vweY1zR2OXlXafAAAbJknTezUOHowlIXtrsD+UhO2d8eCUzqqxvcbug7E7S0v8Tqxx5WB8JZlr9sx4cBVeL/+s7qXqJmEDgDmXCs2DNbYMxraW6atS/5a+gjScaJ+W53JJyjQJ2w2lJTy591TDFkqrpCUZ/K3bznjaoH3F7rsax5VdM0vClvs9qUyex1E1Du229+1+Rlq+ub7Mqfuw2+7PAwDmyB417q1xe42zB+NJTC4Y7G+ktD5nSdheK62t+WaN4xed0SRRu6a0atq7pa3+vK/GpzX+rPF7t70a0yZseR63lfa38zxSTXujtGsde7W068v/w/c1Pqpx6qIzAID/vD6ZSNvvydISl8j8rbQgh/O3eqn6ZLVkkqKdxVqZNmHLqs5UznonlFaFOmwwluMPDPaT2OWee/ndVw32ZzVNwtafm+vfXibPI0nbHd322P6lrRpdGI0DAHMi1ZwkMwtl8asizittovywRbrWziythbdSHNudO23CNtYvQkirMZK4fVDjlB1ntASpXxyQhOnH0uaqTeuisvgeLq/x9mhseG9D/fM4prSq2nCu2nLvfVsordLmvWwAMOeeL23VZS/ztZZLVraU9a+wJYFMi3KcsGVsKXmx7PBY/l3O71d4bist2cu9xDhBS2VrrRLWaSpsvTyPYTJ5cmnXuJS0Si8eDwIA8yfVp48G++PXWQxlAnwqRpk7tbNYLsmY1kJpFcDxKtGMLaV/pUf/9/sKW9/iTHtxWJ0bt4C3lcm5p3U/ZzVLwpZrHd7rrYPtofzuVNcWuv2raxy94ygAMFfSfvu42z6i7HqrcT1lAv7N3XYqXz+XyQT7rOLMNfcvlE378MVuO/L9z1Tc+opZVlK+X9oq2LRbM8G/T9CS5KXClSQuLcobu/FZzZKwvVDjyG4717JSOzRJa+YgJinduugoADBX0gr8qsazpSVumaC/2STZStsy89Aeq3FFN9b7qcYj3XbGry3t6wZJ1n6pcX13rJdKYZK4W0prlw5bwOfUeKm0pC5J22rMkrBlRWuqbGnLju9zKIna3aV95zRz8gCAOZVqU15/0X8nMxWn5b4gMC8OKpNELNWrYfVtra31lw4AgP+htAJTVUvilpZa2orjN+nPk1Sl0j7t32v2RGktUQCATSuVps9KmxN2fo3dFh+eS5mo/01pbcfMVQMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIBN5W9I760UzELr1AAAAABJRU5ErkJggg==>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAmwAAAAuCAYAAACVmkVrAAACo0lEQVR4Xu3du4oUQRQG4BLvt0QRTNT1gngDTRQTBSPFSAQNBCMNBDMfwMBIUREMDBQRTMXAC6igkWAi+gImm/kYeo7VwzSN7mzvzjoTfB/8bHf1DLVsdDhVXVsKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAZqyN3Iuu6DwAAmA4zkc+RDZ1xAACmxI3Il+4gAADT42PkeHdwDnsia7qDi/SrOwAAwNDT0m85dF8Z/343BRsAMFVORw5GljX32yNbho+XxFxzrm9+ztdCCrYVkWORi6XOtzKyPHIqciHyurle6r8DAMBIWbhcjfwotYDJztazUveRLZVxz7mQgu1V5F6pv8ebyKPI1sj7yNcmOX5k8AUAgEnIIuduZFVkNnK0Gc8C6lpz3ZUdsc3zyL8KqIXMOUqfgi07Zi8ju1pjOe+55npj5Hmpb6oCAExcdrqy2MniJTtc7X1jJ1rX47TYOXeXulTZzuXImc7YycEXOvKzuT8tlz9TFo4PIvub+5lSjxSZbwEIAPBfZMFyuHV/qNRC5m8W22Eb6DPnKH06bB8i31v32eGbLcO9dLks64UDAGDqvItsat1faV135csBuc9rVG6WuQuwPnOO0qdg+1Tq3AO5HNou0J6U2mFL5yM7Ws8AACbmYWRbc52dr/ksTS7WOOfsU7BdKsMO285Si7UXw8d/irXbpXYJD7TGAQAmam+pXadbkbNluDy4lMY5Z5+CLffQZdH2M/K41OXQ/B0Grpf6hmi+RQoAwJj0+U8H7Zccssj7VmrBBwDAFMiDenPJc6a5zzPW7kdWDz4AAMBkrY28LfXA3jxSJI//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAX7DWggUOqJt+tbAAAAAElFTkSuQmCC>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAbCAYAAACwRpUzAAAAkElEQVR4XmNgGAJABl0ABqSAuB5dEAYsgTgWXRAGMoDYFF0QBNiAuB+IRZEFuYBYGIhdgPgxlC0IxEzIikB2vUYWgAFmIO4A4r3oEiAgBMSbgXgGugQI6APxNSAuQpcAgUgg/g/EDgwQK0CO4wdJwOw7DMQKQKwBxI1AzA6SBAEbID4BxN0MkFDCADD/jjgAAMP6D1IJanq/AAAAAElFTkSuQmCC>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAaCAYAAACO5M0mAAAA3klEQVR4Xu3Rvw7BUBQG8E9IJAyIWI0SIWI08A4GkRhYJGxdDUYhRvEEJoM/C4uXYBIvYDB4CL6Te29zWrNB4kt+aXt6T29PC/zzzSQoRZHwDZcKrWhHG1rQCKbRj3SfqWXPxZC2lFbrUKIZxVStTHOKukKcllRzBZsmdcKFF1QnzHaybU7V0IVZqFOkC4LNaNBTXcsgPXw2IwPzOWQQed8+PeimF7nk6UonGtDR8iNPkU+TVDU3nBz9eLY4ttdZmGn3CE08oTtMd5XWdKCCXiSRLds0hXlqHcG/8zN5A7EiIByjKy0WAAAAAElFTkSuQmCC>

[image5]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAaCAYAAACO5M0mAAAA4UlEQVR4Xu2QwQoBURSGfxQlSknJapZWilIUxYNYirWVnVKylBJ7e6UoWdso5Rlm7yH4z9yZO3cuSxvlq2+ae86Zc85c4M+3idGkHbQp0A2905aVO9KqvKTonHbpmU6huge4tC4v8pjQhB8c6RIgC/WxTEQTqrV0cWlDlwEOXcDavY1oN0HO3liTIVT3ABm7pSUj5iF7lo2zQy/4cGU9hPtl6JI+w3SIJK90Rg/0BvVzGrkW2U8uO6ADVTQwYsjTE3345yLd0zXUFE2arqCuokZ3fpE0eCNH+3RMKzQeTf8GLxtMHqubtTskAAAAAElFTkSuQmCC>

[image6]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAZCAYAAADuWXTMAAAA2klEQVR4XmNgGCqAH4gXAjEjugQxQB+IrzGQqTkSiB+gCxIDQLY1AfEidAligCoQbwNiDXQJYoA7EE8CYnZ0CRAAOYsFixgTlF3EADEAA4gC8XQgPg3E5kjiiUCcAmXzATEnkhwYmAJxPRAzM0BCEmQDDIDitRqJjwEsgdiQAeJEUByC4hIZBKDxsQIpBkg08CKJgVyDbhhWYAvEGWhiIAORDcMJQH4FeQEZuKLxcQKQ30C2gwAoemIZIMmRKMDDAImqVgaI30HRhB7veAHIAGEg5kKXGAVDGgAAwrIUHztiUCIAAAAASUVORK5CYII=>

[image7]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAZCAYAAAA8CX6UAAAA6ElEQVR4Xu2RIQ7CQBBFPwmCEEg4QhMMguAQGFIUAgOWY+BIwOAQhAPgsByAA6AxKCQ3gfnMhu5Om6aA7U9ems6bbmd3gTLfZiRshKVh4Lytk55zQdpIFnsKM2EotJz33VmYeC6VunCANtvwoxPUxaFKJxIuwtXUmQ60Th+FKp0Y+sejqTNTqOPEnDw3C2jz2gpojY49uYmgY9+EOfRwfe7Osy83MZJtNUP1zk/bqhjH90Lb4gSchM1j4xhe/dfXzmu2Ya3Q+Wyhf+SzZlxD2AkroWrcJ13oLXERn73QFx4ZLusMy5T5Oy8BFTnNANCajgAAAABJRU5ErkJggg==>

[image8]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAaCAYAAABYQRdDAAABX0lEQVR4Xu2UTytGQRTGH39CYoFIsniLRKLsWRAbH8LaSkhKWaMslIVspGxFdlKUsrHhC9jY+xA8z3tm7j3NvfW+ykbdp37dOWfOnJlz7twLVPojbZOV1NlKhsgcGUjmGqmbnJORdOKWPJJn8kWWSYsPcBoLRNXIC5L4CTLjbI0/yKLzRek0D+TM+RbIu7Pr2XfIrHdS3+SG9Cd+JVAl6mGUxqfOrifdIrukzfnfYInnna8LdsIn5P3T89LZmZQ47d8nLPFksDdgm3i0YTsZRHF9QQrQogPYIqmHrAb/JuyGxLmmNE3uyHDiX4f1U339lZSoLKGku+j72VAqZY8cwkqVdGL1K0qn1Gmb1hosaWewdRP2yVQWUSy9rJpMejFHsCC9ADFOLpCXquukr6YW7FHSF8al0peTXhdxRXpDjJLewzZUe06Cv1TxZ5AmFFrYkYfilRyTa7Lk/JUq/Tv9AGNNO1rhZrm5AAAAAElFTkSuQmCC>

[image9]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAYCAYAAADOMhxqAAAAwElEQVR4XmNgGAxAAYh3ogviAwFA/B9dEBdgBOJaIL6ELgECzEDczACR1IGKaQDxSSB2hSlCBqJAvA2KQWwQADlnLRALwRQhA30gvgbE/UDMxoBwTgqyImQQywDxXAiUzwvEMxgQzoMDLiAWBuK9QLwOiBWhfILgARA3MUCcQhQAOQfkSaKAFBAvYoC4myhgywAJEZhzQMHKhJDGBBlA7A5lgzTlI8lhBZpAPA+IZzJAYpsHVRo7AMUmUQpHAdUBAM3KFwrCBzrPAAAAAElFTkSuQmCC>

[image10]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAmwAAAA9CAYAAAAQ2DVeAAAEEUlEQVR4Xu3du4udRRgH4IkRUTGoETGI4CoEvBQBxSKoYIoQxUZRG1ELEbQQQbHxHhQkhTaCJqIoBryAlQS8FGIRCASxCZLGZnv/CH1f53zsnNlv92zcyzmB54EfOfN+Z3dTDvN+M1MKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADA9toXOdRlV+SKkXrWAACYk38iP3a1pcjpyP1dHQCAOcgJ27GudjDyd+TGrg4AwA7bHzkfOdDVT5Q6kQMAYM6ORE5F9nb1X0tdYQMAYI72RE6WupI2lk9WvgoAwDxkO/RsWd0OvbzUCdsLXR0AgB32RqkTs91dPTccZEvUhgMAgDkb2qG9XFnLdmiutAEAMEc5WcsNB61cVcvVtVxlAwBgTnL3Z7u54PvINZGfu/ry5PsAAAAAAAAAAAAAAMAWezLySmRXcUQGAMBCeS1yphmfi/zRjFtfl7o7c1beHn4AAIDNy2MzXm3Gea5ZHp0x5urIdRvIlcMPAACwOYfLyrlmgzzT7JFmvB2OLlAAABZaXuv0dDPOmwP6CVxLSxQAYIcdKSsTttxs8FTk3clnAAAWxBelvsf2bORE5Pbpx3N3U+R4X1zH7sjjZfWk85LIvaXuhL2zewYAcFEYLlJfqx06L99FDvXFGT4udbWw9WKpvyffz/uzewYAsJCOlrrBYPB+5K9mvN3uiDxY6q7ST0v9v+yb+kZ9nitsvesjbzbjfO/ul2acq2vPR65tar9FXpp8zjbwbc0zAICFlJOcYYKWx3Xk52wl7oScSH3TjPPvfxV5r9SWZlvrW5sp373L1uYgz43Ln23dGnm0GedhwNkWzd/3VqkrigAArOGeyHKZ3qF6X6nv0h2cjHNSNXYeXJ7x9llkaTLOCdiXkauGLzTGDgDOdukzfREAgGmXlnoVVrZDBzlhOx85MBnnZO3YyuP/Vt7uijxR6kTsoVJbo/nO3Vorg8vdOP/uw2V81Q4AgHXcEPmh1HfWBrna1q7ADbIV2r57l+3RoY3a+yly2eRzbkJ4vdSNB49F9g5fAgBgtlxZe66r5aQsV916p0ttiW5EHlPimiwAgE16oIy3KdeasGW93XCwHhM2AIBN+rzUDQiDDyL7J5/HWqI5+coVtqVS26A3Tz1drW2JAgBwgfLMtXyfLDceDPl28m86W+pdp62lyMnInlJvK5i1epaTOwAA/odsdWZrs887zXfyXLX+WI9cVfs98mHk7u7ZmDN9AQCArXM4cq4vlnre2kZ2eGYr9KO+CADA1sqbCsaupppluJoqb0sAAGAb5TtqL5fVO0hnuSVyqi8CALA9coXteF9cR77nljcfXOgkDwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAuIj8C8eJo+unWtnKAAAAAElFTkSuQmCC>

[image11]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAmwAAAAuCAYAAACVmkVrAAADuElEQVR4Xu3dS6itYxgH8Mf9elyTS6kjcpcUoshxS5ESQ5fO0MDIpchlQCRCmCjlRCm5DQzEQAYiJgZGyuSUgYGRudvzeNdnv/vde59l4Ky1Tvv3q3/t9Xxr7daaPT3v+35fBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA29KbmWcyjy4hZwQAAHNVw7ZjLAIAsBouyxw3FgEAtqsrMl+NxSU6JPNa5rDxAgDAdvVG5vOxuEQvZW4di+nMzHmZg8YL6djM45nHupwzu9bXKrfP6gAAB4yarj08FpfovWgN2OTQzN2ZzzJfZz7prk2OyFyd+TjzV+amzFGza9dnns58k7krc9qsDgBwwKjlx2p4VsFFmZOG2peZJ7rX1VxWU3d8V5vsjY3LuydkPsjcMdQBAFZKbeCvSdVkmmDV7StW6RYWNT0blzy/yPzUvb4m82u0iVrv8GjTtQeHejVqVa/GbSsnZg4eiwAAi3J65t3M97PX10ZrgGqqVk3c2CAt031jIVojdnT3uhqwmqLt7GqlGs9q5Or39Z6P1rBt9Tvfyrw/ywuZs9dfBgDYv27OPJS5KtpyYTUt1aQ9GfueOE3q/ZdE2wc2L9Oesa1UQ/VUtFOgm6mlziPH4iaqKev3uE3uz7wTbf9a/71+znzXvW9yZaw1ruXkzKeZU/59BwDAAtSJyHOjPTFgb1ffFVs3TvvDBZlHMr9EO+05qmauDhTM+04XZl4fi9EmcHXadfdQLzVdq0ZutCda8ze5NPNKtIkeAMDC9Xu7aqL0bHdtEWr6VRO436Od1hx9m7lhLA4+zNwz+7sOJ/STsFoGreZrnI7V6/rtu4Z6qXotl5ZqFOvvatoAAJaib1oujrVGZZ5aonw52ufn5azZZ/almqo/YuMG/zrFecxQ69Vy5W2xtg/txcz5a5f/aUbrO4zTsemmwDuHeqn37579XY2d5VAAYKmqObklWsNTe9r6E6OLdF3mt8zlsda0PRDrDxWMXo2NzWEtf06fqf/zQ+bHWH+w4NRoS6F1S5DNfu9Hmeeifb72stX/BQBYqtqov9lm/UW7M9qkrZ5EcG+06dqy1a1DVuF7AACshB2ZP6M9JqqeXnDj+ssLUfvp+iXYaiDr5CwAADN1WrSatlqmnXcy9P9WU8Y90Q4q1N64t2PjTXgBALa9apjqxOh/ue/a/lCNWh1cqGePzjudCgCwbXm2JwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAs1N9CE4u5pCgGyAAAAABJRU5ErkJggg==>

[image12]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAAaCAYAAABhJqYYAAAAw0lEQVR4XmNgGAUDAXiAmAuJzwLETEh8OJAD4p1AfAyIs4FYG4jXAPFyIJZAUgfm9EPZ+kB8CYh3ALEsED8H4kioHBgkA7EHlK0JxOeAuBaIuYH4ARBbQOUY2IDYH4j5ofwAIP4PxO5QvioQM0LZKIAXiBdBMYiNFYBCAGSyBhCfZYA4AWaaC1QODKQYIKFwmAHhBGQPdTBAghQMYKZNAOJZDKjuBSmyhbLhApOBuA+IQ4E4mgFiSxMQr2bA4blRQDsAABhMG2VrscQCAAAAAElFTkSuQmCC>