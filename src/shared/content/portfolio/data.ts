import { PORTFOLIO_TEXT } from './text';
import { messages } from '@/shared/i18n';

export interface Experience {
  title: string;
  company: string;
  /** Employer site; when set, the company name is shown as an external link in overlays. */
  companyUrl?: string;
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

export type ContactIconId = 'linkedin' | 'github' | 'email';

export interface ContactLink {
  name: string;
  link: string;
  icon: ContactIconId;
}

export const PORTFOLIO_DATA = {
  profile: {
    name: PORTFOLIO_TEXT.profile.details.fullName,
    location: PORTFOLIO_TEXT.profile.details.country,
    about: PORTFOLIO_TEXT.profile.about
  },
  experiences: [
    {
      title: messages.portfolio.experiences.hummingbird.title,
      company: messages.portfolio.experiences.hummingbird.company,
      companyUrl: "https://hummingbird.rs/",
      period: messages.portfolio.experiences.hummingbird.period,
      description: messages.portfolio.experiences.hummingbird.description
    },
    {
      title: messages.portfolio.experiences.vegaEngineer.title,
      company: messages.portfolio.experiences.vegaEngineer.company,
      companyUrl: "https://www.vegaitglobal.com/",
      period: messages.portfolio.experiences.vegaEngineer.period,
      description: messages.portfolio.experiences.vegaEngineer.description
    },
    {
      title: messages.portfolio.experiences.vegaIntern.title,
      company: messages.portfolio.experiences.vegaIntern.company,
      companyUrl: "https://www.vegaitglobal.com/",
      period: messages.portfolio.experiences.vegaIntern.period,
      description: messages.portfolio.experiences.vegaIntern.description
    },
    {
      title: messages.portfolio.experiences.facultyAssistant.title,
      company: messages.portfolio.experiences.facultyAssistant.company,
      companyUrl: "https://ftn.uns.ac.rs/engfaculty-of-technical-sciences-eng/",
      period: messages.portfolio.experiences.facultyAssistant.period,
      description: messages.portfolio.experiences.facultyAssistant.description
    }
  ],
  projects: [
    {
      title: messages.portfolio.projectsData.dynamicBookmarks.title,
      description: messages.portfolio.projectsData.dynamicBookmarks.description,
      tags: ["JS", "Chrome-Extension", "Webpack", "Materialize.css"],
      link: "https://chrome.google.com/webstore/detail/dynamic-bookmarks/ilhojkjlfkppedidhpecepohnmlndopb"
    },
    {
      title: messages.portfolio.projectsData.arduinoSimulator.title,
      description: messages.portfolio.projectsData.arduinoSimulator.description,
      tags: ["C++", "STL", "Windows"],
      link: "https://github.com/DaniloNovakovic/Arduino_uc32_basic_ui_shield_simulator"
    },
    {
      title: messages.portfolio.projectsData.chesspernado.title,
      description: messages.portfolio.projectsData.chesspernado.description,
      tags: ["C", "Linux", "Game"],
      link: "https://github.com/DaniloNovakovic/Chesspernado"
    }
  ],
  abilities: {
    skills: ["React.js", "TypeScript", "Front-End Development", "Design Systems", "UI Components", "Accessibility (WCAG)", "Storybook", "Figma Token Mapping", "Node.js", "C#", "SQL"],
    languages: ["Serbian (Native or Bilingual)", "English (Full Professional)"],
    tools: ["VS Code", "Git", "Storybook", "Figma", "Liveblocks", "npm"]
  },
  contact: [
    { name: messages.portfolio.contacts.linkedin, link: "https://www.linkedin.com/in/danilo-novakovic", icon: "linkedin" },
    { name: messages.portfolio.contacts.github, link: "https://github.com/DaniloNovakovic", icon: "github" },
    { name: messages.portfolio.contacts.email, link: "mailto:dakenzi97@gmail.com", icon: "email" }
  ] satisfies ContactLink[],
  /** Ids align with `portfolioRegistry` hobby overlays / Hobbies room (`games`, `art`, `music`, `fitness`, `dancing`). */
  hobbies: [
    {
      id: 'games',
      name: messages.portfolio.hobbiesData.games.name,
      description: messages.portfolio.hobbiesData.games.description
    },
    {
      id: 'art',
      name: messages.portfolio.hobbiesData.art.name,
      description: messages.portfolio.hobbiesData.art.description
    },
    {
      id: 'music',
      name: messages.portfolio.hobbiesData.music.name,
      description: messages.portfolio.hobbiesData.music.description
    },
    {
      id: 'fitness',
      name: messages.portfolio.hobbiesData.fitness.name,
      description: messages.portfolio.hobbiesData.fitness.description
    },
    {
      id: 'dancing',
      name: messages.portfolio.hobbiesData.dancing.name,
      description: messages.portfolio.hobbiesData.dancing.description
    }
  ]
};
