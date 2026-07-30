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
    bridge: {
      speakers: {
        prompt: "Prompt",
        cicka: "Cicka",
        bridgeDraftsperson: "Bridge Draftsperson",
      },
      dialogue: {
        "bridge.cicka.first_meet.01": "Sit near Cicka",
        "bridge.cicka.first_meet.02": "Small chirp.",
        "bridge.cicka.first_meet.03": "Cicka bats the tiny car back into place.",
        "bridge.draftsperson.missing_span.01":
          "The middle span keeps looking brave until I imagine someone crossing it.",
        "bridge.draftsperson.missing_span.02":
          "I had a tiny test car for this. It was here a minute ago.",
        "bridge.draftsperson.missing_span.03": "Look for the tiny test car",
        "bridge.cicka.parallel_play.01": "Sit with Cicka",
        "bridge.cicka.parallel_play.02": "Roll the car back gently",
        "bridge.cicka.parallel_play.03": "Quiet purr.",
        "bridge.cicka.parallel_play.04": "Cicka leaves the tiny car beside you.",
        "bridge.draftsperson.toy_car_test.01":
          "Set the tiny car on the drawing",
        "bridge.draftsperson.toy_car_test.02":
          "If it can carry this much courage, maybe it can carry us.",
        "bridge.draftsperson.toy_car_test.03":
          "The toy car rolls across the new span.",
        "bridge.draftsperson.toy_car_test.04":
          "That line holds. The bridge knows it now.",
        "bridge.exit.opened_crossing.01": "Cross the finished bridge",
        "bridge.exit.opened_crossing.02":
          "Thank you. I think I can leave this line alone now.",
        "bridge.exit.opened_crossing.03":
          "The page turns toward evening music.",
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
        "concert.crowd.delay_barks.01": "Show's late. Crossing's full of patience wearing thin.",
        "concert.crowd.delay_barks.02": "Heard the guitarist wiped out trying to look brave.",
        "concert.crowd.delay_barks.03": "Someone's behind the stage props. Maybe start there.",
        "concert.guitarist.injury.01": "I tried a one-leg skateboard solo. The street voted no.",
        "concert.guitarist.injury.02": "Wrist won't play loud. Pride won't either.",
        "concert.guitarist.injury.03": "Learn the phrase with me",
        "concert.guitarist.practice_riff.01": "Practice the forgiving riff",
        "concert.guitarist.practice_riff.02": "You find the phrase without failing.",
        "concert.guitarist.practice_riff.03": "That much courage can clear a street.",
        "concert.performance.auto_success.01": "Start the concert",
        "concert.performance.auto_success.02": "The phrase lands. Soft. True.",
        "concert.performance.auto_success.03": "Alright—show happened. People can move.",
        "concert.performance.auto_success.04": "Take the guitar. Carry the comfort.",
        "concert.guitarist.guitar_handoff.01": "Keep it for the road ahead.",
        "concert.guitarist.guitar_handoff.02": "Play it when quiet needs company.",
        "concert.guitarist.guitar_handoff.03": "The guitar rests warm against your side.",
        "concert.cicka.band_resting_spot.01": "Sit near hidden Cicka",
        "concert.cicka.band_resting_spot.02": "mrrp.",
        "concert.cicka.band_resting_spot.03": "Cicka loafs with the band",
        "concert.cicka.band_resting_spot.04": "purr.",
        "concert.exit.dance_transition.01": "Follow the opened crossing",
        "concert.exit.dance_transition.02": "Festival setup waits downhill.",
        "concert.exit.dance_transition.03": "The page warms toward afternoon.",
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
        "dance.traveler.relay_wayfinding.01": "Relay is up the hill shuttle.",
        "dance.traveler.relay_wayfinding.02":
          "Last daylight ride—only after setup clears.",
        "dance.traveler.relay_wayfinding.03":
          "Help Operations with lanterns, then the Dance Teacher with one step.",
        "dance.driver.shuttle_delay.01":
          "Can't leave until the steward opens the gate.",
        "dance.driver.shuttle_delay.02":
          "Clipboard says ready. My feet disagree.",
        "dance.driver.shuttle_delay.03": "He keeps rereading the same safe line.",
        "dance.driver.shuttle_delay.choice.help":
          "One step. Privately. Maybe the Dance Teacher…",
        "dance.driver.shuttle_delay.choice.help_hint":
          "Walk left-of-center to the Dance Teacher (skirt pose, raised arm).",
        "dance.driver.shuttle_delay.choice.wait":
          "You give him space and ask around.",
        "dance.operations_helper.handoff_check.01":
          "Help check the operations handoff",
        "dance.operations_helper.handoff_check.02":
          "If the lantern line fails, I fail with it.",
        "dance.operations_helper.handoff_check.03":
          "You check the crates with her. One clean pass is enough.",
        "dance.operations_helper.handoff_check.done.01":
          "Handoff done — find the Dance Teacher next",
        "dance.operations_helper.handoff_check.done.02":
          "She can almost leave the plaza alone now.",
        "dance.locals.triangulated_read.01":
          "Road opens after setup clears at the gate.",
        "dance.locals.triangulated_read.02":
          "She waits on one perfect lantern. He waits on anything but asking.",
        "dance.locals.triangulated_read.03":
          "Help Operations, then ask me for one private step for him.",
        "dance.driver.one_step_practice.01": "Practice one private dance step",
        "dance.driver.one_step_practice.02":
          "No audience. He learns exactly one shared rhythm.",
        "dance.driver.one_step_practice.03":
          "Okay. I can offer that much later.",
        "dance.driver.one_step_practice.done.01":
          "Step learned — clear the service gate next",
        "dance.driver.one_step_practice.done.02":
          "Dignity intact. The gate can open when setup finishes.",
        "dance.driver.folded_song_request.01":
          "Help fold a tiny song request",
        "dance.driver.folded_song_request.02":
          "No confession. Just one dance later.",
        "dance.driver.folded_song_request.03":
          "She reads it. Soft nod. No spotlight.",
        "dance.driver.folded_song_request.04":
          "Now clear the service gate on the right.",
        "dance.setup_clearance.01": "Clear the service gate for the shuttle",
        "dance.setup_clearance.02": "Secure the lantern line.",
        "dance.setup_clearance.03": "Tape the service lane clear.",
        "dance.setup_clearance.04": "Gate open. Last daylight window.",
        "dance.setup_clearance.05":
          "Shuttle sign flips. Board the van to the right.",
        "dance.shuttle.last_daylight_ride.01": "All aboard the last ride.",
        "dance.shuttle.last_daylight_ride.02":
          "The hill lifts into sunset paper.",
        "dance.shuttle.last_daylight_ride.03": "Relay waits quiet above.",
        "dance.cicka.resting_spot.01": "Cicka loafs on the operations table",
        "dance.cicka.resting_spot.02": "Cicka settles by the cleared gate",
        "dance.cicka.resting_spot.03": "mrrp.",
      },
    },
    relay: {
      speakers: {
        prompt: "Prompt",
        cicka: "Cicka",
        dedication: "Dedication",
      },
      dialogue: {
        "relay.overlook.inspect.01": "Look out over the finished route",
        "relay.overlook.inspect.02":
          "The pages below still hold their changes.",
        "relay.sit_and_play.prompt.01": "Sit and play beside Cicka",
        "relay.sit_and_play.prompt.02":
          "You settle. The guitar finds the concert phrase.",
        "relay.sit_and_play.prompt.03": "The overlook softens.",
        "relay.montage.bridge.01": "(memory) The finished bridge holds.",
        "relay.montage.concert.01":
          "(memory) The crossing clears; the guitar changes hands.",
        "relay.montage.dance.01":
          "(memory) Night lanterns wake after you leave.",
        "relay.guitar.sunset.01":
          "Sunset lowers while the phrase keeps breathing.",
        "relay.guitar.let_song_end.01": "Let the song end",
        "relay.guitar.let_song_end.02": "The phrase resolves into quiet.",
        "relay.cicka.threshold_meow.01": "mrrp.",
        "relay.cicka.threshold_meow.02":
          "Cicka turns back once, then slips into warm paper light.",
        "relay.cicka.threshold_meow.03":
          "The overlook holds empty for a breath.",
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
