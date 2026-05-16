# **Systemic Agency and the Brute-Force Paradigm: An Analysis of Larian Studios’ Management of Triple-A Complexity in Baldur’s Gate 3**

The development of *Baldur’s Gate 3* represents a singular achievement in the management of exponential complexity within the role-playing game (RPG) genre. To understand how Larian Studios successfully navigated the staggering permutations of the *Dungeons & Dragons* 5th Edition ruleset alongside high-fidelity cinematic presentation, one must examine a cohesive set of development principles that prioritize systemic logic over rigid scripting. At the core of Larian’s success is a commitment to the "n+1" principle, the "brute-force" design methodology, and a "follow the sun" production model that leverages a global studio structure. This approach allows for a degree of player agency that is often cited as the new benchmark for the industry, ensuring that the game world reacts to nearly any player action with logical consistency and cinematic validation.

## **The Philosophical Core: Intellectual Respect and the "Weird Dungeon Master"**

The foundational principle guiding Larian Studios is a concept of "intellectual respect" toward the player. Unlike many triple-A titles that utilize "invisible walls" or invincible NPCs to protect the integrity of a scripted narrative, Larian operates on the mantra that the player is the "true main character" of the experience. This philosophy dictates that the game should not merely tolerate player deviations but actively support them, even when they threaten to derail the primary plot. Swen Vincke, the CEO and creative director, has frequently characterized the studio’s role as that of a "weird Dungeon Master". In a tabletop setting, a Dungeon Master must improvise when players decide to kill a quest-giver or bypass a designed challenge; Larian attempts to automate this improvisation through systemic design and brute-force narrative coverage.  
This mindset is best exemplified by the studio’s decision to allow players to kill almost every character in the game, including those critical to the overarching story. By removing the "essential" tag from NPCs, Larian forces itself to develop robust fallback mechanisms, ensuring the story remains functional despite the player’s "murderhobo" tendencies. This creates a sense of genuine consequence that is rare in high-budget RPGs, where narrative stakes are often undermined by the impossibility of failure.

| Key Development Motto/Principle | Definition and Application |
| :---- | :---- |
| **Intellectual Respect** | The assumption that players are intelligent and will seek creative, non-obvious solutions that must be validated by the game. |
| **"Break the Systems"** | A gameplay formula that encourages players to push mechanics to their logical limits, such as using physics or elemental surfaces to bypass encounters. |
| **"n+1" Principle** | The requirement that for every critical story beat (n), there must be at least one fallback path (+1) in case the player eliminates the primary actors. |
| **Brute-Force Design** | The massive allocation of resources (writing, VO, cinematics) to cover every possible permutation of player choice. |
| **Weird Dungeon Master** | Approaching game design as an improvisational session where the developer anticipates and rewards unpredictable behavior. |

## **The "n+1" Principle: Redundancy as a Structural Necessity**

To maintain narrative coherence across millions of potential world states, Larian utilizes the "n+1" principle. This principle is a technical and narrative requirement: designers must assume that every protagonist and antagonist can be eliminated by the player. Consequently, the "critical path" of the story must be supported by redundant delivery mechanisms for essential information or items.  
The most prominent case study for this principle is the Githyanki artifact, a central plot device that the player must possess for the game’s narrative and mechanics to function. Because the artifact is initially held by the companion Shadowheart, the developers had to account for every possible interaction a player might have with her. Analysis revealed that Larian created approximately 24 different versions of the artifact hand-off to ensure the player would always receive it, whether they recruited Shadowheart, killed her, or never encountered her at all. This redundancy allows the game to support extreme player freedom without the risk of a "soft lock" where progress becomes impossible.  
This principle extends to the recruitment and death of major characters. For instance, the character Minthara was originally designed as an antagonist, but the studio eventually "rescoped" her to be a recruitable companion, requiring extensive new narrative and cinematic pathways to integrate her into the player’s camp. Conversely, the "darlings" of the story—elements that the developers were personally attached to—were often "killed" or cut during the rescoping process to ensure that the remaining systems remained manageable and high-quality. Examples of cut content included a visit to the Githyanki city of Tu'narath and the War College related to Wyll’s backstory, illustrating that complexity management at Larian also involves rigorous pruning of features that do not serve the central systemic goals.

