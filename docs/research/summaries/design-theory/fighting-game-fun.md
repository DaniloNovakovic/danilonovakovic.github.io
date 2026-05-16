# **The Architecture of Adversarial Engagement: A Comprehensive Analysis of 2D Fighting Game Design**

The ludological essence of 2D combat titles, such as those within the Street Fighter and Mortal Kombat franchises, represents a sophisticated convergence of millisecond-precision mechanics, spatial geometry, and psychological warfare. At its core, the appeal of these games resides in a multi-layered hierarchy of engagement that transcends mere digital violence. To understand why these systems are perceived as fun, one must examine the progression from immediate visceral feedback to the deep, intrinsic satisfaction of cognitive mastery. This analysis explores the systemic components—mechanics, level design, and psychology—that define the genre and sustain its competitive longevity.

## **The Hierarchy of Fun and the Player Experience**

The enjoyment of a fighting game is structured through a stratified hierarchy, similar to Maslow’s Hierarchy of Needs, which dictates how a player moves from a novice to an expert state. This hierarchy begins with the visceral, moment-to-moment experience. Layer 1 consists of the immediate reaction to the game’s art style, graphics, combat feel, and music. This is where the "juice" of the game resides—the visual flashes, the crunch of a hit, and the expressive animations that make actions feel impactful.  
As the player progresses to Layer 2, they engage with the core loop, beginning to understand the fundamental rules and gaining competence in basic mechanics. Layer 3 introduces progression, where players recognize the relationship between effort and reward, whether through in-game currency, skins, or the unlocking of new characters. Layer 4 is defined by meta-mastery, the point at which a player understands the nuances of the system—such as frame data and specific character matchups—to gain a performance edge. Finally, Layer 5 is the emotional pinnacle, where the player develops a deep investment in the game, participating in its community and playing daily.  
The "essence of fun" in this context is found at the intersection of challenge and skill. If the challenge level of a task meets the player’s skill level, they enter a state of flow. Flow is characterized by deep absorption, a loss of self-consciousness, and the sensation that time is passing faster than usual. Game designers maintain this state through clear goals, immediate feedback, and a balanced difficulty curve that prevents both boredom (when the game is too easy) and frustration (when it is too difficult).

## **The Mechanics of Time: Frame Data as Systemic Grammar**

The fundamental unit of interaction in fighting games is the frame. Operating at a standard 60 frames per second (FPS), these games use time as their primary resource for balancing and competition. Every action taken by a character is defined by its frame data, which categorizes animations into three distinct phases: startup, active, and recovery.

### **The Lifecycle of an Attack**

The startup phase is the time between the player's input and the moment the attack’s hitbox becomes active. During this phase, the character is preparing the strike but cannot yet deal damage. The active phase is the window during which the attack can actually hit the opponent. Finally, the recovery phase is the period after the attack during which the character is returning to a neutral state and cannot perform other actions.  
Understanding the relationship between these phases is critical for competitive play. If an attack misses, the player is "locked in" to the recovery frames, leaving them vulnerable to a "whiff punish". If an attack is blocked, the relative frame advantage determines who can act first.

| Technical Component | Description | Gameplay Function |
| :---- | :---- | :---- |
| Startup Frames | Frames preceding the hitbox activation. | Defines the speed and "reactability" of an attack. |
| Active Frames | Frames where the hitbox can collide with an opponent. | Determines the window for a hit to connect. |
| Recovery Frames | Frames following the attack where the player is immobile. | Dictates the risk of missing an attack (whiffing). |
| Hitstun | Frames of immobility imposed on an opponent after a hit. | Enables the execution of "true" combos. |
| Blockstun | Frames of immobility imposed on an opponent after a block. | Determines the safety or "plus/minus" status of a move. |

### **The Concept of Advantage and Safety**

Advantage is measured in the delta between the attacker’s recovery and the defender’s stun. If an attacker finishes their animation 2 frames before the defender exits blockstun, they are "+2 on block". This means they can act 2 frames sooner than their opponent, effectively making their next attack faster. Conversely, if an attacker is "minus," they are at a disadvantage. A move is considered "unsafe" if its negative frame advantage is greater than the startup frames of the opponent’s fastest attack, allowing for a guaranteed punishment.  
Frame traps are a strategic application of this data. A player may use a move that leaves them slightly plus, creating a small "actable gap" between their next attack. If the defender attempts to "mash" a button during this gap, they will be hit because the attacker’s next move completes its startup before the defender’s move can activate. This depth converts the game from a "button masher" into a "geometric debate," where players use moves as arguments that must be countered with mathematically sound responses.

