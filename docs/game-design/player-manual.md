# Player Manual

Current shipped behavior for interactive mode. Concept and future-design notes live in the other files in this directory.

## Starting Modes

- **Interactive mode:** the Phaser street with React overlays and Phaser interior scenes.
- **Static mode:** the non-game portfolio view.
- The mode switch in the top-right corner swaps between the two.

## Core Controls

### Desktop

- **Move:** `A` / `D` or left / right arrows. Danilo keeps facing the way he last walked when you let go.
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
- A `START` signpost sits beside the spawn. Reading it gives a hint for the next step of the secret chain (glasses → hobby spare parts or litter pile → Circuit → CRT) plus a `Secrets found: n/6` tally (glasses, litter pile, Circuit, and three spare parts). A bobbing `!` marks the sign when it has a hint you haven't read yet.
- The street "grows up" as secrets are found. With glasses it is the plain kid-drawing street; after three secrets an ink pass adds cast-shadow hatching, daisies, and picket fences; with the Circuit, street lamps with light pools and twinkling stars appear. A short toast announces each upgrade.
- Once you have found anything, a `Backpack` button appears in the header next to `Dev` while you are on the street (`I` on a keyboard). It opens the Backpack: the six street secrets as paper cutouts, found or `?`, with a found tally. Glasses have a wear switch there, and hobby parts show `Soldered in` once the Circuit exists. It is hidden in other scenes and while a scene panel is open.
- A billboard near the end of the street reads "This space for rent" until you sign and pin a drawing in the Hobbies art station; the pinned doodle then hangs on the billboard.
- Doodle birds on the telephone wire scatter when you get close (sooner while sprinting) and return once you've walked away. Landing and sprinting kick up small ink puffs.
- Decorative motion (bird flight, puffs, wobble, CRT animation) is reduced or frozen under `prefers-reduced-motion`.
- Opening a React overlay pauses Phaser movement and input.
- Closing an overlay returns to the street, unless the overlay was opened from an interior parent scene.
- The basement entrance is an open hatch with a ladder. The lid rattles and `?` glyphs float up when you walk near it; after collecting the glasses, code glyphs rise instead. Entering plays a short drop-in animation.
- A chick paces on the sidewalk just past Experiences. With glasses off, interact to start Chick Magnet. Clearing the 2:30 run grants and equips the glasses. The field is a meadow bigger than the screen, with a picnic blanket in the middle and a hedge around it, and the camera follows you. Only two chicks show up at first; more walk in from off-screen as the run goes on. Each kind of bird looks different, and its drawn body is exactly what can peck you; the ring at your feet is your own hitbox. A bird that pecks you bounces off and backs away for a moment. A mirror appears at 0:22, 1:02, and 1:44: stand by it for a pep talk and a free twist. Your ex shows up at 1:26 as a tough boss that charges along a red lane and always drops a gift. Gifts pull in every scrap, make the flock scatter, heal you, or refill your dad joke. The last 20 seconds are a last-call rush. A Joke meter in the status strip fills over time and faster as you clear birds; when it reads Dad joke!, press Space or tap it to tell one, which damages and dazes the nearest birds around you. Let too many chicks swoon over you and Brad, someone's jealous boyfriend, turns up near the end (always by last call). He calls chicks over to shield him, dashes along three bent red lanes, throws protein shakers that leave a slowing pink puddle, and flexes harder once he is below half health. A dad joke only confuses him at first, but below half health it cracks him up and he fights the flock as your wingman for a while before leaving. Arrows on the screen edge point at off-screen mirrors, gifts, hearts, the bartender, the ex, and Brad. Scraps close to you fly in. The run starts by picking one weapon from two or three random offers. The first twist costs 8 scraps, and the next twists stay cheaper than a new weapon. A new weapon waits until after those early twists. A draft can also heal one peck, add room for another, or spin a little shell that catches the next one. At 1 HP a heart sometimes drops on the floor. Drafts are still at least 14 seconds apart, and nothing is a plain damage boost. Bad selfie photographs random nearby chicks and dazes whoever survives it. Bad breath is a lane of green bubbles in the direction you are facing. Bad smell is a grumpy green stink cloud that pops out of you and orbits close. Fake glasses folds the nearest chicks within reach. Each weapon shows on you: a phone, the bubbles, the stink cloud, or lenses. Twists change how that looks and feels: a wider or lingering or snaking breath, a farther or faster or twin or fatter cloud, a group photo or a longer pose or a rear camera, a prescription or a stare or a side eye. A chick hit by breath or stink flashes green. Nerds ignore glasses until the prescription twist, perfume chicks ignore the stink, and a situationship will not pose for a selfie. The special chicks occasionally say one line at a time. A fixer mends wounded birds. Hens take two hits, a rooster stops, shows a red lane, charges along it, and takes three, and a bartender raises a mug before throwing beer that soaks you and shuts your weapons off for a few seconds. During a run, `E`, `H`, and `Esc` do nothing so a stray press cannot end it; use the header Back button to leave. After a run, `E` or `H` returns to the street. With glasses on, the street chick runs away and will not talk. Take the glasses off (Backpack) and it comes back; a repeat clear does not grant a second pair. After a clear, Keep going (endless) resumes the same run with no time limit and the clock counting up: the flock keeps growing, newcomers get faster and tougher, a mirror returns every 40 seconds, your ex comes back stronger every 75 seconds, Brad comes back stronger every 90 seconds, and a 15-second rush hits once a minute. The run ends on the last peck, and the longest endless run on this device is shown as your best.
- A litter pile secret (crumpled paper, a tipped can, raccoon paw prints) sits on the sidewalk just past Abilities, and only while glasses are on. After discovery, interacting with it ("Tidy up?") slips Danilo into the dumpster and Scrub Rumble.
- A blank street CRT sits between the Projects and Abilities buildings. It is always drawn, with or without glasses. Without a Circuit it only shows a locked prompt and the occasional flicker of static; once you own the Circuit, a little stick figure waves from the screen. While owning the Circuit, interact with the CRT to insert it and enter Ridge (secret side story).

