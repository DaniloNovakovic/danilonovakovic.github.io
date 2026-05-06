# **The Kinetic Strategy of Clair Obscur: Expedition 33: A Comprehensive Analysis of Reactive Turn-Based Combat**

The landscape of the role-playing game (RPG) genre has historically been bifurcated between the methodical, menu-driven deliberation of traditional turn-based systems and the visceral, reflex-oriented engagement of real-time action. *Clair Obscur: Expedition 33*, the debut title from Sandfall Interactive, represents a seminal attempt to dissolve this dichotomy through its "Reactive Turn-Based" (RTB) system. Developed using Unreal Engine 5, the game utilizes high-fidelity visuals and a sophisticated audio-visual feedback loop to transform turn-based combat into a high-stakes performance. By analyzing the mechanical intricacies, character-specific architectures, and the psychological underpinnings of its gameplay, it becomes evident that the "essence of fun" in *Expedition 33* is derived from the continuous demand for player agency—even during the enemy's turn—creating a combat experience that is as much about rhythmic mastery as it is about tactical planning.

## **The Architecture of Reactive Turn-Based Combat**

At its foundational level, the combat in *Expedition 33* adheres to the structural norms of the JRPG subgenre, utilizing a timeline to dictate turn order based on the Speed and Agility attributes of both allies and adversaries. However, the developers at Sandfall Interactive have introduced a layer of real-time interaction that necessitates constant cognitive and physical engagement. This "RTB" framework is built upon three primary pillars: proactive offensive execution, reactive defensive mitigation, and the management of a shared resource economy.  
The flow of a typical encounter begins with the "First Strike" mechanic. While traversing the linear yet secret-rich environments inspired by Belle Époque France, players can initiate combat by striking an enemy first, thereby securing an immediate turn advantage for the entire party. This initial phase sets the tempo for the Action Point (AP) economy, which serves as the lifeblood of the combat system.

### **The Action Point Economy and Resource Management**

The AP system in *Expedition 33* differs from traditional "mana" or "stamina" pools by being a dynamic, regenerable resource that rewards skillful play. While characters gain a baseline amount of AP at the start of their turns, the most efficient way to fuel powerful abilities is through the successful execution of real-time maneuvers.

| Action Category | AP Cost / Gain | Strategic Implication |
| :---- | :---- | :---- |
| Basic Attack | \+1 AP per hit | Used to build resources and chip away at minor shields. |
| Skill Execution | 1 to 9 AP | High-impact actions that require timed QTEs for maximum efficiency. |
| Free Aim Shot | \-1 AP | Precision targeting for weak points; essential for aerial threats. |
| Successful Parry | \+1 AP per parry | Rewards defensive timing with increased offensive capacity. |
| Perfect Dodge | \+1 AP (with specific Pictos) | Provides an alternative resource generation path for evasion-focused builds. |

This economy creates a continuous decision-making loop. A player may choose to use a series of low-cost basic attacks to stockpile AP for a devastating high-tier skill like Maelle's "Phantom Strike," or they may rely on their ability to parry an enemy's multi-hit combo to refund the cost of their previous actions. The "fun" emerges from this virtuous cycle: defensive excellence is not merely a survival tactic but an offensive enabler.

### **The Sensory Feedback Loop: Visual and Auditory Precision**

The efficacy of the reactive system is heavily dependent on the game's ability to communicate timing windows to the player. Sandfall Interactive utilizes a multi-sensory approach to "telegraphing" enemy actions, ensuring that the player's failure or success is a direct result of their own perception and reaction.  
The visual cues are integrated into the cinematography of the combat. Unreal Engine 5's Blueprint visual scripting allows for dynamic camera manipulation, such as a "punch-in" zoom that occurs at the precise moment an attack becomes active. This visual "shorthand" helps players distinguish between an enemy's elaborate wind-up animation and the actual frame of impact. Furthermore, the game employs time dilation—the slowing of time during specific maneuvers—to heighten the intensity and weight of successful actions, a technique that provides the player with a brief "tactical breather" to prepare for the next input.  
Auditory cues serve as an even more reliable indicator for many players. Every attack in the game is synchronized with a distinct sound effect, ranging from a "high-pitched ring" to a guttural "grunt" or a heavy "thwomp". These cues are so integral that many high-level players recommend playing with headphones or adjusting the music-to-SFX ratio to better discern the timing windows. The "essence of fun" here is comparable to a rhythm game; there is an inherent psychological satisfaction in matching one's button presses to a complex, auditory-visual sequence, transforming a standard boss fight into a "mastered song".

