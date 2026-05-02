# Level Design & Progression

> Concept / future-design notes unless a section explicitly says it is implemented. For current shipped level behavior, see [`PLAYER_MANUAL.md`](./PLAYER_MANUAL.md).

## Overworld: The "Sketch" City

### Zone 1: The Outskirts (Starting Area)

- **Visuals:** Pure sketch mode. Buildings are just cubes with "Building" written on them.
- **Goal:** Find the "Glasses."
- **Layout:** A long flat stretch that ends at a "Closed" gate. A hidden hole under a "TODO" sign leads to the basement.

### Zone 2: The Downtown (Post-Glasses)

- **Visuals:** Transitional. Mix of sketch and low-fidelity color.
- **Key Buildings:** 
  - **The Studio:** Where the player can change their outfit (unlockable skins).
  - **The Library:** Contains "Lore" about the projects (converted from the current Static Portfolio data).
- **Secrets:** 
  - A rooftop that can only be reached by jumping on "Invisible" platforms revealed by the Lens.

---

## Hobby Scene: The "Growth" Room

### Phase 1: The Empty Room

- Personal hobby props are visible as tactile room objects rather than portfolio menu items.
- The room focuses on lifestyle/play activities; developer-workstation content lives in the basement.

### Phase 2: The Populated Room

- As the player interacts with items, the room becomes more vibrant.
- **The Guitar:** Unlock a rhythm mini-game.
- **The Canvas:** Unlock a painting mini-game.
- **The Muay Thai Bag:** Unlock a timing-based punching mini-game.

### Secrets:

- **The Hidden Door:** Revealed only when all mini-games are completed at least once. Leads to the "Final Level" (Credits/Contact).

---

## The Basement: The "Dev" Room

- **Visuals:** Matrix-style falling code or raw terminal aesthetic.
- **Role:** Central hub for "Secrets" and developer identity. Once an item is found in the world, it can appear here.
- **The Computer:** An unnamed workstation with a simple `[E] Interact` prompt. Before the glasses are collected, interacting produces a character thought (`ughh... I can't see`); after the glasses are owned, it opens the terminal-style Developer Console.
- **The "Cheat" Terminal:** The Developer Console can start with commands like `whoami`, `skills`, and `help`, then later grow into cheatsheets, tests, and world modifiers such as `gravity 0.5`.