## **The Psychological Battlefield: Yomi and the Mental Stack**

While mechanics provide the rules, the "essence of fun" often lies in the psychological interaction between two humans. This is frequently described using the term "Yomi," a Japanese word meaning "reading" the opponent’s mind. In fighting games, this involves anticipating the opponent's next move based on their patterns and the current state of the game.

### **Managing the Mental Stack**

The "Mental Stack" is a critical cognitive concept in 2D combat. It refers to the number of different options a player is preparing to react to at any given time. The human brain has a finite capacity for rapid reaction; as more options are added to the mental stack, the reaction time for each individual option increases.  
For example, if a player only has to worry about an opponent jumping at them, they can react with an "anti-air" attack almost instantly. However, if the opponent might also dash, throw a fireball, or use a "Drive Impact" move, the defender’s reaction time to the jump-in will slow down significantly. High-level players "weaponize" the mental stack by overwhelming their opponents with variety, forcing them to juggle too many possibilities until they "freeze" and become vulnerable to even simple attacks.

### **The Flow State and Automaticity**

At the highest levels of play, conscious thought often gives way to "transient hypofrontality," a state where the prefrontal cortex—the part of the brain responsible for self-reflection and hesitation—shuts down. This allows the basal ganglia, which handles movement and autopilot functions, to take control. This is the neurobiological basis for the "Flow State" or "being in the zone".  
To achieve this, players must drill patterns until they are automatic. This repetition builds muscle memory, allowing the conscious brain to focus on higher-level strategy while the nervous system handles the physical execution. Fun is derived from the sensation of effortless mastery that occurs when a player's nervous system is in perfect synchronization with the game's mechanics.

## **Character Archetypes and Emotional Design**

Fighting game characters are categorized into archetypes that dictate their preferred range and strategy. These archetypes are not just mechanical definitions; they are designed to evoke specific emotions in both the player and their opponent.

### **The Primary Archetypes**

Characters like Ryu in Street Fighter or Mario in Super Smash Bros. are "All-Around" characters. They possess a balanced toolkit with no major weaknesses, making them versatile but lacking in extreme specialization. They are often the starting point for new players because they allow for the learning of fundamental mechanics without the complexity of specialized archetypes.

| Archetype | Preferred Range | Emotional Impact on Opponent | Examples |
| :---- | :---- | :---- | :---- |
| Rushdown | Close Range | Panic, Overwhelm, Stress | Cammy, Fox, Liu Kang |
| Zoner | Full Screen | Frustration, Irritation, Boredom | Dhalsim, Guile, Skarlet |
| Grappler | Close Range | Fear, Apprehension, Dread | Zangief, Potemkin, Jax |
| Mix-Up | Varies | Unpredictability, Confusion | Ness, Millia Rage, Ibuki |
| Hit-and-Run | Mid Range | Frustration, Annoyance | Sonic, Greninja |

### **The Emotional Spectrum of Combat**

The "Rushdown" archetype focuses on high-speed aggression and constant pressure, intended to "panic" the opponent into making a mistake. These characters often have the highest combo potential but lower health, making them high-risk, high-reward "glass cannons".  
In contrast, "Zoners" use projectiles and long-range pokes to keep the opponent away. This style of play focuses on "keep-out" and can be highly frustrating for opponents who lack long-range options. The fun for the zoner player is found in the "surgical" dismantling of an opponent's approach, while the fun for the opponent is found in the "puzzle" of successfully closing the gap.  
"Grapplers" elicit a unique sense of "fear". Because a single command throw can deal massive damage and cannot be blocked, the opponent is forced to play with extreme caution. Grapplers typically have the highest health and defense but the lowest mobility, making the "test" of the match their ability to navigate the opponent's zoning to reach throwing range.

## **Level Design: Geometry and the Possibility Space**

In 2D fighting games, level design is less about traversal and more about defining the "Possibility Space"—the area in which the combat occurs and the boundaries that limit movement. A level acts as a scaffolded area that contains all possible actions and outcomes.

### **The Tactical Significance of the Corner**