## **Offensive Mechanics: The Controlled Damage Puzzle**

The offensive phase in *Expedition 33* is not a passive selection of menu items but a "controlled damage puzzle" that rewards precision and synergy. The system is built on the premise that players should be actively maximizing their damage output through multiple layers of interaction: the Quick Time Event (QTE) system, Free Aim, and the management of character-specific gauges.

### **The QTE System: "Paper Mario on Steroids"**

During the execution of a skill, players are presented with a "QTE widget," typically requiring a timed press of the "X" button as a cursor moves through a success zone. While this may seem rudimentary, the system scales in complexity as characters unlock multi-hit abilities. A skill like Gustave's "Lumiere Assault" consists of five distinct hits, each requiring its own timed input.  
The mechanical implication is significant: a "Perfect" timing hit does not just increase damage; it can also generate additional resources, such as Gustave's "Charges," or apply status effects more reliably. This turns every turn into a high-engagement event where the player is not just a strategist but an active participant in the character's physical exertion. For many players, this is the "Paper Mario on steroids" effect—a classic, satisfying mechanic elevated by modern production values and high-stakes combat.

### **Free Aim and the Shield System**

The "Free Aim" mechanic introduces a spatial element to the turn-based grid. By spending 1 AP, a character can manually target an enemy's weak point with a ranged weapon. This serves several tactical functions:

1. **Aerial Combat:** Floating or flying enemies often possess high evasion against standard melee attacks, making Free Aim the primary method for dealing consistent damage.  
2. **Shield Reduction:** Many enemies are protected by multiple "shield icons" that negate all damage from heavy attacks. Each Free Aim shot (or each hit of a multi-hit basic attack) removes one shield icon, requiring players to "break" the enemy's guard before unleashing their most powerful skills.  
3. **Weak Point Exploitation:** Striking specific parts of an enemy (such as a boss's eye or a creature's glowing core) deals significantly more damage and can accelerate the "Break" meter.

This system forces players to evaluate the "texture" of their opposition. Is it more efficient to spend 3 AP on a single high-damage nuke, or 3 AP on three Free Aim shots to remove a boss's shields and set up an ally for a massive strike?. This strategic depth, combined with the manual skill of aiming, contributes to the game's "tactical fun".

## **Defensive Dynamics: The Heart of the Performance**

While offensive play provides the power fantasy, the defensive mechanics are the true heart of *Expedition 33*. The game's difficulty is designed around the assumption that the player will not simply "take hits" but will actively mitigate them through three primary maneuvers: Dodging, Parrying, and Jumping.

### **The Risk-Reward of Parrying**

The parry is the most difficult but rewarding defensive action. It requires the player to press the "RB/R1" button at the exact moment of impact. Unlike traditional RPGs where blocking might reduce damage by a percentage, a successful parry in *Expedition 33* completely negates all incoming damage for that hit.  
The "fun" of the parry system is found in the "Expedition Counter". If an enemy unleashes a multi-hit combo and the player parries *every single hit*, the character (or the entire party, in the case of a group attack) will perform a devastating, automatic counterattack. This transforms the enemy's turn into an opportunity for the player to deal massive damage. The psychological impact of "turning the tables" through pure skill is a major driver of the game's positive reception.

### **Defensive Variation: Dodging and Jumping**

For players who find the parry window too tight, the "Dodge" (B/O button) offers a safer alternative with a more generous timing window. While it does not trigger the same powerful counters as a parry, it remains essential for survival. Furthermore, specific ground-based or area-of-effect (AOE) attacks are telegraphed with a yellow "Jump" icon, signaling that neither dodging nor parrying will be effective. The player must jump over the shockwave or sweeping attack, an action that can also trigger a group counter if timed correctly.  
This tripartite defensive system ensures that players must constantly monitor enemy animations. It is not enough to simply "wait for your turn"; you must actively learn the "rhythms" of each of the surreal adversaries, from the towering Lampmaster to the erratic Chromatic Troubadour.

### **Gradient Attacks and the Grayscale Mechanic**

