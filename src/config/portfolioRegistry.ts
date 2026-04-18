import { MiniGameType, type MiniGamePlugin } from '../game/types';
import ProfileOverlay from '../components/ProfileOverlay';
import ExperienceOverlay from '../components/ExperienceOverlay';
import ProjectsOverlay from '../components/ProjectsOverlay';
import AbilitiesOverlay from '../components/AbilitiesOverlay';
import ContactOverlay from '../components/ContactOverlay';
import { HobbiesScene } from '../game/HobbiesScene';

import CodingMini from '../components/CodingMini';
import DrawingCanvas from '../components/DrawingCanvas';
import GuitarStrings from '../components/GuitarStrings';
import MuayThaiMini from '../components/MuayThaiMini';

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
    description: 'Step inside to see what I do when I am not coding.',
    Scene: HobbiesScene,
    type: MiniGameType.PHASER_SCENE
  },
  {
    id: 'contact',
    name: 'Contact',
    x: 2900,
    description: 'Get in touch with me.',
    Component: ContactOverlay,
    type: MiniGameType.REACT_OVERLAY
  },
  // Hobby Minigames
  {
    id: 'games',
    name: 'Game Development',
    description: 'I love building games and interactive experiences.',
    Component: CodingMini,
    type: MiniGameType.REACT_OVERLAY
  },
  {
    id: 'art',
    name: 'Digital Art',
    description: 'Sketching and drawing is how I relax.',
    Component: DrawingCanvas,
    type: MiniGameType.REACT_OVERLAY
  },
  {
    id: 'music',
    name: 'Music Performance',
    description: 'Playing guitar and making music.',
    Component: GuitarStrings,
    type: MiniGameType.REACT_OVERLAY
  },
  {
    id: 'fitness',
    name: 'Muay Thai & Fitness',
    description: 'Keeping active with Muay Thai and exercise.',
    Component: MuayThaiMini,
    type: MiniGameType.REACT_OVERLAY
  }
];
