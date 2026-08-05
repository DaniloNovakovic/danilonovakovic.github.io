export const sceneMessages = {
  overworld: {
    glassesSecretHint: "Something appears in plain sight.",
    basementHole: "TODO?",
    bananaDiscoveredPrompt: "[E] Peel banana",
    bananaUndiscoveredPrompt: "[E] Peel?",
    bananaDiscovery:
      "A tiny banana sticker points east. This city has stranger shortcuts than doors.",
    circuitCrtLockedPrompt: "A blank CRT. Needs a Circuit.",
    circuitCrtReadyPrompt: "[E] Insert Circuit",
  },
  basement: {
    title: "DEVELOPER BASEMENT",
    ladderUp: "LADDER UP",
    glasses: "GLASSES",
    glassesAcquired: "Glasses acquired. The sketch city flickers into focus.",
    cannotSeeThought: "ughh... I can't see",
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
        guitarist: "touring guitarist",
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
          "Two chords. I only need two.",
          "...still can't close my hand around it.",
          "Hums something unfinished.",
          "The crowd's been patient. Too patient.",
        ],
        crowd: [
          "Is it starting?",
          "I walked an hour for this.",
          "Shh — listen.",
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
        "bridge.cicka.first_meet.prompt": "Pet Cicka",
        "bridge.cicka.first_meet.01": "You approach Cicka resting in the warm sunlight.",
        "bridge.cicka.first_meet.02": "Mrreeow! *Cicka swats a tiny wheeled toy back into place with feline precision*",
        "bridge.cicka.first_meet.03": "Looks like Cicka is running a secret quality-assurance test with a toy car.",
        "bridge.draftsperson.missing_span.prompt": "Talk to Draftsperson",
        "bridge.draftsperson.missing_span.01":
          "My blueprint was looking legendary... until I realized nobody can actually walk across an imaginary line!",
        "bridge.draftsperson.missing_span.02":
          "I had a tiny test car to verify the bridge span, but a mischievous furry assistant snatched it!",
        "bridge.draftsperson.missing_span.03": "Offer to retrieve the test car from Cicka",
        "bridge.cicka.parallel_play.prompt": "Play with Cicka",
        "bridge.cicka.parallel_play.01": "You sit beside Cicka in the warm sunlight.",
        "bridge.cicka.parallel_play.02": "Gently roll the toy car back and forth",
        "bridge.cicka.parallel_play.03": "Purrrr... *Cicka nudges the toy car into your hand with approval*",
        "bridge.cicka.parallel_play.04": "Cicka entrusts you with the official Bridge Test Vehicle!",
        "bridge.draftsperson.toy_car_test.prompt": "Test Blueprint",
        "bridge.draftsperson.toy_car_test.01":
          "You place the tiny test car onto the blueprint span.",
        "bridge.draftsperson.toy_car_test.02":
          "If this little car can brave the gap on paper, we can build the real thing!",
        "bridge.draftsperson.toy_car_test.03":
          "Vroom! The toy car zips safely across the inked span without falling.",
        "bridge.draftsperson.toy_car_test.04":
          "Aha! The math holds! The blueprint bridge comes alive under our feet!",
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
        injuredGuitarist: "Injured Guitarist",
        crowd: "Crowd",
      },
      dialogue: {
        "concert.crowd.delay_barks.prompt": "Listen to Crowd",
        "concert.crowd.delay_barks.01": "Show's delayed! The crowd's patience is thinner than tracing paper!",
        "concert.crowd.delay_barks.02": "Word is the lead guitarist tried a kickflip during soundcheck and wiped out!",
        "concert.crowd.delay_barks.03": "He's hiding behind the stage props nursing his wrist and his ego.",
        "concert.guitarist.injury.prompt": "Talk to Guitarist",
        "concert.guitarist.injury.01": "Okay, in my defense... a one-legged skateboard guitar solo sounded epic on paper.",
        "concert.guitarist.injury.02": "My wrist says 'absolutely not', but the show MUST go on!",
        "concert.guitarist.injury.03": "Offer to learn his signature chord phrase",
        "concert.guitarist.practice_riff.prompt": "Practice Riff",
        "concert.guitarist.practice_riff.01": "You strum the forgiving acoustic chord progression.",
        "concert.guitarist.practice_riff.02": "Your fingers find the melody naturally—clean, warm, and resonant.",
        "concert.guitarist.practice_riff.03": "Whoa! You nailed the phrase! That rhythm has enough soul to clear this whole street!",
        "concert.performance.auto_success.prompt": "Play Concert",
        "concert.performance.auto_success.01": "You step up to the stage mic and play.",
        "concert.performance.auto_success.02": "The chord ring out across the night plaza. The crowd goes wild!",
        "concert.performance.auto_success.03": "Alright! Show was a hit! Path is cleared!",
        "concert.performance.auto_success.04": "Here, take my guitar. You've earned it, maestro.",
        "concert.guitarist.guitar_handoff.prompt": "Take Guitar",
        "concert.guitarist.guitar_handoff.01": "Keep it safe. Let it sing whenever the quiet needs company.",
        "concert.guitarist.guitar_handoff.02": "Play it out on the open ridge.",
        "concert.guitarist.guitar_handoff.03": "The acoustic guitar rests comfortably slung across your back.",
        "concert.cicka.band_resting_spot.prompt": "Pet Cicka",
        "concert.cicka.band_resting_spot.01": "You sit near Cicka backstage.",
        "concert.cicka.band_resting_spot.02": "Mrrp!",
        "concert.cicka.band_resting_spot.03": "Cicka loafs peacefully on an amplifier casing.",
        "concert.cicka.band_resting_spot.04": "Purrrr...",
        "concert.exit.dance_transition.prompt": "Head Downhill",
        "concert.exit.dance_transition.01": "You follow the open street toward the festival lights.",
        "concert.exit.dance_transition.02": "The Dance Festival setup glimmers downhill.",
        "concert.exit.dance_transition.03": "Warm festival banners flutter in the evening breeze.",
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
    result: {
      eyebrow: {
        cleared: "Run complete",
        failed: "Run ended",
      },
      title: {
        cleared: "Blanket held",
        failed: "Page got crowded",
      },
      body: {
        cleared: "The sketch stayed calm through the whole stampede.",
        failed: "Too many marks landed before the timer ran out.",
      },
      rewardNote: {
        earned: "Stamp earned. One glide pip tucked into the Ridge.",
        alreadyOwned: "Stamp already owned. Glide pip already tucked into the Ridge.",
        unavailable: "No stamp yet. Rewards are still taped over.",
        failed: "Hold the blanket to earn the Stampede stamp and glide pip.",
      },
      stats: {
        time: "Time",
        contacts: "Contacts",
      },
      actions: {
        backToRidge: "Back to Ridge",
        retry: "Retry",
      },
    },
  },
} as const;
