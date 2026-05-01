import type { FeaturePluginDefinition } from './portfolioCompose';

export const FEATURE_PLUGIN_DEFINITIONS: FeaturePluginDefinition[] = [
  {
    id: 'profile',
    name: 'Profile',
    description: 'About me, my background and location.'
  },
  {
    id: 'experiences',
    name: 'Experiences',
    description: 'My career path and education.'
  },
  {
    id: 'projects',
    name: 'Projects',
    description: 'Showcase of my personal and professional projects.'
  },
  {
    id: 'abilities',
    name: 'Abilities',
    description: 'Technical skills, languages and tools.'
  },
  {
    id: 'hobbies',
    name: 'Hobbies',
    description: 'Step inside to see what I do when I am not coding.'
  },
  {
    id: 'basement',
    name: 'Basement',
    description: 'A hidden developer room where rough sketches become playable.'
  },
  {
    id: 'potassium',
    name: 'Potassium Slip',
    description: 'Slip the incoming stakeholders and dodge the deadlines in this slippery challenge.'
  },
  {
    id: 'contact',
    name: 'Contact',
    description: 'Get in touch with me.'
  },
  {
    id: 'games',
    name: 'Game Development',
    description: 'I love building games and interactive experiences.',
    overlayParentId: 'hobbies'
  },
  {
    id: 'art',
    name: 'Digital Art',
    description: 'Sketching and drawing is how I relax.',
    overlayParentId: 'hobbies'
  },
  {
    id: 'music',
    name: 'Music Performance',
    description: 'Playing guitar and making music.',
    overlayParentId: 'hobbies'
  },
  {
    id: 'fitness',
    name: 'Muay Thai & Fitness',
    description: 'Keeping active with Muay Thai and exercise.',
    overlayParentId: 'hobbies'
  },
  {
    id: 'dancing',
    name: 'Dance & rhythm',
    description: 'Repeat the moves, feel the beat—coordination as a mini-game.',
    overlayParentId: 'hobbies'
  }
];
