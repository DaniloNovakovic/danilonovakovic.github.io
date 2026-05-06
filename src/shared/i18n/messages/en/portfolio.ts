export const portfolioMessages = {
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
    quote: "If I had asked people what they wanted, they would have said faster horses.",
    quoteAuthor: "- Henry Ford",
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
      description: "Sketching and digital art-creativity away from the keyboard.",
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
      description: "Moving to music and learning patterns-coordination as play.",
    },
  },
} as const;
