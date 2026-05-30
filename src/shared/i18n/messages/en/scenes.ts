export const sceneMessages = {
  overworld: {
    glassesSecretHint: "Something appears in plain sight.",
    basementHole: "TODO?",
    bananaDiscoveredPrompt: "[E] Peel banana",
    bananaUndiscoveredPrompt: "[E] Peel?",
    bananaDiscovery:
      "A tiny banana sticker points east. This city has stranger shortcuts than doors.",
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