In the latter half of the game, players are introduced to "Gradient Attacks"—powerful maneuvers that bypass standard defense. These attacks are signaled by the screen turning grayscale and time slowing to a crawl. To defend against these, players must use a "Gradient Counter" by pressing "RT/R2".  
The timing for this is unique: the player must wait through the slow-motion wind-up and press the button exactly when the enemy's movement returns to normal speed for the final strike. This creates a "moment of tension" that breaks the standard combat rhythm, forcing the player to adapt to a different timing logic. While some players found this mechanic frustrating due to its departure from standard parry logic, others praised it for adding a "cinematic high-stakes" feel to major boss encounters like the fight against Renoir.

## **Character-Specific Architectures and Synergistic Depth**

The "Reactive Turn-Based" system is further enriched by the distinct mechanical identities of the six playable characters. Each character is designed around a unique "gimmick" that fundamentally changes how they interact with the AP economy and the real-time systems.

### **Gustave: The Engineer’s Multi-Hit Momentum**

As the starting character, Gustave is designed to teach the player the importance of hit count. His unique mechanic is the "Overcharge" gauge, which fills not by damage dealt, but by the number of successful hits landed. This makes Gustave a "multi-hit specialist." His basic attack and skills like "Lumiere Assault" are intended to rapidly fill the gauge, which can then be expelled through the "Overcharge" skill—a single, massive strike that deals extreme damage and is highly effective at "Breaking" an enemy's stance.

### **Lune: The Mage’s Elemental "Stains"**

Lune represents the strategic "resource management" archetype. Her elemental skills generate "Stains" (up to a maximum of four) on a shared palette. These Stains correspond to the elements used (Ice, Fire, Lightning, Earth, or Light) and can be consumed to augment her next ability.  
For example, consuming Fire Stains might increase the burn duration of her next spell, while consuming Lightning Stains could add extra hits to a single-target nuke. This makes Lune's turns a "sequencing puzzle." Players must plan several steps ahead: "If I use Ice Lance now to slow the enemy, I'll have two Ice Stains for my next turn, which I can then consume to make my healing spell more potent". The depth here lies in the synergy between her different elemental trees, rewarding players who master the "Perfect Flow" of her stains.

### **Maelle: The Fencer’s Stance Rotation**

Maelle is perhaps the most mechanically complex character in terms of turn-to-turn execution. Her combat revolves around three "Stances": Offensive, Defensive, and Virtuose.

| Stance Type | Bonus Effect | Drawback / Requirement |
| :---- | :---- | :---- |
| Stanceless | Baseline performance | No special bonuses. |
| Defensive | \-50% damage taken; \+1 AP on parry/dodge | Lower damage output. |
| Offensive | \+50% damage dealt | \+50% damage taken. |
| Virtuose | \+200% damage dealt | Extremely high AP costs; requires setup skills. |

Maelle cannot stay in the same stance for two turns in a row without using specific high-level skills like "Fleuret Fury". This forces the player into a "dance" of switching between offense and defense. The "essence of fun" with Maelle is the high-risk, high-reward nature of her Virtuose stance. Successfully parrying an enemy's combo while in Virtuose stance can result in counterattacks that rival the damage of most ultimate abilities.

### **Sciel: The Support-Nuke "Twilight" Hybrid**

Sciel utilizes a "Builder-Spender" mechanic based on "Foretell" stacks. Her "Sun" skills apply these stacks to enemies, while her "Moon" skills consume them for amplified effects, such as massive dark damage or party-wide healing. By balancing Sun and Moon charges, Sciel can enter the "Twilight" state, where her ability to apply and consume Foretell is doubled. Sciel’s "fun" factor is her versatility; she can be built as a pure offensive powerhouse or as a "turn-controlling support" who can apply multiple buffs (Shell, Rush, Powerful) to the entire party in a single turn.

### **Monoco: The "Blue Mage" Bestial Wheel**

Monoco is the most unique character in the roster. His skills are literally stolen from the enemies he defeats—Nevrons—and his performance is tied to the "Bestial Wheel". This wheel contains five "Masks" (Agile, Balanced, Heavy, Caster, and Almighty) that rotate with every skill he uses. Each mask provides a different buff to his Nevron abilities.  
Playing Monoco requires a high degree of "rotation optimization." Players must calculate exactly how many steps the wheel will move with each skill to ensure they land on the "Almighty Mask" (which buffs all skills) before a major boss phase. This "predictive strategy" offers a different flavor of fun compared to the reflex-heavy style of Maelle or the resource-heavy style of Lune.

### **Verso: The Perfectionist**

