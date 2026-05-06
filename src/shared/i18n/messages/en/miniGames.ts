export const miniGameMessages = {
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
} as const;