The most critical element of 2D level design is the corner. Most stages have lateral boundaries that characters cannot move past. When a player is "cornered," they lose the ability to move backward, which nullifies defensive options like back-dashing or jumping away. This removes "pushback," the mechanical force that normally separates characters after a hit, allowing for more devastating "corner combos" that would be impossible in the center of the screen.  
The game's "neutral" state usually takes place at mid-screen, where neither player has a positional advantage. The struggle of the match often involves "corner carry"—the ability to use combos that move the opponent toward the wall to gain this tactical advantage.

### **Interactive Environments and 3D Considerations**

Mortal Kombat and the Injustice series have innovated by making environments interactive. Stages may contain props like barrels, chairs, or statues that players can throw or use to vault over an opponent. These interactables add a tactical layer to the environment, though they can be controversial in competitive play if they are perceived as unbalanced.  
In 3D fighters like Tekken, level design includes walls that can be broken, sending characters into new areas of the stage. Some games, like Virtua Fighter, include "ring outs," where knocking a character off the edge of the stage results in an instant round loss, shifting the win condition from health depletion to spatial control.

## **The Aesthetics of Impact: Juice and Feedback Loops**

A significant portion of the fun in Street Fighter and Mortal Kombat is derived from "juice"—the non-functional visual and auditory feedback that makes actions feel powerful. This is Layer 1 of the Hierarchy of Fun, providing the immediate visceral satisfaction that keeps players engaged.

### **Hitstop and the Sensation of Weight**

"Hitstop," also known as "freeze frames," is a technique where the animation of both the attacker and the defender pauses for a few frames upon impact. This mimics physical resistance, giving the player a sense of "weight" and providing a window for "hit confirmation"—knowing whether the move landed so they can follow up with a combo. Without hitstop, attacks can feel like they are "cutting through air," making the combat feel "floaty" or "flat".

### **Visual and Auditory Flourishes**

Other feedback mechanisms include:

* **Screen Shake:** For heavy attacks, the camera vibrates to simulate a massive impact.  
* **Hit Sparks and Particles:** Flashes of light or bursts of blood provide immediate visual cues that a hit has connected.  
* **Dynamic Lighting and Sound:** High-BPM soundtracks and crunchy sound effects during combat heighten tension and reinforce the rhythm of the fight.

| Feedback Technique | Technical Implementation | Psychological Purpose |
| :---- | :---- | :---- |
| Hitstop (Freeze Frames) | Pausing the engine for n frames on collision. | Simulates physical resistance; aids input timing. |
| Screen Shake | Procedural vibration of the camera's X/Y coordinates. | Communicates the magnitude of force. |
| Hit Sparks | Spawning particle emitters at the point of contact. | Provides clear visual confirmation of a hit. |
| Sound Design | Layered "meaty" sounds (thuds, slashes, crunches). | Reinforces the visceral nature of the impact. |
| Expressive Animation | Over-the-top character reactions and "smear frames." | Communicates character personality and move power. |

## **Comparative Philosophies: Street Fighter vs. Mortal Kombat**

While both series are titans of the genre, Street Fighter and Mortal Kombat are built on divergent design philosophies that cater to different player motivations.

### **Street Fighter: Technical Refinement**

Street Fighter is generally viewed as a "tighter" and more "balanced" series. Its mechanics are based around the "six-button layout" and blocking by holding "back" on the controller. This system places a high premium on "fundamentals" and the "neutral game," where players use precise movement to "fish" for openings.  
Street Fighter's animation style is "arcadey" and stylized, often exaggerating musculature and movement to make the action clear at a glance. Its "fun" is derived from the high skill ceiling and the satisfaction of mastering complex "motion inputs" like the quarter-circle forward (the Hadoken).

### **Mortal Kombat: Cinematic Spectacle**

Mortal Kombat initially differentiated itself through "motion capture" (mocap) and digitizing real actors, giving it a more "realistic" (though often choppier) look than Street Fighter. Its design philosophy emphasizes "story," "secrets," and "additional modes" over pure mechanical refinement.  
Key differences include the use of a dedicated "block button," which removes the vulnerability of "cross-ups," and the "dial-a-combo" system, where players input a sequence of buttons to trigger a pre-determined string of attacks. The "fun" in Mortal Kombat is heavily tied to its "edgy" aesthetic, its deep lore, and the visceral satisfaction of its "Fatality" finishing moves.

