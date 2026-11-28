import { getMessages } from '@/shared/i18n';
import type { Messages } from '@/shared/i18n';

export type ContactIconId = 'linkedin' | 'github' | 'email';

export interface Experience {
  title: string;
  company: string;
  /** Employer site; when set, the company name is shown as an external link in overlays. */
  companyUrl?: string;
  period: string;
  /** Short, scannable points; the static page lists them as bullets. */
  highlights: readonly string[];
  /** The highlights as one paragraph, for overlays that show running text. */
  description: string;
  /** Early, minor role: the static page shows it as a single line. */
  compact?: boolean;
}

type ExperienceMessage = Pick<Experience, 'title' | 'company' | 'period' | 'highlights'>;

function toExperience(entry: ExperienceMessage, extra: Pick<Experience, 'companyUrl' | 'compact'>): Experience {
  return { ...entry, ...extra, description: entry.highlights.join(' ') };
}

export interface Project {
  title: string;
  description: string;
  tags: string[];
  link: string;
  image?: string;
}

export interface ContactLink {
  name: string;
  link: string;
  icon: ContactIconId;
}

export function getPortfolioData(messages: Messages = getMessages()) {
  return {
    profile: {
      name: messages.portfolio.profile.details.fullName,
      location: messages.portfolio.profile.details.country,
      about: messages.portfolio.profile.about
    },
    experiences: [
      toExperience(messages.portfolio.experiences.hummingbird, { companyUrl: 'https://hummingbird.rs/' }),
      toExperience(messages.portfolio.experiences.vegaEngineer, { companyUrl: 'https://www.vegaitglobal.com/' }),
      toExperience(messages.portfolio.experiences.vegaIntern, { companyUrl: 'https://www.vegaitglobal.com/' }),
      toExperience(messages.portfolio.experiences.facultyAssistant, {
        companyUrl: 'https://ftn.uns.ac.rs/engfaculty-of-technical-sciences-eng/',
        compact: true
      })
    ] satisfies Experience[],
    projects: [
      {
        ...messages.portfolio.projectsData.dynamicBookmarks,
        tags: ['JS', 'Chrome-Extension', 'Webpack', 'Materialize.css'],
        link: 'https://chrome.google.com/webstore/detail/dynamic-bookmarks/ilhojkjlfkppedidhpecepohnmlndopb'
      },
      {
        ...messages.portfolio.projectsData.arduinoSimulator,
        tags: ['C++', 'STL', 'Windows'],
        link: 'https://github.com/DaniloNovakovic/Arduino_uc32_basic_ui_shield_simulator'
      },
      {
        ...messages.portfolio.projectsData.chesspernado,
        tags: ['C', 'Linux', 'Game'],
        link: 'https://github.com/DaniloNovakovic/Chesspernado'
      }
    ] satisfies Project[],
    abilities: {
      skills: [
        'React.js',
        'TypeScript',
        'Front-End Development',
        'Design Systems',
        'UI Components',
        'Accessibility (WCAG)',
        'Storybook',
        'Figma Token Mapping',
        'Node.js',
        'C#',
        'SQL'
      ],
      languages: ['Serbian (Native or Bilingual)', 'English (Full Professional)'],
      tools: ['VS Code', 'Git', 'Storybook', 'Figma', 'Liveblocks', 'npm']
    },
    contact: [
      {
        name: messages.portfolio.contacts.linkedin,
        link: 'https://www.linkedin.com/in/danilo-novakovic',
        icon: 'linkedin'
      },
      {
        name: messages.portfolio.contacts.github,
        link: 'https://github.com/DaniloNovakovic',
        icon: 'github'
      },
      {
        name: messages.portfolio.contacts.email,
        link: 'mailto:dakenzi97@gmail.com',
        icon: 'email'
      }
    ] satisfies ContactLink[],
    hobbies: [
      {
        id: 'games' as const,
        ...messages.portfolio.hobbiesData.games
      },
      {
        id: 'art' as const,
        ...messages.portfolio.hobbiesData.art
      },
      {
        id: 'music' as const,
        ...messages.portfolio.hobbiesData.music
      },
      {
        id: 'fitness' as const,
        ...messages.portfolio.hobbiesData.fitness
      },
      {
        id: 'dancing' as const,
        ...messages.portfolio.hobbiesData.dancing
      }
    ]
  };
}