## **Systemic Design and Emergent Gameplay: The Divinity Engine 4.0**

Larian Studios manages complexity by shifting the burden of interaction from individual scripts to overarching systems. This "systemic thinking" is built into the proprietary Divinity Engine 4.0, which prioritizes simulated world coherence over mere visual fidelity. In a systemic game, the developers do not program specific "solutions" to an obstacle; instead, they define the properties of the actors and the environment, allowing the outcome to emerge from their interaction.  
\#\#\# Elemental and Physics Systems  
A core feature of the Divinity Engine is its surface and elemental interaction system. Fire, water, ice, blood, and grease are not just visual effects but system-level entities with defined properties. When a player casts a fire spell on a grease surface, the resulting explosion is a product of the engine’s internal logic, not a pre-placed script. This systemic approach extends to verticality and physics; players can push enemies off cliffs, stack crates to reach high areas, or use "Telekinesis" to move heavy objects. This freedom allows for "emergent gameplay," where players solve problems in ways the developers never explicitly intended, such as the famous "Owlbear from the top rope" strategy.

| System Type | Mechanism of Complexity Management | Player Impact |
| :---- | :---- | :---- |
| **Elemental Surfaces** | Global rules for how elements interact (e.g., electricity through water). | Encourages environmental awareness and tactical creativity. |
| **Physics and Verticality** | Dynamic weight, falling damage, and object stacking. | Allows for non-combat solutions and unconventional traversal. |
| **State Management** | Tracking thousands of world states across diverse locations. | Ensures the world "remembers" small choices and reflects them later. |
| **AI Reaction Layers** | NPC AI that reacts to noise, theft, and environmental changes systemicly. | Creates a "living" world that feels responsive to player presence. |

### **The Osiris Scripting Language**

The technical execution of these systems is handled by Osiris, a declarative, event-driven scripting language developed in-house. Unlike procedural languages that require a developer to specify every step of a process, Osiris allows designers to define conditions and the desired outcome. This is particularly effective for managing a reactive world: Osiris "listens" for events (e.g., an item being added to an inventory, a character dying) and triggers the appropriate response based on a set of rules.  
Osiris is designed for robustness; it includes built-in failsafes to prevent game-breaking errors. For instance, if a script orders an NPC to move to a location that is blocked by a player-placed object, the language will often trigger a teleport to ensure the narrative beat is satisfied. This level of automation is essential for managing a game where the player can fundamentally alter the environment at any time.

## **Brute-Force Narrative: The Permutation Problem**

While systemic design handles the "how" of gameplay, the "what" of the narrative must still be manually authored to ensure high production value. This leads to the "brute-force" design strategy: the studio employs a massive team of writers, voice actors, and cinematic designers to cover the astronomical number of permutations created by systemic play.

### **The 17,000 Endings and the Spreadsheet Army**

The complexity of *Baldur’s Gate 3* is often summarized by the figure of "17,000 endings". This is not 17,000 distinct cinematic sequences, but rather 17,000 permutations of the game’s final state, accounting for which characters lived, who they loved, what factions they supported, and the ultimate fate of the city. To track these branches, Larian’s writers utilized massive spreadsheets that required constant scrolling to navigate. A "small army" of testers was dedicated specifically to verifying these permutations, ensuring that choices made in Act 1 were still being correctly reflected in the finale.  
This brute-force approach is also applied to the "main character" of the game: the player. Whether a player chooses an "Origin" character or a custom "Tav," the game treats their specific path as the canonical story. This requires every cinematic to be "real-time," allowing the engine to swap in different characters and reflect their current equipment, injuries, or racial traits (such as a Tiefling's horns or a Dragonborn's scales) without needing pre-rendered video.

### **Case Study: Astarion’s Evolution**

The development of the companion Astarion highlights Larian’s iterative approach to managing character complexity. Originally, Astarion was conceived as a Tiefling vampire, but the team felt this did not resonate strongly as a companion. He was eventually changed to an Elf, and his backstory with the antagonist Cazador was refined through multiple iterations of writing and art until the character "sprang from the screen". This iterative process—where characters are constantly "redone" to hit the right tone—is a key part of the brute-force method, ensuring that even minor paths have high emotional weight.

## **The Global Engine: "Follow the Sun" and Studio Structure**