### **The Convergence of Design**

In recent years, the two series have influenced each other. Ed Boon’s 2011 *Mortal Kombat* reboot introduced a "fleshed-out story mode" that inspired Capcom to include similar cinematic narratives in *Street Fighter V* and *VI*. Conversely, Mortal Kombat’s evolution has seen a greater focus on competitive balance and "neutral" play, attempting to capture the technical depth that defines Street Fighter.

## **The Evolution of Accessibility: Modern Controls and the Onboarding of New Players**

One of the greatest challenges in fighting game design is the "execution barrier"—the difficulty of performing complex inputs while under pressure. This has traditionally made the genre "niche," as new players often feel they are "button mashing" without understanding the system.

### **The Street Fighter 6 "Modern" Revolution**

To combat this, *Street Fighter 6* introduced "Modern Controls," which allow players to perform special moves with a single button press and an optional direction, bypassing the need for complex joystick motions. This allows beginners to skip the "execution phase" and immediately participate in the "fun part" of the game: decision-making, footsies, and strategy.  
However, this accessibility comes with trade-offs to preserve competitive balance:

* **Damage Reduction:** Special moves and supers performed with simple inputs deal approximately 20% less damage.  
* **Limited Moveset:** Modern control users lose access to roughly half of their character's "normal" attacks (punches and kicks), which can be a significant disadvantage in higher-level play.  
* **Reduced Strategic Nuance:** Some "option selects" and "hit confirms" that are possible with classic controls are more difficult or impossible with modern controls.

### **The Strategic Value of Execution**

The requirement for complex inputs is not arbitrary; it is a balancing mechanic. For example, the "Dragon Punch" (Shoryuken) input (forward, down, down-forward) ensures that a player cannot be blocking (holding back) while initiating the move. This forces the player to commit to the attack and leave themselves vulnerable for a fraction of a second. By mapping this to a single button, designers must find new ways to balance the "instant" nature of the move, such as by increasing its recovery or reducing its invulnerability.

## **Comeback Mechanics: Managing Tension and "Epic" Moments**

To prevent "lame duck" situations where a match is effectively over but still being played, many modern fighting games incorporate "comeback mechanics". These systems grant the losing player more power as they take damage, creating opportunities for "epic win moments".

### **Examples of Comeback Systems**

Several prominent games use these mechanisms to maintain tension:

* **X-Factor (Marvel vs. Capcom 3):** A one-time-use buff that increases damage and speed, becoming more powerful as the player loses more characters on their team.  
* **Rage (Tekken 7):** Increases damage when a character’s health drops below a certain threshold and allows for a "Rage Drive" or "Rage Art" super move.  
* **V-Trigger (Street Fighter V):** A unique character power-up that is fueled by taking damage or performing successful defensive actions.  
* **Fatal Blows (Mortal Kombat 11/1):** High-damage cinematic attacks that only become available when a player’s health is below 30%.

### **The Design Philosophy of Comebacks**

The intent of these mechanics is to provide a "negative feedback loop," where a disturbance (losing health) is counteracted by an increase in power. This keeps the match "stable" and prevents a single early mistake from determining the outcome. However, designers must ensure that these mechanics do not "penalize" the winning player for being better or allow for "low-effort upsets" that trivialize skill. Ideally, a comeback mechanic should not "close the gap" by itself; it should require a combination of the buff, player skill, and opponent misplays to succeed.

## **The Social and Long-Term Value of Fighting Games**

The longevity and "essence of fun" in franchises like Street Fighter and Mortal Kombat are ultimately rooted in their nature as social experiences and hobbies. Fighting games are essentially "infinite" because the opponent is a human being who can adapt, learn, and deceive.

### **The Mastery Curve as Content**

In most modern games, "content" refers to levels or items. In fighting games, "content" is the mastery of the system. The fun is derived from the "return on investment" of practice. Players move from "mashing" to understanding "footsies," to "reading" opponents, and finally to "breaking" the game through advanced tech. This process teaches players how to improve at a difficult skill, how to practice, and how to diagnose and fix problems—skills that translate beyond the game itself.

### **Community and Identity**