## Hobbies Room

- Enter the Hobbies Phaser scene from the Hobbies building.
- Walk to a hobby station and press `E` to open its React overlay.
- Current hobby stations: Art, Music, Fitness, and Dancing. A prize tag beside each station label stays dashed until its reward is claimed, then shows a tick.
- Music (guitar chords in any major key, including the sharp keys). The campfire sketch, G D Em C G, awards a copper string. The other sketches are for playing. Fitness (Muay Thai timing combo) and Dancing (rhythm rounds) award a battery cell and a clock crystal. Replays stay playable for fun.
- Art lets you sign and pin a drawing; it appears on the street billboard.
- Close a hobby overlay to return to the Hobbies room.
- Press `H` or `Esc`, or interact with the exit, to return to the street.
- Not every wall in the Hobbies room is as solid as it looks. If you end up somewhere undrawn, walk back right to return; `H` and `Esc` work from anywhere.
- Something waits at the far end of the undrawn page. Press `E` (or tap interact) and a **Point of no return** warning asks first: **Leave it** (`N`) changes nothing; **Pick it up** (`Y`) is a choice you can't take back. Keyboard: `←`/`→` move between the two, `Enter`, `Space` or `E` presses the highlighted one. `Esc` still leaves the room.
- Picking it up plays a short close-up, then an alarm: `OUT_OF_BOUNDS` is stamped across the view in alert red and the page edge shakes in pencil (reduced motion: cuts instead of zooms, no shake; nothing flashes, and it all reads with sound off). Behind you the page scribbles itself shut, so the way back right is blocked, and the page now runs on further left to a torn opening.
- From then on, for the rest of the visit to the site, you are escaping: leaving with `H`, `Esc` or the header puts you on the street in alarm (see below), and the Hobbies room stays taped shut. Reloading the page resets it.
- What you picked up goes in the Backpack, under its own "Off the page" heading. It doesn't count toward the street secrets.
- Walk into the torn opening and the blank page gives way: you come through the right wall of the Developer Basement (reduced motion: a cut instead of the fade into ink).

## The street in alarm (Out of Bounds escape)