Handling the complexity of a project on the scale of *Baldur’s Gate 3* required a radical shift in Larian’s production model. The studio expanded from a single office in Ghent to a global network of seven studios. This expansion enabled the "follow the sun" development model, which allows for a 24-hour work cycle without requiring extreme "crunch" from individual employees.

### **Geographic Distribution of Larian Studios**

| Studio Location | Key Responsibilities and Contributions |
| :---- | :---- |
| **Ghent, Belgium** | Original home and central leadership office. |
| **Kuala Lumpur, Malaysia** | "Owner" of major content like the Dark Urge and House of Hope. |
| **Quebec, Canada** | Critical for North American testing and console optimization. |
| **Warsaw, Poland** | Focus on engine development and technical art. |
| **Barcelona, Spain** | Supporting art and scripting across major questlines. |
| **Dublin, Ireland** | Narrative design and publishing oversight. |
| **Guildford, UK** | Audio engineering and technical design. |

### **Efficiency through Handoffs**

The "follow the sun" model is most effective in the realm of quality assurance. As the team in Kuala Lumpur finishes their workday, they hand off the current build to the European teams; the European teams then pass it to the North American team at the end of their day. This allows for continuous testing of *Baldur’s Gate 3*, reducing a testing cycle that would typically take a month to just one week.  
Crucially, these global offices are not treated as secondary "support" studios or outsourcers. They "own" significant portions of the game’s creative identity. This distributed ownership helps manage complexity by empowering local teams to solve problems independently within their domain, rather than routing every decision through a central headquarters.

## **Early Access: Complexity Refined by the Community**

A vital tool in Larian's arsenal for managing complexity was the 1,031-day Early Access period. This was not a marketing gimmick but a functional part of the "brute-force" strategy. By releasing the game’s first act to millions of players years before the full launch, Larian was able to use the community as a massive research and development team.

1. **Identifying Emergence:** Developers watched how players used systems (like jumping, shoving, or combining spells) to find solutions they hadn't predicted.  
2. **Authoring Recognition:** If a significant number of players tried a specific, non-scripted action, Larian would then write and voice-act a reaction for that action in the final game.  
3. **Balancing the Rules:** The complexity of D\&D 5e was balanced against player data, ensuring that mechanics like "Reaction" spells were intuitive for a digital environment.

While some critics noted that this focus on Act 1 led to a disparity in polish compared to the later acts, Larian argues that the "institutional knowledge" gained from the Early Access period was what made the overall game possible.

## **The Human Factor: Ethical Management and Institutional Knowledge**

Larian’s management of complexity is also deeply tied to its treatment of its workforce. Swen Vincke has been a vocal critic of the "quarterly profits" mindset that leads to mass layoffs in the games industry. He argues that the constant cycle of firing and hiring destroys "institutional knowledge"—the collective experience of a team that has spent years learning how to use a proprietary engine and how to work together.  
To retain this knowledge, Larian focuses on being "resilient" and creating financial reserves to keep the team intact between projects. This stability allows the studio to tackle projects of immense complexity, as the developers are not constantly reinventing their workflows or relearning their tools. The studio’s motto, in many ways, is that if the developers have fun making the game, the players will have fun playing it. This "idealism-driven" development ensures that the team is emotionally invested in the game's myriad systems and story branches, providing the energy necessary to sustain a six-year development cycle.

## **The Role of Machine Learning and AI in Complexity Management**

Despite the industry trend toward generative AI, Larian has taken a cautious and additive approach to these tools. Swen Vincke has stated that while the studio uses AI for tasks like exploring ideas, creating placeholder text for scripters, and organizing PowerPoint presentations, it is not used to replace human craft or skill.

* **Concept Ideation:** AI is used in the early stages of concept art to "explore things" and generate a wide range of "half-baked ideas" that artists can then refine.  
* **Workflow Acceleration:** Tools are used to assist with data processing, captioning, and localization, allowing the human developers to focus on the "creative process itself," which Vincke insists cannot be accelerated.  
* **Commitment to Human Performance:** For the upcoming *Divinity* project, Larian has explicitly stated that everything will be written and performed by human actors, maintaining the "high standard" set by *Baldur’s Gate 3*.

This balanced approach allows Larian to handle technical complexity without sacrificing the "soul" of their narrative, which relies on nuanced human performances and specific, authored reactivity.

