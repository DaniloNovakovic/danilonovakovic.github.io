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

- **Move:** swipe left or right on the game area.
- **Jump:** swipe up.
- **Interact:** tap the game area.

## Overworld

- Walk along the hand-drawn street and interact with buildings to open React portfolio overlays.
- Opening a React overlay pauses Phaser movement and input.
- Closing an overlay returns to the street, unless the overlay was opened from an interior parent scene.
- The basement entrance is the hole under the `TODO?` sign.
- A banana peel secret can be discovered in the street. After discovery, interacting with it enters Potassium Slip.

## Hobbies Room

- Enter the Hobbies Phaser scene from the Hobbies building.
- Walk to a hobby station and press `E` to open its React overlay.
- Current hobby stations: Art, Music, Fitness, and Dancing.
- Close a hobby overlay to return to the Hobbies room.
- Press `H` or `Esc`, or interact with the exit, to return to the street.

## Developer Basement

- Enter through the overworld basement hole.
- The glasses pickup is in the basement. Collecting it adds and equips the glasses.
- Before glasses are owned, interacting with the computer shows the character thought: `ughh... I can't see`.
- After glasses are owned, interacting with the computer opens the Developer Console React overlay.
- Close the console to return to the basement.
- Press `H` or `Esc`, or interact with the ladder, to return to the street.

## Potassium Slip

- Potassium Slip is a Phaser mini-game reached from the banana peel secret.
- Start a run with `E` on desktop or a tap on mobile.
- Launch the banana by dragging toward a target and releasing.
- Hold while the banana is moving to yo-yo it back to the launch pad, then relaunch.
- Clear falling 5-column enemy waves, draft stackable upgrades, and defeat the boss for the Circuit.
- You start with 5 lives; losing all lives ends the run.
- After game over, choose `Retry` or `Return to City`. After winning, choose `Endless Mode` or `Return to City`.
- Potassium keeps a local top-5 records list for finished runs.
- Press `R` to retry after a terminal screen, `E` to return, `Space` to continue into endless after winning, or `Esc` to return to the city.

## Runtime Notes For Playtesting

- React overlays should always pause Phaser input.
- Returning from Hobbies or Basement overlays should restore the parent room, not the overworld.
- Hobbies, Basement, and the overworld preserve resume position where policy allows it.
- Potassium starts fresh when entered.
