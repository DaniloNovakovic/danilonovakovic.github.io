import { TEXTS } from './content';

export interface Experience {
  title: string;
  company: string;
  period: string;
  description: string;
}

export interface Project {
  title: string;
  description: string;
  tags: string[];
  link: string;
  image?: string;
}

export interface Hobby {
  id: string;
  name: string;
  description: string;
}

export const PORTFOLIO_DATA = {
  profile: {
    name: TEXTS.profile.details.fullName,
    location: TEXTS.profile.details.country,
    about: TEXTS.profile.about
  },
  experiences: [
    {
      title: "Software Engineer",
      company: "Hummingbird",
      period: "April 2024 - Present",
      description: "Built web applications in the financial sector for US clients. Led the implementation of a shared UI design system (Storybook, Theme Provider, Figma tokens). Developed core UI components and ensured WCAG-compliant accessibility. Contributed to innovative features like a finance AI chatbot and real-time collaboration using Liveblocks."
    },
    {
      title: "Software Engineer",
      company: "Vega IT",
      period: "October 2019 - April 2024",
      description: "Played a pivotal role in feature development for a social network app (Timeline, Chat, Teams). Collaborated on an apartment reservation app. Developed a custom UI library and enhanced code quality with custom eslint plugins and advanced TypeScript rules. Mentored in React to foster team growth."
    },
    {
      title: "Software Engineer Intern",
      company: "Vega IT",
      period: "September 2019 - October 2019",
      description: "Worked on a Recreational Basketball League app. Optimized import algorithm for large data sets (92% faster) and improved team name correction using Levenshtein distance algorithm."
    },
    {
      title: "Student Assistant",
      company: "Faculty of Technical Sciences",
      period: "February 2018 - June 2018",
      description: "Demonstrator in Object-Oriented-Programming course. Provided assistance to students under the guidance of academic staff."
    }
  ],
  projects: [
    {
      title: "Dynamic Bookmarks",
      description: "Chrome extension which dynamically updates bookmarks based on the specified regular expression.",
      tags: ["JS", "Chrome-Extension", "Webpack", "Materialize.css"],
      link: "https://chrome.google.com/webstore/detail/dynamic-bookmarks/ilhojkjlfkppedidhpecepohnmlndopb"
    },
    {
      title: "Arduino Simulator",
      description: "Aimed for students who are learning Arduino on uc32 Basic U/I Shield",
      tags: ["C++", "STL", "Windows"],
      link: "https://github.com/DaniloNovakovic/Arduino_uc32_basic_ui_shield_simulator"
    },
    {
      title: "Chesspernado",
      description: "Chesspernado is an original game inspired by chess, tetris and plants vs zombie idea.",
      tags: ["C", "Linux", "Game"],
      link: "https://github.com/DaniloNovakovic/Chesspernado"
    }
  ],
  abilities: {
    skills: ["React.js", "TypeScript", "Front-End Development", "Design Systems", "UI Components", "Accessibility (WCAG)", "Storybook", "Figma Token Mapping", "Node.js", "C#", "SQL"],
    languages: ["Serbian (Native or Bilingual)", "English (Full Professional)"],
    tools: ["Fite", "VS Code", "Git", "Storybook", "Figma", "Liveblocks", "npm"]
  },
  contact: [
    { name: "LinkedIn", link: "https://www.linkedin.com/in/danilo-novakovic", icon: "linkedin" },
    { name: "Portfolio", link: "https://danilonovakovic.github.io/", icon: "portfolio" },
    { name: "GitHub", link: "https://github.com/DaniloNovakovic", icon: "github" },
    { name: "Email", link: "mailto:dakenzi97@gmail.com", icon: "email" }
  ],
  /** Ids align with `portfolioRegistry` hobby overlays / Hobbies room (`games`, `art`, `music`, `fitness`). */
  hobbies: [
    {
      id: 'games',
      name: 'Games & dev',
      description: 'Building games, analyzing mechanics, and enjoying immersive worlds.'
    },
    {
      id: 'art',
      name: 'Drawing & art',
      description: 'Sketching and digital art—creativity away from the keyboard.'
    },
    {
      id: 'music',
      name: 'Guitar',
      description: 'Playing guitar and recharging through music.'
    },
    {
      id: 'fitness',
      name: 'Muay Thai & fitness',
      description: 'Discipline and physical sharpness through martial arts and training.'
    }
  ]
};