## **Technical Limitations and the Future: Divinity 5.0**

The development of *Baldur’s Gate 3* was not without its technological struggles. Swen Vincke has acknowledged that the complexity of the city in Act 3 pushed the Divinity Engine 4.0 to its limits. The engine lacked the advanced streaming capabilities necessary to fit the entire city into memory, forcing the team to split the urban area into two distinct parts. This experience has prompted Larian to begin development on a new engine (potentially Divinity 5.0) for their future projects.  
The goals for this next-generation technology include:

1. **Enhanced Flexibility:** Allowing the team to react faster when a ruleset or mechanic is found to be "not working".  
2. **Improved Streaming:** Seamlessly handling massive, detailed environments without the need for memory-driven "smoke and mirrors".  
3. **Advanced Narrative Experiments:** Expanding player choice and replayability even further than what was achieved in *Baldur’s Gate 3*.

## **Conclusions: The Complexity Paradigm**

Larian Studios managed the immense complexity of *Baldur’s Gate 3* by rejecting the industry’s trend toward over-scripting and instead embracing a systemic, human-centric development model. Their success is a product of several synergistic factors:

* **Systemic Thinking:** Prioritizing world logic over individual scripts, allowing for emergent player solutions.  
* **The "n+1" Principle:** Building structural redundancy into the narrative to ensure player freedom does not lead to failure.  
* **Brute-Force Production:** Committing the necessary human resources to author high-fidelity reactions for an astronomical number of permutations.  
* \*\*Global Collaboration: Utilizing a "follow the sun" model to maintain a 24-hour development cycle and leverage diverse talent across seven global offices.  
* **Institutional Stability:** Avoiding the boom-and-bust cycle of industry layoffs to preserve the knowledge required to use complex proprietary tools.

As Larian moves away from the *Dungeons & Dragons* license to return to their own *Divinity* universe, these principles will likely be elevated further. The "blueprint" established by *Baldur’s Gate 3*—one that values "intellectual respect," "systemic agency," and "brute-force reactivity"—has not only redefined the RPG genre but has also provided a roadmap for how independent studios can successfully execute projects of unparalleled scale and complexity.

#### **Works cited**