Fighting games foster a unique sense of community. Because players must study the game down to individual animation frames and cycles, they develop a shared "language" and a deep respect for the effort required to compete. The "Emotional Layer" (Layer 5\) of the Hierarchy of Fun is reached when the player identifies with their character and their community, participating in tournaments and discussing the game’s "metagame"—the evolving set of viable strategies used by the best players.

| Developmental Phase | Focus | Primary Motivation |
| :---- | :---- | :---- |
| Casual / New | Visuals, Characters, Basic Attacks | Visceral fun, story, "cool" factor. |
| Intermediate | Combos, Special Moves, Basic Defense | Competence, winning against friends. |
| Competitive | Frame Data, Spacing, Mental Stack | Mastery, ranking up, consistency. |
| Professional / Expert | Matchup Nuance, Meta-Gaming, Mind Games | High-level strategy, tournament success. |

## **Synthesis: The Essence of Fun in 2D Combat**

The enduring success of Street Fighter and Mortal Kombat is not the result of a single feature, but the harmonious integration of multiple design principles. The "essence of fun" is found in:

1. **Visceral Satisfaction:** The "juice" of hitstop, screen shake, and sound design that provides immediate feedback.  
2. **Cognitive Engagement:** The psychological battle of Yomi and the management of the Mental Stack.  
3. **Geometric Precision:** The mathematical certainty of frame data and the tactical control of stage geometry.  
4. **Aspiration and Mastery:** A deep hierarchy of fun that allows players to grow from mashing buttons to participating in a sophisticated metagame.  
5. **Dramatization of Skill:** Comeback mechanics and archetypal designs that create high-tension, cinematic moments.

By balancing these elements, fighting game designers create an ecosystem where players can experience the joy of physical input and the thrill of outsmarting another human being, making every match a unique "geometric debate" with stakes that feel personal and rewarding. The transition from Street Fighter's pneumatic arcade buttons in 1987 to the "Modern" controls of 2023 represents a continuous effort to refine this experience, ensuring that the essence of combat remains accessible, deep, and—above all—fun.

#### **Works cited**

