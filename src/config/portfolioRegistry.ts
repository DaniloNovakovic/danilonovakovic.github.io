import { MiniGameType, type MiniGamePlugin } from '../game/types';
import ProfileOverlay from '../components/ProfileOverlay';
import ExperienceOverlay from '../components/ExperienceOverlay';
import ProjectsOverlay from '../components/ProjectsOverlay';
import AbilitiesOverlay from '../components/AbilitiesOverlay';
import ContactOverlay from '../components/ContactOverlay';
import HobbiesOverlay from '../components/HobbiesOverlay';

export const PORTFOLIO_SECTIONS: MiniGamePlugin[] = [
  {
    id: 'profile',
    name: 'Profile',
    x: 400,
    description: 'About me, my background and location.',
    Component: ProfileOverlay,
    type: MiniGameType.REACT_OVERLAY
  },
  {
    id: 'experiences',
    name: 'Experiences',
    x: 900,
    description: 'My career path and education.',
    Component: ExperienceOverlay,
    type: MiniGameType.REACT_OVERLAY
  },
  {
    id: 'projects',
    name: 'Projects',
    x: 1400,
    description: 'Showcase of my personal and professional projects.',
    Component: ProjectsOverlay,
    type: MiniGameType.REACT_OVERLAY
  },
  {
    id: 'abilities',
    name: 'Abilities',
    x: 1900,
    description: 'Technical skills, languages and tools.',
    Component: AbilitiesOverlay,
    type: MiniGameType.REACT_OVERLAY
  },
  {
    id: 'hobbies',
    name: 'Hobbies',
    x: 2400,
    description: 'What I do when I am not coding.',
    Component: HobbiesOverlay,
    type: MiniGameType.REACT_OVERLAY
  },
  {
    id: 'contact',
    name: 'Contact',
    x: 2900,
    description: 'Get in touch with me.',
    Component: ContactOverlay,
    type: MiniGameType.REACT_OVERLAY
  }
];
