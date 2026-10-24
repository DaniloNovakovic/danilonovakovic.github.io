# Player Manual

Current shipped behavior for interactive mode. Concept and future-design notes live in the other files in this directory.

## Starting Modes

- **Interactive mode:** the Phaser street with React overlays and Phaser interior scenes.
- **Static mode:** the non-game portfolio view.
- The mode switch in the top-right corner swaps between the two.

## Core Controls

### Desktop

- **Move:** `A` / `D` or left / right arrows.
- **Sprint:** hold `Shift`.
- **Jump:** up arrow.
- **Interact:** `E` when a prompt appears.
- **Exit interior scene:** `H` or `Esc` in Hobbies and Basement.
- **Close React overlay:** click the close button or use the overlay close affordance.

### Mobile / Touch

- **Move:** drag left or right anywhere on the game area. A small drag indicator appears under your finger while moving.
- **Interact:** tap the game area.
- **Jump:** desktop only (up arrow). Not mapped on mobile touch.

## Overworld

- Walk along the hand-drawn street and interact with buildings to open React portfolio overlays.
- The building you can enter lifts and wobbles slightly, and its label grows.
- A `START` signpost sits beside the spawn. Reading it gives a hint for the next step of the secret chain (glasses → hobby spare parts or banana peel → Circuit → CRT) plus a `Secrets found: n/6` tally (glasses, banana peel, Circuit, and three spare parts). A bobbing `!` marks the sign when it has a hint you haven't read yet.
- The street "grows up" as secrets are found. With glasses it is the plain kid-drawing street; after three secrets an ink pass adds cast-shadow hatching, daisies, and picket fences; with the Circuit, street lamps with light pools and twinkling stars appear. A short toast announces each upgrade.
- A billboard near the end of the street reads "This space for rent" until you sign and pin a drawing in the Hobbies art station; the pinned doodle then hangs on the billboard.
- Doodle birds on the telephone wire scatter when you get close (sooner while sprinting) and return once you've walked away. Landing and sprinting kick up small ink puffs.
- Decorative motion (bird flight, puffs, wobble, CRT animation) is reduced or frozen under `prefers-reduced-motion`.
- Opening a React overlay pauses Phaser movement and input.
- Closing an overlay returns to the street, unless the overlay was opened from an interior parent scene.
- The basement entrance is an open hatch with a ladder. The lid rattles and `?` glyphs float up when you walk near it; after collecting the glasses, code glyphs rise instead. Entering plays a short drop-in animation.
- A banana peel secret can be discovered in the street. After discovery, interacting with it enters Potassium Slip.
- A blank street CRT sits between the Projects and Abilities buildings. It is always drawn, with or without glasses. Without a Circuit it only shows a locked prompt and the occasional flicker of static; once you own the Circuit, a little stick figure waves from the screen. While owning the Circuit, interact with the CRT to insert it and enter Ridge (secret side story).

## Hobbies Room

- Enter the Hobbies Phaser scene from the Hobbies building.
- Walk to a hobby station and press `E` to open its React overlay.
- Current hobby stations: Art, Music, Fitness, and Dancing. A prize tag beside each station label stays dashed until its reward is claimed, then shows a tick.
- Music (guitar chords in any major key, including the sharp keys). The campfire sketch, G D Em C G, awards a copper string. The other sketches are for playing. Fitness (Muay Thai timing combo) and Dancing (rhythm rounds) award a battery cell and a clock crystal. Replays stay playable for fun.
- Art lets you sign and pin a drawing; it appears on the street billboard.
- Close a hobby overlay to return to the Hobbies room.
- Press `H` or `Esc`, or interact with the exit, to return to the street.

## Developer Basement

- Enter through the overworld basement hole.
- The glasses pickup is in the basement. Collecting it adds and equips the glasses.
- Without glasses the den is dim; collecting them switches the swinging bulb on.
- Before glasses are owned, interacting with the computer shows the character thought: `ughh... I can't see`.
- After glasses are owned, interacting with the computer opens the Developer Console React overlay. Besides `whoami`, `skills`, and `enter <scene>`, it answers `ls`, `cat <file>`, `parts`, and a couple of hidden commands.
- The corkboard cycles through notes about Danilo's work; read cards are marked on the board.
- The shelf holds relics of old projects (a uc32 board, a chess piece glued to a Tetris block).
- The workbench shows a Circuit blueprint with three part slots. With all three hobby spare parts, interacting solders them into a Circuit — a second route to the Circuit besides winning Potassium Slip.
- Close the console to return to the basement.
- Press `H` or `Esc`, or interact with the ladder, to return to the street.

## Potassium Slip

- Potassium Slip is a Phaser mini-game reached from the banana peel secret.
- Start a run with `E` on desktop or a tap on mobile.
- Launch the banana by dragging toward a target and releasing.
- Hold while the banana is moving to yo-yo it back to the launch pad, then relaunch.
- Clear falling 5-column enemy waves, draft stackable upgrades, and defeat the boss for the Circuit.
- The Circuit can be inserted into the overworld street CRT to enter Ridge.
- You start with 5 lives; losing all lives ends the run.
- After game over, choose `Retry` or `Return to City`. After winning, choose `Endless Mode` or `Return to City`.
- Potassium keeps a local top-5 records list for finished runs.
- Press `R` to retry after a terminal screen, `E` to return, `Space` to continue into endless after winning, or `Esc` to return to the city.

## Headless / AI Console

- Full interactive route is playable without a browser via `pnpm game:console`.
- Shared commands: `look`, `go left|right [n]`, `interact [name]`, `inventory`,
  `equip` / `unequip`, `close`.
- Potassium in console mode is discrete (`start`, `fight`, `draft`) — not the
  live drag-banana physics. Winning still grants the Circuit.
- Ridge conversation uses `advance` / `choose`. `pnpm ridge:console` is an alias
  that starts already inside Ridge.
- Ridge first-playable secret route: Bridge → Concert → Dance Festival → Relay
  farewell (Sit and Play, dedication card), then return to the Overworld street.
  Progress resets so the next CRT entry starts Bridge again.
- One-shot scripts: `pnpm game:console --script "look; go right 3; interact" --json`.

## Runtime Notes For Playtesting

- React overlays should always pause Phaser input.
- Returning from Hobbies or Basement overlays should restore the parent room, not the overworld.
- Hobbies, Basement, and the overworld preserve resume position where policy allows it.
- Potassium starts fresh when entered.