1\. 'If You Like Baldur's Gate 3, This Is Gonna Be Great' — Larian Boss ..., https://www.ign.com/articles/if-you-like-baldurs-gate-3-this-is-gonna-be-great-larian-boss-swen-vincke-reveals-what-to-expect-from-divinity-in-first-interview-since-the-game-awards-announcement 2\. I'm Curious What a Post-Baldur's Gate 3 Era Divinity Will Look Like \- ComicBook.com, https://comicbook.com/gaming/feature/im-curious-what-a-post-baldurs-gate-3-era-divinity-will-look-like/ 3\. Larian's Divinity 4.0 Engine: The Technical Backbone of Baldur's ..., https://foro3d.com/en/2026/february/larians-divinity-40-engine-the-technical-foundation-of-baldurs-gate-3.html 4\. Baldur's Gate 3 Dev Suggests Next Game May Come in 2029, but ..., https://www.ign.com/articles/larian-studios-head-suggests-next-game-2029 5\. Emergent Gameplay (Introductory Guide) \- Game Design Skills, https://gamedesignskills.com/game-design/emergent-gameplay/ 6\. Why Baldur's Gate 3 Is Changing RPGs Forever \- SPINE ONLINE, http://spineonline.co/ign-in-game-narratives/2025/12/4/why-baldurs-gate-3-is-changing-rpgs-forever 7\. Larian gave Baldur's Gate 3 its acclaimed reactivity by approaching ..., https://www.pcgamer.com/games/rpg/larian-gave-baldurs-gate-3-its-acclaimed-reactivity-by-approaching-it-as-weird-dungeon-masters/ 8\. Baldur's Gate 3: Director Swen Vincke Answers All Our Questions ..., https://www.ign.com/articles/baldurs-gate-3-director-swen-vincke-answers-all-our-questions-about-foregoing-dlc-aaa-development-and-more 9\. What's The Difference Between Emergent, Immersive and Systemic Gameplay? \- Reddit, https://www.reddit.com/r/gamedesign/comments/hgn8l7/whats\_the\_difference\_between\_emergent\_immersive/ 10\. In terms of engine and mechanics, what do you expect from next Divinity game? \- Reddit, https://www.reddit.com/r/DivinityOriginalSin/comments/1qyzd2j/in\_terms\_of\_engine\_and\_mechanics\_what\_do\_you/ 11\. An interview with Swen Vincke, from Larian Studios, about Divinity, its scope, development goals, and more, by Jason Schreier : r/TwoBestFriendsPlay \- Reddit, https://www.reddit.com/r/TwoBestFriendsPlay/comments/1po48t4/an\_interview\_with\_swen\_vincke\_from\_larian\_studios/ 12\. Understanding Osiris Rules: Conditions | BG3 Modding Community Wiki, https://wiki.bg3.community/Tutorials/Osiris/Understanding-Osiris-Conditions 13\. Scripting: Introduction to Osiris \- Baldur's Gate 3 Modding, https://docs.baldursgate3.game/Scripting:\_Introduction\_to\_Osiris 14\. Modding: Guidelines & FAQ \- Larian Studios forums, https://forums.larian.com/ubbthreads.php?ubb=showflat\&Number=948625 15\. Fextralive on the size/replayability/reactivity of BG3 \- Spoiler \- Larian Studios forums, https://forums.larian.com/ubbthreads.php?ubb=showflat\&Number=864507 16\. Larian originally wanted Baldur's Gate 3 to have multiple narrators, also Astarion was a tiefling | PC Gamer, https://www.pcgamer.com/games/baldurs-gate/larian-originally-wanted-baldurs-gate-3-to-have-multiple-narrators-also-astarion-was-a-tiefling/ 17\. 'Work with the players ... otherwise you shouldn't be doing it': Heads at Baldur's Gate 3 developer Larian Studios say you ought to 'really mean it' going into early access | PC Gamer, https://www.pcgamer.com/games/baldurs-gate/work-with-the-players-otherwise-you-shouldn-t-be-doing-it-heads-at-baldur-s-gate-3-developer-larian-studios-say-you-ought-to-really-mean-it-going-into-early-access/ 18\. Reactions in BG3 \- Larian Studios forums, https://forums.larian.com/ubbthreads.php?ubb=showflat\&Number=753057 19\. Baldur's Gate 3: Early Access Feedback : r/baldursgate \- Reddit, https://www.reddit.com/r/baldursgate/comments/j67j2n/baldurs\_gate\_3\_early\_access\_feedback/ 20\. Early Access \- How did people feel about BG3? as a comparison : r/Stormgate \- Reddit, https://www.reddit.com/r/Stormgate/comments/1ens5zo/early\_access\_how\_did\_people\_feel\_about\_bg3\_as\_a/ 21\. The Early Access System Needs to Go \- Larian Studios forums, https://forums.larian.com/ubbthreads.php?ubb=showflat\&Number=946051 22\. Baldur's Gate 3 boss blasts publisher "greed" behind layoffs | Eurogamer.net, https://www.eurogamer.net/baldurs-gate-3-boss-blasts-publisher-greed-behind-layoffs 23\. Swen Vincke's (Baldur's Gate 3 Director) TGAs speech was remarkable \- Reddit, https://www.reddit.com/r/pcgaming/comments/1hdoypx/swen\_vinckes\_baldurs\_gate\_3\_director\_tgas\_speech/ 24\. Update: Larian CEO says any AI tool 'used well' is additive \- Game Developer, https://www.gamedeveloper.com/production/larian-ceo-says-studio-is-more-or-less-ok-around-gen-ai-use 25\. Larian Studios promises “next level” turn-based RPG in Divinity, surpassing Baldur's Gate 3, https://tribune.com.pk/story/2582636/larian-studios-promises-next-level-turn-based-rpg-in-divinity-surpassing-baldurs-gate-3 26\. Larian's Last Engine Held Baldur's Gate 3 Back | Restart.run, https://www.restart.run/articles/larian-is-building-a-new-engine-for-divinity-because-the-previous-one-held-baldur-s-gate-3-back 27\. Make the Player Smile: Interview with Larian CEO Swen Vincke | Restart.run, https://www.restart.run/articles/make-the-player-smile-an-interview-with-larian-ceo-swen-vincke