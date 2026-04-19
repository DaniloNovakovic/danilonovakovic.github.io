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
import type { FeaturePluginDefinition } from './portfolioCompose';
import { MiniGameType } from '../game/types';

export const FEATURE_PLUGIN_DEFINITIONS: FeaturePluginDefinition[] = [
  {
    id: 'profile',
    name: 'Profile',
    description: 'About me, my background and location.',
    Component: ProfileOverlay,
    type: MiniGameType.REACT_OVERLAY
  },
  {
    id: 'experiences',
    name: 'Experiences',
    description: 'My career path and education.',
    Component: ExperienceOverlay,
    type: MiniGameType.REACT_OVERLAY
  },
  {
    id: 'projects',
    name: 'Projects',
    description: 'Showcase of my personal and professional projects.',
    Component: ProjectsOverlay,
    type: MiniGameType.REACT_OVERLAY
  },
  {
    id: 'abilities',
    name: 'Abilities',
    description: 'Technical skills, languages and tools.',
    Component: AbilitiesOverlay,
    type: MiniGameType.REACT_OVERLAY
  },
  {
    id: 'hobbies',
    name: 'Hobbies',
    description: 'Step inside to see what I do when I am not coding.',
    Scene: HobbiesScene,
    type: MiniGameType.PHASER_SCENE
  },
  {
    id: 'contact',
    name: 'Contact',
    description: 'Get in touch with me.',
    Component: ContactOverlay,
    type: MiniGameType.REACT_OVERLAY
  },
  {
    id: 'games',
    name: 'Game Development',
    description: 'I love building games and interactive experiences.',
    Component: CodingMini,
    type: MiniGameType.REACT_OVERLAY,
    overlayParentId: 'hobbies'
  },
  {
    id: 'art',
    name: 'Digital Art',
    description: 'Sketching and drawing is how I relax.',
    Component: DrawingCanvas,
    type: MiniGameType.REACT_OVERLAY,
    overlayParentId: 'hobbies'
  },
  {
    id: 'music',
    name: 'Music Performance',
    description: 'Playing guitar and making music.',
    Component: GuitarStrings,
    type: MiniGameType.REACT_OVERLAY,
    overlayParentId: 'hobbies'
  },
  {
    id: 'fitness',
    name: 'Muay Thai & Fitness',
    description: 'Keeping active with Muay Thai and exercise.',
    Component: MuayThaiMini,
    type: MiniGameType.REACT_OVERLAY,
    overlayParentId: 'hobbies'
  }
];