- Once you are escaping, the street is a manhunt at night: the same drawn street under a dark wash, a moon, searchlights sweeping the buildings and a helicopter circling with its spotlight (reduced motion: they hold still). Every door is crossed with red, ink-hatched tape.
- Nothing can be entered: no buildings, no hatch, no CRT, no litter pile, and `H`/`Esc` no longer go back to the Hobbies room. Trying gets "Taped shut. Nowhere to hide now." The header `Static mode` button still works.
- Coming up through the hatch, the chick that always ran away from you is waiting, evil now (red eyes, hackles up). It says its piece, then comes for you: a red `!` over its head, then it lunges and pecks (`PECK!`). Step back during the `!`, or **parry** it and it stands there dizzy.
- You have the hammer from the Debugging Tools, and two moves: **Swing** (`F`) hits everything right in front of you, the way you last walked; **Parry** (`R`) raises a short guard. On touch, tap the round **Swing** and **Parry** buttons in the corner of the game. The first swing flattens the chick (`BONK!`).
- Then the street comes for you in three waves: packs of raccoons (5, then 8, then 12) pouring in from both sides, a few at a time, with more pigeons overhead each wave. Only the raccoons count; the pigeons are there to annoy you, and one you knock out is soon replaced. Pigeons cross the sky left and right, in a low lane you can reach by jumping (up arrow) and swinging, and a high one out of the hammer's reach. As they pass they lob eggs and worse at the spot where you're standing: keep still and you get hit, step aside and it splats on the street. **Parry** an egg as it reaches you and it flies back and knocks out the pigeon that dropped it (`RETURN!` … `BOINK!`); that's the only way to bring down the high ones. Raccoons rush in from the edges of the screen, raise a claw with a red `!` over their heads, and swipe: step back before it lands, or **parry** it (`PARRY!`) and the raccoon stands there dizzy, stars over its head, for you to hit.
- A hit pigeon tumbles with `THWACK!` and feathers; a raccoon spins off with `WHACK!`. Getting hit knocks you back with `PECK!`, `SWIPE!` or `SPLAT!` and stuns you for half a second (no walking, no swinging), then there's a moment where nothing else can hit you. There is no game over. A corner card shows the wave, what is left in it, and how many cracks the screen has.
- Every chick or raccoon smash cracks the screen itself (pigeons don't): the glass breaks at a corner of the whole browser window (alternating sides) and the cracks run in over the game, the header and the buttons, stopping short of the middle so you can always see the street and Danilo. Cracks pile up (26 by the end) and never block a click, `Esc` or static mode. Reduced motion: no camera shake, and each crack appears whole instead of running out. Nothing flashes.
- After the last enemy the street goes quiet and the screen stays badly cracked. Cracks last until the page is reloaded.
- **The screen destroyer.** A moment later Danilo wonders what happens if he keeps hitting it, and from then on every smash lands on the page itself. Click or tap anywhere on the page (the cursor turns into a hammer), or **Swing** (`F`) at nothing: each smash dents the glass right where it landed. Buttons (Static mode, Swing, Parry) keep their own click and are never a smash. Raccoons and pigeons keep coming in from the edges of the view; clicking one, or swinging at it, knocks it out and counts as a smash too (pigeons count now).
- The page comes apart in four layers, from the outside in: **the header** (6 smashes: the Dev and Backpack buttons tilt and drop off the page, while Static mode hangs on by a strip of red tape), **the building labels** (6: they slide down their buildings, then tumble off), **the drawn street** (10: everything stops moving, and buildings, sky, pavement and the alarm fall away front to back into blank paper), and last **Danilo's own drawing** (6: erased from the top down). The corner card says which layer is breaking and how many are left.
- When the last line of Danilo is gone, the page fades into black: **Unplugged**. "...signal lost." It's a cliffhanger: Act 4 isn't built yet. **Back to the portfolio** (or `Esc`) goes calmly to static mode; Static mode stays in the header corner too. Coming back to the game shows the black page again until a reload.
- Reduced motion: the layers change without animated tearing or falling, no camera shake, and the black is a cut instead of a fade. Nothing flashes in any mode. The dents only show in the game; static mode keeps just the cracks at the edges so it stays readable.

## Developer Basement

- Enter through the overworld basement hole.
- After you have picked up what waits off the page, the basement has been ransacked: desk tipped over, corkboard torn down, papers on the floor, the shelf knocked over, claw marks and red `WANTED` scrawls around Danilo's things. Every station still works where it always was. The hole you came in through is scribbled shut behind you; the exit ladder on the far left is the way out, and any way of leaving (ladder, `Esc`, the header) brings you up through the hatch onto the street in alarm. The hatch is taped shut behind you.
- The glasses pickup is in the basement. Collecting it adds and equips the glasses.
- Without glasses the den is dim; collecting them switches the swinging bulb on.
- Before glasses are owned, interacting with the computer shows the character thought: `ughh... I can't see`.
- With the glasses owned but taken off (Backpack), the den shows the same near-sighted haze as the street. Interacting with the computer then puts them back on (`*squints* ...okay, glasses back on.`) and the haze clears; interact again to boot it.
- With the glasses on, interacting with the computer opens the Developer Console React overlay. Besides `whoami`, `skills`, and `enter <scene>`, it answers `ls`, `cat <file>`, `parts`, and a couple of hidden commands.
- The corkboard cycles through notes about Danilo's work; read cards are marked on the board.
- The shelf holds relics of old projects (a uc32 board, a chess piece glued to a Tetris block).
- The workbench shows a Circuit blueprint with three part slots. With all three hobby spare parts, interacting solders them into a Circuit — a second route to the Circuit besides winning Scrub Rumble.
- Close the console to return to the basement.
- Press `H` or `Esc`, or interact with the ladder, to return to the street.

## Scrub Rumble

- Scrub Rumble (formerly Potassium Slip; code id `potassium`) is a Phaser mini-game reached from the litter pile beside Abilities.
- Start a run with `E` on desktop or a tap on mobile.
- Inside the dumpster you throw a sponge. Launch it by dragging toward a target and releasing.
- Hold while the sponge is moving to yo-yo it back to the launch pad, then relaunch.
- Clear falling 5-column enemy waves, draft stackable cleaning-supply upgrades (Suds Trail, Germ-B-Gone, Bubble Pop, Mini Sponges, Spray Bottle, Shower Head), and defeat Sir Rummage the raccoon for the Circuit.
- The Circuit can be inserted into the overworld street CRT to enter Ridge.
- You start with 5 lives; losing all lives ends the run.
- After game over, choose `Retry` or `Return to City`. After winning, choose `Endless Mode` or `Return to City`.
- Scrub Rumble keeps a local top-5 records list for finished runs.
- Press `R` to retry after a terminal screen, `E` to return, or `Space` to continue into endless after winning. `Esc` does nothing, so a stray press cannot end a run; use the header Back button to leave at any time.

## Headless / AI Console

- Full interactive route is playable without a browser via `pnpm game:console`.
- Shared commands: `look`, `go left|right [n]`, `interact [name]`, `inventory`,
  `equip` / `unequip`, `close`.
- Scrub Rumble (`potassium`) in console mode is discrete (`start`, `fight`, `draft`) — not the
  live drag-sponge physics. Winning still grants the Circuit.
- Ridge conversation uses `advance` / `choose`. `pnpm ridge:console` is an alias
  that starts already inside Ridge.
- At the Bridge, Cicka won't just hand over her toy car: join her game (a corn
  leaf, then roll the car back and forth) and she shares it. Or keep the car
  and she tests you in **Cicka's Standoff**: you never attack; press Space, E
  or ↑ (or tap Dodge) as the closing ring meets the circle around you. Dashed
  rings are feints, so hold still: a dodge that misses leaves you slow to
  recover, while one that slips a real paw lets you go again. Outlast her with nerve left and she gives you
  the car out of respect; lose all three and she keeps it until a rematch.
  Console: `duel wait`, `duel dodge`, `duel done`. Bridge
  conversations are small topic menus; ask the Draftsperson whatever you like
  and hand the car over when you're ready.
