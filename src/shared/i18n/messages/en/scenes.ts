export const sceneMessages = {
  overworld: {
    glassesSecretHint: "Something appears in plain sight.",
    bananaDiscoveredPrompt: "[E] Peel banana",
    bananaUndiscoveredPrompt: "[E] Peel?",
    bananaDiscovery:
      "A tiny banana sticker points along the street. This city has stranger shortcuts than doors.",
    chickPrompt: "[E] The chick is staring",
    circuitCrtLockedPrompt: "A blank CRT. Needs a Circuit.",
    circuitCrtReadyPrompt: "[E] Insert Circuit",
    signpostLabel: "START",
    signpostPrompt: "[E] Read sign",
    signpostHints: {
      "find-glasses": "The sign is too blurry to read. A chick is pacing just past Experiences.",
      "wear-glasses": "Glasses off? The street hides things from blurry eyes. That chick will bolt if you put them on.",
      "find-peel": "Watch your step just past the Abilities shelf. Something slippery is down there.",
      "win-circuit": "That peel leads somewhere. Win what's down there... or build your own. The hobby house hides spare parts.",
      "solder-circuit": "Your pockets rattle with parts. The basement workbench could make something of them.",
      "use-crt": "The blank CRT by Projects is humming. It wants your Circuit.",
    },
    signpostTally: (found: number, total: number) => `Secrets found: ${found}/${total}`,
    billboardEmpty: "This space for rent.\n(Ask the artist in the hobby house.)",
    sketchUpgrade: "The sketch picks up a little more detail...",
  },
  basement: {
    title: "DEVELOPER BASEMENT",
    ladderUp: "LADDER UP",
    glasses: "GLASSES",
    glassesAcquired: "Glasses acquired. The sketch city flickers into focus.",
    cannotSeeThought: "ughh... I can't see",
    darkStatus: "A forgotten dev room hums under the sketch city.",
    litStatus: "Lights on. Someone has been building things down here.",
    corkboard: "NOTES",
    workbench: "WORKBENCH",
    corkboardNotes: [
      "Sticky note: \"Coding since 2016. Still not done.\"",
      "Index card: \"Import job: 92% faster. Levenshtein fixed the team names.\"",
      "Napkin sketch: chess + tetris + plants vs zombies = ???",
      "Printout: \"eslint rule idea — no more magic numbers. (except 42)\"",
      "Postcard from Serbia: \"Design tokens in Figma = tokens in code. Make it so.\"",
    ],
    shelfThought: "An old uc32 board, jumper wires... and a chess piece glued to a Tetris block?",
    workbenchMissing: (owned: number, total: number) =>
      `A Circuit blueprint. Parts ${owned}/${total}. The hobby house might have spares...`,
    workbenchSoldered: "Copper, crystal, cell... *sizzle* — I built a Circuit!",
    workbenchDone: "The iron is cold. My Circuit is already humming.",
  },
  hobbies: {
    labels: {
      title: "Hobbies",
      games: "GAMES",
      art: "ART",
      music: "MUSIC",
      fitness: "FITNESS",
      dancing: "DANCE",
    },
    posterLimbs: "ART OF 8 LIMBS",
  },
  ridge: {
    memory: {
      stampedeFirstClearLabel: "HELD",
      cickaWalkByBark: "mrrp.",
    },
    cicka: {
      interaction: {
        fresh: "meow.",
        stampedeMemory: "mrrp!",
      },
    },
    presence: {
      roles: {
        cicka: "road cat",
        "counterpart-cat": "local cat",
        draftsperson: "bridge draftsperson",
        guitarist: "local legend",
        kid: "skater kid",
        crowd: "waiting crowd",
        traveler: "long-way walker",
        driver: "shuttle driver",
        "operations-helper": "festival crew",
        "dance-teacher": "dance teacher",
        steward: "festival steward",
        shuttle: "last shuttle",
      },
      barks: {
        cicka: ["mrrp.", "prrt?", "...mrow.", "*tail flick*"],
        "counterpart-cat": ["mrow.", "*slow blink*", "prrp."],
        draftsperson: [
          "...load-bearing, load-bearing...",
          "It's the middle span. It's always the middle span.",
          "Measure twice. Then measure again.",
          "Paper holds. Paper always holds.",
        ],
        guitarist: [
          "Seven notes. The whole song is seven notes.",
          "...still can't close my hand around it.",
          "Twenty summers. Never missed one.",
          "The ramp won. This time.",
        ],
        kid: [
          "It's NOT my fault.",
          "*kicks the cracked board*",
          "Old people shouldn't skate.",
          "...the chord was good, though.",
        ],
        crowd: [
          "Is it starting?",
          "I walked an hour for this.",
          "Du-le! Du-le!",
          "Someone play something.",
        ],
        traveler: [
          "Long way yet.",
          "Feet know the road better than I do.",
          "Which ridge was it again?",
        ],
        driver: [
          "Schedule says one thing, the road says another.",
          "Last ride leaves at sundown.",
          "Everyone accounted for?",
        ],
        "operations-helper": [
          "Lanterns up!",
          "Mind the cables, mind the cables.",
          "Almost set. Almost.",
        ],
        "dance-teacher": [
          "One step. Then the next one.",
          "Loosen the shoulders.",
          "You already know this part.",
        ],
        steward: ["The gate opens when it opens.", "Ticket? Ah — go on.", "Busy night."],
      },
    },
    bridge: {
      speakers: {
        prompt: "Prompt",
        cicka: "Cicka",
        bridgeDraftsperson: "Bridge Draftsperson",
      },
      dialogue: {
        "bridge.cicka.first_meet.prompt": "Visit Cicka",
        "bridge.cicka.first_meet.01": "You find Cicka in a sunny patch of corn.",
        "bridge.cicka.first_meet.02": "Mrreeow! *She swats a tiny wheeled toy back into place with feline precision.*",
        "bridge.cicka.first_meet.03": "Looks like Cicka is running a very serious quality-assurance test on a toy car.",
        "bridge.cicka.first_meet.choice.pet": "Pet Cicka gently",
        "bridge.cicka.first_meet.pet.01": "mrrp.",
        "bridge.cicka.first_meet.pet.02": "She leans into your hand for exactly one second, then remembers she is busy.",
        "bridge.cicka.first_meet.choice.watch": "Watch the tiny car",
        "bridge.cicka.first_meet.watch.01": "Vroom. The car makes another brave loop through the corn. Cicka supervises every inch.",
        "bridge.cicka.first_meet.choice.reach": "Reach for the toy car",
        "bridge.cicka.first_meet.reach.01": "Thwap. A white paw lands on the car before your fingers do.",
        "bridge.cicka.first_meet.reach.02": "Mrrrow.",
        "bridge.cicka.first_meet.reach.03": "Cicka looks at you like you've misread the rules of a very simple game.",
        "bridge.cicka.first_meet.choice.leave": "Let her play",
        "bridge.cicka.first_meet.leave.01": "You leave Cicka to her important testing.",
        "bridge.draftsperson.missing_span.prompt": "Talk to Draftsperson",
        "bridge.draftsperson.missing_span.01": "My blueprint looked legendary... until I imagined someone actually walking across the middle.",
        "bridge.draftsperson.missing_span.02": "So I erase it. Then I draw it again. Then I erase it again.",
        "bridge.draftsperson.missing_span.choice.car": "How will you know if it holds?",
        "bridge.draftsperson.missing_span.car.01": "Easy! I roll my tiny test car across. If it holds the car, it'll hold anyone.",
        "bridge.draftsperson.missing_span.car.02": "...It was right here a minute ago. Where did my car go?",
        "bridge.draftsperson.missing_span.car.03": "Somewhere back in the corn, something small and wheeled goes vroom.",
        "bridge.draftsperson.missing_span.car.03_cat": "You think of a certain cat, and a certain very busy toy car.",
        "bridge.draftsperson.missing_span.choice.who": "Who are you, exactly?",
        "bridge.draftsperson.missing_span.who.01": "The Bridge Draftsperson! I draft. The 'person' part is still in planning.",
        "bridge.draftsperson.missing_span.choice.why": "Why not just build it?",
        "bridge.draftsperson.missing_span.why.01": "What if it wobbles? What if a cow crosses? What if a cow crosses nervously?",
        "bridge.draftsperson.missing_span.why.02": "A drawing can't fall down. That's what I like about drawings.",
        "bridge.draftsperson.missing_span.choice.leave": "I'll have a look around.",
        "bridge.draftsperson.missing_span.leave.01": "Take your time. The river isn't going anywhere. That's... sort of the problem.",
        "bridge.draftsperson.missing_span.waiting": "Back already? Any sign of my test car?",
        "bridge.draftsperson.missing_span.choice.cicka": "Cicka has it.",
        "bridge.draftsperson.missing_span.cicka.01": "The cat? Oh, she's been playing with it all morning.",
        "bridge.draftsperson.missing_span.cicka.01_guarded": "Let me guess. You reached for it and got the paw?",
        "bridge.draftsperson.missing_span.cicka.02": "Cats don't hand things over, you know. But they do share a good game.",
        "bridge.draftsperson.missing_span.choice.still_looking": "Still looking.",
        "bridge.draftsperson.missing_span.still_looking.01": "I'll keep... not drawing it. Very carefully.",
        "bridge.cicka.parallel_play.prompt": "Play with Cicka",
        "bridge.cicka.parallel_play.01": "You sit beside Cicka in the warm corn.",
        "bridge.cicka.parallel_play.02": "The toy car is parked under one white paw. She is not watching it. She is definitely watching it.",
        "bridge.cicka.parallel_play.choice.grab": "Grab the car",
        "bridge.cicka.parallel_play.grab.01": "Your hand gets halfway there. Thwap. The paw was faster.",
        "bridge.cicka.parallel_play.grab.02": "Mrrrow.",
        "bridge.cicka.parallel_play.choice.ask": "Ask her nicely for it",
        "bridge.cicka.parallel_play.ask.01": "Cicka gives you a slow blink. It's a very polite blink. It's also a no.",
        "bridge.cicka.parallel_play.choice.leaf": "Wiggle a corn leaf in the dirt",
        "bridge.cicka.parallel_play.leaf.01": "You wiggle a corn leaf. Cicka's ears swivel. Her tail twitches.",
        "bridge.cicka.parallel_play.leaf.02": "Pounce! She tackles the leaf, and the toy car rolls loose to your knee.",
        "bridge.cicka.parallel_play.choice.pocket": "Pocket the car while she's busy",
        "bridge.cicka.parallel_play.pocket.01": "You reach for it... and Cicka is already sitting on it. How? She was over there.",
        "bridge.cicka.parallel_play.choice.roll": "Roll it back to her",
        "bridge.cicka.parallel_play.roll.01": "The car bumps gently into her paws. She stares at it. Then at you.",
        "bridge.cicka.parallel_play.roll.02": "Mrrp?",
        "bridge.cicka.parallel_play.roll.03": "Bap. She rolls it right back.",
        "bridge.cicka.parallel_play.choice.roll_again": "Roll it back again",
        "bridge.cicka.parallel_play.roll_again.01": "Back and forth. Back and forth. The game has rules now, and you're learning them.",
        "bridge.cicka.parallel_play.roll_again.02": "Purrrr...",
        "bridge.cicka.parallel_play.roll_again.03": "Cicka nudges the car into your hand and flops over in the sun. Your turn to look after it.",
        "bridge.cicka.parallel_play.roll_again.04": "Cicka entrusts you with the official Bridge Test Vehicle!",
        "bridge.cicka.parallel_play.choice.keep": "Keep it this time",
        "bridge.cicka.parallel_play.keep.01": "You close your hand around the car. Cicka's eyes go very round.",
        "bridge.cicka.parallel_play.keep.02": "Mrrrrrrow.",
        "bridge.cicka.parallel_play.keep.03": "Her tail puffs up to twice its size. She crouches low over the car, rear end wiggling. Oh. This is a test.",
        "bridge.cicka.parallel_play.choice.rematch": "Crouch down, ready this time",
        "bridge.cicka.parallel_play.rematch.01": "You crouch, eyes on the white paw. Cicka's tail starts to swish. Round two.",
        "bridge.cicka.duel_won.01": "The last pounce lands on empty corn. Cicka sits up, tail high, and looks at you for a long moment.",
        "bridge.cicka.duel_won.02": "Mrrp!",
        "bridge.cicka.duel_won.03": "She nudges the toy car over to your foot. Fair is fair. You were faster than the paw.",
        "bridge.cicka.duel_won.04": "Cicka respects you. The official Bridge Test Vehicle is yours.",
        "bridge.cicka.duel_lost.01": "Thwap. Cicka pins the car under one paw and starts washing her face, very pleased with herself.",
        "bridge.cicka.duel_lost.02": "Mrrow.",
        "bridge.cicka.duel_lost.03": "She'll take you on again any time. Or maybe there's a gentler game to play.",
        "bridge.cicka.parallel_play.choice.leave": "Stand up",
        "bridge.cicka.parallel_play.leave.01": "You stand. Cicka keeps the car. The car keeps Cicka.",
        "bridge.cicka.after_share.prompt": "Visit Cicka",
        "bridge.cicka.after_share.01": "Cicka is sunbathing. One eye opens at the toy car in your hand.",
        "bridge.cicka.after_share.01_respect": "Cicka is sunbathing. She lifts her chin at you: one champion to another.",
        "bridge.cicka.after_share.choice.pet": "Scratch behind her ears",
        "bridge.cicka.after_share.pet.01": "Purrrr...",
        "bridge.cicka.after_share.choice.promise": "Promise to bring it back",
        "bridge.cicka.after_share.promise.01": "The eye closes again. Deal.",
        "bridge.draftsperson.toy_car_test.prompt": "Show the toy car",
        "bridge.draftsperson.toy_car_test.01": "You hold up the tiny test car.",
        "bridge.draftsperson.toy_car_test.02": "My test car! Where did you... no, wait. Let me guess. The cat?",
        "bridge.draftsperson.toy_car_test.choice.hand_over": "Set it on the blueprint",
        "bridge.draftsperson.toy_car_test.hand_over.01": "Every time I draw the middle span, I erase it. What if it sags? What if it snaps?",
        "bridge.draftsperson.toy_car_test.hand_over.02": "Would you draw it with me? Bolt beams to the banks, and the little car will tell us if it holds.",
        "bridge.draftsperson.toy_car_test.hand_over.03": "Road beams carry the car. Wood beams hold the road up. Triangles are your friend.",
        "bridge.draftsperson.toy_car_test.choice.story": "Tell how Cicka shared it",
        "bridge.draftsperson.toy_car_test.story.01": "She played with you? She's never even made eye contact with me.",
        "bridge.draftsperson.toy_car_test.story.02": "Maybe I should sit in the corn more. Less drafting, more sitting.",
        "bridge.draftsperson.toy_car_test.choice.not_yet": "Not yet.",
        "bridge.draftsperson.toy_car_test.not_yet.01": "Fair. It's a very good car. I'll be here, not drawing anything.",
        "bridge.draftsperson.toy_car_test.resume": "Back to the drawing board? The little car is still fueled up.",
        "bridge.draftsperson.toy_car_test.choice.resume": "Back to the table",
        "bridge.draftsperson.toy_car_test.choice.advice": "Any advice?",
        "bridge.draftsperson.toy_car_test.advice.01": "Triangles. Always triangles. I dream about triangles.",
        "bridge.draftsperson.toy_car_test.advice.02": "And if you get stuck, my sketch is behind the ? button. I won't be offended. Much.",
        "bridge.draftsperson.toy_car_test.choice.later": "In a minute.",
        "bridge.draftsperson.toy_car_test.later.01": "The drawing will wait. Drawings are very good at waiting.",
        "bridge.draftsperson.bridge_built.01":
          "Vroom! The toy car rattles all the way across your span, and the ink holds.",
        "bridge.draftsperson.bridge_built.02":
          "It held?! It HELD! I've drawn forty bridges and erased forty-one!",
        "bridge.draftsperson.bridge_built.03":
          "You didn't overthink it, you just drew it. Thank you, partner. The crossing is open!",
        "bridge.draftsperson.bridge_built.04":
          "The pencil lines darken into real timber. Cicka trots over to inspect the far bank.",
        "bridge.builder.tip.intro":
          "Drag from a bolt to draw. The four bolts are our only solid ground; everything else hangs off them.",
        "bridge.builder.tip.drawing": "Road for the car, wood to hold it up. Triangles keep their shape.",
        "bridge.builder.tip.wobbly": "Hmm, see the faint pencil? That's where it droops before the car even rolls.",
        "bridge.builder.tip.wobbly.2": "The ghost lines are sagging... something in there can still fold.",
        "bridge.builder.tip.steady": "Ooh, it's holding its own weight. Ready when you are!",
        "bridge.builder.tip.testing": "Go, little car, go...!",
        "bridge.builder.tip.no_road": "Glub. Our car went swimming... the road stops short somewhere.",
        "bridge.builder.tip.no_road.2": "Splash! The road needs to reach bank to bank, no gaps.",
        "bridge.builder.tip.no_road.3": "I do that too. Drawing a road that stops halfway. Close the gap?",
        "bridge.builder.tip.bare_deck": "Ouch... a plank on its own just droops. It needs some wood to lean on.",
        "bridge.builder.tip.bare_deck.2": "It folded like wet paper. Try wood triangles above or under the road.",
        "bridge.builder.tip.bare_deck.3": "Even I'd sag holding all that alone. Give the road some support?",
        "bridge.builder.tip.loose_frame": "So close! Those triangle tips wobble loose. Try tying them together.",
        "bridge.builder.tip.loose_frame.2": "Hmm. It folded before the car even moved. Join the peaks along the top?",
        "bridge.builder.tip.loose_frame.3": "The points flap like loose pages. Connect them and they'll hold.",
        "bridge.builder.tip.hanging_joint":
          "Those low points are just dangling in the air. Nothing's under them but river.",
        "bridge.builder.tip.hanging_joint.2": "No ground down there! Tie the low points back with triangles.",
        "bridge.builder.tip.hanging_joint.3": "A pillar needs something to stand on. Down there it's only water.",
        "bridge.builder.tip.snapped_middle": "Snap! The middle gave way. It's always the loneliest part of a bridge.",
        "bridge.builder.tip.snapped_middle.2": "Ah, right in the belly. One more triangle near my X?",
        "bridge.builder.tip.snapped_middle.3": "It almost made it! The middle just needs a friend near the X.",
        "bridge.builder.tip.snapped_end": "Crack, right by the bank! That end could use a diagonal brace.",
        "bridge.builder.tip.snapped_end.2": "The middle held, but the edge buckled. Brace it near the bolt.",
        "bridge.builder.tip.snapped_end.3": "The ends do the heaviest pulling. Shore up near my X.",
        "bridge.builder.tip.stuck": "The little car couldn't climb that. Keep the road nice and gentle.",
        "bridge.builder.tip.stuck.2": "Wheels spinning... that slope's too steep for a toy.",
        "bridge.builder.tip.sketch_nudge": "(Psst, my sketch is behind the ? button.)",
        "bridge.builder.tip.sketch_shown": "That's my doodle. Trace it, or improve it!",
        "bridge.builder.tip.out_of_ink": "We're out of ink! Erase a few beams to free some up.",
        "bridge.builder.tip.passed": "IT HOLDS! Look at it go!",
        "bridge.exit.opened_crossing.prompt": "Cross Bridge",
        "bridge.exit.opened_crossing.01": "You stride across the freshly completed bridge.",
        "bridge.exit.opened_crossing.02":
          "Thanks partner! The path east is officially open!",
        "bridge.exit.opened_crossing.03":
          "The sketchbook page folds back, revealing the evening lights of Concert Crossing.",
      },
      handoffNote: "evening music ahead",
    },
    concert: {
      speakers: {
        prompt: "Prompt",
        cicka: "Cicka",
        injuredGuitarist: "Steve",
        crowd: "Crowd",
        crowdUncle: "Impatient Uncle",
        crowdGrandma: "Folding-Chair Grandma",
        kid: "Skater Kid",
      },
      dialogue: {
        "concert.poster.read.prompt": "Read the poster",
        "concert.poster.read.01":
          "A hand-drawn poster on the kafana wall, curling at the corners: STEVE & THE LATE SHOW. TONIGHT, 9PM. THE CROSSING.",
        "concert.poster.read.02":
          "Someone has added in pen: \"still?\" Someone else has crossed that out and written: \"ALWAYS.\"",
        "concert.poster.read.after.01": "Under \"ALWAYS\", in fresh ink: \"tonight it was somebody new.\"",

        "concert.crowd.delay_barks.prompt": "Ask the crowd",
        "concert.crowd.delay_barks.01":
          "Nine o'clock, the poster said. Nine! My watch says it's a quarter to never.",
        "concert.crowd.delay_barks.choice.holdup": "What's the holdup?",
        "concert.crowd.delay_barks.holdup.01": "Steve took a tumble at soundcheck. On a skateboard. At his age!",
        "concert.crowd.delay_barks.holdup.02":
          "Wrist went one way, board went the other. He's been hiding back by the amps ever since.",
        "concert.crowd.delay_barks.choice.who": "Who's playing?",
        "concert.crowd.delay_barks.who.01":
          "Steve and the Late Show! He's played this crossing every summer since they put the traffic light in.",
        "concert.crowd.delay_barks.who.02": "I saw him play straight through a power cut once. He just sang louder.",
        "concert.crowd.delay_barks.choice.through": "Can I squeeze past?",
        "concert.crowd.delay_barks.through.01":
          "Past? We've held this spot since six. Nobody moves till there's music.",
        "concert.crowd.delay_barks.through.02":
          "The crowd is packed shoulder to shoulder across the crossing. It isn't going anywhere.",
        "concert.crowd.delay_barks.choice.leave": "Never mind.",
        "concert.crowd.delay_barks.leave.01":
          "If you see a guitarist, tell him we're old too. We can wait. Grumpily.",
        "concert.crowd.delay_barks.ready.01": "Was that a guitar? Back by the amps? Somebody's tuning up!",
        "concert.crowd.delay_barks.ready.02": "Finally. If it's not Steve, it had better be somebody good.",

        "concert.kid.board.prompt": "Talk to the kid",
        "concert.kid.board.01":
          "A kid sits on the curb outside the kafana, glaring at a skateboard with a fresh crack down the middle.",
        "concert.kid.board.02": "If you're here to say it's my fault, it's not. I just said he was too old to rock.",
        "concert.kid.board.choice.what": "What happened?",
        "concert.kid.board.what.01":
          "He grabbed my board to prove he could still shred. One-legged guitar solo, straight down the ramp.",
        "concert.kid.board.what.02": "Played one chord, did one wobble, and ate the curb.",
        "concert.kid.board.what.03": "...The chord was actually really good.",
        "concert.kid.board.choice.harsh": "Calling him old was harsh.",
        "concert.kid.board.harsh.01": "He IS old.",
        "concert.kid.board.harsh.02": "He picks at the grip tape. He doesn't look up.",
        "concert.kid.board.harsh.03": "I didn't think he'd actually try it.",
        "concert.kid.board.choice.sticker": "Is that a Late Show sticker?",
        "concert.kid.board.sticker.01": "No. ...Maybe. It came with the board.",
        "concert.kid.board.sticker.02":
          "It did not come with the board. It's been carefully peeled off and stuck back on at least twice.",
        "concert.kid.board.choice.hype": "Then help him out. Get the crowd going.",
        "concert.kid.board.hype.01": "Like... a hype man?",
        "concert.kid.board.hype.02":
          "Fine. But only because the night's boring without music. Not because of him.",
        "concert.kid.board.hype.03":
          "The kid tucks the cracked board under his arm and wriggles into the front row of the crowd.",
        "concert.kid.board.choice.secret": "Your secret's safe with me.",
        "concert.kid.board.secret.01": "There's no secret. ...Thanks, though.",
        "concert.kid.board.choice.leave": "See you around.",
        "concert.kid.board.leave.01": "Whatever. Tell him the board's fine. It's not fine.",
        "concert.kid.hype_waiting.prompt": "Talk to the kid",
        "concert.kid.hype_waiting.01": "I'm ready. The second the music starts, I'm clapping. Loud.",
        "concert.kid.hype_waiting.02": "Wait, YOU'RE playing? Even better. Less pressure on me.",
        "concert.kid.after.prompt": "Talk to the kid",
        "concert.kid.after.01":
          "The kid is still on the curb, but he's nodding along to a song that already ended.",
        "concert.kid.after.02": "...Okay. That was kind of sick. Don't tell him I said that.",
        "concert.kid.after.choice.tell": "Go tell him yourself.",
        "concert.kid.after.tell.01": "...Maybe. Tomorrow. When it's less embarrassing.",
        "concert.kid.after.choice.nod": "Nod and say nothing.",
        "concert.kid.after.nod.01": "He nods back. Very serious. A deal between professionals.",
        "concert.kid.after.hype.01": "Did you hear them? I started that clap. That was all me.",
        "concert.kid.after.hype.02": "Steve says I can have lessons. On the guitar. Not the board. Probably not the board.",

        "concert.guitarist.injury.prompt": "Talk to the guitarist",
        "concert.guitarist.injury.01":
          "Tucked behind the stage, a man in a worn leather jacket sits on an amp, cradling his wrist like a hurt bird.",
        "concert.guitarist.injury.02": "If you're here for an autograph, it'll have to be left-handed.",
        "concert.guitarist.practice_riff.prompt": "Talk to Steve",
        "concert.guitarist.practice_riff.01": "Back? The phrase is still waiting. So is the crowd. Loudly.",
        "concert.guitarist.choice.wrist": "What happened to your wrist?",
        "concert.guitarist.wrist.01":
          "A kid told me I was too old to rock. So naturally, I borrowed his skateboard.",
        "concert.guitarist.wrist.02": "One-legged solo, straight down the ramp. Big finish.",
        "concert.guitarist.wrist.03": "The ramp had a bigger finish.",
        "concert.guitarist.choice.who": "Who are you?",
        "concert.guitarist.who.01": "Steve. Of Steve and the Late Show. Twenty summers on this crossing.",
        "concert.guitarist.who.02": "Tonight we're really living up to the name.",
        "concert.guitarist.choice.cancel": "Can't you just call it off?",
        "concert.guitarist.cancel.01": "And send them home quiet? No.",
        "concert.guitarist.cancel.02":
          "This street gets one loud night a year. It's how we tell each other we're still here.",
        "concert.guitarist.choice.kid": "About that kid...",
        "concert.guitarist.kid.01": "He's not wrong. I'm forty-six. My knees play percussion now.",
        "concert.guitarist.kid.02":
          "...He's got our sticker on that board, you know. I saw it right before I saw the ground.",
        "concert.guitarist.choice.help": "Could I play instead?",
        "concert.guitarist.help.01": "You?",
        "concert.guitarist.help.02":
          "...Hm. You've got the hands for it. And honestly, you're the only offer I've had.",
        "concert.guitarist.help.03":
          "Every song we play grows out of one phrase. Seven notes. Learn those, and the rest you'll learn on stage.",
        "concert.guitarist.choice.learn": "Teach me the phrase.",
        "concert.guitarist.learn.01":
          "Watch the notes slide down the strings. Strum the moment one touches the line. Low, middle, high.",
        "concert.guitarist.learn.02": "Don't worry about being perfect. Worry about coming back to it.",
        "concert.guitarist.choice.later": "Let me look around first.",
        "concert.guitarist.later.01": "Sure. I'm not going anywhere. Literally. I'm sitting on an amp.",
        "concert.guitarist.choice.leave": "Hang in there.",
        "concert.guitarist.leave.01": "Hanging. Mostly by the left hand.",
        "concert.guitarist.choice.not_yet": "Not yet.",
        "concert.guitarist.not_yet.01": "No rush. They've only been waiting three hours.",
        "concert.guitarist.ready.prompt": "Talk to Steve",
        "concert.guitarist.ready.01":
          "You've got the phrase. The rest of the song is just the phrase, saying more.",
        "concert.guitarist.ready.01_assisted":
          "It wasn't pretty. But you kept coming back to it, and that's the actual skill.",
        "concert.guitarist.choice.show": "Let's play the show.",
        "concert.guitarist.show.01": "Plug in. I'll call the changes from the side of the stage.",
        "concert.guitarist.show.02":
          "Don't look at the crowd. Look at the notes. The crowd will look after itself.",
        "concert.guitarist.choice.again": "Run the riff once more.",
        "concert.guitarist.again.01": "Good instinct. From the top, nice and slow.",
        "concert.guitarist.choice.nervous": "I'm nervous.",
        "concert.guitarist.nervous.01": "Good. It means you care.",
        "concert.guitarist.nervous.02":
          "I threw up before my first show. Then I played it anyway. Then I threw up again. Great night.",
        "concert.guitarist.choice.wait": "Give me a minute.",
        "concert.guitarist.wait.01": "Take two. They've waited this long.",
        "concert.stage.look.prompt": "Look at the stage",
        "concert.stage.look.01":
          "A tiny stage. One mic, one amp, and a setlist taped to the floor that just says PLAY LOUD.",
        "concert.stage.look.02": "Without a guitarist, it's just a very nice table.",
        "concert.stage.take.prompt": "Take the stage",
        "concert.stage.encore.prompt": "Play an encore",
        "concert.stage.encore.01": "The stage is empty now, but the amp is still warm.",
        "concert.stage.encore.choice.encore": "Play it again",
        "concert.stage.encore.encore.01": "A few stragglers turn around at the first note. Somebody whoops.",
        "concert.stage.encore.choice.leave": "Let it ring",
        "concert.stage.encore.leave.01": "Some nights only happen once. This one could happen twice. Maybe later.",

        "concert.gig.practice_done.passed.01": "Hey. HEY. That's it! That's the phrase!",
        "concert.gig.practice_done.passed.02":
          "Seven notes. Everything tonight is just those seven notes in different hats.",
        "concert.gig.practice_done.assisted.01": "Okay. Not every note landed.",
        "concert.gig.practice_done.assisted.02":
          "But you didn't stop, and that's the whole trick. The rest comes on stage.",
        "concert.gig.practice_done.cicka.01":
          "Behind the amp, Cicka's ears have swivelled toward you like two small satellite dishes.",
        "concert.gig.practice_done.03": "Whenever you're ready, the stage is yours.",
        "concert.gig.show_done.01":
          "The last chord rings out over the crossing. For one long second, nobody moves.",
        "concert.gig.show_done.crowd.legendary": "...STEVE! STEVE! Wait. Who IS that?!",
        "concert.gig.show_done.crowd.great": "Encore! ENCORE!",
        "concert.gig.show_done.crowd.good": "Now THAT is what I waited three hours for!",
        "concert.gig.show_done.crowd.rough": "They played! Music! Wonderful!",
        "concert.gig.show_done.steve.legendary": "Twenty summers. I have never heard it played like that.",
        "concert.gig.show_done.steve.great": "You made it yours. That's the only trick there is.",
        "concert.gig.show_done.steve.good": "A few wobbly bits. Every good night has wobbly bits.",
        "concert.gig.show_done.steve.rough":
          "Rough? Sure. But listen to them. Nobody ever remembers the clean notes.",
        "concert.gig.show_done.cicka.01":
          "Cicka has crept out from behind the amp to the very edge of the stage. She gives you a long, slow blink.",
        "concert.gig.show_done.02": "Humming, the crowd drifts off home. The crossing opens.",
        "concert.gig.show_done.03": "Come find me by the corner before you go. I've got something for you.",
        "concert.gig.show_done.encore.01": "The last few stragglers clap like a full house.",

        "concert.guitarist.guitar_handoff.prompt": "Talk to Steve",
        "concert.guitarist.guitar_handoff.01": "So. This wrist needs the whole summer off.",
        "concert.guitarist.guitar_handoff.02": "And a guitar that sits in its case all summer forgets how to sing.",
        "concert.guitarist.guitar_handoff.kid.01": "...That was sick, by the way.",
        "concert.guitarist.guitar_handoff.kid.02": "And sorry. For the old thing.",
        "concert.guitarist.guitar_handoff.kid.03": "I AM old. Old is how you get good.",
        "concert.guitarist.guitar_handoff.kid.04":
          "Lessons, once this heals? Bring the board. We'll fix that too.",
        "concert.guitarist.guitar_handoff.kid.05": "...Yeah. Okay.",
        "concert.guitarist.guitar_handoff.03":
          "So take her. She's been to every summer on this street. Every song I know is still in the wood.",
        "concert.guitarist.guitar_handoff.choice.promise": "I'll look after her.",
        "concert.guitarist.guitar_handoff.promise.01":
          "I know you will. Play her somewhere quiet, for someone who matters. That's what she's for.",
        "concert.guitarist.guitar_handoff.promise.02":
          "Steve's guitar settles across your back. It's warmer than you expected.",
        "concert.guitarist.guitar_handoff.choice.sure": "Are you sure?",
        "concert.guitarist.guitar_handoff.sure.01": "Sure? No. Right? Yes.",
        "concert.guitarist.guitar_handoff.sure.02":
          "Play her somewhere quiet, for someone who matters. That's what she's for.",
        "concert.guitarist.guitar_handoff.sure.03":
          "Steve's guitar settles across your back. It's warmer than you expected.",
        "concert.guitarist.farewell.prompt": "Talk to Steve",
        "concert.guitarist.farewell.01": "Go on. Next town over, tell them Steve says hi.",
        "concert.guitarist.farewell.choice.thanks": "Thanks for tonight.",
        "concert.guitarist.farewell.thanks.01": "Thank YOU. I just sat on an amp and shouted chord names.",
        "concert.guitarist.farewell.choice.leave": "See you, Steve.",
        "concert.guitarist.farewell.leave.01": "See you. Mind the curbs.",

        "concert.cicka.band_resting_spot.prompt": "Find Cicka",
        "concert.cicka.band_resting_spot.01":
          "Behind the amp: two round eyes. Cicka has found the one quiet square metre on this whole street.",
        "concert.cicka.band_resting_spot.01_practiced":
          "Cicka is still behind the amp, but now she's watching the stage.",
        "concert.cicka.band_resting_spot.choice.sit": "Sit with her a while",
        "concert.cicka.band_resting_spot.sit.01":
          "You sit on a cable crate. Back here, the crowd softens into a hum.",
        "concert.cicka.band_resting_spot.sit.02": "...mrrp.",
        "concert.cicka.band_resting_spot.sit.03":
          "She leans against the guitar case. Her tail taps along to a song nobody is playing yet.",
        "concert.cicka.band_resting_spot.choice.coax": "Coax her toward the crowd",
        "concert.cicka.band_resting_spot.coax.01": "Hhhk.",
        "concert.cicka.band_resting_spot.coax.02":
          "Cicka retreats exactly one inch further behind the amp. That's a no.",
        "concert.cicka.band_resting_spot.choice.leave": "Leave her be",
        "concert.cicka.band_resting_spot.leave.01": "She approves of this decision.",
        "concert.cicka.band_resting_spot.after.01":
          "Cicka is loafing on top of the warm amp. Steve scratches behind her ears without looking.",
        "concert.cicka.band_resting_spot.after.02": "Purrrr...",
        "concert.cicka.band_resting_spot.choice.pet": "Scratch her chin",
        "concert.cicka.band_resting_spot.pet.01": "Prrrt.",
        "concert.cicka.band_resting_spot.pet.02": "She has decided the band is acceptable.",
        "concert.cicka.band_resting_spot.choice.nap": "Let her nap",
        "concert.cicka.band_resting_spot.nap.01": "Cicka doesn't open her eyes. She doesn't need to.",

        "concert.exit.dance_transition.prompt": "Head downhill",
        "concert.exit.dance_transition.01":
          "The crossing is clear. Downhill, festival lanterns are blinking on one by one.",
        "concert.exit.dance_transition.02": "Go on, then. She likes being played on the move.",
        "concert.exit.dance_transition.03":
          "You set off, the guitar tapping against your back in time with your steps.",
      },
    },
    dance: {
      speakers: {
        prompt: "Prompt",
        cicka: "Cicka",
        traveler: "Traveler",
        hillShuttleDriver: "Hill-Shuttle Driver",
        operationsHelper: "Last-Stop Operations Helper",
        danceTeacher: "Dance Teacher",
        festivalSteward: "Festival Steward",
      },
      dialogue: {
        "dance.traveler.relay_wayfinding.prompt": "Talk to Traveler",
        "dance.traveler.relay_wayfinding.01": "The summit Relay Spire is up the hill shuttle route!",
        "dance.traveler.relay_wayfinding.02":
          "It's the last ride of the day—boards as soon as festival setup clears.",
        "dance.traveler.relay_wayfinding.03":
          "Help Operations with the lantern line, then check on the shuttle driver!",
        "dance.driver.shuttle_delay.prompt": "Talk to Driver",
        "dance.driver.shuttle_delay.01":
          "Can't depart yet! My clipboard has 40 checklist items and two cold feet.",
        "dance.driver.shuttle_delay.02":
          "Clipboard says go. My nerves say stay in the bus forever.",
        "dance.driver.shuttle_delay.03": "He keeps nervously re-reading the exact same checklist item.",
        "dance.driver.shuttle_delay.choice.help":
          "Offer to help him practice one private dance step",
        "dance.driver.shuttle_delay.choice.help_hint":
          "Check in with the Dance Teacher nearby.",
        "dance.driver.shuttle_delay.choice.wait":
          "Give him a moment and inspect the plaza setup",
        "dance.operations_helper.handoff_check.prompt": "Help Operations",
        "dance.operations_helper.handoff_check.01":
          "You help Operations string the festival lanterns.",
        "dance.operations_helper.handoff_check.02":
          "If these festoon lights aren't glowing by sunset, the festival is bust!",
        "dance.operations_helper.handoff_check.03":
          "You help secure the lantern lines. A warm golden glow illuminates the plaza!",
        "dance.operations_helper.handoff_check.done.01":
          "Operations handoff complete! Check on the Dance Teacher next.",
        "dance.operations_helper.handoff_check.done.02":
          "The plaza looks vibrant and cozy.",
        "dance.locals.triangulated_read.prompt": "Check Steward",
        "dance.locals.triangulated_read.01":
          "Service gate opens the moment the shuttle is cleared!",
        "dance.locals.triangulated_read.02":
          "She's master of the lanterns. He just needs a little push of confidence.",
        "dance.locals.triangulated_read.03":
          "Let's teach him one simple dance step away from the crowd.",
        "dance.driver.one_step_practice.prompt": "Practice Dance Step",
        "dance.driver.one_step_practice.01": "You guide the driver through one simple step.",
        "dance.driver.one_step_practice.02":
          "Side step, tap, turn! No spotlight, no pressure—just smooth rhythm.",
        "dance.driver.one_step_practice.03":
          "Hey! I actually did it! That wasn't scary at all!",
        "dance.driver.one_step_practice.done.prompt": "Clear Gate",
        "dance.driver.one_step_practice.done.01":
          "Driver confidence restored! Clear the service gate next.",
        "dance.driver.one_step_practice.done.02":
          "Dignity 100%! Ready to roll the shuttle!",
        "dance.driver.folded_song_request.prompt": "Hand Song Request",
        "dance.driver.folded_song_request.01":
          "You hand him a neatly folded paper song request.",
        "dance.driver.folded_song_request.02":
          "A quiet request for the opening festival song.",
        "dance.driver.folded_song_request.03":
          "He reads it with a smile and nods. 'Consider it played.'",
        "dance.driver.folded_song_request.04":
          "All clear! Head to the shuttle service gate on the right.",
        "dance.setup_clearance.prompt": "Open Service Gate",
        "dance.setup_clearance.01": "You open the service gate for the final shuttle.",
        "dance.setup_clearance.02": "Lantern lines secured.",
        "dance.setup_clearance.03": "Service lane clear of obstacles.",
        "dance.setup_clearance.04": "Gate swings wide open! Last daylight window active!",
        "dance.setup_clearance.05":
          "The shuttle engine hums to life. Board the van!",
        "dance.shuttle.last_daylight_ride.prompt": "Board Shuttle",
        "dance.shuttle.last_daylight_ride.01": "All aboard the Ridge Shuttle!",
        "dance.shuttle.last_daylight_ride.02":
          "The bus climbs the winding hill into golden sunset light.",
        "dance.shuttle.last_daylight_ride.03": "The Relay Spire appears atop the quiet ridge.",
        "dance.cicka.resting_spot.prompt": "Pet Cicka",
        "dance.cicka.resting_spot.01": "Cicka snoozes happily on the operations crate.",
        "dance.cicka.resting_spot.02": "Cicka watches the shuttle gate with sleepy curiosity.",
        "dance.cicka.resting_spot.03": "Purrr... mrreeow.",
      },
    },
    relay: {
      speakers: {
        prompt: "Prompt",
        cicka: "Cicka",
        dedication: "Dedication",
      },
      dialogue: {
        "relay.overlook.inspect.prompt": "Inspect Overlook",
        "relay.overlook.inspect.01": "You gaze out over the entire sketchbook route below.",
        "relay.overlook.inspect.02":
          "From the blueprint bridge to the festival lights, every page holds your story.",
        "relay.sit_and_play.prompt.prompt": "Sit & Play Guitar",
        "relay.sit_and_play.prompt.01": "You sit on the summit bench beside Cicka.",
        "relay.sit_and_play.prompt.02":
          "You unslung the acoustic guitar. The sunset phrase echoes across the mountain air.",
        "relay.sit_and_play.prompt.03": "The overlook fills with warm, peaceful evening light.",
        "relay.montage.bridge.01": "(Memory) The blueprint bridge stands strong across the river.",
        "relay.montage.concert.01":
          "(Memory) The street crowd cheered as the guitar melody landed true.",
        "relay.montage.dance.01":
          "(Memory) Festival lanterns glow warmly in the twilight below.",
        "relay.guitar.sunset.01":
          "The sun dips below the horizon as your song gently concludes.",
        "relay.guitar.let_song_end.01": "You let the final chord ring out into quiet.",
        "relay.guitar.let_song_end.02": "The final acoustic note resolves peacefully.",
        "relay.cicka.threshold_meow.01": "Mrreeow...",
        "relay.cicka.threshold_meow.02":
          "Cicka glances back with a gentle purr, then leaps into the warm paper light.",
        "relay.cicka.threshold_meow.03":
          "A quiet moment of serene completion.",
        "relay.dedication.card.01": "For Cicka.",
        "relay.dedication.card.02": "Thank you for playing.",
      },
    },
  },
  stampedeSketch: {
    start: {
      title: "Ooh. Irresistible.",
      body: "Don't make eye contact. It only encourages them.",
      hint: "Pick one weapon. It fires on its own. Scraps mostly twist how it feels. Sometimes they let you stay standing.",
    },
    result: {
      eyebrow: {
        cleared: "Run complete",
        failed: "Run ended",
        endless: "Endless run over",
      },
      title: {
        cleared: "They lost the scent",
        failed: "Pecked",
        endless: "Finally caught",
      },
      body: {
        cleared: "The flock peels off, offended. A pair of glasses is sitting in the mess.",
        failed: "The flock got the hug. You got the beak.",
        endless: "They never stopped coming. You never stopped being irresistible.",
      },
      endless: {
        newBest: "New best. The flock will talk about this one.",
        best: (time: string) => `Best ${time}. Keep them chasing longer.`,
      },
      rewardNote: {
        earned: "Glasses acquired. The street snaps into focus. The chick will not forgive this.",
        alreadyOwned: "Still no second pair. The chicks remain obsessed.",
        unavailable: "No glasses yet.",
        failed: "Stay out of beak range. The glasses are the prize.",
      },
      stats: {
        time: "Time",
        contacts: "Contacts",
        best: "Best",
        wingmen: "Wingmen",
      },
      actions: {
        backToRidge: "Back to the street",
        retry: "Retry",
        keepGoing: "Keep going (endless)",
      },
    },
  },
} as const;