Verso, who joins the party in Act II, is designed for the highest-skill players. His "Perfection" mechanic rewards him for landing hits and successfully defending without taking *any* damage. As his Perfection gauge fills, his Rank increases from D to S, providing massive damage multipliers. However, a single failed parry or dodge can reset his rank. Verso is the ultimate "glass cannon" reward for players who have mastered the game's defensive timing.

## **The Metagame: Build Theory, Synergies, and Progression**

Beyond the moment-to-moment combat, *Expedition 33* offers a deep metagame that allows players to "break" the difficulty through clever builds and synergies. This "theory-crafting" is centered around the Picto, Lumina, and Attribute systems.

### **The Picto and Lumina Synergy**

Pictos are collectible items that grant unique perks. Once a character "masters" a Picto by winning four battles with it equipped, they unlock its "Lumina"—a passive bonus that can be shared with other party members.  
This creates an "additive power system" where the party becomes progressively more optimized as they master more items. For example, the "Cheater" and "Energy Master" Luminas are considered essential for endgame play because they grant extra turns and reduce AP costs, allowing for "limitless loops" of extreme damage. The "essence of fun" here is the sense of growth; by Act III, a well-built party feels "unbeatable" not because of raw stats, but because they have engineered a perfect machine of turn-resets and damage-multipliers.

### **Status Stacking and Boss Elimination**

The deepest tactical synergy in the game revolves around three status effects: **Burn**, **Mark**, and **Break**.

* **Burn Stacking:** Using Maelle’s "Medalum" weapon, players can apply uncapped amounts of Burn damage. When combined with "Critical Burn" Luminas, every tick of burn damage can also trigger critical hit bonuses.  
* **Mark Application:** Verso’s "Simoso" weapon allows him to keep enemies permanently "Marked," which increases all damage taken from the rest of the party.  
* **Break Exploitation:** Monoco can be built as a "Breaker" specialist, using high-speed Pictos to rapidly deplete a boss's stance meter.

Once an enemy is "Broken," they are stunned for a full turn and take significantly increased damage. A perfect rotation often looks like this: Verso marks the target, Monoco breaks the target, and then Maelle enters Virtuose stance and unleashes a nuke that consumes all of Lune's previously applied Burn stacks for a single, multi-million damage hit. This "one-cycle boss kill" is the ultimate reward for players who engage with the game's deepest systems.

### **Attribute Allocation and Role Specialization**

Each level-up provides 3 points to invest in five core stats. The impact of these choices is pronounced because weapons have scaling grades (e.g., Might Rank A, Agility Rank C).

* **Might:** Essential for raw damage scaling, particularly for Maelle and Verso.  
* **Agility:** The most valuable stat for support characters like Sciel and Monoco, ensuring they can apply buffs and "Break" pressure before the enemy acts.  
* **Luck:** Critical for Gustave and Verso, as their multi-hit attacks gain the most benefit from high crit rates.  
* **Vitality & Defense:** Critical for "Tank" builds, particularly if using Maelle’s "Egide" weapon, which allows her to intercept all attacks for the party.

| Attribute | Primary Benefit | Ideal For |
| :---- | :---- | :---- |
| Might | High Raw Attack Power | Maelle, Verso. |
| Agility | Turn Frequency / Speed | Sciel, Monoco. |
| Luck | Critical Rate / Follow-ups | Gustave, Verso, Sciel. |
| Vitality | HP Pool / Base ATK | Lune (Healer Build). |
| Defense | Damage Mitigation | Tank-Maelle. |

## **The "Essence of Fun": A Psychological Breakdown**

The preceding analysis of mechanics, characters, and metagame builds leads to a central question: what is the "essence" of why this combat is fun? The answer lies in the intersection of three psychological states: **Flow**, **Agency**, and **Mastery**.

### **The Turn-Based Flow State**

"Flow" is a state of deep immersion where a person is fully absorbed in an activity. Traditional turn-based games often break this flow during the enemy's turn—the player stops "playing" and begins "waiting." *Expedition 33* eliminates this waiting period. Because the player must be ready to dodge or parry at any moment, they never leave the flow state. This "continuous engagement" is why many players found they could play the game for hours without feeling bored or repetitive.

### **Agency and the Illusion of Determinism**

