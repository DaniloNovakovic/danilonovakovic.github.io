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