1\. A "Hierarchy of Fun" \- What are your core game design ... \- Reddit, https://www.reddit.com/r/gamedesign/comments/1muj2an/a\_hierarchy\_of\_fun\_what\_are\_your\_core\_game\_design/ 2\. Game Design Principles for Engaging Player Experiences \- 3dsense Media School, https://3dsense.net/blogs/game-design-principles-for-engaging-player-experiences 3\. The Flow State-The hidden zone of combat sports \- Ninja Mindset, https://ninja-mindset.beehiiv.com/p/the-flow-state-the-hidden-zone-of-combat-sports 4\. Flow State Design: Applying Game Psychology to Productivity Apps \- UX Magazine, https://uxmag.com/articles/flow-state-design-applying-game-psychology-to-productivity-apps 5\. Time Speeds Up in Flow States When Playing Video Games | Psychology Today, https://www.psychologytoday.com/us/blog/sense-time/202105/time-speeds-in-flow-states-when-playing-video-games 6\. Peripheral-physiological and neural correlates of the flow experience while playing video games: a comprehensive review \- PMC, https://pmc.ncbi.nlm.nih.gov/articles/PMC7751419/ 7\. How Game Design Principles Drive Player Engagement | CG Spectrum, https://www.cgspectrum.com/blog/game-design-principles-player-engagement 8\. What is frame data in fighting games, and why is it so complicated? \- Quora, https://www.quora.com/What-is-frame-data-in-fighting-games-and-why-is-it-so-complicated 9\. Guide :: HOW TO Read Frame Data (and other ... \- Steam Community, https://steamcommunity.com/sharedfiles/filedetails/?id=2952953328 10\. Tips on balancing fighting game frame data? : r/gamedesign \- Reddit, https://www.reddit.com/r/gamedesign/comments/1lmt6s3/tips\_on\_balancing\_fighting\_game\_frame\_data/ 11\. I STILL don't understand frame data : r/Fighters \- Reddit, https://www.reddit.com/r/Fighters/comments/1b671a1/i\_still\_dont\_understand\_frame\_data/ 12\. Rethinking Fighting Games as Geometric Debates: Ecosystems of Strategy, https://www.gamedeveloper.com/design/rethinking-fighting-games-as-geometric-debates-ecosystems-of-strategy 13\. Mental Stack in Fighting Games \- Improving Your Reactions :: Street ..., https://steamcommunity.com/app/1364780/discussions/0/3815158655056253592/?l=italian 14\. Fighting Game Primer \- Masher to Master \- Patrick Miller \- FightRise, https://fightrise.com/resources/Fighting%20Game%20Primer%20-%20Masher%20to%20Master%20-%20Patrick%20Miller.pdf 15\. How to improve my corner game? Getting harassed like this is no fun. \- Reddit, https://www.reddit.com/r/StreetFighter/comments/1kecfk6/how\_to\_improve\_my\_corner\_game\_getting\_harassed/ 16\. If grapplers inflict fear and zoners inflict frustration, what emotion do rushdown characters inflict? : r/Fighters \- Reddit, https://www.reddit.com/r/Fighters/comments/1o8txf3/if\_grapplers\_inflict\_fear\_and\_zoners\_inflict/ 17\. Character Archetypes | Smashpedia \- Fandom, https://supersmashbros.fandom.com/wiki/Character\_Archetypes 18\. The Fighting Game Theory of FaB: The Rushdown \- The Rathe Times, https://rathetimes.com/articles/the-fighting-game-theory-of-fab-the-rushdown 19\. How to Pick a Fighting Game Character – Celia Wagar's CritPoints, https://critpoints.net/2023/06/03/how-to-pick-a-fighting-game-character/ 20\. Why is grappler vs zoner vs rushdown presented as rock-paper-scissors? : r/Fighters \- Reddit, https://www.reddit.com/r/Fighters/comments/ygsnld/why\_is\_grappler\_vs\_zoner\_vs\_rushdown\_presented\_as/ 21\. Level Design Fundamentals | Epic Developer Community, https://dev.epicgames.com/community/learning/tutorials/3VKJ/unreal-engine-fortnite-level-design-fundamentals 22\. Level design for melee combat systems \- Game Developer, https://www.gamedeveloper.com/design/level-design-for-melee-combat-systems 23\. Corner \- Street Fighter Wiki \- Fandom, https://streetfighter.fandom.com/wiki/Corner 24\. What are the best stage interactions/transitions in fighting games? : r/Fighters \- Reddit, https://www.reddit.com/r/Fighters/comments/1lpgxpc/what\_are\_the\_best\_stage\_interactionstransitions/ 25\. Anyone else noticed the game doesn't have interactive stages? : r/MortalKombat \- Reddit, https://www.reddit.com/r/MortalKombat/comments/15w2loz/anyone\_else\_noticed\_the\_game\_doesnt\_have/ 26\. Eight Hit Stop Techniques \[Design Specifics\] — Masahiro Sakurai ..., https://www.reddit.com/r/Games/comments/zgzpku/eight\_hit\_stop\_techniques\_design\_specifics/ 27\. Freeze Frame/hitstop in action games \- why? Can it be done better? : r/truegaming \- Reddit, https://www.reddit.com/r/truegaming/comments/xk8hth/freeze\_framehitstop\_in\_action\_games\_why\_can\_it\_be/ 28\. Understanding Hitstop, Blood Splatter, and Screen Shaking on Monsters \- GameFAQs, https://gamefaqs.gamespot.com/boards/762804-monster-hunter-4-ultimate/71244450 29\. Analysis of Screenshake Types \- Stuff Made By Dave \- David Strachan, http://www.davetech.co.uk/gamedevscreenshake 30\. Is Street fighter better than Mortal Kombat with graphics? \- Quora, https://www.quora.com/Is-Street-fighter-better-than-Mortal-Kombat-with-graphics 31\. Differences between this and Street Fighter... (Is the new SF worth getting)? \- Mortal Kombat, https://gamefaqs.gamespot.com/boards/961032-mortal-kombat/59401951 32\. What's the differences between MK and Street Fighter? : r/MortalKombat \- Reddit, https://www.reddit.com/r/MortalKombat/comments/17j7jbs/whats\_the\_differences\_between\_mk\_and\_street/ 33\. Which realism-style game has the best character design? Mortal Kombat, Tekken, or Street Fighter? \- Reddit, https://www.reddit.com/r/Fighters/comments/15n7yjl/which\_realismstyle\_game\_has\_the\_best\_character/ 34\. Visualizing fighting game mechanics (2020) \- Hacker News, https://news.ycombinator.com/item?id=38641105 35\. Whoa SSFIV Producer Ono's thoughts about Mortal Kombat...talking crap? \- GameFAQs, https://gamefaqs.gamespot.com/boards/961031-mortal-kombat/58717781 36\. Why is Street Fighter superior to Mortal Kombat? :: Street Fighter V 综合讨论, https://steamcommunity.com/app/310950/discussions/0/2272575584125514663/?l=schinese 37\. Mortal Kombat 11 vs Street Fighter V Animation : r/StreetFighter \- Reddit, https://www.reddit.com/r/StreetFighter/comments/bq71gf/mortal\_kombat\_11\_vs\_street\_fighter\_v\_animation/ 38\. What is Mortal Kombat like if you compared to Street Fighter? : r/StreetFighter \- Reddit, https://www.reddit.com/r/StreetFighter/comments/13l8by8/what\_is\_mortal\_kombat\_like\_if\_you\_compared\_to/ 39\. Mortal Kombat 1's Ed Boon 'Absolutely' Wants to Make Something Different \- IGN, https://www.ign.com/articles/mortal-kombat-1s-ed-boon-absolutely-wants-to-make-something-different 40\. Street Fighter Producer on Mortal Kombat Reboot Inspiration, 30th Anniversary Surprises, https://sea.ign.com/street-fighter-5/117250/street-fighter-producer-on-mortal-kombat-reboot-inspiration-30th-anniversary-surprises 41\. Normals Can Be Fun: A Road to Recovery for Button Mashers | by Letters From the Arcade, https://lettersfromthearcade.medium.com/normals-can-be-fun-a-road-to-recovery-for-button-mashers-3fb2b97c64a2 42\. What's the difference between classic and modern controls in SF6? : r/StreetFighter \- Reddit, https://www.reddit.com/r/StreetFighter/comments/1irhlku/whats\_the\_difference\_between\_classic\_and\_modern/ 43\. Modern Controls as a Beginner :: Street Fighter™ 6 General Discussions, https://steamcommunity.com/app/1364780/discussions/0/3815158655060323940/ 44\. Should I learn SF6 with modern controls and move to classic or just start with classic? : r/StreetFighter \- Reddit, https://www.reddit.com/r/StreetFighter/comments/1enrex5/should\_i\_learn\_sf6\_with\_modern\_controls\_and\_move/ 45\. "What 10 hours with Modern Control has taught me in Street Fighter 6" : r/StreetFighter \- Reddit, https://www.reddit.com/r/StreetFighter/comments/137t41j/what\_10\_hours\_with\_modern\_control\_has\_taught\_me/ 46\. Is there anything wrong with using modern controls in SF6? Any advice or input? \- Reddit, https://www.reddit.com/r/Fighters/comments/1gw53do/is\_there\_anything\_wrong\_with\_using\_modern/ 47\. Comeback Mechanic \- The Fighting Game Glossary \- infil.net, https://glossary.infil.net/?t=Comeback%20Mechanic 48\. Comeback Mechanics & Slippery Slopes \- Celia Wagar's CritPoints, https://critpoints.net/2017/04/01/comeback-mechanics-2/ 49\. Game Design: What is your take on the use of comeback mechanics to generate Epic win moments? \- Quora, https://www.quora.com/Game-Design-What-is-your-take-on-the-use-of-comeback-mechanics-to-generate-Epic-win-moments 50\. The Underdog Story: Designing Comeback Mechanics \- \+4 Blog of Arcane Secrets, https://blogofarcanesecrets.wordpress.com/2018/02/12/the-underdog-story-designing-comeback-mechanics/ 51\. Love everything about the game for now, but one of the things I majorly disliked about MK11 that moved to MK1 is how the camera shakes on every slightest hit\\slash like it's a two-ton punch. It feels like a very artificial impact. Can we get an option to disable that? Does anybody feel the same \- Reddit, https://www.reddit.com/r/MortalKombat/comments/15okrl8/love\_everything\_about\_the\_game\_for\_now\_but\_one\_of/ 52\. Why haven't fighting games died yet? | by Patrick Miller \- Medium, https://pattheflip.medium.com/why-havent-fighting-games-died-yet-e30ee365e5ce 53\. Street Fighter – 1987 Developer Interview \- shmuplations.com, https://shmuplations.com/streetfighter/