In many RPGs, if a boss is designed to hit for 500 damage and the player has 400 HP, the outcome is deterministic: the player loses. In *Expedition 33*, the player has the agency to "refuse" that outcome. A perfect parry negates the damage entirely. This shift from "stat-checking" to "skill-checking" makes victories feel earned rather than calculated. The fun comes from knowing that *you* won the fight because *you* performed, not just because your numbers were higher.

### **The Mastery of the "Song"**

The "rhythmic" nature of the combat—learning the thwomps and grunts of the enemies and matching them with parries—creates a sense of mastery that is unique to this hybrid genre. There is a distinct "arc of fun" for every new enemy: initial confusion, followed by pattern recognition, and finally, the effortless execution of the perfect counter. This satisfies the human desire for "competence," a core component of self-determination theory.

## **Conclusion: The New Standard for Tactical Engagement**

*Clair Obscur: Expedition 33* does not merely "add" real-time elements to turn-based combat; it reconstructs the genre around them. By making defense as active as offense, and by layering complex character mechanics over a robust build-theory metagame, Sandfall Interactive has created a system that addresses the historical weaknesses of both turn-based and action RPGs. The "essence of fun" is the constant, high-stakes dialogue between the player and the game: every enemy attack is a question, and every parry, dodge, or jump is the player’s emphatic, skillful answer. This kinetic strategy marks a new milestone in RPG design, proving that the deliberate pace of turn-based tactics and the visceral thrill of real-time action are not mutually exclusive, but are, in fact, the perfect partners for a modern masterpiece.

#### **Works cited**