- Handing the toy car to the Draftsperson opens the Blueprint
  Bridge drawing table: drag road and wood beams from the bank bolts (a dashed
  circle shows how far a beam can reach), press
  Test, and the toy car drives across. If it snaps, fix it and try again; the `?`
  button shows the Draftsperson's sketch as gray dashes to trace. When it holds, your bridge becomes
  the crossing. Console: `build road 0,0 2,0`, `build test`, `build done`.
- Concert Crossing: the crowd blocks the street because the show is late; its
  guitarist Steve hurt his wrist showing off on a kid's skateboard. Ask him if
  you can play: he teaches a seven-note riff, then you play the show on a
  three-lane note highway (`A S D`, arrows, `J K L`, or the big buttons on
  touch). It never fails; how well you play changes how the street reacts.
  Talk the skater kid round and he starts the crowd clapping. After the show
  Steve gives you his guitar at the corner, and the stage offers an encore.
  Console: `gig hit`, `gig wait`, `gig auto`, `gig done`.
- Dance Festival (Last-Stop Plaza): the service gate to the Relay hill is shut
  for tonight's bachata setup, and the last daylight shuttle waits on it. The
  driver has two left feet; bring the Profe to him behind the shuttle shelter
  and dance the bachata basic with him (`← ↓ →` or `A S D`, `Space` for the
  tap: step left, hip tap, step right; big buttons on touch). It never fails, and "Just count it
  for him" plays it out. Run the Operations Helper's checklist, get the Profe
  to keep watch tonight, then help the driver fold a song request into her jar.
  Two setup jobs on the lane (the lantern line's hook and the cable run, each
  marked with an ink tag) and the sign at the gate open the road at sunset. Optional: play
  Steve's guitar for the shy cat under the chair stacks. Console: `dance step`,
  `dance left|tap|right`, `dance auto`, `dance done`.
- Ridge first-playable secret route: Bridge → Concert → Dance Festival → Relay
  farewell (Sit and Play, dedication card), then return to the Overworld street.
  Progress resets so the next CRT entry starts Bridge again.
- One-shot scripts: `pnpm game:console --script "look; go right 3; interact" --json`.

## Runtime Notes For Playtesting

- React overlays should always pause Phaser input.
- Returning from Hobbies or Basement overlays should restore the parent room, not the overworld.
- Hobbies, Basement, and the overworld preserve resume position where policy allows it.
- Scrub Rumble starts fresh when entered.
