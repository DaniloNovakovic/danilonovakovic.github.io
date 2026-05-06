export const enMessages = {
  common: {
    pressEsc: "[ Press ESC or click X to return ]",
    scrollToSeeMore: "[ Scroll to see more ]",
    viewMore: "View More",
    start: "START",
    restart: "RESTART",
    gameOver: "GAME OVER!",
    playAgain: "PLAY AGAIN",
    score: "SCORE:",
    time: "TIME:",
    combo: "COMBO:",
    loading: "Loading...",
    close: "Close",
  },
  navigation: {
    hints: "Use A/D or Arrows to walk • Hold SHIFT to sprint • Press E to enter",
    hintsCompact: "Swipe Left/Right to move • Swipe Up to jump • Tap game to interact",
    enter: "[E] ENTER",
    interact: "[E] INTERACT",
    exit: "EXIT",
    opensInNewTab: (label: string) => `${label} (opens in new tab)`,
  },
  modePicker: {
    eyebrow: "Danilo Novakovic — Portfolio",
    title: "Pick your path",
    blurb: "Two ways to explore: walk around a sketchbook city, or flip through a quiet paper version.",
    recommended: "Recommended",
    interactive: {
      title: "Interactive",
      blurb: "Walk a hand-drawn street, peek into buildings, play little mini-games. Works best with a keyboard.",
      cta: "Start walking",
    },
    static: {
      title: "Static",
      blurb: "A calm, scrollable version of the portfolio. Fast to load, easy to read, great on phones.",
      cta: "Read the page",
    },
    switchHint: "You can switch between the two at any time.",
  },
  staticPortfolio: {
    switchToInteractive: "Switch to interactive portfolio",
    tryInteractive: "Try interactive",
    interactive: "Interactive",
    eyebrow: "Portfolio — Static edition",
    footerPrompt: "Prefer the playful version?",
    footerCta: "Try interactive mode →",
    copyright: (year: number, name: string) => `© ${year} ${name}`,
  },
  gameShell: {
    controlsLabel: "Interactive controls",
    openInventory: "Open inventory",
    inventory: "Inventory",
    openDevSwitcher: "Open dev scene switcher",
    dev: "Dev",
    switchToStatic: "Switch to static portfolio",
    staticMode: "Static mode",
    static: "Static",
    devSwitcher: "Dev scene switcher",
    city: "City",
    loadingScene: "Loading scene",
  },
  inventory: {
    title: "Inventory",
    equipment: "Equipment",
    glasses: "Glasses",
    circuit: "Circuit",
    noItemsYet: "No items yet",
  },
  portfolio: {
    profile: {
      title: "About Me",
      name: "Name:",
      location: "Location:",
      about: "I specialize in frontend development, with a focus on creating consistent, accessible, and performant UIs. Over the years, I've led design system implementations, built core UI components, and worked closely with designers to bridge Figma and code. Outside of work, I practice martial arts and explore creativity through drawing, guitar, and dance.",
      details: {
        fullName: "Danilo Novakovic",
        country: "Serbia",
      },
    },
    experience: {
      title: "Experience",
    },
    abilities: {
      title: "Abilities",
      skills: "Skills",
      tools: "Tools",
      languages: "Languages",
    },
    projects: {
      title: "Projects",
    },
    hobbies: {
      title: "Hobbies",
    },
    contact: {
      title: "Contact",
      quote: "“If I had asked people what they wanted, they would have said faster horses.”",
      quoteAuthor: "— Henry Ford",
    },
    experiences: {
      hummingbird: {
        title: "Software Engineer",
        company: "Hummingbird",
        period: "April 2024 - Present",
        description: "Built web applications in the financial sector for US clients. Led the implementation of a shared UI design system (Storybook, Theme Provider, Figma tokens). Developed core UI components and ensured WCAG-compliant accessibility. Contributed to innovative features like a finance AI chatbot and real-time collaboration using Liveblocks.",
      },
      vegaEngineer: {
        title: "Software Engineer",
        company: "Vega IT",
        period: "October 2019 - April 2024",
        description: "Played a pivotal role in feature development for a social network app (Timeline, Chat, Teams). Collaborated on an apartment reservation app. Developed a custom UI library and enhanced code quality with custom eslint plugins and advanced TypeScript rules. Mentored in React to foster team growth.",
      },
      vegaIntern: {
        title: "Software Engineer Intern",
        company: "Vega IT",
        period: "September 2019 - October 2019",
        description: "Worked on a Recreational Basketball League app. Optimized import algorithm for large data sets (92% faster) and improved team name correction using Levenshtein distance algorithm.",
      },
      facultyAssistant: {
        title: "Student Assistant",
        company: "Faculty of Technical Sciences",
        period: "February 2018 - June 2018",
        description: "Demonstrator in Object-Oriented-Programming course. Provided assistance to students under the guidance of academic staff.",
      },
    },
    projectsData: {
      dynamicBookmarks: {
        title: "Dynamic Bookmarks",
        description: "Chrome extension which dynamically updates bookmarks based on the specified regular expression.",
      },
      arduinoSimulator: {
        title: "Arduino Simulator",
        description: "Aimed for students who are learning Arduino on uc32 Basic U/I Shield",
      },
      chesspernado: {
        title: "Chesspernado",
        description: "Chesspernado is an original game inspired by chess, tetris and plants vs zombie idea.",
      },
    },
    contacts: {
      linkedin: "LinkedIn",
      github: "GitHub",
      email: "Email",
    },
    hobbiesData: {
      games: {
        name: "Games & dev",
        description: "Building games, analyzing mechanics, and enjoying immersive worlds.",
      },
      art: {
        name: "Drawing & art",
        description: "Sketching and digital art—creativity away from the keyboard.",
      },
      music: {
        name: "Guitar",
        description: "Playing guitar and recharging through music.",
      },
      fitness: {
        name: "Muay Thai & fitness",
        description: "Discipline and physical sharpness through martial arts and training.",
      },
      dancing: {
        name: "Dance & rhythm",
        description: "Moving to music and learning patterns—coordination as play.",
      },
    },
  },
  catalog: {
    portfolio: {
      profile: {
        name: "Profile",
        description: "About me, my background and location.",
      },
      experiences: {
        name: "Experiences",
        description: "My career path and education.",
      },
      projects: {
        name: "Projects",
        description: "Showcase of my personal and professional projects.",
      },
      abilities: {
        name: "Abilities",
        description: "Technical skills, languages and tools.",
      },
      contact: {
        name: "Contact",
        description: "Get in touch with me.",
      },
    },
    basement: {
      basement: {
        name: "Basement",
        description: "A hidden developer room where rough sketches become playable.",
      },
      games: {
        name: "Developer Console",
        description: "A basement terminal for profile commands, skills, notes and experiments.",
      },
    },
    hobbies: {
      hobbies: {
        name: "Hobbies",
        description: "Step inside to see what I do when I am not coding.",
      },
      art: {
        name: "Digital Art",
        description: "Sketching and drawing is how I relax.",
      },
      music: {
        name: "Music Performance",
        description: "Playing guitar and making music.",
      },
      fitness: {
        name: "Muay Thai & Fitness",
        description: "Keeping active with Muay Thai and exercise.",
      },
      dancing: {
        name: "Dance & rhythm",
        description: "Repeat the moves, feel the beat—coordination as a mini-game.",
      },
    },
    potassiumSlip: {
      potassium: {
        name: "Potassium Slip",
        description: "Slip the incoming stakeholders and dodge the deadlines in this slippery challenge.",
      },
    },
  },
  scenes: {
    overworld: {
      glassesSecretHint: "Something appears in plain sight.",
      basementHole: "TODO?",
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
  },
  miniGames: {
    arcade: {
      title: "Arcade",
      instruction: "Click the targets as fast as you can!",
      startLabel: "START ARCADE",
    },
    coding: {
      title: "Coding",
      welcome: "Welcome to DaniloOS v1.0",
      helpText: "Type 'help' to see available commands.",
      helpResponse: "Available commands: whoami, skills, clear",
      whoamiResponse: "Danilo Novakovic. Coding since 2016. Lover of logic and design.",
      skillsResponse: "> Frontend & UI: React.js, TypeScript, Tailwind, Storybook, UI Components, Accessibility (WCAG), Redux\n> Backend & Data: Node.js, .NET, Express-style APIs, SQL, MongoDB\n> Additional Languages: C#, C, C++, Python, Matlab\n> Product Design & DX: Design Systems, Figma token mapping, theming, designer-dev handoff, Git, npm",
      commandNotFound: (command: string) => `Command not found: ${command}`,
      instruction: "Hack the mainframe!",
    },
    muayThai: {
      title: "Muay Thai & Fitness",
      instruction: "Click the bag to strike!",
      bam: "BAM!",
      punchingBag: "Punching Bag",
    },
    guitar: {
      title: "Guitar",
      instruction: "Hover or tap the strings to play!",
      stringLabel: (note: string, key: string) => `String ${note} (Press ${key})`,
    },
    drawing: {
      title: "Drawing",
      instruction: "Try it! Doodle something.",
      keyboardHint: "[Arrows to move • Space to draw • Shift to speed up]",
      erase: "Erase All",
    },
    dancing: {
      title: "Dancing",
      instruction: "Repeat the dance moves!",
      startMessage: "Press Start to Dance!",
      watchMessage: "Watch the sequence...",
      turnMessage: "Your turn!",
      successMessage: "Nice Moves! Next Round...",
      gameOverWithScore: (score: number) => `GAME OVER! SCORE: ${score}`,
    },
  },
  potassiumSlip: {
    title: "POTASSIUM SLIP",
    instructions: "DRAG TOWARD A TARGET. RELEASE BANANA.\nHOLD ANYWHERE TO YO-YO IT HOME.\nCLEAR WAVES. STEAL THE CIRCUIT.",
    chooseUpgrade: "CHOOSE BANANA NONSENSE",
    finalScore: (score: number) => `Final Score: ${score}`,
    hud: {
      score: (score: number) => `Score ${score}`,
      lives: (lives: number) => `Lives ${lives}`,
      waveLabel: (wave: number, title: string) => `W${wave} ${title}`,
    },
    hints: {
      start: "Drag toward a target • Hold to recall",
      endlessStart: "Endless audit • The nonsense keeps filing",
      bossWave: "Boss wave • Stop the audit before it lands",
      wave: (title: string, hint: string) => `${title}: ${hint}`,
      waveClear: "Wave clear • Choose fresh banana nonsense",
      devSkip: "Dev skip • Choose a test upgrade",
      genericStacked: (label: string) => `${label} stacked • Endless paperwork trembles`,
      skillApplied: (label: string, action: "unlocked" | "upgraded") => `${label} ${action} • It stacks forever`,
    },
    outcomes: {
      won: "CIRCUIT ACQUIRED",
      gameOver: "BANANA BANKRUPTCY",
    },
    terminal: {
      endlessMode: "ENDLESS MODE",
      returnToCity: "RETURN TO CITY",
      retry: "RETRY",
    },
    leaderboard: {
      title: "RECORDS",
      empty: "No banana paperwork filed yet.",
      modeLabel: (mode: "campaign" | "endless", outcome: "won" | "game_over") => mode === "endless" ? "endless" : outcome,
      recordLine: (rank: number, score: number, wave: number, modeLabel: string) => `${rank}. ${score} • W${wave} • ${modeLabel}`,
    },
    enemies: {
      intern: "Intern Bug",
      scope: "Scope Blob",
      deadline: "Deadline Drone",
      wall: "Wooden Wall",
      hardWall: "Unbreakable Wall",
      splitter: "Splitter Memo",
      shield: "Shielded Form",
      boss: "Potassium Compliance Officer",
      health: (hp: number, maxHp: number) => `${hp}/${maxHp}`,
      labelledHealth: (label: string, hp: number) => `${label} ${hp}/${hp}`,
    },
    upgrades: {
      generic: {
        damage: {
          label: "Damage +",
          description: "+12% banana and beam damage.",
        },
        poison: {
          label: "Poison +",
          description: "+10% poison tick strength.",
        },
        explosion: {
          label: "Explosion +",
          description: "+6% blast radius.",
        },
        cloneTime: {
          label: "Clone Time +",
          description: "+300ms clone lifetime.",
        },
        bananaSpeed: {
          label: "Banana Speed +",
          description: "+5% launch speed.",
        },
        bonusLife: {
          label: "Bonus Life",
          description: "+1 life right now.",
        },
      },
      skills: {
        fire: {
          label: "Fire Trail",
          description: "Moving bananas leave hot nonsense.",
          unlockDescription: "Moving bananas leave fire.",
          upgradeDescription: "Hits drop extra fire patches.",
        },
        poison: {
          label: "Poison Damage",
          description: "Hits tick for 1 dmg every 500ms.",
          unlockDescription: "Hits poison enemies over time.",
          upgradeDescription: "Poisoned enemies spread on death.",
        },
        explosion: {
          label: "Explosion Damage",
          description: "Every hit pops nearby paperwork.",
          unlockDescription: "Hits explode with falloff damage.",
          upgradeDescription: "Bigger blasts apply statuses.",
        },
        duplicate: {
          label: "Duplicate",
          description: "Main hits spawn two tiny bananas.",
          unlockDescription: "Main hits spawn 2 small bananas.",
          upgradeDescription: "Clones apply half-strength procs and spawn +1.",
        },
        ghostHorizontal: {
          label: "Horizontal Ghost",
          description: "Hits sweep a blue row beam.",
          unlockDescription: "Hits fire a blue row beam.",
          upgradeDescription: "Row beams apply statuses.",
        },
        ghostVertical: {
          label: "Vertical Ghost",
          description: "Hits sweep a blue column beam.",
          unlockDescription: "Hits fire a blue column beam.",
          upgradeDescription: "Column beams apply statuses.",
        },
      },
      upgradedTitle: (label: string) => `${label} +`,
    },
    waveTitles: {
      boss: "Compliance Review",
      endlessAudit: (index: number) => `Endless Audit ${index}`,
      orientationStack: (wave: number) => `Orientation Stack ${wave}`,
      wallPattern: (wave: number) => `Wall Pattern ${wave}`,
      officePressure: (wave: number) => `Office Pressure ${wave}`,
      deadlineWeather: (wave: number) => `Deadline Weather ${wave}`,
    },
    waveHints: {
      endlessEscalation: "endless paperwork escalation",
      launchAndBounce: "launch and bounce",
      multiHitBlobs: "multi-hit blobs",
      wallsBlockAngles: "walls block angles",
      splitterMemos: "splitter memos make smaller problems",
      stackChoices: "stack your choices",
      shieldPlates: "shield plates reject bad angles",
      hardWalls: "hard walls ignore banana law",
      bossTime: "boss time",
    },
  },
} as const;