1\. Clair Obscur: Expedition 33 \- Wikipedia, https://en.wikipedia.org/wiki/Clair\_Obscur:\_Expedition\_33 2\. Inside the development journey of Clair Obscur: Expedition 33 \- Unreal Engine, https://www.unrealengine.com/developer-interviews/inside-the-development-journey-of-clair-obscur-expedition-33 3\. Combat \- Clair Obscur Expedition 33 Wiki Guide, https://expedition33.wiki.fextralife.com/Combat 4\. Clair Obscur: Expedition 33 on Steam, https://store.steampowered.com/app/1903340/Clair\_Obscur\_Expedition\_33/ 5\. How the Clair Obscur: Expedition 33 dev process powered creative ..., https://blog.playstation.com/2026/03/11/how-the-clair-obscur-expedition-33-dev-process-powered-creative-design-freedom/ 6\. Behind the Captivating Sound of 'Clair Obscur: Expedition 33 ..., https://www.asoundeffect.com/clair-obscur-expedition-33-game-audio/ 7\. Clair Obscur: Expedition 33 Hands-on Preview – The Brushstrokes ..., https://www.rpgfan.com/2025/03/03/clair-obscur-expedition-33-preview/ 8\. Clair Obscur: Expedition 33: The Final Preview \- IGN, https://www.ign.com/articles/clair-obscur-expedition-33-the-final-preview 9\. Best Clair Obscur Expedition 33 attributes for all characters \- PCGamesN, https://www.pcgamesn.com/clair-obscur-expedition-33/attributes-best 10\. Combat Guide \- Clair Obscur Expedition 33 \- Maxroll, https://maxroll.gg/clair-obscur-expedition-33/guides/combat-guide 11\. Hands-On Preview : Clair Obscur Expedition 33 \- Seasoned Gaming, https://seasonedgaming.com/2025/03/29/hands-on-preview-clair-obscur-expedition-33/ 12\. Clair Obscur Expedition 33 Wiki Guide \- FextraLife, https://expedition33.wiki.fextralife.com/Expedition+33+Wiki 13\. Battles | Clair Obscur Wiki | Fandom, https://clair-obscur.fandom.com/wiki/Battles 14\. Clair Obscur: Expedition 33 hands-on preview — Triumphant, turn-based tour de force, https://gamingtrend.com/previews/clair-obscur-expedition-33-hands-on-preview-triumphant-turn-based-tour-de-force/ 15\. Clair Obscur Expedition 33: A Guide to the Key Characters \- Gamerall, https://gamerall.com/blog/game-news/expedition-33-clair-obscur-character-guide 16\. "Parrying was not easy": Clair Obscur Expedition 33 devs had to turn to sound to fix an integral part of the J'RPG's combat : r/expedition33 \- Reddit, https://www.reddit.com/r/expedition33/comments/1rqx7po/parrying\_was\_not\_easy\_clair\_obscur\_expedition\_33/ 17\. Audio cue was a pretty bad gameplay choice :: Clair Obscur: Expedition 33 Общие обсуждения \- Steam Community, https://steamcommunity.com/app/1903340/discussions/0/592895604607172763/?l=russian 18\. The BEST TIP You Need for Dodging & Parrying in Clair Obscur: Expedition 33 \- YouTube, https://www.youtube.com/watch?v=FBKdCARWVY0 19\. 'Clair Obscur: Expedition 33' Party Synergies Guide – Best Builds ..., https://www.techtimes.com/articles/313916/20260115/clair-obscur-expedition-33-party-synergies-guide-best-builds-rotations-combos.htm 20\. Characters | Expedition 33 Wiki, https://expedition33.wiki.fextralife.com/Characters 21\. All Party Members In Clair Obscur: Expedition 33 And Their Abilities \- GameSpot, https://www.gamespot.com/gallery/all-party-members-in-clair-obscur-expedition-33-and-their-abilities/2900-6501/ 22\. Combat Guide \- Clair Obscur: Expedition 33 Guide \- IGN, https://www.ign.com/wikis/clair-obscur-expedition-33/Combat\_Guide 23\. Parry and Dodge TIPS :: Clair Obscur: Expedition 33 General Discussions \- Steam Community, https://steamcommunity.com/app/1903340/discussions/0/592895445665076373/ 24\. How to use Gradient Attacks in Clair Obscur Expedition 33 | Eurogamer.net, https://www.eurogamer.net/how-to-use-gradient-attacks-counters-clair-obscur-expedition-33 25\. Gradient Counters Tutorial in Under 2 Minutes — Clair Obscur: Expedition 33 Walkthrough, https://www.youtube.com/watch?v=KQV1yoe4ff0 26\. Can someone explain the whole grandient counter : r/expedition33 \- Reddit, https://www.reddit.com/r/expedition33/comments/1kae9tk/can\_someone\_explain\_the\_whole\_grandient\_counter/ 27\. Clair Obscur: Expedition 33 Dev Team Discusses Creative Process | TechPowerUp Forums, https://www.techpowerup.com/forums/threads/clair-obscur-expedition-33-dev-team-discusses-creative-process.331730/ 28\. Clair Obscur Expedition 33: List of All Characters \- LootBar, https://lootbar.gg/blog/en/clair-obscur-expedition-33-list-of-characters.html 29\. Clair Obscur: Expedition 33 Complete Character Build Guide \- ScreenRant, https://screenrant.com/clair-obscur-expedition-33-complete-character-builds-weapons/ 30\. Sciel | Expedition 33 Wiki, https://expedition33.wiki.fextralife.com/Sciel 31\. Skills | Expedition 33 Wiki, https://expedition33.wiki.fextralife.com/Skills 32\. Companions \- Clair Obscur: Expedition 33 Walkthrough & Guide \- GameFAQs \- GameSpot, https://gamefaqs.gamespot.com/ps5/469495-clair-obscur-expedition-33/faqs/82352/companions 33\. Sciel, Skill List \- Clair Obscur: Expedition 33 Walkthrough & Guide \- GameFAQs, https://gamefaqs.gamespot.com/ps5/469495-clair-obscur-expedition-33/faqs/81883/sciel-skill-list 34\. Sciel Skills Guide \- Clair Obscur: Expedition 33 \- Maxroll, https://maxroll.gg/clair-obscur-expedition-33/guides/sciel-skills-guide 35\. Party synergy :: Clair Obscur: Expedition 33 General Discussions \- Steam Community, https://steamcommunity.com/app/1903340/discussions/0/592896116589089577/?ctp=2 36\. New Clair Obscur: Expedition 33 Guides & Planner \- Maxroll, https://maxroll.gg/clair-obscur-expedition-33/news/new-clair-obscur-expedition-33-guides-planner 37\. Clair Obscur : Expedition 33 \- BUILD FOR EVERY CHARACTER \- YouTube, https://www.youtube.com/watch?v=QRImFZpZkv8 38\. Is combat system deep or parry/dodge ftw? :: Clair Obscur: Expedition 33 General Discussions \- Steam Community, https://steamcommunity.com/app/1903340/discussions/0/685242695859432708/ 39\. Clair Obscur: Expedition 33 Gameplay/Combat : r/PS5 \- Reddit, https://www.reddit.com/r/PS5/comments/1s9vb0o/clair\_obscur\_expedition\_33\_gameplaycombat/